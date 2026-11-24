import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letters')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    fullName: z.string().min(2, 'Full name is required'),
    phone: z
      .string()
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
      .optional()
      .or(z.literal('')),
    role: z.enum(['BENEFICIARY']).optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    otp: z.string().min(4, 'OTP code is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  }),
});

const verifyResetTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letters')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letters')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

const toggleTwoFactorSchema = z.object({
  body: z.object({
    enabled: z.boolean(),
  }),
});

router.post('/send-otp', validateRequest(sendOtpSchema), AuthController.sendOtp);
router.post('/verify-otp', validateRequest(verifyOtpSchema), AuthController.verifyOtp);
router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/verify-reset-token', validateRequest(verifyResetTokenSchema), AuthController.verifyResetToken);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.get('/dashboard', authenticate, AuthController.getUserDashboard);
router.patch('/profile', authenticate, AuthController.updateProfile);

// Real-time Security & Access Management
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), AuthController.changePassword);
router.post('/toggle-2fa', authenticate, validateRequest(toggleTwoFactorSchema), AuthController.toggleTwoFactor);
router.get('/security-activity', authenticate, AuthController.getSecurityActivity);
router.post('/revoke-sessions', authenticate, AuthController.revokeSessions);

export default router;
