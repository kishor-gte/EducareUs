import { WhatsAppCloudService } from '../services/whatsappCloud.service.js';
import { env } from '../config/env.js';

export class WhatsAppController {
  /**
   * Meta Webhook Verification (GET /api/whatsapp/webhook)
   * Handles hub.challenge verification requested when configuring Meta Webhook in App Dashboard.
   */
  static async verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'educare_webhook_verify_token_2026';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('✅ Meta WhatsApp webhook verified successfully!');
      return res.status(200).send(challenge);
    }

    console.warn('⚠️ Webhook verification failed. Token mismatch.');
    return res.status(403).json({ error: 'Verification token mismatch' });
  }

  /**
   * Meta Webhook Event Receiver (POST /api/whatsapp/webhook)
   * Receives real-time message status updates (sent, delivered, read, failed).
   */
  static async handleWebhookEvent(req, res) {
    // 1. Verify HMAC SHA-256 signature
    const isValid = WhatsAppCloudService.verifyWebhookSignature(req);
    if (!isValid) {
      console.warn('⚠️ Webhook rejected: Invalid HMAC signature.');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // 2. Acknowledge Meta immediately (200 OK)
    res.status(200).send('EVENT_RECEIVED');

    // 3. Process status event asynchronously
    try {
      await WhatsAppCloudService.processWebhookPayload(req.body);
    } catch (err) {
      console.error('❌ Error processing WhatsApp webhook event:', err);
    }
  }

  /**
   * Returns current WhatsApp Business Cloud API config & sender number.
   * (GET /api/whatsapp/config)
   */
  static async getConfig(req, res, next) {
    try {
      const config = WhatsAppCloudService.getConfig();
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Returns eligible recipient breakdown and count before starting a campaign.
   * (GET /api/admin/whatsapp/recipients-preview)
   */
  static async getRecipientsPreview(req, res, next) {
    try {
      const { audience = 'All Users' } = req.query;
      const data = await WhatsAppCloudService.resolveAudienceRecipients(audience);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Initiates a Bulk WhatsApp Campaign through Meta Cloud API.
   * Single click initiates automatic dispatch without opening any individual chats.
   * (POST /api/admin/whatsapp/bulk-send)
   */
  static async createBulkSend(req, res, next) {
    try {
      const {
        title,
        message,
        audience = 'All Users',
        templateName,
        templateLanguage,
      } = req.body;

      const result = await WhatsAppCloudService.createBulkCampaign({
        title,
        message,
        audience,
        templateName,
        templateLanguage,
        createdById: req.user?.id || null,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lists campaigns with real-time delivery counts.
   * (GET /api/admin/whatsapp/campaigns)
   */
  static async listCampaigns(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const campaigns = await WhatsAppCloudService.listCampaigns(limit);
      res.status(200).json({ success: true, data: campaigns });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Gets specific campaign details and individual recipient message delivery statuses.
   * (GET /api/admin/whatsapp/campaigns/:id)
   */
  static async getCampaignDetails(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await WhatsAppCloudService.getCampaignDetails(id);
      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }
      res.status(200).json({ success: true, data: campaign });
    } catch (err) {
      next(err);
    }
  }
}

export default WhatsAppController;
