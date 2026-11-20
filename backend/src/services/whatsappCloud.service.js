import crypto from 'crypto';
import prisma from '../config/db.js';
import { env } from '../config/env.js';

/**
 * Service: WhatsAppCloudService
 * Production-ready integration for Meta WhatsApp Business Cloud API (Graph API)
 * Handles template/text bulk campaigns, background rate-limited queueing,
 * international phone normalization, HMAC signature verification, and delivery webhooks.
 */
export class WhatsAppCloudService {
  /**
   * Returns current WhatsApp Business Cloud API configuration status.
   * Safe for admin UI: never exposes access token or app secret.
   */
  static getConfig() {
    const token = env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_TOKEN || '';
    const phoneId = env.WHATSAPP_PHONE_NUMBER_ID || '';
    const wabaId = env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
    const appSecret = env.META_APP_SECRET || '';
    const businessNumber = env.WHATSAPP_BUSINESS_PHONE_NUMBER || '918147647779';
    const apiVersion = env.WHATSAPP_API_VERSION || 'v21.0';
    const templateName = env.WHATSAPP_TEMPLATE_NAME || 'educare_notification';
    const templateLanguage = env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';

    const isPlaceholder = (val) =>
      !val ||
      val.startsWith('YOUR_') ||
      val.includes('PLACEHOLDER') ||
      val.trim() === '';

    const isConfigured = !isPlaceholder(token) && !isPlaceholder(phoneId);

    const cleanNumber = businessNumber.replace(/\D/g, '');
    const displaySender =
      cleanNumber.startsWith('91') && cleanNumber.length === 12
        ? `+91 ${cleanNumber.slice(2, 7)} ${cleanNumber.slice(7)}`
        : `+${cleanNumber}`;

    return {
      isConfigured,
      businessPhoneNumber: cleanNumber || '918147647779',
      displaySender,
      phoneNumberId: isPlaceholder(phoneId) ? null : phoneId,
      businessAccountId: isPlaceholder(wabaId) ? null : wabaId,
      apiVersion,
      templateName,
      templateLanguage,
      hasWebhookSecret: !isPlaceholder(appSecret),
      status: isConfigured ? 'CONNECTED' : 'CREDENTIALS_NEEDED',
      gatewayType: 'META_CLOUD_API',
    };
  }

  /**
   * Normalizes any raw phone number into strict E.164 international format (without '+').
   * - 10-digit Indian numbers starting with 6, 7, 8, or 9: prepends '91'
   * - 11-digit numbers starting with 0: strips leading 0 and prepends '91'
   * - 12-digit Indian numbers starting with 91: returned as is
   * - Valid international numbers: 10 to 15 digits
   */
  static normalizePhoneNumber(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') {
      return { isValid: false, normalized: '', display: '' };
    }

    const cleanDigits = rawPhone.replace(/\D/g, '');

    if (!cleanDigits || cleanDigits.length < 10) {
      return { isValid: false, normalized: '', display: rawPhone };
    }

    let normalized = cleanDigits;

