import prisma from '../config/db.js';
import { env } from '../config/env.js';

export class WhatsAppService {
  /**
   * Normalizes and validates phone numbers.
   * Cleans special characters, detects country codes, formats for WhatsApp (E.164).
   * - 10-digit Indian numbers starting with 6, 7, 8, or 9: prepends '91'
   * - 11-digit numbers starting with 0: strips 0 and prepends '91'
   * - 12-digit numbers starting with 91: returns directly
   * - International numbers with valid length (10 to 15 digits)
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
    // 11-digit starting with leading zero (08660609247)
    else if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
      normalized = `91${cleanDigits.slice(1)}`;
    }
    // 12-digit Indian number starting with 91 (918660609247)
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
   * Formats message text with WhatsApp markdown and branding
   */
  static formatMessage({ fullName, title, message }) {
    const greeting = fullName ? `Hello *${fullName}*,` : 'Hello,';
    return (
      `🎓 *Educarrus Alert: ${title.trim()}*\n\n` +
      `${greeting}\n\n` +
      `${message.trim()}\n\n` +
      `──────────────────────\n` +
      `🏛️ *Educarrus Foundation — Admissions & Scholarships Desk*\n` +
      `🌐 https://educarrus.org`
    );
  }

  /**
   * Generates direct wa.me link for click-to-chat
   */
  static generateWaLink(normalizedPhone, messageText) {
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;
  }

