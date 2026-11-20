import { Router } from 'express';
import { z } from 'zod';
import { DonationsController } from '../controllers/donations.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = Router();

const createOrderSchema = z.object({
  body: z.object({
    amount: z.number().positive('Donation amount must be greater than 0'),
    tipAmount: z.number().nonnegative().optional(),
    donorName: z.string().optional(),
    donorEmail: z.string().email().optional(),
    isAnonymous: z.boolean().optional(),
    purpose: z.string().optional(),
  }),
});

const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1, 'razorpayOrderId is required'),
    razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required'),
    razorpaySignature: z.string().min(1, 'razorpaySignature is required'),
  }),
});

router.post('/create-order', optionalAuthenticate, validateRequest(createOrderSchema), DonationsController.createOrder);
router.post('/verify', validateRequest(verifyPaymentSchema), DonationsController.verifyPayment);
router.get('/receipt/:receiptNumber', DonationsController.getReceipt);

export default router;
