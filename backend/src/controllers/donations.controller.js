import { DonationsService } from '../services/donations.service.js';

export class DonationsController {
  static async createOrder(req, res, next) {
    try {
      const { amount, tipAmount, donorName, donorEmail, isAnonymous, purpose } = req.body;
      const donorId = req.user ? req.user.id : null;

      const orderData = await DonationsService.createDonationOrder({
        amount,
        tipAmount,
        donorId,
        donorName,
        donorEmail,
        isAnonymous,
        purpose,
      });

      res.status(200).json({
        success: true,
        data: orderData,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyPayment(req, res, next) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const result = await DonationsService.verifyClientPayment({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getReceipt(req, res, next) {
    try {
      const receipt = await DonationsService.getDonationReceipt(req.params.receiptNumber);
      res.status(200).json({
        success: true,
        data: receipt,
      });
    } catch (err) {
      next(err);
    }
  }
}