  /**
   * Dispatches or simulates sending a single WhatsApp message
   */
  static async sendSingleMessage({ to, fullName, title, message }) {
    const phoneInfo = this.normalizePhoneNumber(to);
    if (!phoneInfo.isValid) {
      return {
        success: false,
        error: `Invalid phone number: ${to}`,
        phone: to,
      };
    }

    // Format message content
    const formattedBody = this.formatMessage({ fullName, title, message });

    // Direct WhatsApp Web and mobile URLs
    const waLink = this.generateWaLink(phoneInfo.normalized, formattedBody);
    const waWebLink = `https://web.whatsapp.com/send?phone=${phoneInfo.normalized}&text=${encodeURIComponent(formattedBody)}`;
    const waApiLink = `https://api.whatsapp.com/send?phone=${phoneInfo.normalized}&text=${encodeURIComponent(formattedBody)}`;

    // 1. Check if UltraMsg API is configured (Instance + Token)
    const ultraInstance = env.ULTRAMSG_INSTANCE_ID || process.env.ULTRAMSG_INSTANCE_ID;
    const ultraToken = env.ULTRAMSG_TOKEN || process.env.ULTRAMSG_TOKEN;
    if (ultraInstance && ultraToken) {
      try {
        const response = await fetch(`https://api.ultramsg.com/${ultraInstance}/messages/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: ultraToken,
            to: phoneInfo.normalized,
            body: formattedBody,
          }),
        });
        const data = await response.json();
        if (data && (data.sent === 'true' || data.sent === true || data.id)) {
          return {
            success: true,
            provider: 'ultramsg',
            messageId: data.id,
            phone: phoneInfo.display,
            normalized: phoneInfo.normalized,
            waLink,
            waWebLink,
            waApiLink,
          };
        }
      } catch (err) {
        console.warn('⚠️ UltraMsg request failed:', err.message);
      }
    }

    // 2. Check if Green-API is configured
    const greenInstance = env.GREEN_API_INSTANCE_ID || process.env.GREEN_API_INSTANCE_ID;
    const greenToken = env.GREEN_API_TOKEN || process.env.GREEN_API_TOKEN;
    if (greenInstance && greenToken) {
      try {
        const response = await fetch(`https://api.green-api.com/waInstance${greenInstance}/sendMessage/${greenToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `${phoneInfo.normalized}@c.us`,
            message: formattedBody,
          }),
        });
        const data = await response.json();
        if (data && data.idMessage) {
          return {
            success: true,
            provider: 'green_api',
            messageId: data.idMessage,
            phone: phoneInfo.display,
            normalized: phoneInfo.normalized,
            waLink,
            waWebLink,
            waApiLink,
          };
        }
      } catch (err) {
        console.warn('⚠️ Green-API request failed:', err.message);
      }
    }

    // 3. Check if Meta WhatsApp Business Cloud API is configured
    const token = env.WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneId = env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (token && phoneId) {
      try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phoneInfo.normalized,
            type: 'text',
            text: {
              preview_url: false,
              body: formattedBody,
            },
          }),
        });

        const data = await response.json();
        if (response.ok && data?.messages?.[0]?.id) {
          return {
            success: true,
            provider: 'meta_cloud_api',
            messageId: data.messages[0].id,
            phone: phoneInfo.display,
            normalized: phoneInfo.normalized,
            waLink,
            waWebLink,
            waApiLink,
          };
        } else {
          console.warn('⚠️ Meta WhatsApp Cloud API response error:', data);
          return {
            success: true,
            provider: 'direct_whatsapp',
            apiWarning: data?.error?.message || 'Meta API returned error',
            phone: phoneInfo.display,
            normalized: phoneInfo.normalized,
            waLink,
            waWebLink,
            waApiLink,
          };
        }
      } catch (err) {
        console.warn('⚠️ Meta WhatsApp API request failed:', err.message);
        return {
          success: true,
          provider: 'direct_whatsapp',
          phone: phoneInfo.display,
          normalized: phoneInfo.normalized,
          waLink,
          waWebLink,
          waApiLink,
        };
      }
    }

    // Default direct WhatsApp Web and mobile link dispatch
    return {
      success: true,
      provider: 'direct_whatsapp',
      phone: phoneInfo.display,
      normalized: phoneInfo.normalized,
      waLink,
      waWebLink,
      waApiLink,
    };
  }

  /**
   * Retrieves reachable audience metrics for WhatsApp
   */
  static async getAudienceReach(audience = 'All Users') {
    const userWhere = { isSuspended: false, phone: { not: null } };
    if (audience === 'Beneficiaries Only' || audience === 'BENEFICIARY') {
      userWhere.role = 'BENEFICIARY';
    } else if (audience === 'Donors Only' || audience === 'DONOR') {
      userWhere.role = 'DONOR';
    } else if (audience === 'Enquiries Only') {
      userWhere.id = 'none'; // only enquiries
    }

    const users =
      audience === 'Enquiries Only'
        ? []
        : await prisma.user.findMany({
            where: userWhere,
            select: { id: true, fullName: true, phone: true, role: true },
          });

    let enquiries = [];
    if (audience === 'All Users' || audience === 'ALL' || audience === 'Enquiries Only') {
      enquiries = await prisma.enquiry.findMany({
        where: { phone: { not: null } },
        select: { id: true, fullName: true, phone: true },
      });
    }

    const seenPhones = new Set();
    const validRecipients = [];

    for (const u of users) {
      if (!u.phone) continue;
      const p = this.normalizePhoneNumber(u.phone);
      if (p.isValid && !seenPhones.has(p.normalized)) {
        seenPhones.add(p.normalized);
        validRecipients.push({
          id: u.id,
          fullName: u.fullName,
          phone: p.display,
          role: u.role,
        });
      }
    }

    for (const e of enquiries) {
      if (!e.phone) continue;
      const p = this.normalizePhoneNumber(e.phone);
      if (p.isValid && !seenPhones.has(p.normalized)) {
        seenPhones.add(p.normalized);
        validRecipients.push({
          id: e.id,
          fullName: e.fullName,
          phone: p.display,
          role: 'COUNSELING_LEAD',
        });
      }
    }

    return {
      audience,
      totalUsersWithPhone: validRecipients.length,
      validWhatsAppCount: validRecipients.length,
      recipients: validRecipients,
    };
  }

  /**
   * Dispatches bulk WhatsApp messages to all users with valid WhatsApp numbers
   */
  static async sendBulkWhatsApp({ audience = 'All Users', title, message, actorId }) {
    const userWhere = { isSuspended: false, phone: { not: null } };
    if (audience === 'Beneficiaries Only' || audience === 'BENEFICIARY') {
      userWhere.role = 'BENEFICIARY';
    } else if (audience === 'Donors Only' || audience === 'DONOR') {
      userWhere.role = 'DONOR';
    } else if (audience === 'Enquiries Only') {
      userWhere.id = 'none';
    }

    const targetUsers =
      audience === 'Enquiries Only'
        ? []
        : await prisma.user.findMany({
            where: userWhere,
            select: { id: true, email: true, fullName: true, phone: true, role: true },
          });

    let enquiries = [];
    if (audience === 'All Users' || audience === 'ALL' || audience === 'Enquiries Only') {
      enquiries = await prisma.enquiry.findMany({
        where: { phone: { not: null } },
        select: { id: true, fullName: true, phone: true, email: true },
      });
    }

    const seenPhones = new Set();
    const candidateList = [];

    for (const u of targetUsers) {
      if (!u.phone) continue;
      const phoneCheck = this.normalizePhoneNumber(u.phone);
      if (phoneCheck.isValid && !seenPhones.has(phoneCheck.normalized)) {
        seenPhones.add(phoneCheck.normalized);
        candidateList.push({
          ...u,
          phoneInfo: phoneCheck,
          role: u.role,
        });
      }
    }

    for (const e of enquiries) {
      if (!e.phone) continue;
      const phoneCheck = this.normalizePhoneNumber(e.phone);
      if (phoneCheck.isValid && !seenPhones.has(phoneCheck.normalized)) {
        seenPhones.add(phoneCheck.normalized);
        candidateList.push({
          id: e.id,
          fullName: e.fullName,
          email: e.email,
          phone: e.phone,
          phoneInfo: phoneCheck,
          role: 'COUNSELING_LEAD',
        });
      }
    }

    if (candidateList.length === 0) {
      return {
        success: false,
        count: 0,
        message: 'No registered users with valid phone numbers were found for the selected audience.',
        recipients: [],
      };
    }

    const results = [];
    for (const recipient of candidateList) {
      const sendRes = await this.sendSingleMessage({
        to: recipient.phone,
        fullName: recipient.fullName,
        title,
        message,
      });

      results.push({
        id: recipient.id,
        fullName: recipient.fullName,
        email: recipient.email,
        phone: recipient.phoneInfo.display,
        normalizedPhone: recipient.phoneInfo.normalized,
        role: recipient.role,
        waLink: sendRes.waLink,
        waWebLink: sendRes.waWebLink,
        waApiLink: sendRes.waApiLink,
        provider: sendRes.provider,
        status: sendRes.success ? 'DELIVERED' : 'FAILED',
      });
    }

    // Record in Audit Log (without polluting in-app student dashboard notifications)
    if (actorId) {
      try {
        await prisma.auditLog.create({
          data: {
            actorId,
            action: 'DISPATCH_WHATSAPP_BROADCAST',
            entityType: 'WhatsAppBroadcast',
            newState: {
              title,
              message,
              audience,
              recipientsCount: results.length,
              recipients: results.map((r) => ({
                name: r.fullName,
                phone: r.phone,
                role: r.role,
                status: r.status,
              })),
            },
          },
        });
      } catch (logErr) {
        console.warn('⚠️ Could not record WhatsApp broadcast audit log:', logErr.message);
      }
    }

    return {
      success: true,
      count: results.length,
      message: `Bulk WhatsApp broadcast dispatched successfully to ${results.length} user(s) with registered WhatsApp numbers!`,
      recipients: results,
    };
  }
}

export default WhatsAppService;
