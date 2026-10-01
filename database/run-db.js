const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');
const path = require('path');
const fs = require('fs');

async function run() {
  const dbDir = path.resolve(__dirname, './data');
  const pidFile = path.join(dbDir, 'postmaster.pid');
  const pgVersionFile = path.join(dbDir, 'PG_VERSION');

  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
    } catch {}
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'postgres',
    password: 'password',
    port: 5432,
    persistent: true,
  });

  if (!fs.existsSync(pgVersionFile)) {
    console.log('Initializing new database cluster in:', dbDir);
    await pg.initialise();
  } else {
    console.log('Using existing cluster in:', dbDir);
  }

  console.log('Starting PostgreSQL server on port 5432...');
  await pg.start();
  console.log('PostgreSQL server is ready and accepting connections on port 5432!');

  try {
    await pg.createDatabase('placement_portal');
    console.log('Ensured database "placement_portal" exists.');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('Database "placement_portal" already exists.');
    } else {
      console.log('Notice regarding createDatabase:', err.message);
    }
  }

  // Graceful shutdown handling
  const cleanExit = async () => {
    console.log('\nStopping PostgreSQL server...');
    try {
      await pg.stop();
    } catch {}
    process.exit(0);
  };

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);

  // Keep process alive
  setInterval(() => {}, 10000);
}

run().catch((err) => {
  console.error('Fatal error starting embedded PostgreSQL:', err);
  process.exit(1);
});
