import { Router } from 'express';
import { WebhooksController } from '../controllers/webhooks.controller.js';

const router = Router();

// Note: express.raw() is attached to this specific route in app.js for cryptographic HMAC verification
router.post('/razorpay', WebhooksController.handleRazorpayWebhook);

export default router;