    // Standard 10-digit Indian mobile number
    if (cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits)) {
      normalized = `91${cleanDigits}`;
    }
    // 11-digit Indian starting with leading zero (08147647779)
    else if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
      normalized = `91${cleanDigits.slice(1)}`;
    }
    // 12-digit Indian number starting with 91 (918147647779)
    else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
      normalized = cleanDigits;
    }

    const isValid = normalized.length >= 10 && normalized.length <= 15;
    const display =
      normalized.startsWith('91') && normalized.length === 12
        ? `+91 ${normalized.slice(2, 7)} ${normalized.slice(7)}`
        : `+${normalized}`;

    return {
      isValid,
      normalized,
      display,
    };
  }

  /**
   * Formats branded WhatsApp notification text with Markdown.
   */
  static formatMessageText({ fullName, title, message }) {
    const greeting = fullName ? `Hello *${fullName}*,` : 'Hello,';
    const cleanTitle = (title || 'Official Notification').trim();
    const cleanMsg = (message || '').trim();

    return (
      `🎓 *EduCare Alert: ${cleanTitle}*\n\n` +
      `${greeting}\n\n` +
      `${cleanMsg}\n\n` +
      `──────────────────────\n` +
      `🏛️ *EduCare Foundation — Admissions & Scholarships Desk*\n` +
      `🌐 https://educarrus.org`
    );
  }

  /**
   * Resolves intended audience from database, eliminating duplicates, opted-out,
   * or invalid phone numbers.
   */
  static async resolveAudienceRecipients(audience = 'All Users') {
    const userWhere = { isSuspended: false, phone: { not: null } };

    if (
      audience === 'Beneficiaries Only' ||
      audience === 'BENEFICIARY' ||
      audience === 'Students'
    ) {
      userWhere.role = 'BENEFICIARY';
    } else if (audience === 'Donors Only' || audience === 'DONOR') {
      userWhere.role = 'DONOR';
    } else if (audience === 'Enquiries Only' || audience === 'ENQUIRY') {
      userWhere.id = 'NO_USER_MATCH'; // Skip users table; fetch only from enquiries table
    } else if (
      audience !== 'All Users (Including Administrators)' &&
      audience !== 'ADMIN'
    ) {
      // Exclude administrator and staff accounts unless explicitly requested
      userWhere.role = { notIn: ['ADMIN', 'SUPER_ADMIN'] };
    }

    // 1. Fetch registered User records
    let users = [];
    if (audience !== 'Enquiries Only' && audience !== 'ENQUIRY') {
      users = await prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          fullName: true,
          phone: true,
          role: true,
        },
      });
    }

    // 2. Also include Enquiries / Admissions Leads if "All Users" or "Enquiries Only"
    let enquiries = [];
    if (
      audience === 'All Users' ||
      audience === 'ALL' ||
      audience === 'Enquiries Only' ||
      audience === 'ENQUIRY'
    ) {
      enquiries = await prisma.enquiry.findMany({
        where: { phone: { not: '' } },
        select: {
          id: true,
          fullName: true,
          phone: true,
          interestedCourse: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Combine and deduplicate by normalized phone number
    const recipientMap = new Map();

    for (const u of users) {
      const norm = this.normalizePhoneNumber(u.phone);
      if (norm.isValid && !recipientMap.has(norm.normalized)) {
        recipientMap.set(norm.normalized, {
          userId: u.id,
          name: u.fullName || 'Scholar',
          phone: norm.normalized,
          displayPhone: norm.display,
          role: u.role || 'BENEFICIARY',
        });
      }
    }

    for (const e of enquiries) {
      const norm = this.normalizePhoneNumber(e.phone);
      if (norm.isValid && !recipientMap.has(norm.normalized)) {
        recipientMap.set(norm.normalized, {
          userId: null,
          name: e.fullName || 'Student Applicant',
          phone: norm.normalized,
          displayPhone: norm.display,
          role: 'COUNSELING_LEAD',
        });
      }
    }

    const recipients = Array.from(recipientMap.values());

    // Total database records with phones (for audience breakdown)
    const totalUsersCount = await prisma.user.count({
      where: { phone: { not: null } },
    });
    const totalEnquiriesCount = await prisma.enquiry.count();

    return {
      audience,
      totalDatabaseUsers: totalUsersCount + totalEnquiriesCount,
      eligibleCount: recipients.length,
      recipients,
    };
  }

  /**
   * Creates a Bulk WhatsApp Campaign and queues individual recipient messages.
   * Single click initiates the entire flow without opening individual WhatsApp chats.
   */
  static async createBulkCampaign({
    title,
    message,
    audience = 'All Users',
    templateName,
    templateLanguage,
    createdById = null,
  }) {
    if (!title || !title.trim()) {
      throw new Error('Notification title is required.');
    }
    if (!message || !message.trim()) {
      throw new Error('Message content is required.');
    }

    const config = this.getConfig();
    const resolvedTemplate = templateName || config.templateName;
    const resolvedLanguage = templateLanguage || config.templateLanguage;

    // Resolve eligible audience
    const audienceData = await this.resolveAudienceRecipients(audience);
    const recipients = audienceData.recipients;

    if (!recipients || recipients.length === 0) {
      throw new Error(
        `No eligible recipients with valid WhatsApp phone numbers found for audience: "${audience}".`
      );
    }

    // 1. Create WhatsAppCampaign record in PostgreSQL
    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        title: title.trim(),
        messageBody: message.trim(),
        templateName: resolvedTemplate,
        templateLanguage: resolvedLanguage,
        audience,
        senderNumberId: config.phoneNumberId || null,
        senderPhoneNumber: config.businessPhoneNumber,
        totalRecipients: recipients.length,
        queuedCount: recipients.length,
        apiAcceptedCount: 0,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        status: 'QUEUED',
        createdById,
      },
    });

    // 2. Create WhatsAppMessage rows in batch
    const messageRows = recipients.map((r) => ({
      campaignId: campaign.id,
      recipientUserId: r.userId,
      recipientName: r.name,
      recipientPhone: r.phone,
      recipientRole: r.role,
      status: 'QUEUED',
    }));

    await prisma.whatsAppMessage.createMany({
      data: messageRows,
    });

    // 3. Kick off asynchronous background processing with controlled rate limiting
    setImmediate(() => {
      this.processCampaignQueue(campaign.id).catch((err) => {
        console.error(`❌ Campaign ${campaign.id} background queue error:`, err);
      });
    });

    return {
      success: true,
      campaignId: campaign.id,
      title: campaign.title,
      totalRecipients: campaign.totalRecipients,
      status: 'QUEUED',
      senderPhoneNumber: config.displaySender,
      message: `Bulk WhatsApp campaign initiated for ${campaign.totalRecipients} recipient(s). Messages are being processed automatically in the background.`,
    };
  }

  /**
   * Background queue worker: Processes campaign messages sequentially
   * with rate limiting, exponential backoff retries, and API response tracking.
   */
  static async processCampaignQueue(campaignId) {
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!campaign) return;

    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: { status: 'PROCESSING' },
    });

    const config = this.getConfig();
    let apiAcceptedCount = 0;
    let failedCount = 0;

    for (const msg of campaign.messages) {
      // Mark as PROCESSING
      await prisma.whatsAppMessage.update({
        where: { id: msg.id },
        data: { status: 'PROCESSING' },
      });

      // Prepare message payload
      const formattedText = this.formatMessageText({
        fullName: msg.recipientName,
        title: campaign.title,
        message: campaign.messageBody,
      });

      // Call Meta WhatsApp Business Cloud API with retries
      const sendResult = await this.sendCloudApiMessageWithRetry({
        to: msg.recipientPhone,
        recipientName: msg.recipientName,
        title: campaign.title,
        formattedText,
        templateName: campaign.templateName,
        templateLanguage: campaign.templateLanguage,
        config,
      });

      if (sendResult.success) {
        apiAcceptedCount++;
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            status: 'ACCEPTED',
            whatsappMessageId: sendResult.messageId || null,
            sentAt: new Date(),
          },
        });
      } else {
        failedCount++;
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            status: 'FAILED',
            errorCode: sendResult.errorCode || 'SEND_FAILED',
            errorMessage: sendResult.error || 'Failed to dispatch via Meta API',
          },
        });
      }

      // Update running campaign counters
      await prisma.whatsAppCampaign.update({
        where: { id: campaignId },
        data: {
          queuedCount: Math.max(0, campaign.totalRecipients - (apiAcceptedCount + failedCount)),
          apiAcceptedCount,
          failedCount,
        },
      });

      // Rate limit delay: 100ms per message (~10 requests/sec, within Meta Cloud API tiers)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Determine final campaign status
    const finalStatus =
      failedCount === campaign.totalRecipients
        ? 'FAILED'
        : failedCount > 0
        ? 'PARTIALLY_FAILED'
        : 'COMPLETED';

    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
      },
    });

    console.log(
      `✅ Bulk WhatsApp Campaign ${campaignId} finished. Accepted: ${apiAcceptedCount}, Failed: ${failedCount}`
    );
  }

  /**
   * Executes Meta Graph API call with exponential backoff on 429 / transient 5xx errors.
   */
  static async sendCloudApiMessageWithRetry({
    to,
    recipientName,
    title,
    formattedText,
    templateName,
    templateLanguage,
    config,
    maxRetries = 2,
  }) {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const res = await this.callMetaGraphApi({
          to,
          recipientName,
          title,
          formattedText,
          templateName,
          templateLanguage,
          config,
        });

        if (res.success || !res.isTransient) {
          return res;
        }

        // If rate limited or server error, back off and retry
        attempt++;
        if (attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          return res;
        }
      } catch (err) {
        attempt++;
        if (attempt > maxRetries) {
          return {
            success: false,
            error: err.message,
            errorCode: 'NETWORK_EXCEPTION',
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Direct HTTP POST to Meta Graph API `/messages`.
   * Supports approved templates as primary, with seamless fallback to formatted text.
   */
  static async callMetaGraphApi({
    to,
    recipientName,
    title,
    formattedText,
    templateName,
    templateLanguage,
    config,
  }) {
    if (!config.isConfigured) {
      return {
        success: false,
        error:
          'Meta WhatsApp Cloud API credentials not configured. Please add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env.',
        errorCode: 'CREDENTIALS_MISSING',
        isTransient: false,
      };
    }

    const token = env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_TOKEN;
    const phoneId = config.phoneNumberId;
    const url = `https://graph.facebook.com/${config.apiVersion}/${phoneId}/messages`;

    // 1. Try Template Dispatch if template is configured
    if (templateName && templateName !== 'none') {
      try {
        const templatePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: templateLanguage || 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: recipientName || 'Scholar' },
                  { type: 'text', text: title || 'Official Update' },
                ],
              },
            ],
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templatePayload),
        });

        const data = await response.json();

        if (response.ok && data?.messages?.[0]?.id) {
          return {
            success: true,
            messageId: data.messages[0].id,
            mode: 'template',
          };
        }

        // If template doesn't exist (error code 132000 or 100), fall back to direct text
        const isTemplateMissing =
          data?.error?.code === 132000 ||
          data?.error?.code === 132001 ||
          data?.error?.error_subcode === 132000 ||
          data?.error?.message?.toLowerCase().includes('template');

        if (!isTemplateMissing) {
          // Genuine Meta error (e.g., recipient not valid or rate limit)
          return {
            success: false,
            error: data?.error?.message || 'Meta API returned error',
            errorCode: String(data?.error?.code || 'META_API_ERROR'),
            isTransient: response.status === 429 || response.status >= 500,
          };
        }

        // Fallthrough to direct text if template was not found
      } catch (templateErr) {
        console.warn('⚠️ Template call failed, attempting text fallback:', templateErr.message);
      }
    }

    // 2. Direct Formatted Text Dispatch
    try {
      const textPayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: formattedText,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(textPayload),
      });

      const data = await response.json();

      if (response.ok && data?.messages?.[0]?.id) {
        return {
          success: true,
          messageId: data.messages[0].id,
          mode: 'text',
        };
      }

      return {
        success: false,
        error: data?.error?.message || 'Meta API rejected message',
        errorCode: String(data?.error?.code || 'META_REJECTED'),
        isTransient: response.status === 429 || response.status >= 500,
      };
    } catch (textErr) {
      return {
        success: false,
        error: textErr.message,
        errorCode: 'FETCH_ERROR',
        isTransient: true,
      };
    }
  }

  /**
   * Verifies incoming webhook signature against META_APP_SECRET using HMAC-SHA256.
   */
  static verifyWebhookSignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    const appSecret = env.META_APP_SECRET;

    if (!appSecret || appSecret === 'YOUR_META_APP_SECRET') {
      // If secret is unset or default placeholder in dev/sandbox, allow signature pass
      return true;
    }
    if (!signature) {
      return false;
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedSignature =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Processes Meta WhatsApp Cloud API incoming webhook delivery status events.
   * Handles: 'sent', 'delivered', 'read', 'failed'.
   */
  static async processWebhookPayload(payload) {
    if (!payload || !Array.isArray(payload.entry)) {
      return { processed: 0 };
    }

    let processedCount = 0;

    for (const entry of payload.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;
        const value = change.value || {};
        const statuses = value.statuses || [];

        for (const statusObj of statuses) {
          const wamid = statusObj.id;
          const newStatus = (statusObj.status || '').toLowerCase();
          const timestamp = statusObj.timestamp
            ? new Date(parseInt(statusObj.timestamp, 10) * 1000)
            : new Date();

          if (!wamid) continue;

          // Find message in DB
          const message = await prisma.whatsAppMessage.findUnique({
            where: { whatsappMessageId: wamid },
          });

          if (!message) continue;

          const updateData = {};

          if (newStatus === 'sent') {
            updateData.status = 'SENT';
            updateData.sentAt = timestamp;
          } else if (newStatus === 'delivered') {
            updateData.status = 'DELIVERED';
            updateData.deliveredAt = timestamp;
          } else if (newStatus === 'read') {
            updateData.status = 'READ';
            updateData.readAt = timestamp;
          } else if (newStatus === 'failed') {
            updateData.status = 'FAILED';
            const error = statusObj.errors?.[0];
            updateData.errorCode = String(error?.code || 'WEBHOOK_FAILED');
            updateData.errorMessage =
              error?.title || error?.message || 'Message delivery failed';
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.whatsAppMessage.update({
              where: { id: message.id },
              data: updateData,
            });

            // Update parent campaign aggregation counters
            await this.recalculateCampaignMetrics(message.campaignId);
            processedCount++;
          }
        }
      }
    }

    return { processed: processedCount };
  }

  /**
   * Recalculates real status counters on a campaign from its individual message records.
   */
  static async recalculateCampaignMetrics(campaignId) {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { campaignId },
      select: { status: true },
    });

    if (!messages.length) return;

    let apiAcceptedCount = 0;
    let sentCount = 0;
    let deliveredCount = 0;
    let readCount = 0;
    let failedCount = 0;
    let queuedCount = 0;

    for (const m of messages) {
      if (m.status === 'QUEUED' || m.status === 'PROCESSING') queuedCount++;
      if (m.status === 'ACCEPTED') apiAcceptedCount++;
      if (m.status === 'SENT') {
        sentCount++;
        apiAcceptedCount++;
      }
      if (m.status === 'DELIVERED') {
        deliveredCount++;
        sentCount++;
        apiAcceptedCount++;
      }
      if (m.status === 'READ') {
        readCount++;
        deliveredCount++;
        sentCount++;
        apiAcceptedCount++;
      }
      if (m.status === 'FAILED') failedCount++;
    }

    const total = messages.length;
    const isFinished = queuedCount === 0;

    let overallStatus = 'PROCESSING';
    if (isFinished) {
      if (failedCount === total) overallStatus = 'FAILED';
      else if (failedCount > 0) overallStatus = 'PARTIALLY_FAILED';
      else overallStatus = 'COMPLETED';
    }

    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        queuedCount,
        apiAcceptedCount,
        sentCount,
        deliveredCount,
        readCount,
        failedCount,
        status: overallStatus,
      },
    });
  }

  /**
   * Retrieves list of campaigns with actual real-time delivery counts.
   */
  static async listCampaigns(limit = 15) {
    return await prisma.whatsAppCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  /**
   * Retrieves specific campaign details and its complete recipient delivery logs.
   */
  static async getCampaignDetails(campaignId) {
    return await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}

export default WhatsAppCloudService;
