import { DonationsService } from '../services/donations.service.js';

export class WebhooksController {
  static async handleRazorpayWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      // req.rawBody or req.body Buffer
      const rawBody = req.rawBody || JSON.stringify(req.body);

      const result = await DonationsService.verifyPaymentWebhook(rawBody, signature);
      return res.status(200).json({ status: 'ok', result });
    } catch (err) {
      console.error('❌ Webhook processing error:', err.message);
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
      });
    }
  }
}
