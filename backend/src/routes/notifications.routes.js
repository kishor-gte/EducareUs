import { Router } from 'express';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all notification routes
router.use(authenticate);

/**
 * Filter notifications by recipient role:
 * - Admin Bell: ONLY receives interactions & submissions coming FROM the user side
 *   (Support tickets, career enquiries, review submissions/updates, verification requests)
 * - User/Scholar Bell: ONLY receives interactions coming FROM the admin side
 *   (Admin replies to support tickets, admissions advisor guidance, verification updates, broadcasts)
 */
function getNotificationFilter(user) {
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  if (isAdmin) {
    return {
      userId: user.id,
      OR: [
        { title: { startsWith: 'New Support' } },
        { title: { startsWith: 'New Review' } },
        { title: { startsWith: 'Review Updated' } },
        { title: { startsWith: 'New Career Enquiry' } },
        { title: { contains: 'Verification Request' } },
        { title: { contains: 'Scholar Verification' } },
      ],
    };
  }

  // Scholar/User bell: only show admin-originated notifications
  return {
    userId: user.id,
    NOT: [
      { title: { startsWith: 'New Support Ticket' } },
      { title: { startsWith: 'New Support Request' } },
      { title: { startsWith: 'New Review' } },
      { title: { startsWith: 'Review Updated' } },
      { title: { startsWith: 'New Career Enquiry' } },
    ],
  };
}

// 1. Get notifications with unread count according to role
router.get('/', async (req, res, next) => {
  try {
    const where = getNotificationFilter(req.user);
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { ...where, isRead: false },
    });
    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// 1.1 Fast unread count endpoint
router.get('/unread-count', async (req, res, next) => {
  try {
    const where = getNotificationFilter(req.user);
    const unreadCount = await prisma.notification.count({
      where: { ...where, isRead: false },
    });
    res.status(200).json({ success: true, count: unreadCount });
  } catch (err) {
    next(err);
  }
});

// 2. Mark single notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
});

// 3. Mark all notifications as read for current view
router.patch('/read-all', async (req, res, next) => {
  try {
    const where = getNotificationFilter(req.user);
    await prisma.notification.updateMany({
      where: { ...where, isRead: false },
      data: { isRead: true },
    });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// 4. Delete single notification
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.notification.deleteMany({
      where: { id, userId: req.user.id },
    });
    res.status(200).json({ success: true, message: 'Notification removed' });
  } catch (err) {
    next(err);
  }
});

export default router;