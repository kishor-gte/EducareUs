import jwt from 'jsonwebtoken';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import { WhatsAppCloudService } from '../src/services/whatsappCloud.service.js';
import { env } from '../src/config/env.js';

const prisma = new PrismaClient();

const adminToken = jwt.sign(
  {
    id: '590a2a77-f4f2-4dbf-ac4a-5e4a25dccc29',
    email: 'admin@educarrus.org',
    role: 'SUPER_ADMIN',
  },
  env.JWT_SECRET
);

function apiRequest({ method = 'GET', path, body = null, token = adminToken }) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 META WHATSAPP BUSINESS CLOUD API TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // ── TEST 1: Phone number normalization ──────────────────────
  const num1 = WhatsAppCloudService.normalizePhoneNumber('8147647779');
  assert(num1.isValid && num1.normalized === '918147647779', '10-digit number 8147647779 normalizes to 918147647779');

  const num2 = WhatsAppCloudService.normalizePhoneNumber('+91 81476 47779');
  assert(num2.isValid && num2.normalized === '918147647779', '+91 formatted string normalizes to 918147647779');

  const num3 = WhatsAppCloudService.normalizePhoneNumber('12345');
  assert(!num3.isValid, 'Short invalid phone numbers are properly rejected');

  // ── TEST 2: Config endpoint ──────────────────────────────────
  const configRes = await apiRequest({ path: '/api/whatsapp/config', token: null });
  assert(configRes.status === 200, 'GET /api/whatsapp/config returns HTTP 200');
  assert(configRes.body?.data?.businessPhoneNumber === '918147647779', 'Config reflects registered business sender 918147647779');

  // ── TEST 3: Meta Webhook Verification Handshake ──────────────
  const challengeStr = 'META_CHALLENGE_' + Date.now();
  const verifyToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const webhookHandshake = await apiRequest({
    path: `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challengeStr}`,
    token: null,
  });
  assert(webhookHandshake.status === 200, 'Webhook handshake returns HTTP 200');
  assert(webhookHandshake.body === challengeStr, 'Webhook handshake returns raw challenge string to Meta');

  // ── TEST 4: Reject invalid webhook token ─────────────────────
  const badHandshake = await apiRequest({
    path: `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=WRONG_TOKEN&hub.challenge=test`,
    token: null,
  });
  assert(badHandshake.status === 403, 'Webhook handshake rejects invalid verification tokens with 403 Forbidden');

  // ── TEST 5: Audience resolution excludes admins ──────────────
  const audience = await WhatsAppCloudService.resolveAudienceRecipients('All Users');
  assert(audience.eligibleCount > 0, `Audience resolution finds ${audience.eligibleCount} eligible recipient(s)`);
  const hasKiranWithNewNumber = audience.recipients.some(r => r.name === 'kiran' && r.phone === '918147647779');
  assert(hasKiranWithNewNumber, 'Recipient kiran is present with registered number 918147647779');
  const hasAdmin = audience.recipients.some(r => r.role === 'SUPER_ADMIN' || r.role === 'ADMIN');
  assert(!hasAdmin, 'Super Administrator is safely excluded from standard recipient audience');

  // ── TEST 6: Single-click bulk send campaign creation ─────────
  const bulkSendRes = await apiRequest({
    method: 'POST',
    path: '/api/admin/whatsapp/bulk-send',
    body: {
      title: 'Automated Meta Cloud API Verification',
      message: 'Hello, this is an official message from EduCare.',
      audience: 'All Users',
      templateName: 'educare_notification',
    },
  });
  assert(bulkSendRes.status === 200, 'POST /api/admin/whatsapp/bulk-send returns HTTP 200');
  assert(bulkSendRes.body?.success === true, 'Bulk send initiates successfully');
  assert(Boolean(bulkSendRes.body?.campaignId), `Campaign ID returned: ${bulkSendRes.body?.campaignId}`);

  const testCampaignId = bulkSendRes.body?.campaignId;

  // ── TEST 7: Campaign DB record verification ──────────────────
  const campaignDb = await prisma.whatsAppCampaign.findUnique({
    where: { id: testCampaignId },
    include: { messages: true },
  });
  assert(campaignDb !== null, 'Campaign record exists in PostgreSQL database');
  assert(campaignDb.senderPhoneNumber === '918147647779', 'Campaign records sender number as 918147647779');
  assert(campaignDb.messages.length === bulkSendRes.body.totalRecipients, `Created ${campaignDb.messages.length} individual recipient message records`);

  // ── TEST 8: Simulate Meta Webhook delivery status updates ────
  // Wait for initial queue dispatch pass to settle before testing webhook
  await new Promise((r) => setTimeout(r, 1200));

  // Pick first message and assign test wamid
  const firstMsg = campaignDb.messages[0];
  const testWamid = 'wamid.TEST_WAMID_' + Date.now();

  await prisma.whatsAppMessage.update({
    where: { id: firstMsg.id },
    data: {
      whatsappMessageId: testWamid,
      status: 'ACCEPTED',
    },
  });

  // Simulate 'delivered' webhook from Meta Graph API
  const webhookDeliveryPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA_123456789',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '918147647779', phone_number_id: 'PHONE_ID' },
              statuses: [
                {
                  id: testWamid,
                  status: 'delivered',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  recipient_id: firstMsg.recipientPhone,
                },
              ],
            },
          },
        ],
      },
    ],
  };

    const webhookEventRes = await apiRequest({
      method: 'POST',
      path: '/api/whatsapp/webhook',
      body: webhookDeliveryPayload,
      token: null,
    });
    assert(webhookEventRes.status === 200, 'POST /api/whatsapp/webhook successfully receives Meta delivery event');

    // Wait brief interval for async webhook processing
    await new Promise((r) => setTimeout(r, 600));

    // Verify DB updated
    const updatedMsg = await prisma.whatsAppMessage.findUnique({ where: { id: firstMsg.id } });
    assert(updatedMsg.status === 'DELIVERED', `Recipient message status successfully transitioned to DELIVERED`);
    assert(updatedMsg.deliveredAt !== null, 'Delivery timestamp recorded in database');

    // ── TEST 9: Campaign monitoring endpoint ─────────────────────
    const monitorRes = await apiRequest({
      path: `/api/admin/whatsapp/campaigns/${testCampaignId}`,
    });
    assert(monitorRes.status === 200, 'GET /api/admin/whatsapp/campaigns/:id returns HTTP 200');
    assert(monitorRes.body?.data?.deliveredCount >= 1, `Monitor reports real delivered count (${monitorRes.body?.data?.deliveredCount})`);

    // Clean up test campaign
    await prisma.whatsAppCampaign.delete({ where: { id: testCampaignId } });

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} tests passed successfully!`);
    console.log('====================================================');
  }

  runTests()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Test execution failed:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
