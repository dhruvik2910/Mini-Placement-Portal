const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function pass(msg) {
  console.log(`  ✅ [PASS] ${msg}`);
}

function fail(msg, details) {
  console.error(`  ❌ [FAIL] ${msg}`);
  if (details) console.error('     Details:', details);
  process.exit(1);
}

async function runNotificationsFlowTests() {
  console.log('\n======================================================');
  console.log('🏛️ RUNNING PHASE 4B — NOTIFICATION DISPATCHER TEST SUITE');
  console.log('======================================================\n');

  // --- 1. Authenticate TPO & Student ---
  console.log('--- 1. Authentication & Security Tokens ---');
  const tpoLogin = await request('POST', '/auth/login', {
    email: 'tpo@placement.edu',
    password: 'Password123!',
  });
  if (tpoLogin.status !== 200 || !tpoLogin.body.data?.token) {
    fail('TPO authentication failed', tpoLogin.body);
  }
  const tpoToken = tpoLogin.body.data.token;
  pass('TPO successfully authenticated');

  const studentLogin = await request('POST', '/auth/login', {
    email: 'rahul.mehta@student.edu',
    password: 'Password123!',
  });
  if (studentLogin.status !== 200 || !studentLogin.body.data?.token) {
    fail('Student authentication failed', studentLogin.body);
  }
  const studentToken = studentLogin.body.data.token;
  pass('Student successfully authenticated');

  // --- 2. RBAC Enforcement on Delivery Logs ---
  console.log('\n--- 2. RBAC Enforcement: Unauthorized Access Prevention ---');
  const unauthLogs = await request('GET', '/tpo/notifications/delivery-logs');
  if (unauthLogs.status === 401) {
    pass('Unauthenticated request to delivery logs rejected with 401 Unauthorized');
  } else {
    fail('Unauthenticated request to delivery logs was not blocked', unauthLogs.status);
  }

  const studentForbidden = await request('GET', '/tpo/notifications/delivery-logs', null, studentToken);
  if (studentForbidden.status === 403) {
    pass('Unauthorized student calling delivery logs strictly blocked with 403 Forbidden');
  } else {
    fail('Student was able to access TPO delivery logs', studentForbidden.status);
  }

  const tpoLogs = await request('GET', '/tpo/notifications/delivery-logs', null, tpoToken);
  if (tpoLogs.status === 200 && tpoLogs.body.data?.logs !== undefined) {
    pass('Authorized TPO successfully retrieved delivery logs (HTTP 200)');
  } else {
    fail('TPO failed to fetch delivery logs', tpoLogs.body);
  }

  // --- 3. Profile Verification Notification Trigger ---
  console.log('\n--- 3. Student Profile Verification Notification Trigger ---');
  const studentsRes = await request('GET', '/tpo/students?search=Rahul', null, tpoToken);
  const targetStudent = studentsRes.body.data?.[0];
  if (!targetStudent) {
    fail('Could not find target student for verification test');
  }

  const verifyRes = await request(
    'POST',
    `/tpo/students/${targetStudent.id}/verify`,
    {
      status: 'VERIFIED',
      remarks: 'All semester grade cards and 10th/12th marksheets verified against GTU database.',
    },
    tpoToken
  );

  if (verifyRes.status === 200) {
    pass('TPO verified student profile (HTTP 200)');
  } else {
    fail('TPO verify profile failed', verifyRes.body);
  }

  // Allow async dispatcher event loop tick
  await new Promise((r) => setTimeout(r, 600));

  // Check delivery log for verification
  const studentEmail = 'rahul.mehta@student.edu';
  const verifyLogsRes = await request(
    'GET',
    `/tpo/notifications/delivery-logs?template=PROFILE_VERIFIED&recipientEmail=${encodeURIComponent(studentEmail)}`,
    null,
    tpoToken
  );

  if (verifyLogsRes.status === 200 && verifyLogsRes.body.data?.logs?.length > 0) {
    const log = verifyLogsRes.body.data.logs[0];
    pass(`Notification delivery log recorded for PROFILE_VERIFIED (Status: ${log.status})`);
    if (log.subject.includes('[LDCE Placements]') && log.subject.includes('Verified')) {
      pass(`Subject correctly formatted: "${log.subject}"`);
    } else {
      fail('Unexpected verification subject', log.subject);
    }
    if (log.channel === 'EMAIL') {
      pass(`Channel verified as EMAIL`);
    }
  } else {
    fail('No delivery log found for PROFILE_VERIFIED', verifyLogsRes.body);
  }

  // --- 4. Application Shortlist Notification Trigger ---
  console.log('\n--- 4. Application Shortlist Notification Trigger ---');
  const appsRes = await request('GET', '/tpo/applications', null, tpoToken);
  const targetApp = appsRes.body.data?.[0];
  if (!targetApp) {
    fail('No applications found to test status notification');
  }

  const shortlistRes = await request(
    'PATCH',
    `/tpo/applications/${targetApp.id}/status`,
    { status: 'SHORTLISTED', notes: 'Shortlisted for technical interview round 1' },
    tpoToken
  );

  if (shortlistRes.status === 200) {
    pass(`TPO transitioned application ${targetApp.id.slice(0, 8)} to SHORTLISTED`);
  } else {
    fail('Status transition to SHORTLISTED failed', shortlistRes.body);
  }

  await new Promise((r) => setTimeout(r, 600));

  const shortlistLogsRes = await request(
    'GET',
    `/tpo/notifications/delivery-logs?template=APPLICANT_SHORTLISTED`,
    null,
    tpoToken
  );

  if (shortlistLogsRes.status === 200 && shortlistLogsRes.body.data?.logs?.length > 0) {
    const log = shortlistLogsRes.body.data.logs[0];
    pass(`Delivery log recorded for APPLICANT_SHORTLISTED to ${log.recipientEmail}`);
    if (log.subject.includes('Shortlisted:')) {
      pass(`Shortlist subject correctly formatted: "${log.subject}"`);
    } else {
      fail('Unexpected shortlist subject', log.subject);
    }
  } else {
    fail('No delivery log found for APPLICANT_SHORTLISTED', shortlistLogsRes.body);
  }

  // --- 5. Application Selection / Offer Notification Trigger ---
  console.log('\n--- 5. Application Selection / Offer Notification Trigger ---');
  const selectRes = await request(
    'PATCH',
    `/tpo/applications/${targetApp.id}/status`,
    { status: 'SELECTED', notes: 'Final offer extended by recruiter' },
    tpoToken
  );

  if (selectRes.status === 200) {
    pass(`TPO transitioned application to SELECTED`);
  } else {
    fail('Status transition to SELECTED failed', selectRes.body);
  }

  await new Promise((r) => setTimeout(r, 600));

  const selectLogsRes = await request(
    'GET',
    `/tpo/notifications/delivery-logs?template=APPLICANT_SELECTED`,
    null,
    tpoToken
  );

  if (selectLogsRes.status === 200 && selectLogsRes.body.data?.logs?.length > 0) {
    const log = selectLogsRes.body.data.logs[0];
    pass(`Delivery log recorded for APPLICANT_SELECTED to ${log.recipientEmail}`);
    if (log.subject.includes('Offer Extended!') || log.subject.includes('Selected')) {
      pass(`Selection subject correctly formatted: "${log.subject}"`);
    } else {
      fail('Unexpected selection subject', log.subject);
    }
  } else {
    fail('No delivery log found for APPLICANT_SELECTED', selectLogsRes.body);
  }

  // --- 6. Idempotency & Duplicate Protection Verification ---
  console.log('\n--- 6. Idempotency & Duplicate Protection Verification ---');
  // Re-triggering verify on same profile should not create duplicate email outbox logs
  const beforeCountLogs = await request(
    'GET',
    `/tpo/notifications/delivery-logs?template=PROFILE_VERIFIED&recipientEmail=${encodeURIComponent(studentEmail)}`,
    null,
    tpoToken
  );
  const countBefore = beforeCountLogs.body.data?.logs?.length || 0;

  await request(
    'POST',
    `/tpo/students/${targetStudent.id}/verify`,
    {
      status: 'VERIFIED',
      remarks: 'All semester grade cards verified.',
    },
    tpoToken
  );
  await new Promise((r) => setTimeout(r, 600));

  const afterCountLogs = await request(
    'GET',
    `/tpo/notifications/delivery-logs?template=PROFILE_VERIFIED&recipientEmail=${encodeURIComponent(studentEmail)}`,
    null,
    tpoToken
  );
  const countAfter = afterCountLogs.body.data?.logs?.length || 0;

  if (countAfter === countBefore) {
    pass(`Duplicate protection verified: re-verification within idempotency window skipped duplicate email dispatch`);
  } else {
    fail(`Duplicate notification was sent! Before: ${countBefore}, After: ${countAfter}`);
  }

  // --- 7. Dual-Channel In-App Verification ---
  console.log('\n--- 7. In-App Notification Delivery Audit ---');
  const studentNotifs = await request('GET', '/student/notifications', null, studentToken);
  if (studentNotifs.status === 200 && Array.isArray(studentNotifs.body.data)) {
    pass(`Student in-app notifications retrieved (${studentNotifs.body.data.length} total)`);
    const hasVerification = studentNotifs.body.data.some((n) => n.title.includes('Verified'));
    if (hasVerification) {
      pass('Student received matching in-app verification notification simultaneously');
    }
  }

  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 4B NOTIFICATION & DISPATCHER TESTS PASSED!');
  console.log('======================================================\n');
}

runNotificationsFlowTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
