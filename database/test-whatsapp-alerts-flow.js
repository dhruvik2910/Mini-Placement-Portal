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

async function runWhatsAppTests() {
  console.log('\n======================================================');
  console.log('⚡ RUNNING INSTANT WHATSAPP ALERTS VERIFICATION SUITE');
  console.log('======================================================\n');

  // 1. Authenticate TPO Officer
  console.log('--- 1. TPO Authentication ---');
  const tpoAuth = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'tpo@placement.edu',
      password: 'Password123!',
    }),
  });
  assert(tpoAuth.status === 200, 'TPO successfully authenticated');
  const tpoToken = tpoAuth.data?.data?.token;
  assert(!!tpoToken, 'Received TPO JWT token');

  // 2. Fetch Active Drives & Applicants
  console.log('\n--- 2. Fetch Active Placement Drives ---');
  const drivesRes = await fetchJson(`${API_BASE}/tpo/drives`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  assert(drivesRes.status === 200, 'TPO drives list retrieved');
  const drives = drivesRes.data?.data || [];
  assert(drives.length > 0, `Retrieved ${drives.length} active placement drives`);

  const targetDrive = drives[0];
  console.log(`  Target Drive: "${targetDrive.title}" (${targetDrive.company?.name})`);

  const appsRes = await fetchJson(`${API_BASE}/tpo/drives/${targetDrive.id}/applicants`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  assert(appsRes.status === 200, 'Drive applicants retrieved');
  const applicants = appsRes.data?.data || [];
  assert(applicants.length > 0, `Found ${applicants.length} candidate applicants for drive`);

  const targetApp = applicants[0];
  const targetAppId = targetApp.id;
  const candidateName = `${targetApp.studentProfile?.firstName} ${targetApp.studentProfile?.lastName}`;
  console.log(`  Target Candidate: ${candidateName} (Roll: ${targetApp.studentProfile?.enrollmentNumber})`);

  // 3. Dispatch Instant WhatsApp, SMS & Email Interview Alert
  console.log('\n--- 3. Dispatch Instant Interview Alerts ---');
  const alertPayload = {
    applicationIds: [targetAppId],
    roundName: 'Technical Round 1 (System Design & DSA)',
    scheduleTime: 'Tomorrow at 10:30 AM',
    venue: 'LDCE Placement Cell, Admin Block Room 204',
    channels: ['WHATSAPP', 'SMS', 'EMAIL'],
    customNote: 'Please report 15 mins prior with 2 printed resume copies and college ID.',
  };

  const alertRes = await fetchJson(`${API_BASE}/tpo/notifications/interview-alert`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tpoToken}` },
    body: JSON.stringify(alertPayload),
  });

  assert(alertRes.status === 200, `POST /tpo/notifications/interview-alert returned HTTP 200 (Got: ${alertRes.status})`);
  assert(alertRes.data?.success === true, 'Response indicates success: true');
  assert(alertRes.data?.data?.dispatchedCount >= 1, `Dispatched count is ${alertRes.data?.data?.dispatchedCount}`);
  assert(alertRes.data?.data?.channelsUsed.includes('WHATSAPP'), 'WhatsApp channel recorded in response');
  assert(alertRes.data?.data?.channelsUsed.includes('SMS'), 'SMS channel recorded in response');
  assert(alertRes.data?.data?.channelsUsed.includes('EMAIL'), 'Email channel recorded in response');

  // Check individual candidate channel results
  const details = alertRes.data?.data?.details?.[0];
  assert(!!details, 'Details array present in response');
  const waChannelResult = details?.channels?.find((c) => c.channel === 'WHATSAPP');
  assert(!!waChannelResult, 'WhatsApp channel result present');
  assert(waChannelResult?.success === true, 'WhatsApp alert was delivered successfully');

  // 4. Verify Delivery Logs in Outbox for WHATSAPP
  console.log('\n--- 4. Verify TPO Delivery Logs Outbox for WHATSAPP Channel ---');
  const logsRes = await fetchJson(`${API_BASE}/tpo/notifications/delivery-logs`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  assert(logsRes.status === 200, 'GET /tpo/notifications/delivery-logs returned HTTP 200');
  const logs = logsRes.data?.data?.logs || [];
  assert(logs.length > 0, `Retrieved ${logs.length} outbox delivery logs`);

  const whatsappLogs = logs.filter((l) => l.channel === 'WHATSAPP');
  assert(whatsappLogs.length > 0, `Found ${whatsappLogs.length} WhatsApp delivery log(s)`);

  const recentWaLog = whatsappLogs[0];
  assert(recentWaLog.status === 'SENT', `WhatsApp log status is SENT (received: ${recentWaLog.status})`);
  assert(recentWaLog.template === 'INTERVIEW_ALERT', `Template matches INTERVIEW_ALERT`);
  assert(recentWaLog.subject.includes('Interview Alert'), `Subject includes "Interview Alert"`);
  assert(recentWaLog.body.includes('LDCE Placements'), `Body contains LDCE Placements institutional signature`);
  assert(recentWaLog.recipientPhone !== null, `Recipient phone number recorded: ${recentWaLog.recipientPhone}`);

  // 5. Test Profile Verification WhatsApp Trigger
  console.log('\n--- 5. Verify Profile Verification WhatsApp Trigger ---');
  const studentsRes = await fetchJson(`${API_BASE}/tpo/students`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  const students = studentsRes.data?.data || [];
  assert(students.length > 0, 'Students directory retrieved');

  // Find a student with a phone number
  const studentWithPhone = students.find((s) => !!s.phone) || students[0];
  console.log(`  Verifying profile for: ${studentWithPhone.firstName} ${studentWithPhone.lastName} (${studentWithPhone.phone})`);

  const verifyRes = await fetchJson(`${API_BASE}/tpo/students/${studentWithPhone.id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tpoToken}` },
    body: JSON.stringify({
      status: 'VERIFIED',
      remarks: 'All semester marksheets and diploma certificates verified.',
    }),
  });
  assert(verifyRes.status === 200, 'Student profile verified by TPO');

  // Check if a WHATSAPP delivery log was recorded for PROFILE_VERIFIED
  const logsAfterVerify = await fetchJson(`${API_BASE}/tpo/notifications/delivery-logs`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  const waVerifyLogs = (logsAfterVerify.data?.data?.logs || []).filter(
    (l) => l.channel === 'WHATSAPP' && l.template === 'PROFILE_VERIFIED'
  );
  assert(waVerifyLogs.length > 0, 'WhatsApp delivery log recorded for PROFILE_VERIFIED');
  assert(waVerifyLogs[0].status === 'SENT', 'WhatsApp profile verification status is SENT');
  assert(waVerifyLogs[0].body.toLowerCase().includes('verified'), 'WhatsApp message contains verification confirmation');

  console.log('\n======================================================');
  console.log('🎉 ALL INSTANT WHATSAPP ALERTS VERIFICATION CHECKS PASSED!');
  console.log('======================================================\n');
}

runWhatsAppTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
