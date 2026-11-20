import prisma from '../config/db.js';

function computeInitials(name) {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export class ReviewsController {
  // Get review submitted by current user
  static async getMyReview(req, res, next) {
    try {
      const userId = req.user?.id || req.query.userId;
      const userName = req.query.name;

      if (!userId && !userName) {
        return res.status(200).json({ success: true, data: null });
      }

      const orConditions = [];
      if (userId) orConditions.push({ userId });
      if (userName && userName.trim()) {
        orConditions.push({ name: { equals: userName.trim(), mode: 'insensitive' } });
      }

      const review = await prisma.review.findFirst({
        where: { OR: orConditions },
        orderBy: { updatedAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: review || null,
      });
    } catch (err) {
      next(err);
    }
  }

  // Public/Student submit review (Only 1 review per user - replaces if already exists)
  static async submitReview(req, res, next) {
    try {
      const { name, role, institution, rating, comment, problemType, userId } = req.body;

      if (!comment || !comment.trim()) {
        return res.status(400).json({ success: false, message: 'Review feedback/comment is required' });
      }

      let targetUserId = req.user?.id || userId || null;
      if (targetUserId) {
        const userExists = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true },
        });
        if (!userExists) {
          targetUserId = null;
        }
      }

      const authorName = (name && name.trim()) || req.user?.fullName || 'Verified Scholar';
      const authorRole = (role && role.trim()) || 'Verified Student Scholar';
      const initials = computeInitials(authorName);
      const parsedRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

      // Check if user has already submitted a review
      const orConditions = [];
      if (targetUserId) {
        orConditions.push({ userId: targetUserId });
      }
      if (authorName && authorName !== 'Verified Scholar') {
        orConditions.push({ name: { equals: authorName, mode: 'insensitive' } });
      }

      let existing = null;
      if (orConditions.length > 0) {
        existing = await prisma.review.findFirst({
          where: { OR: orConditions },
        });
      }

      if (existing) {
        // REPLACE existing review (Single review per user constraint)
        const updated = await prisma.review.update({
          where: { id: existing.id },
          data: {
            userId: targetUserId || existing.userId,
            name: authorName,
            initials,
            role: authorRole,
            institution: institution ? institution.trim() : null,
            rating: parsedRating,
            comment: comment.trim(),
            problemType: problemType ? problemType.trim() : null,
            isApproved: true,
            updatedAt: new Date(),
          },
        });

        // Notify administrators of review update
        try {
          const admins = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isSuspended: false },
            select: { id: true },
          });
          if (admins.length > 0) {
            await prisma.notification.createMany({
              data: admins.map((admin) => ({
                userId: admin.id,
                type: 'SYSTEM',
                title: `Review Updated by ${authorName} (${parsedRating}★)`,
                message: `"${comment.trim().substring(0, 75)}..." (${problemType || 'General Resolution'})`,
                link: '/admin-reviews.html',
                isRead: false,
              })),
            });
          }
        } catch (notifErr) {
          console.warn('Admin notification error for updated review:', notifErr.message);
        }

        return res.status(200).json({
          success: true,
          message: 'Your existing review has been updated and replaced successfully!',
          data: updated,
          replaced: true,
        });
      }

      // Create new review if user has not reviewed before
      const review = await prisma.review.create({
        data: {
          userId: targetUserId,
          name: authorName,
          initials,
          role: authorRole,
          institution: institution ? institution.trim() : null,
          rating: parsedRating,
          comment: comment.trim(),
          problemType: problemType ? problemType.trim() : null,
          isApproved: true,
        },
      });

      // Notify administrators of new review
      try {
        const admins = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isSuspended: false },
          select: { id: true },
        });
        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: 'SYSTEM',
              title: `New Review by ${authorName} (${parsedRating}★)`,
              message: `"${comment.trim().substring(0, 75)}..." (${problemType || 'General Resolution'})`,
              link: '/admin-reviews.html',
              isRead: false,
            })),
          });
        }
      } catch (notifErr) {
        console.warn('Admin notification error for new review:', notifErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Your review has been successfully submitted and posted!',
        data: review,
        replaced: false,
      });
    } catch (err) {
      next(err);
    }
  }

  // Get last 5 approved reviews for homepage
  static async getHomepageReviews(req, res, next) {
    try {
      const reviews = await prisma.review.findMany({
        where: { isApproved: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: List all reviews
  static async listReviewsAdmin(req, res, next) {
    try {
      const reviews = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Edit / Update review
  static async updateReviewAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { name, role, institution, rating, comment, problemType, isApproved } = req.body;

      const existing = await prisma.review.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      const dataToUpdate = {};
      if (name !== undefined) {
        dataToUpdate.name = name.trim();
        dataToUpdate.initials = computeInitials(name);
      }
      if (role !== undefined) dataToUpdate.role = role.trim();
      if (institution !== undefined) dataToUpdate.institution = institution ? institution.trim() : null;
      if (rating !== undefined) {
        dataToUpdate.rating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
      }
      if (comment !== undefined) dataToUpdate.comment = comment.trim();
      if (problemType !== undefined) dataToUpdate.problemType = problemType ? problemType.trim() : null;
      if (isApproved !== undefined) dataToUpdate.isApproved = Boolean(isApproved);

      const updated = await prisma.review.update({
        where: { id },
        data: dataToUpdate,
      });

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Delete review
  static async deleteReviewAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await prisma.review.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      await prisma.review.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
