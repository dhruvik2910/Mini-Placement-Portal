const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/placement_portal',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL for migration...');

    // 1. Update StudentProfile columns
    await client.query(`
      ALTER TABLE "StudentProfile" 
      ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "address" TEXT,
      ADD COLUMN IF NOT EXISTS "currentSemester" INTEGER NOT NULL DEFAULT 7,
      ADD COLUMN IF NOT EXISTS "skills" JSONB,
      ADD COLUMN IF NOT EXISTS "resumeUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "resumeName" TEXT,
      ADD COLUMN IF NOT EXISTS "resumeUpdatedAt" TIMESTAMP(3);
    `);
    console.log('StudentProfile columns synchronized.');

    // 2. Update RecruitmentDrive columns
    await client.query(`
      ALTER TABLE "RecruitmentDrive"
      ADD COLUMN IF NOT EXISTS "driveDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);
    console.log('RecruitmentDrive columns synchronized.');

    // 3. Create Notification table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT NOT NULL,
        "studentProfileId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'INFO',
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Notification_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") 
          REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "Notification_studentProfileId_idx" ON "Notification"("studentProfileId");
      CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
    `);
    console.log('Notification table synchronized.');

    // 4. Create NotificationChannel & NotificationDeliveryStatus ENUMs and NotificationDeliveryLog table
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "NotificationDeliveryLog" (
        "id" TEXT NOT NULL,
        "studentProfileId" TEXT,
        "recipientEmail" TEXT,
        "recipientPhone" TEXT,
        "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
        "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
        "template" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "idempotencyKey" TEXT,
        "error" TEXT,
        "sentAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NotificationDeliveryLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "NotificationDeliveryLog_idempotencyKey_key" UNIQUE ("idempotencyKey"),
        CONSTRAINT "NotificationDeliveryLog_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") 
          REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "NotificationDeliveryLog_recipientEmail_idx" ON "NotificationDeliveryLog"("recipientEmail");
      CREATE INDEX IF NOT EXISTS "NotificationDeliveryLog_channel_status_idx" ON "NotificationDeliveryLog"("channel", "status");
      CREATE INDEX IF NOT EXISTS "NotificationDeliveryLog_template_idx" ON "NotificationDeliveryLog"("template");
      CREATE INDEX IF NOT EXISTS "NotificationDeliveryLog_idempotencyKey_idx" ON "NotificationDeliveryLog"("idempotencyKey");
    `);
    console.log('NotificationDeliveryLog table and enums synchronized.');

    console.log('All migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
