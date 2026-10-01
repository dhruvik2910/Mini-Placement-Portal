const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

async function fetchRaw(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  return { status: res.status, ok: res.ok, headers: res.headers, text };
}

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

async function runExportTests() {
  console.log('\n======================================================');
  console.log('🏛️ RUNNING PHASE 4A — TPO REPORTING & CSV EXPORT TEST SUITE');
  console.log('======================================================\n');

  // Step 1: Authenticate TPO & Student
  console.log('--- 1. Authentication & Security Tokens ---');
  const tpoRes = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'tpo@placement.edu', password: 'Password123!' }),
  });
  assert(tpoRes.status === 200, 'TPO successfully authenticated');
  const tpoToken = tpoRes.data.data.token;

  const studentRes = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'rahul.mehta@student.edu', password: 'Password123!' }),
  });
  assert(studentRes.status === 200, 'Student successfully authenticated');
  const studentToken = studentRes.data.data.token;

  // Step 2: Strict RBAC Barrier Tests
  console.log('\n--- 2. RBAC Enforcement: Unauthorized Access Prevention ---');
  const unauthCohort = await fetchRaw(`${API_BASE}/tpo/students/export-csv`);
  assert(unauthCohort.status === 401, 'Unauthenticated request to students CSV export rejected with 401 Unauthorized');

  const unauthApps = await fetchRaw(`${API_BASE}/tpo/applications/export-csv`);
  assert(unauthApps.status === 401, 'Unauthenticated request to applications CSV export rejected with 401 Unauthorized');

  const studentCohort = await fetchRaw(`${API_BASE}/tpo/students/export-csv`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(studentCohort.status === 403, 'Unauthorized student calling students CSV export strictly blocked with 403 Forbidden');

  const studentApps = await fetchRaw(`${API_BASE}/tpo/applications/export-csv`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(studentApps.status === 403, 'Unauthorized student calling applications CSV export strictly blocked with 403 Forbidden');

  // Step 3: TPO Student Cohort Directory CSV Export
  console.log('\n--- 3. Student Cohort Directory CSV Export ---');
  const allStudentsExport = await fetchRaw(`${API_BASE}/tpo/students/export-csv`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  assert(allStudentsExport.status === 200, 'TPO student cohort export returned HTTP 200 OK');
  const contentType = allStudentsExport.headers.get('content-type') || '';
  assert(contentType.includes('text/csv'), `Content-Type is text/csv (received: ${contentType})`);
  const contentDisposition = allStudentsExport.headers.get('content-disposition') || '';
  assert(contentDisposition.includes('attachment') && contentDisposition.includes('.csv'), `Content-Disposition header includes attachment filename`);

  const studentLines = allStudentsExport.text.trim().split('\r\n');
  assert(studentLines.length >= 2, `Exported CSV contains header + data rows (total lines: ${studentLines.length})`);

  const studentHeader = studentLines[0];
  assert(studentHeader.includes('GTU Enrollment Number'), 'Student CSV contains "GTU Enrollment Number" column');
  assert(studentHeader.includes('LDCE Department'), 'Student CSV contains "LDCE Department" column');
  assert(studentHeader.includes('Verified CGPA'), 'Student CSV contains "Verified CGPA" column');
  assert(studentHeader.includes('Active Backlogs'), 'Student CSV contains "Active Backlogs" column');
  assert(studentHeader.includes('Profile Status'), 'Student CSV contains "Profile Status" column');
  assert(studentHeader.includes('TPO Verification'), 'Student CSV contains "TPO Verification" column');

  // Step 4: Student Cohort Filters Before Export
  console.log('\n--- 4. Student Cohort Export Filters ---');
  // Filter by branch: Computer Engineering
  const ceExport = await fetchRaw(`${API_BASE}/tpo/students/export-csv?department=Computer%20Engineering`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  assert(ceExport.status === 200, 'Filtered export by department "Computer Engineering" returned 200 OK');
  const ceLines = ceExport.text.trim().split('\r\n');
  for (let i = 1; i < ceLines.length; i++) {
    assert(ceLines[i].includes('Computer Engineering'), `Row ${i} strictly matches department filter`);
  }

  // Filter by Verification Status: VERIFIED
  const verifiedExport = await fetchRaw(`${API_BASE}/tpo/students/export-csv?verificationStatus=VERIFIED`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  assert(verifiedExport.status === 200, 'Filtered export by verificationStatus "VERIFIED" returned 200 OK');
  const verifiedLines = verifiedExport.text.trim().split('\r\n');
  for (let i = 1; i < verifiedLines.length; i++) {
    assert(verifiedLines[i].includes('VERIFIED'), `Row ${i} strictly matches VERIFIED status`);
  }

  // Step 5: Candidate Applications Pipeline CSV Export
  console.log('\n--- 5. Candidate Applications Pipeline CSV Export ---');
  const allAppsExport = await fetchRaw(`${API_BASE}/tpo/applications/export-csv`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  assert(allAppsExport.status === 200, 'TPO applications pipeline export returned HTTP 200 OK');
  const appContentType = allAppsExport.headers.get('content-type') || '';
  assert(appContentType.includes('text/csv'), `Applications Content-Type is text/csv (received: ${appContentType})`);
  
  const appLines = allAppsExport.text.trim().split('\r\n');
  assert(appLines.length >= 2, `Applications CSV contains header + data rows (total lines: ${appLines.length})`);

  const appHeader = appLines[0];
  assert(appHeader.includes('Application ID'), 'Applications CSV contains "Application ID" column');
  assert(appHeader.includes('GTU Enrollment Number'), 'Applications CSV contains "GTU Enrollment Number" column');
  assert(appHeader.includes('Recruiting Partner'), 'Applications CSV contains "Recruiting Partner" column');
  assert(appHeader.includes('Job Role'), 'Applications CSV contains "Job Role" column');
  assert(appHeader.includes('Application Status'), 'Applications CSV contains "Application Status" column');
  assert(appHeader.includes('CTC / Package'), 'Applications CSV contains "CTC / Package" column');

  // Step 6: Applications Export Filters
  console.log('\n--- 6. Candidate Applications Export Filters ---');
  // Filter by status: SELECTED
  const selectedAppsExport = await fetchRaw(`${API_BASE}/tpo/applications/export-csv?status=SELECTED`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  assert(selectedAppsExport.status === 200, 'Filtered applications export by status "SELECTED" returned 200 OK');
  const selectedLines = selectedAppsExport.text.trim().split('\r\n');
  for (let i = 1; i < selectedLines.length; i++) {
    assert(selectedLines[i].includes('SELECTED'), `Row ${i} strictly matches SELECTED status`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 4A REPORTING & EXPORT TESTS PASSED!');
  console.log('======================================================\n');
}

runExportTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
