/**
 * End-to-end Verification for Feature 3: AI Resume Analyzer & Job Fit Scoring
 */
const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- TESTING AI RESUME ANALYZER & JOB FIT SCORING ---');

  // 1. Login as student (Rahul Mehta)
  console.log('1. Logging in as student (rahul.mehta@student.edu)...');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'rahul.mehta@student.edu',
      password: 'Password123!',
    }
  );

  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    console.error('Failed to log in as student:', loginRes);
    process.exit(1);
  }

  const token = loginRes.body.data.token;
  console.log('✅ Student logged in successfully.');

  // 2. Fetch active drives
  console.log('2. Fetching available placement drives...');
  const drivesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/drives',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const drives = drivesRes.body.data;
  if (!drives || drives.length === 0) {
    console.error('No drives found:', drivesRes);
    process.exit(1);
  }

  const targetDrive = drives[0];
  console.log(`✅ Selected Drive: "${targetDrive.title}" for role "${targetDrive.jobRole}" at "${targetDrive.company.name}" (ID: ${targetDrive.id})`);
  console.log(`   Required Skills: ${targetDrive.requiredSkills.join(', ')}`);

  // 3. Test AI Fit endpoint: GET /api/v1/drives/:id/ai-fit
  console.log(`3. Computing AI Resume & Job Fit via GET /api/v1/drives/${targetDrive.id}/ai-fit...`);
  const aiFitRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/v1/drives/${targetDrive.id}/ai-fit`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`   HTTP Status: ${aiFitRes.status}`);
  if (aiFitRes.status !== 200) {
    console.error('AI Fit request failed:', aiFitRes);
    process.exit(1);
  }

  const fitData = aiFitRes.body.data;
  console.log('✅ AI Fit Response Received:');
  console.log(`   - Match Score: ${fitData.matchScore}%`);
  console.log(`   - Verdict: ${fitData.verdict}`);
  console.log(`   - Summary: ${fitData.summary}`);
  console.log(`   - Matching Skills (${fitData.matchingSkills.length}): ${fitData.matchingSkills.join(', ')}`);
  console.log(`   - Missing Skills / Keywords (${fitData.missingSkills.length}): ${fitData.missingSkills.join(', ')}`);
  console.log(`   - Engine / Model: ${fitData.modelUsed} (isAiGenerated: ${fitData.isAiGenerated})`);
  console.log('   - Tailored Resume Bullets:');
  fitData.tailoredBulletPoints.forEach((bullet, idx) => {
    console.log(`     [${idx + 1}] ${bullet}`);
  });
  console.log('   - Key Strengths:');
  fitData.keyStrengths.forEach((strength, idx) => {
    console.log(`     • ${strength}`);
  });
  console.log('   - Recommendations:');
  fitData.recommendations.forEach((rec, idx) => {
    console.log(`     • ${rec}`);
  });

  // 4. Validate output schema expectations
  if (typeof fitData.matchScore !== 'number' || fitData.matchScore < 0 || fitData.matchScore > 100) {
    throw new Error('Invalid matchScore: expected number 0-100');
  }
  if (!Array.isArray(fitData.matchingSkills) || !Array.isArray(fitData.missingSkills)) {
    throw new Error('Skills must be arrays');
  }
  if (!Array.isArray(fitData.tailoredBulletPoints) || fitData.tailoredBulletPoints.length === 0) {
    throw new Error('Tailored bullet points should not be empty');
  }

  console.log('\n🎉 ALL AI RESUME ANALYZER TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('❌ Test encountered error:', err);
  process.exit(1);
});
