import prisma from '../config/db.js';

export class EnquiryService {
  /**
   * Submit new student course / career guidance enquiry
   */
  static async createEnquiry({
    userId,
    fullName,
    email,
    phone,
    location,
    highestEducation,
    currentStream,
    interestedCourse,
    preferredInstitutions,
    queryDetails,
  }) {
    if (!fullName || !email || !highestEducation || !interestedCourse || !queryDetails) {
      const err = new Error('Please fill in all required enquiry fields.');
      err.statusCode = 400;
      throw err;
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        userId: userId || null,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        location: location ? location.trim() : null,
        highestEducation: highestEducation.trim(),
        currentStream: currentStream ? currentStream.trim() : null,
        interestedCourse: interestedCourse.trim(),
        preferredInstitutions: preferredInstitutions ? preferredInstitutions.trim() : null,
        queryDetails: queryDetails.trim(),
        status: 'PENDING',
      },
    });

    // Notify administrators in real-time
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
            title: `New Career Enquiry from ${enquiry.fullName}`,
            message: `Interested in: ${enquiry.interestedCourse} (${enquiry.highestEducation})`,
            link: '/admin-requests.html',
            isRead: false,
          })),
        });
      }
    } catch (notifErr) {
      console.warn('Could not notify admins of enquiry:', notifErr.message);
    }

    return enquiry;
  }

  /**
   * Get enquiries submitted by a specific user
   */
  static async getUserEnquiries(userId) {
    if (!userId) return [];
    return await prisma.enquiry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: List all enquiries with search and pagination
   */
  static async listAllEnquiries({ status, search, highestEducation, page = 1, limit = 20 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      ...(status && status !== 'ALL' && { status }),
      ...(highestEducation && { highestEducation }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { interestedCourse: { contains: search, mode: 'insensitive' } },
          { currentStream: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, enquiries, pendingCount, inProgressCount, resolvedCount] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              verificationStatus: true,
            },
          },
        },
      }),
      prisma.enquiry.count({ where: { status: 'PENDING' } }),
      prisma.enquiry.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.enquiry.count({ where: { status: 'RESOLVED' } }),
    ]);

    return {
      enquiries,
      stats: {
        totalAll: pendingCount + inProgressCount + resolvedCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Admin: Update status and add counselor notes
   */
  static async updateEnquiryStatus(id, { status, adminNotes }) {
    const data = {};
    if (status) data.status = status;
    if (typeof adminNotes === 'string') data.adminNotes = adminNotes;

    const updated = await prisma.enquiry.update({
      where: { id },
      data,
    });

    // Notify user of advisor response
    if (updated.userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: updated.userId,
            type: 'SYSTEM',
            title: `Career Guidance: ${updated.interestedCourse || 'Enquiry Status'}`,
            message: adminNotes ? `Advisor: ${adminNotes}` : `Your enquiry status is now ${updated.status}.`,
            link: '/userdashboard?tab=enquiry',
            isRead: false,
          },
        });
      } catch (err) {
        console.warn('Could not create notification for enquiry update:', err.message);
      }
    }

    return updated;
  }

  /**
   * Admin: Delete an enquiry
   */
  static async deleteEnquiry(id) {
    await prisma.enquiry.delete({ where: { id } });
    return { success: true, message: 'Enquiry deleted successfully.' };
  }
}
