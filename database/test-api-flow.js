const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1${path}`,
        method,
        headers,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({ status: res.statusCode, body: parsed });
          } catch {
            resolve({ status: res.statusCode, raw: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting End-to-End Student API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body.data.status === 'healthy', 'Health Check Healthy with DB');

    // 2. Student Registration
    const testRegEmail = `test.student.${Date.now()}@college.edu`;
    const regRes = await request('POST', '/auth/register', {
      email: testRegEmail,
      password: 'Password123!',
      enrollmentNumber: `ENR${Date.now().toString().slice(-6)}`,
      firstName: 'Test',
      lastName: 'Student',
      department: 'Computer Engineering',
      batchYear: 2025,
      studentType: 'REGULAR',
    });
    assert(regRes.status === 201 && regRes.body.data.token, 'Student Registration succeeds and issues JWT');
    const newStudentToken = regRes.body.data.token;

    // 3. Invalid Login Failure Test
    const badLogin = await request('POST', '/auth/login', {
      email: testRegEmail,
      password: 'WrongPassword!',
    });
    assert(badLogin.status === 401, 'Invalid Login properly rejected with 401');

    // 4. Valid Login
    const loginRes = await request('POST', '/auth/login', {
      email: testRegEmail,
      password: 'Password123!',
    });
    assert(loginRes.status === 200 && loginRes.body.data.token, 'Valid Login succeeds');

    // 5. Incomplete Profile - Attempt Apply (Expect 400 or 403)
    const drivesRes = await request('GET', '/drives', null, newStudentToken);
    assert(drivesRes.status === 200 && drivesRes.body.data.length > 0, 'Drives list retrieved');
    const googleDrive = drivesRes.body.data.find((d) => d.title.includes('Google'));
    const lttsDrive = drivesRes.body.data.find((d) => d.title.includes('LTTS'));
    const closedDrive = drivesRes.body.data.find((d) => d.isClosed);

    const prematureApply = await request('POST', '/applications', { recruitmentDriveId: googleDrive.id }, newStudentToken);
    assert(prematureApply.status >= 400, 'Applying with incomplete profile rejected by backend');

    // 6. Complete Profile
    const updateProfileRes = await request(
      'PUT',
      '/student/profile',
      {
        firstName: 'Test',
        lastName: 'Student',
        phone: '+91 91234 56789',
        dateOfBirth: '2003-05-10',
        gender: 'Male',
        address: '12, College Campus Hostel',
        department: 'Computer Engineering',
        batchYear: 2025,
        currentSemester: 7,
        currentCgpa: 8.5,
        activeBacklogs: 0,
        totalBacklogs: 0,
        tenthMarks: {
          board: 'CBSE',
          schoolName: 'St. Paul High School',
          passingYear: 2019,
          marksObtained: 450,
          totalMarks: 500,
          percentage: 90.0,
          subjectWiseMarks: [
            { subject: 'Maths', marksObtained: 95, maxMarks: 100 },
            { subject: 'Science', marksObtained: 90, maxMarks: 100 },
          ],
        },
        twelfthDetails: {
          board: 'CBSE',
          schoolName: 'St. Paul High School',
          passingYear: 2021,
          stream: 'Science',
          marksObtained: 440,
          totalMarks: 500,
          percentage: 88.0,
        },
        skills: {
          technical: ['React', 'Node.js', 'PostgreSQL'],
          soft: ['Teamwork'],
          languages: ['English', 'Hindi'],
          tools: ['Git'],
        },
      },
      newStudentToken
    );
    assert(updateProfileRes.status === 200, 'Student Profile updated with academic details');

    // 7. Lock Profile
    const lockRes = await request('POST', '/student/profile/lock', null, newStudentToken);
    assert(lockRes.status === 200 && lockRes.body.data.status === 'LOCKED', 'Student Profile locked successfully');

    // 8. Server-Side Profile Locking Enforcement Test
    const attemptEditLocked = await request(
      'PUT',
      '/student/profile',
      {
        firstName: 'HackedName',
        lastName: 'Student',
        department: 'Computer Engineering',
        batchYear: 2025,
        currentSemester: 7,
        currentCgpa: 9.9, // Attempt tampering CGPA!
        activeBacklogs: 0,
        totalBacklogs: 0,
        tenthMarks: {
          board: 'CBSE',
          schoolName: 'School',
          passingYear: 2019,
          marksObtained: 490,
          totalMarks: 500,
          percentage: 98.0,
          subjectWiseMarks: [],
        },
      },
      newStudentToken
    );
    assert(attemptEditLocked.status === 403, 'Server-Side Profile Locking BLOCKS tampering (HTTP 403 Forbidden)');

    // 9. Ineligible Drive Application Test (LTTS is only for EC/EE, student is CE)
    const ineligibleApply = await request('POST', '/applications', { recruitmentDriveId: lttsDrive.id }, newStudentToken);
    assert(ineligibleApply.status === 403, 'Ineligible student applying is BLOCKED by server-side eligibility check (HTTP 403)');

    // 10. Eligible Drive Application (Google Drive: 8.0 CGPA, student has 8.5)
    const validApply = await request('POST', '/applications', { recruitmentDriveId: googleDrive.id, notes: 'Excited for this role!' }, newStudentToken);
    assert(validApply.status === 201 && validApply.body.data.status === 'APPLIED', 'Eligible student application SUCCEEDS (HTTP 201)');

    // 11. Duplicate Application Prevention Test
    const duplicateApply = await request('POST', '/applications', { recruitmentDriveId: googleDrive.id }, newStudentToken);
    assert(duplicateApply.status === 409, 'Duplicate application rejected with 409 Conflict');

    // 12. Closed Drive Application Test
    if (closedDrive) {
      const closedApply = await request('POST', '/applications', { recruitmentDriveId: closedDrive.id }, newStudentToken);
      assert(closedApply.status === 400, 'Applying to closed drive rejected with 400 Bad Request');
    }

    // 13. My Applications List
    const myApps = await request('GET', '/applications', null, newStudentToken);
    assert(myApps.status === 200 && myApps.body.data.length === 1, 'My Applications list returns student applications');

    // 14. Notifications List
    const notifs = await request('GET', '/student/notifications', null, newStudentToken);
    assert(notifs.status === 200 && notifs.body.data.length >= 2, 'Student Notifications audit trail populated');

    console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();
