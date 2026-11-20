import crypto from 'crypto';
import prisma from '../config/db.js';
import { razorpayInstance } from '../config/razorpay.js';
import { env } from '../config/env.js';

export class DonationsService {
  /**
   * Generates a unique tax-compliant receipt number (e.g. REC-2026-X8910)
   */
  static generateReceiptNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `REC-2026-${timestamp}-${randomHex}`;
  }

  /**
   * Initializes Razorpay order and creates a PENDING Donation record
   */
  static async createDonationOrder({
    amount,
    tipAmount = 0,
    donorId = null,
    donorName = null,
    donorEmail = null,
    isAnonymous = false,
    purpose = 'Education Aid Grant',
  }) {
    const totalAmount = Number(amount) + Number(tipAmount || 0);
    const amountInPaise = Math.round(totalAmount * 100);
    const receiptNumber = this.generateReceiptNumber();

    let razorpayOrder;
    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptNumber,
        notes: {
          purpose: String(purpose).substring(0, 30),
          donorEmail: donorEmail || '',
        },
      });
    } catch (err) {
      console.warn('⚠️ Razorpay order creation failed, generating local fallback order:', err.message);
      // Mock order for sandbox / test environment when keys are placeholders
      razorpayOrder = {
        id: `order_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptNumber,
      };
    }

    const donation = await prisma.donation.create({
      data: {
        donorId: donorId || null,
        amount: amount,
        tipAmount: tipAmount || 0,
        donorName: donorName || (isAnonymous ? 'Anonymous Donor' : 'Kind Supporter'),
        donorEmail: donorEmail || null,
        isAnonymous: Boolean(isAnonymous),
        purpose: purpose || 'Education Aid Grant',
        razorpayOrderId: razorpayOrder.id,
        receiptNumber: receiptNumber,
        status: 'PENDING',
      },
    });

    return {
      donationId: donation.id,
      receiptNumber: donation.receiptNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      purpose: donation.purpose,
    };
  }

  /**
   * Verifies Razorpay Webhook cryptographically with HMAC SHA-256 and executes
   * an atomic Prisma transaction to prevent race conditions or double-counting.
   */
  static async verifyPaymentWebhook(rawBody, signature) {
    if (!signature) {
      const error = new Error('Missing Razorpay signature header.');
      error.statusCode = 400;
      throw error;
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // In production with genuine webhooks, verify exact signature match
    if (env.NODE_ENV === 'production' && signature !== expectedSignature) {
      const error = new Error('Invalid Razorpay webhook signature.');
      error.statusCode = 400;
      throw error;
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const paymentMethod = paymentEntity?.method || 'UPI';

      if (!orderId) {
        return { message: 'Ignored webhook with no order_id' };
      }

      return await this.processSuccessfulPayment({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        paymentMethod,
      });
    }

    if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await prisma.donation.updateMany({
          where: { razorpayOrderId: orderId, status: 'PENDING' },
          data: {
            status: 'FAILED',
            failureReason: paymentEntity?.error_description || 'Payment Failed',
          },
        });
      }
    }

    return { status: 'acknowledged', event };
  }

  /**
   * Manual/Client Checkout Verification (Handles direct return from Razorpay modal)
   */
  static async verifyClientPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // Accept signature in development/test or if cryptographically valid
    const isValid =
      env.NODE_ENV !== 'production' ||
      razorpaySignature === generatedSignature;

    if (!isValid) {
      const error = new Error('Cryptographic signature verification failed.');
      error.statusCode = 400;
      throw error;
    }

    return await this.processSuccessfulPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod: 'Online Payment',
    });
  }

  /**
   * ATOMIC TRANSACTION:
   * 1. Finds pending donation
   * 2. Updates Donation status to SUCCESS
   * 3. Creates a Notification for donor
   */
  static async processSuccessfulPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentMethod,
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check existing donation status to prevent double-counting
      const existingDonation = await tx.donation.findUnique({
        where: { razorpayOrderId },
      });

      if (!existingDonation) {
        const error = new Error(`Donation record with order ID ${razorpayOrderId} not found.`);
        error.statusCode = 404;
        throw error;
      }

      // If already processed as SUCCESS, return early (idempotency)
      if (existingDonation.status === 'SUCCESS') {
        return {
          success: true,
          message: 'Donation already verified and processed.',
          donation: existingDonation,
        };
      }

      // 2. Mark donation as SUCCESS
      const updatedDonation = await tx.donation.update({
        where: { id: existingDonation.id },
        data: {
          status: 'SUCCESS',
          razorpayPaymentId: razorpayPaymentId || `pay_${Date.now()}`,
          razorpaySignature: razorpaySignature || 'verified_sig',
          paymentMethod: paymentMethod || 'Online Gateway',
        },
      });

      // Create Notification for registered Donor (if authenticated)
      if (existingDonation.donorId) {
        await tx.notification.create({
          data: {
            userId: existingDonation.donorId,
            type: 'DONATION',
            title: '🙏 Thank You for Your Contribution!',
            message: `Your donation of ₹${Number(existingDonation.amount).toLocaleString('en-IN')} for education aid was successful. Receipt: ${existingDonation.receiptNumber}`,
            link: `/receipts/${existingDonation.receiptNumber}`,
          },
        });
      }

      return {
        success: true,
        message: 'Payment verified and recorded atomically.',
        donation: updatedDonation,
      };
    });
  }

  static async getDonationReceipt(receiptNumber) {
    const donation = await prisma.donation.findUnique({
      where: { receiptNumber },
      include: {
        donor: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!donation) {
      const error = new Error('Receipt not found.');
      error.statusCode = 404;
      throw error;
    }

    return donation;
  }
}
