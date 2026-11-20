import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Protect all support routes with authentication
router.use(authenticate);

const createTicketSchema = z.object({
  body: z.object({
    subject: z.string({ required_error: 'Please enter a subject for your ticket' }).trim().min(1, 'Subject cannot be empty'),
    message: z.string({ required_error: 'Please enter inquiry message details' }).trim().min(1, 'Message cannot be empty'),
    category: z
      .any()
      .optional()
      .transform((val) => (typeof val === 'string' && val.trim().length > 0 ? val.trim() : 'General Inquiry')),
    priority: z
      .any()
      .optional()
      .transform((val) => {
        const upper = typeof val === 'string' ? val.toUpperCase().trim() : '';
        return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(upper) ? upper : 'MEDIUM';
      }),
  }),
});

// 1. Get all tickets submitted by authenticated user
router.get('/my', async (req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedAdmin: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Submit a new support ticket
router.post('/', validateRequest(createTicketSchema), async (req, res, next) => {
  try {
    const { subject, message, category, priority } = req.body;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        subject,
        message,
        category: category || 'General Inquiry',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // Also notify all admins of a new support ticket
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isSuspended: false },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'SUPPORT',
            title: `New Support Ticket from ${req.user.fullName || 'User'}`,
            message: `Subject: ${subject} (${category || 'General'})`,
            link: '/admin-support.html',
            isRead: false,
          })),
        });
      }
    } catch (notifErr) {
      console.warn('Could not notify admins of new support ticket:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Our team will review and reply.',
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
