import { Router } from 'express';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';
import donationsRoutes from './donations.routes.js';
import webhooksRoutes from './webhooks.routes.js';
import adminRoutes from './admin.routes.js';
import enquiryRoutes from './enquiry.routes.js';
import notificationRoutes from './notifications.routes.js';
import supportRoutes from './support.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/donations', donationsRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/admin', adminRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support-tickets', supportRoutes);
router.use('/support', supportRoutes);
router.use('/chat', chatRoutes);
router.use('/ai', chatRoutes);

export default router;
