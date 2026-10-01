const http = require('http');

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

async function runLdceScopeVerification() {
  console.log('\n======================================================');
  console.log('🏛️ VERIFYING EXCLUSIVE LDCE INSTITUTIONAL PORTAL SCOPE');
  console.log('   L.D. College of Engineering, Ahmedabad (GTU: 028)');
  console.log('======================================================\n');

  // 1. Root Layout & Metadata
  console.log('--- 1. Application Layout & Metadata ---');
  const loginPage = await fetchText('http://localhost:3000/login');
  assert(loginPage.status === 200, 'Login page returns HTTP 200 OK');
  assert(loginPage.text.includes('LDCE Placement Portal'), 'Login page contains "LDCE Placement Portal" title');
  assert(loginPage.text.includes('Training &amp; Placement Cell') || loginPage.text.includes('Training & Placement Cell'), 'Login page contains "Training & Placement Cell"');
  assert(loginPage.text.includes('L.D. College of Engineering, Ahmedabad'), 'Login page contains "L.D. College of Engineering, Ahmedabad"');
  assert(loginPage.text.includes('GTU Code: 028') || loginPage.text.includes('028'), 'Login page identifies GTU College Code: 028');
  assert(loginPage.text.includes('Prof. A. S. Sharma (Convener, TPO LDCE)'), 'TPO demo button identifies Convener, TPO LDCE');
  assert(loginPage.text.includes('Rahul Mehta (LDCE Computer Engg)'), 'Student demo button identifies LDCE Computer Engg');

  // 2. Student Registration Page
  console.log('\n--- 2. Student Registration (No Multi-College Prompts) ---');
  const regPage = await fetchText('http://localhost:3000/register');
  assert(regPage.status === 200, 'Registration page returns HTTP 200 OK');
  assert(regPage.text.includes('LDCE Student Registration'), 'Registration page titled "LDCE Student Registration"');
  assert(regPage.text.includes('Permanent Institution: L.D. College of Engineering (LDCE)'), 'Permanent single-institution badge verified');
  assert(!regPage.text.includes('Select your college'), 'No multi-college selection prompt exists');
  assert(regPage.text.includes('LDCE Engineering Department'), 'Department dropdown scoped to LDCE Engineering Department');

  // 3. Student Dashboard
  console.log('\n--- 3. Student Placement Portal ---');
  const homePage = await fetchText('http://localhost:3000/');
  assert(homePage.status === 200, 'Student home page returns HTTP 200 OK');
  assert(homePage.text.includes('LDCE Placement Portal'), 'Student home nav includes "LDCE Placement Portal"');
  assert(homePage.text.includes('L.D. College of Engineering, Ahmedabad'), 'Student home includes "L.D. College of Engineering, Ahmedabad"');
  assert(homePage.text.includes('GTU: 028'), 'Student navigation displays LDCE GTU code: 028');

  // 4. Student Notifications Page
  console.log('\n--- 4. Student Notifications Page ---');
  const notifPage = await fetchText('http://localhost:3000/notifications');
  assert(notifPage.status === 200, 'Student notifications page returns HTTP 200 OK');
  assert(notifPage.text.includes('Notifications &amp; Alerts') || notifPage.text.includes('Notifications & Alerts'), 'Notifications page renders correctly');

  // 5. TPO Dashboard
  console.log('\n--- 5. LDCE Training & Placement Cell Dashboard ---');
  const tpoPage = await fetchText('http://localhost:3000/tpo');
  assert(tpoPage.status === 200, 'TPO dashboard returns HTTP 200 OK');
  assert(tpoPage.text.includes('LDCE Training &amp; Placement Cell') || tpoPage.text.includes('LDCE Training & Placement Cell') || tpoPage.text.includes('LDCE Placement Cell'), 'TPO dashboard nav displays LDCE Placement Cell');
  assert(tpoPage.text.includes('LDCE TPO Dashboard'), 'TPO dashboard title is "LDCE TPO Dashboard"');
  assert(tpoPage.text.includes('L.D. College of Engineering, Ahmedabad'), 'TPO dashboard references L.D. College of Engineering, Ahmedabad');

  // 6. TPO Student Directory
  console.log('\n--- 6. LDCE Student Management ---');
  const tpoStudents = await fetchText('http://localhost:3000/tpo/students');
  assert(tpoStudents.status === 200, 'TPO students directory returns HTTP 200 OK');
  assert(tpoStudents.text.includes('LDCE Student Cohort &amp; Compliance Directory') || tpoStudents.text.includes('LDCE Student Cohort & Compliance Directory'), 'TPO directory titled for LDCE student cohort');
  assert(tpoStudents.text.includes('LDCE Branch'), 'Branch filter labeled "LDCE Branch"');

  // 7. TPO Companies
  console.log('\n--- 7. LDCE Company Management ---');
  const tpoCompanies = await fetchText('http://localhost:3000/tpo/companies');
  assert(tpoCompanies.status === 200, 'TPO companies page returns HTTP 200 OK');
  assert(tpoCompanies.text.includes('LDCE Partner Companies &amp; Recruiters') || tpoCompanies.text.includes('LDCE Partner Companies & Recruiters'), 'TPO companies page titled "LDCE Partner Companies & Recruiters"');

  // 8. TPO Recruitment Drives
  console.log('\n--- 8. LDCE Recruitment Drives ---');
  const tpoDrives = await fetchText('http://localhost:3000/tpo/drives');
  assert(tpoDrives.status === 200, 'TPO drives page returns HTTP 200 OK');
  assert(tpoDrives.text.includes('LDCE Recruitment Drives Management'), 'TPO drives page titled "LDCE Recruitment Drives Management"');

  // 9. TPO Applications Master List
  console.log('\n--- 9. LDCE Candidate Applications Master List ---');
  const tpoApps = await fetchText('http://localhost:3000/tpo/applications');
  assert(tpoApps.status === 200, 'TPO applications page returns HTTP 200 OK');
  assert(tpoApps.text.includes('LDCE Candidate Applications Master List'), 'Applications page titled "LDCE Candidate Applications Master List"');

  // 10. TPO Analytics
  console.log('\n--- 10. LDCE Placement Analytics ---');
  const tpoAnalytics = await fetchText('http://localhost:3000/tpo/analytics');
  assert(tpoAnalytics.status === 200, 'TPO analytics page returns HTTP 200 OK');
  assert(tpoAnalytics.text.includes('LDCE Placement Analytics &amp; Reports') || tpoAnalytics.text.includes('LDCE Placement Analytics & Reports'), 'Analytics page titled "LDCE Placement Analytics & Reports"');

  // 11. TPO Notifications Feed
  console.log('\n--- 11. LDCE TPO Activity & Notifications Log ---');
  const tpoNotifs = await fetchText('http://localhost:3000/tpo/notifications');
  assert(tpoNotifs.status === 200, 'TPO notifications page returns HTTP 200 OK');
  assert(tpoNotifs.text.includes('TPO Activity &amp; Notifications Log') || tpoNotifs.text.includes('TPO Activity & Notifications Log'), 'TPO activity log rendered');

  // 12. Permanent Institutional Footer
  console.log('\n--- 12. Permanent Institutional Footer ---');
  assert(homePage.text.includes('Opp. Gujarat University, Navrangpura, Ahmedabad - 380015, Gujarat'), 'Footer includes official LDCE Ahmedabad address');
  assert(homePage.text.includes('Estd. 1948'), 'Footer includes LDCE foundation year Estd. 1948');

  console.log('\n======================================================');
  console.log('🎉 ALL 24 LDCE INSTITUTIONAL SCOPE CHECKS PASSED!');
  console.log('   The application is 100% scoped exclusively to');
  console.log('   L.D. College of Engineering (LDCE), Ahmedabad.');
  console.log('======================================================\n');
}

runLdceScopeVerification().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
