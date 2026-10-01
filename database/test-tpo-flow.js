const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

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

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ [PASS] ${message}`);
}

async function runTpoTests() {
  console.log('\n======================================================');
  console.log('🏛️ RUNNING COMPREHENSIVE TPO BACKEND & RBAC TEST SUITE');
  console.log('======================================================\n');

  // 1. TPO Authentication
  console.log('--- 1. TPO Authentication & RBAC Enforcement ---');
  // Invalid Login
  const badLogin = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'tpo@placement.edu', password: 'WrongPassword!' }),
  });
  assert(badLogin.status === 401, 'Invalid TPO password rejected with 401 Unauthorized');

  // Valid TPO Login
  const tpoLogin = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'tpo@placement.edu', password: 'Password123!' }),
  });
  assert(tpoLogin.status === 200, 'TPO successfully authenticated (HTTP 200)');
  assert(tpoLogin.data.data.user.role === 'TPO', 'Authenticated user role is TPO');
  const tpoToken = tpoLogin.data.data.token;
  const tpoHeaders = { Authorization: `Bearer ${tpoToken}` };

  // Student Login (to test security isolation)
  const studentLogin = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'rahul.mehta@student.edu', password: 'Password123!' }),
  });
  const studentToken = studentLogin.data.data.token;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // Security Test: Student token calling TPO route
  const studentCallingTpo = await fetchJson(`${API_BASE}/tpo/dashboard`, {
    headers: studentHeaders,
  });
  assert(studentCallingTpo.status === 403, 'Security Barrier: Student JWT calling TPO route rejected with HTTP 403 Forbidden');

  // Security Test: Unauthenticated request
  const unauthCallingTpo = await fetchJson(`${API_BASE}/tpo/dashboard`);
  assert(unauthCallingTpo.status === 401, 'Security Barrier: Unauthenticated request rejected with HTTP 401 Unauthorized');

  // 2. TPO Dashboard Metrics
  console.log('\n--- 2. TPO Dashboard Database Metrics ---');
  const dashRes = await fetchJson(`${API_BASE}/tpo/dashboard`, { headers: tpoHeaders });
  assert(dashRes.status === 200, 'GET /tpo/dashboard returned HTTP 200');
  const stats = dashRes.data.data;
  assert(typeof stats.totalStudents === 'number' && stats.totalStudents > 0, `Total registered students: ${stats.totalStudents}`);
  assert(typeof stats.lockedProfiles === 'number', `Locked profiles: ${stats.lockedProfiles}`);
  assert(typeof stats.totalCompanies === 'number' && stats.totalCompanies > 0, `Total companies: ${stats.totalCompanies}`);
  assert(typeof stats.activeDrives === 'number', `Active drives: ${stats.activeDrives}`);
  assert(typeof stats.totalApplications === 'number', `Total applications: ${stats.totalApplications}`);
  assert(Array.isArray(stats.recentActivity), 'Recent activity stream present');

  // 3. Student Management & Filtering
  console.log('\n--- 3. Student Management & Directory ---');
  const studentsRes = await fetchJson(`${API_BASE}/tpo/students`, { headers: tpoHeaders });
  assert(studentsRes.status === 200, 'GET /tpo/students returned list');
  const students = studentsRes.data.data;
  assert(students.length > 0, `Retrieved ${students.length} student records`);

  // Search filter
  const searchRes = await fetchJson(`${API_BASE}/tpo/students?search=Rahul`, { headers: tpoHeaders });
  assert(searchRes.status === 200 && searchRes.data.data.length >= 1, 'Search by name "Rahul" returns student');

  // Backlog filter
  const backlogFilterRes = await fetchJson(`${API_BASE}/tpo/students?backlogStatus=HAS_BACKLOGS`, { headers: tpoHeaders });
  assert(backlogFilterRes.status === 200, 'Filter by backlogStatus=HAS_BACKLOGS succeeds');

  // Student Detail Dossier
  const targetStudent = students[0];
  const dossierRes = await fetchJson(`${API_BASE}/tpo/students/${targetStudent.id}`, { headers: tpoHeaders });
  assert(dossierRes.status === 200, `Retrieved full dossier for ${targetStudent.firstName} ${targetStudent.lastName}`);
  assert(Array.isArray(dossierRes.data.data.applications), 'Dossier includes placement applications');
  assert(Array.isArray(dossierRes.data.data.verifications), 'Dossier includes verification audit records');

  // 4. Student Verification / Compliance
  console.log('\n--- 4. Student Profile Verification ---');
  const verifyRes = await fetchJson(`${API_BASE}/tpo/students/${targetStudent.id}/verify`, {
    method: 'POST',
    headers: tpoHeaders,
    body: JSON.stringify({
      status: 'VERIFIED',
      remarks: 'All 10th and 12th original marksheets verified by TPO dean.',
    }),
  });
  assert(verifyRes.status === 200, 'Student profile verified by TPO (HTTP 200)');
  assert(verifyRes.data.data.verificationStatus === 'VERIFIED', 'Profile verification status is now VERIFIED');

  // 5. Company Management
  console.log('\n--- 5. Company Management (CRUD) ---');
  const uniqueCode = Date.now().toString().slice(-4);
  const newCompanyPayload = {
    name: `Apex Cloud Systems ${uniqueCode}`,
    website: 'https://apexcloud.example.com',
    industry: 'Cloud Infrastructure',
    description: 'Enterprise Kubernetes and Multi-Cloud platform engineering.',
    contactPerson: 'Mr. David Miller',
    contactEmail: `recruitment.${uniqueCode}@apexcloud.example.com`,
    contactPhone: '+91 99887 76655',
  };

  const createCompanyRes = await fetchJson(`${API_BASE}/tpo/companies`, {
    method: 'POST',
    headers: tpoHeaders,
    body: JSON.stringify(newCompanyPayload),
  });
  assert(createCompanyRes.status === 201, 'Company created successfully (HTTP 201)');
  const createdCompany = createCompanyRes.data.data;
  assert(createdCompany.name === newCompanyPayload.name, 'Company name matches');

  // Update company
  const updateCompanyRes = await fetchJson(`${API_BASE}/tpo/companies/${createdCompany.id}`, {
    method: 'PUT',
    headers: tpoHeaders,
    body: JSON.stringify({ description: 'Updated company description for placement.' }),
  });
  assert(updateCompanyRes.status === 200, 'Company details updated (HTTP 200)');

  // 6. Recruitment Drive Management & Eligibility Preview
  console.log('\n--- 6. Recruitment Drive Management & Live Eligibility Preview ---');
  const newDrivePayload = {
    companyId: createdCompany.id,
    title: `Apex Cloud Associate SRE Drive ${uniqueCode}`,
    jobRole: 'Site Reliability Engineer',
    driveType: 'FULL_TIME',
    status: 'ACTIVE',
    packageLpa: 14.5,
    location: 'Bangalore / Remote',
    description: 'Developing high-scale distributed telemetry pipelines.',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    driveDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    requiredSkills: ['Linux', 'Go', 'Kubernetes', 'Docker'],
    minCgpa: 7.5,
    minTenthPercentage: 70,
    minTwelfthOrDiplomaPercentage: 70,
    maxActiveBacklogs: 0,
    allowedStudentTypes: ['REGULAR', 'D2D'],
    allowedDepartments: ['Computer Engineering', 'Information Technology'],
  };

  // Live Eligibility Preview BEFORE drive creation
  const previewRes = await fetchJson(`${API_BASE}/tpo/drives/eligibility-preview`, {
    method: 'POST',
    headers: tpoHeaders,
    body: JSON.stringify(newDrivePayload),
  });
  assert(previewRes.status === 200, 'Eligibility preview computed via single source of truth engine');
  const previewData = previewRes.data.data;
  assert(typeof previewData.eligibleCount === 'number', `Eligible students: ${previewData.eligibleCount} / ${previewData.totalStudents}`);
  assert(Array.isArray(previewData.students), 'Student eligibility breakdown returned');

  // Create Drive
  const createDriveRes = await fetchJson(`${API_BASE}/tpo/drives`, {
    method: 'POST',
    headers: tpoHeaders,
    body: JSON.stringify(newDrivePayload),
  });
  assert(createDriveRes.status === 201, 'Recruitment drive created (HTTP 201)');
  const createdDrive = createDriveRes.data.data;

  // 7. Applicant Management & Status Transitions
  console.log('\n--- 7. Applicant Management & State Transitions ---');
  // Have the student apply to this new drive
  const applyRes = await fetchJson(`${API_BASE}/applications`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ recruitmentDriveId: createdDrive.id, notes: 'Excited for SRE role!' }),
  });
  assert(applyRes.status === 201, 'Student submitted application for new drive');
  const testApplicationId = applyRes.data.data.id;

  // TPO fetches applicants for the drive
  const applicantsRes = await fetchJson(`${API_BASE}/tpo/drives/${createdDrive.id}/applicants`, {
    headers: tpoHeaders,
  });
  assert(applicantsRes.status === 200, 'TPO retrieved drive applicants list');
  assert(applicantsRes.data.data.some((a) => a.id === testApplicationId), 'Applicant appears in TPO drive applicants');

  // Transition: APPLIED -> SHORTLISTED
  const shortlistRes = await fetchJson(`${API_BASE}/tpo/applications/${testApplicationId}/status`, {
    method: 'PATCH',
    headers: tpoHeaders,
    body: JSON.stringify({ status: 'SHORTLISTED', notes: 'Top 10% coding assessment rank.' }),
  });
  assert(shortlistRes.status === 200, 'TPO transitioned status to SHORTLISTED');
  assert(shortlistRes.data.data.status === 'SHORTLISTED', 'Application status updated in DB');

  // Transition: SHORTLISTED -> SELECTED
  const selectRes = await fetchJson(`${API_BASE}/tpo/applications/${testApplicationId}/status`, {
    method: 'PATCH',
    headers: tpoHeaders,
    body: JSON.stringify({ status: 'SELECTED', notes: 'Cleared final managerial round.' }),
  });
  assert(selectRes.status === 200, 'TPO transitioned status to SELECTED');
  assert(selectRes.data.data.status === 'SELECTED', 'Official offer status recorded');

  // Invalid Transition Security Test: SELECTED -> APPLIED (Disallowed)
  const invalidTransition = await fetchJson(`${API_BASE}/tpo/applications/${testApplicationId}/status`, {
    method: 'PATCH',
    headers: tpoHeaders,
    body: JSON.stringify({ status: 'APPLIED' }),
  });
  assert(invalidTransition.status === 400, 'Business Rule Enforced: Reverting SELECTED back to APPLIED rejected (HTTP 400)');

  // 8. Bulk Applicant Status Updates
  console.log('\n--- 8. Bulk Applicant Actions ---');
  const bulkRes = await fetchJson(`${API_BASE}/tpo/applications/bulk-status`, {
    method: 'POST',
    headers: tpoHeaders,
    body: JSON.stringify({
      applicationIds: [testApplicationId],
      status: 'SELECTED',
      notes: 'Bulk confirmation batch.',
    }),
  });
  assert(bulkRes.status === 200 && bulkRes.data.data.updatedCount === 1, 'Bulk update successfully executed');

  // 9. Placement Analytics
  console.log('\n--- 9. Placement Analytics & Reporting ---');
  const analyticsRes = await fetchJson(`${API_BASE}/tpo/analytics`, { headers: tpoHeaders });
  assert(analyticsRes.status === 200, 'Placement analytics loaded');
  const analytics = analyticsRes.data.data;
  assert(typeof analytics.placementRate === 'number', `Overall placement rate: ${analytics.placementRate}%`);
  assert(Array.isArray(analytics.departmentStats), 'Department placement statistics array present');
  assert(Array.isArray(analytics.companyStats), 'Company recruitment metrics array present');
  assert(typeof analytics.statusFunnel === 'object', 'Funnel analysis present');

  console.log('\n======================================================');
  console.log('🎉 ALL 24 TPO BACKEND & SECURITY TESTS PASSED!');
  console.log('======================================================\n');
}

runTpoTests().catch((err) => {
  console.error('TPO test script crashed:', err);
  process.exit(1);
});
