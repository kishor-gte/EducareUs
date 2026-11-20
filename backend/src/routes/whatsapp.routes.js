import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = Router();

// =========================================================================
// 1. PUBLIC META CLOUD API WEBHOOK ENDPOINTS
// =========================================================================
// Meta Webhook verification handshake
router.get('/webhook', WhatsAppController.verifyWebhook);

// Meta Webhook delivery status events receiver
router.post('/webhook', WhatsAppController.handleWebhookEvent);

// Public/Admin config status
router.get('/config', WhatsAppController.getConfig);

// =========================================================================
// 2. ADMIN AUTOMATIC BULK WHATSAPP DISPATCH & TRACKING
// =========================================================================
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Recipient audience reach & preview
router.get('/recipients-preview', WhatsAppController.getRecipientsPreview);

// Single-click bulk dispatch via Meta WhatsApp Business Cloud API
router.post('/bulk-send', WhatsAppController.createBulkSend);

// Campaigns history with real delivery metrics
router.get('/campaigns', WhatsAppController.listCampaigns);

// Campaign live details & recipient logs
router.get('/campaigns/:id', WhatsAppController.getCampaignDetails);

export default router;
