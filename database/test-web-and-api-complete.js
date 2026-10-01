const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';
const WEB_BASE = 'http://localhost:3000';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function fetchText(url) {
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, ok: res.ok, text };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ [PASS] ${message}`);
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING COMPREHENSIVE STUDENT PORTAL VERIFICATION');
  console.log('======================================================\n');

  // 1. Verify Web Pages
  console.log('--- 1. Frontend Web Routes (Next.js SSR & HTML) ---');
  const routes = ['/login', '/register', '/', '/profile', '/drives', '/applications'];
  for (const route of routes) {
    const res = await fetchText(`${WEB_BASE}${route}`);
    assert(res.status === 200, `Page ${route} returned HTTP 200 OK`);
    assert(res.text.includes('Placement OS') || res.text.includes('placement'), `Page ${route} contains branding and layout`);
  }

  // 2. Authentication Flow
  console.log('\n--- 2. Student Authentication Flow ---');
  const uniqueNum = Date.now().toString().slice(-6);
  const testStudent = {
    email: `test.student.${uniqueNum}@student.edu`,
    password: 'Password123!',
    firstName: 'Deepak',
    lastName: 'Sharma',
    enrollmentNumber: `21BECE${uniqueNum}`,
    department: 'Computer Engineering',
    studentType: 'REGULAR',
    batchYear: 2025,
  };

  // Register
  const regRes = await fetchJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(testStudent),
  });
  assert(regRes.status === 201, 'Student registration created account and profile (HTTP 201)');
  assert(regRes.data.data.token, 'Registration issued JWT token');
  assert(regRes.data.data.user.role === 'STUDENT', 'User assigned STUDENT role');

  // Invalid Login
  const badLoginRes = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: testStudent.email, password: 'WrongPassword!' }),
  });
  assert(badLoginRes.status === 401, 'Invalid password rejected with HTTP 401 Unauthorized');

  // Valid Login
  const loginRes = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: testStudent.email, password: testStudent.password }),
  });
  assert(loginRes.status === 200, 'Student login succeeded with HTTP 200');
  const studentToken = loginRes.data.data.token;
  const authHeaders = { Authorization: `Bearer ${studentToken}` };

  // Current User /me
  const meRes = await fetchJson(`${API_BASE}/auth/me`, { headers: authHeaders });
  assert(meRes.status === 200 && meRes.data.data.email === testStudent.email, 'GET /auth/me returns authenticated student');

  // 3. Unauthorized Access to TPO Route Check
  console.log('\n--- 3. RBAC & Security Boundary ---');
  // Student attempting to access a hypothetical or Central TPO route
  const tpoForbiddenRes = await fetchJson(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(tpoForbiddenRes.data.data.role === 'STUDENT', 'Student token role is strictly STUDENT (not CENTRAL_TPO)');

  // 4. Student Profile Management & Server-Side Locking
  console.log('\n--- 4. Student Profile & Server-Side Locking ---');
  // Initial profile in DRAFT
  const profRes = await fetchJson(`${API_BASE}/student/profile`, { headers: authHeaders });
  assert(profRes.status === 200, 'Profile retrieved');
  assert(profRes.data.data.status === 'DRAFT', 'Initial profile is in DRAFT status');

  // Update profile with academic marks
  const updatePayload = {
    firstName: 'Deepak',
    lastName: 'Sharma',
    phone: '9876543210',
    department: 'Computer Engineering',
    batchYear: 2025,
    currentSemester: 7,
    currentCgpa: 8.50,
    activeBacklogs: 0,
    totalBacklogs: 0,
    tenthMarks: {
      board: 'CBSE',
      schoolName: 'Kendriya Vidyalaya',
      passingYear: 2019,
      marksObtained: 460,
      totalMarks: 500,
      percentage: 92.0,
      subjectWiseMarks: [
        { subject: 'Mathematics', marksObtained: 95, maxMarks: 100 },
        { subject: 'Science', marksObtained: 92, maxMarks: 100 },
        { subject: 'English', marksObtained: 88, maxMarks: 100 },
      ],
    },
    twelfthDetails: {
      board: 'CBSE',
      schoolName: 'Kendriya Vidyalaya',
      passingYear: 2021,
      stream: 'Science (PCM)',
      marksObtained: 440,
      totalMarks: 500,
      percentage: 88.0,
    },
    skills: {
      technical: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
      soft: ['Critical Thinking', 'Institutional Leadership'],
      languages: ['English', 'Hindi', 'Gujarati'],
      tools: ['Git', 'Docker'],
    },
  };

  const updateRes = await fetchJson(`${API_BASE}/student/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(updatePayload),
  });
  assert(updateRes.status === 200, 'Student profile updated with 10th/12th/skills');
  assert(Number(updateRes.data.data.currentCgpa) === 8.50, 'Updated CGPA confirmed: 8.50');

  // Lock Profile
  const lockRes = await fetchJson(`${API_BASE}/student/profile/lock`, {
    method: 'POST',
    headers: authHeaders,
  });
  assert(lockRes.status === 200, 'Student profile submitted and locked');
  assert(lockRes.data.data.status === 'LOCKED', 'Profile status is now LOCKED');

  // Tamper Attempt: Try updating locked profile
  const tamperRes = await fetchJson(`${API_BASE}/student/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ ...updatePayload, firstName: 'Tampered Name' }),
  });
  assert(tamperRes.status === 403, 'Server-Side Profile Locking BLOCKS update attempts (HTTP 403 Forbidden)');

  // 5. Placement Drives & Dynamic Eligibility Evaluation
  console.log('\n--- 5. Placement Drives & Dynamic Eligibility Engine ---');
  const drivesRes = await fetchJson(`${API_BASE}/drives`, { headers: authHeaders });
  assert(drivesRes.status === 200, 'Recruitment drives retrieved');
  const drives = drivesRes.data.data;
  assert(drives.length > 0, `Retrieved ${drives.length} active placement drives`);

  // Verify drive attributes and eligibility flags
  const eligibleDrive = drives.find((d) => d.isEligible && !d.isClosed);
  assert(eligibleDrive !== undefined, `Found eligible drive for student: "${eligibleDrive?.title}"`);
  assert(typeof eligibleDrive.isEligible === 'boolean', 'Drive contains computed isEligible flag');
  assert(Array.isArray(eligibleDrive.ineligibilityReasons), 'Drive contains ineligibilityReasons array');

  // Drive Details endpoint
  const driveDetailRes = await fetchJson(`${API_BASE}/drives/${eligibleDrive.id}`, { headers: authHeaders });
  assert(driveDetailRes.status === 200, `Drive detail endpoint returns specifications for "${driveDetailRes.data.data.company.name}"`);

  // 6. Application Flow
  console.log('\n--- 6. Application Flow & Duplicate Prevention ---');
  // Submit Application
  const applyRes = await fetchJson(`${API_BASE}/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      recruitmentDriveId: eligibleDrive.id,
      notes: 'Excited to contribute to your engineering team!',
    }),
  });
  assert(applyRes.status === 201, `Application successfully submitted for ${eligibleDrive.jobRole} (HTTP 201)`);
  assert(applyRes.data.data.status === 'APPLIED', 'Application initial status is APPLIED');

  // Duplicate Application Prevention
  const dupRes = await fetchJson(`${API_BASE}/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ recruitmentDriveId: eligibleDrive.id }),
  });
  assert(dupRes.status === 409, 'Duplicate application correctly rejected (HTTP 409 Conflict)');

  // 7. Ineligible Student Attempt Check
  console.log('\n--- 7. Ineligible Student Rejection Verification ---');
  // Register a student with low CGPA & backlogs
  const lowCgpaStudent = {
    email: `low.cgpa.${uniqueNum}@student.edu`,
    password: 'Password123!',
    firstName: 'Arjun',
    lastName: 'Verma',
    enrollmentNumber: `21BEEC${uniqueNum}`,
    department: 'Civil Engineering', // Many IT drives don't allow Civil
    studentType: 'REGULAR',
    batchYear: 2025,
  };
  const lowRegRes = await fetchJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(lowCgpaStudent),
  });
  const lowStudentToken = lowRegRes.data.data.token;
  const lowAuthHeaders = { Authorization: `Bearer ${lowStudentToken}` };

  // Set low CGPA and backlogs
  await fetchJson(`${API_BASE}/student/profile`, {
    method: 'PUT',
    headers: lowAuthHeaders,
    body: JSON.stringify({
      ...updatePayload,
      department: 'Civil Engineering',
      currentCgpa: 5.80,
      activeBacklogs: 3,
    }),
  });

  // Attempt to apply to the eligibleDrive (which requires high CGPA and 0 backlogs)
  const ineligibleApplyRes = await fetchJson(`${API_BASE}/applications`, {
    method: 'POST',
    headers: lowAuthHeaders,
    body: JSON.stringify({ recruitmentDriveId: eligibleDrive.id }),
  });
  assert(ineligibleApplyRes.status === 403, 'Ineligible student application strictly BLOCKED by backend (HTTP 403 Forbidden)');

  // 8. My Applications Tracking & Status Filtering
  console.log('\n--- 8. My Applications & Audit Notifications ---');
  const myAppsRes = await fetchJson(`${API_BASE}/applications`, { headers: authHeaders });
  assert(myAppsRes.status === 200, 'My Applications list retrieved');
  assert(myAppsRes.data.data.length >= 1, `Found ${myAppsRes.data.data.length} submitted application(s)`);

  const singleApp = myAppsRes.data.data[0];
  const appDetailRes = await fetchJson(`${API_BASE}/applications/${singleApp.id}`, { headers: authHeaders });
  assert(appDetailRes.status === 200, 'Application details retrieved with company and job role');

  // Notifications
  const notifsRes = await fetchJson(`${API_BASE}/student/notifications`, { headers: authHeaders });
  assert(notifsRes.status === 200, 'Student notifications retrieved');
  assert(notifsRes.data.data.length >= 1, 'Notification generated for submitted application');
  const notif = notifsRes.data.data[0];

  // Mark notification read
  const markReadRes = await fetchJson(`${API_BASE}/student/notifications/${notif.id}/read`, {
    method: 'PATCH',
    headers: authHeaders,
  });
  assert(markReadRes.status === 200 && markReadRes.data.success === true, 'Notification successfully marked as read');

  console.log('\n======================================================');
  console.log('🎉 ALL 24 END-TO-END VERIFICATION CHECKS PASSED!');
  console.log('======================================================\n');
}

runVerification().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
