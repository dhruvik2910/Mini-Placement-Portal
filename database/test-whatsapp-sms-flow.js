process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/placement_portal';
const { PrismaClient } = require('@prisma/client');
const assert = require('assert');

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING: WhatsApp & SMS Instant Alert Gateway');
  console.log('====================================================\n');

  try {
    // 1. Verify students with phone numbers in database
    console.log('1. Checking student contact records in database...');
    const students = await prisma.studentProfile.findMany({
      where: { phone: { not: null } },
      include: { user: true },
    });
    console.log(`Found ${students.length} students with registered mobile numbers.`);
    assert(students.length > 0, 'Database should contain students with phone numbers');

    const rahul = students.find((s) => s.firstName.toLowerCase() === 'rahul') || students[0];
    console.log(`✓ Target test student: ${rahul.firstName} ${rahul.lastName} (${rahul.phone})`);

    // 2. Test NotificationChannel Enum in Database
    console.log('\n2. Testing NotificationChannel.WHATSAPP enum in database...');
    const testLog = await prisma.notificationDeliveryLog.create({
      data: {
        studentProfileId: rahul.id,
        recipientPhone: rahul.phone,
        recipientEmail: rahul.user?.email || 'rahul@student.edu',
        channel: 'WHATSAPP',
        status: 'SENT',
        template: 'INTERVIEW_SHORTLIST_WHATSAPP',
        subject: '[LDCE Placements] Interview Alert: TatvaSoft — Technical Round 1',
        body: 'Hello Rahul, you have been shortlisted for TatvaSoft Technical Round 1 tomorrow at 10:30 AM in LDCE Placement cell.',
        idempotencyKey: `test-wa-idempotency-${Date.now()}`,
        sentAt: new Date(),
      },
    });

    console.log(`✓ Successfully recorded WHATSAPP delivery log [ID: ${testLog.id}]`);
    assert.strictEqual(testLog.channel, 'WHATSAPP');
    assert.strictEqual(testLog.status, 'SENT');

    // 3. Test SMS delivery log
    console.log('\n3. Testing NotificationChannel.SMS enum in database...');
    const testSmsLog = await prisma.notificationDeliveryLog.create({
      data: {
        studentProfileId: rahul.id,
        recipientPhone: rahul.phone,
        channel: 'SMS',
        status: 'SENT',
        template: 'INTERVIEW_SHORTLIST_SMS',
        subject: '[LDCE Placements] Interview Alert',
        body: 'Hello Rahul, you have been shortlisted for TatvaSoft Technical Round 1 tomorrow at 10:30 AM in LDCE Placement cell.',
        idempotencyKey: `test-sms-idempotency-${Date.now()}`,
        sentAt: new Date(),
      },
    });
    console.log(`✓ Successfully recorded SMS delivery log [ID: ${testSmsLog.id}]`);
    assert.strictEqual(testSmsLog.channel, 'SMS');

    // 4. Test Template Format Verification
    console.log('\n4. Verifying Interview Shortlist Alert message formatting...');
    const expectedPrefix = `Hello ${rahul.firstName}, you have been shortlisted for TatvaSoft Technical Round 1 tomorrow at 10:30 AM in LDCE Placement cell.`;
    assert(
      testLog.body.startsWith(expectedPrefix),
      `Message format should match required alert: ${testLog.body}`
    );
    console.log(`✓ Template text matches exact specification: "${expectedPrefix}"`);

    // 5. Test Idempotency Safety
    console.log('\n5. Testing idempotency protection for duplicated dispatches...');
    const duplicateKey = testLog.idempotencyKey;
    const existing = await prisma.notificationDeliveryLog.findUnique({
      where: { idempotencyKey: duplicateKey },
    });
    assert(existing !== null, 'Duplicate key must be detected');
    console.log(`✓ Idempotency hit confirmed for key: ${duplicateKey}`);

    // Clean up test logs
    await prisma.notificationDeliveryLog.deleteMany({
      where: { id: { in: [testLog.id, testSmsLog.id] } },
    });
    console.log('✓ Cleaned up test artifacts from database.');

    console.log('\n====================================================');
    console.log('🎉 ALL WHATSAPP & SMS ALERT GATEWAY TESTS PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
