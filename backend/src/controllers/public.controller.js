import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { LocationService } from '../services/location.service.js';

import CoursesService from '../services/courses.service.js';
import { ReviewsController } from './reviews.controller.js';

export class PublicController {
  static async getStates(req, res, next) {
    try {
      const states = await LocationService.getStates();
      res.status(200).json({
        success: true,
        data: states,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCities(req, res, next) {
    try {
      const { stateCode } = req.query;
      const cities = await LocationService.getCitiesByState(stateCode);
      res.status(200).json({
        success: true,
        data: cities,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPlatformStats(req, res, next) {
    try {
      const [totalStudents, totalDonations, totalRaised, totalEnquiries, settings] = await Promise.all([
        prisma.user.count({ where: { role: 'BENEFICIARY' } }),
        prisma.donation.count({ where: { status: 'SUCCESS' } }),
        prisma.donation.aggregate({
          where: { status: 'SUCCESS' },
          _sum: { amount: true },
        }),
        prisma.enquiry.count(),
        prisma.systemSetting.findMany({
          where: {
            key: {
              in: [
                'PLATFORM_NAME',
                'SUPPORT_EMAIL',
                'TAX_EXEMPTION_CODE',
                'PLATFORM_FEE_PERCENT',
                'YEARS_OF_GUIDANCE',
                'COLLEGE_TIE_UPS',
                'DIRECT_FEE_TRANSFER_PERCENT',
                'STUDENTS_SUPPORTED',
              ],
            },
          },
        }),
      ]);

      const settingsMap = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      // Real active statistics dynamically fetched from PostgreSQL database (no dummy hardcoding)
      const realStudents = settingsMap['STUDENTS_SUPPORTED'] !== undefined
        ? Number(settingsMap['STUDENTS_SUPPORTED'])
        : (totalStudents + totalEnquiries);

      const yearsOfGuidance = settingsMap['YEARS_OF_GUIDANCE'] !== undefined
        ? Number(settingsMap['YEARS_OF_GUIDANCE'])
        : 0;

      const collegeTieUps = settingsMap['COLLEGE_TIE_UPS'] !== undefined
        ? Number(settingsMap['COLLEGE_TIE_UPS'])
        : 0;

      const directFeeTransferPercent = settingsMap['DIRECT_FEE_TRANSFER_PERCENT'] !== undefined
        ? Number(settingsMap['DIRECT_FEE_TRANSFER_PERCENT'])
        : 0;

      res.status(200).json({
        success: true,
        data: {
          studentsGuided: realStudents,
          fundsDistributed: totalRaised._sum.amount || 0,
          totalDonationsCount: totalDonations,
          yearsOfGuidance,
          collegeTieUps,
          directFeeTransferPercent,
          platformName: settingsMap['PLATFORM_NAME'] || '',
          supportEmail: settingsMap['SUPPORT_EMAIL'] || '',
          taxExemptionCode: settingsMap['TAX_EXEMPTION_CODE'] || '',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCourses(req, res, next) {
    try {
      const courses = await CoursesService.getHomepageCourses();
      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTestimonials(req, res, next) {
    return ReviewsController.getHomepageReviews(req, res, next);
  }

  static async getMentors(req, res, next) {
    try {
      const trustMembers = await prisma.trustMember.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });

      const formatted = trustMembers.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.specialization,
        specialization: m.specialization,
        bio: m.description,
        description: m.description,
        image: m.image || '/pdf-extracted/img_4_26483.jpg',
        tag: m.tag || 'Academic Leader',
        badgeColor: m.badgeColor || 'bg-[#FFB52E] text-[#172033]',
        linkedinUrl: m.linkedinUrl,
        twitterUrl: m.twitterUrl,
        githubUrl: m.githubUrl,
      }));

      res.status(200).json({
        success: true,
        data: formatted,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitContact(req, res, next) {
    try {
      const { fullName, email, subject, message } = req.body;
      if (!fullName || !email) {
        return res.status(400).json({
          success: false,
          message: 'Full name and email are required.',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = fullName.trim();
      const ticketSubject = subject?.trim() || 'General Inquiry';
      const ticketMessage = message?.trim() || 'Student support request from EducareUs homepage';

      // 1. Find or create user associated with this support request
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        const dummyPasswordHash = await bcrypt.hash(`Educarrus_${Date.now()}_pwd`, 10);
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            fullName: trimmedName,
            passwordHash: dummyPasswordHash,
            role: 'BENEFICIARY',
            verificationStatus: 'UNVERIFIED',
          },
        });
      }

      // 2. Create SupportTicket in PostgreSQL so it immediately reflects in the admin support desk
      const ticket = await prisma.supportTicket.create({
        data: {
          userId: user.id,
          subject: ticketSubject,
          message: ticketMessage,
          category: 'General Inquiry',
          priority: 'MEDIUM',
          status: 'OPEN',
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      // 3. Record Enquiry for counselling & pipeline tracking
      try {
        await prisma.enquiry.create({
          data: {
            userId: user.id,
            fullName: trimmedName,
            email: normalizedEmail,
            highestEducation: 'Undergraduate / College Scholar',
            interestedCourse: ticketSubject,
            queryDetails: ticketMessage,
            status: 'NEW',
          },
        });
      } catch (enquiryErr) {
        console.warn('Could not record duplicate enquiry:', enquiryErr.message);
      }

      // 4. Notify all administrators of the new support ticket
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
              title: `New Support Request: ${ticketSubject}`,
              message: `From ${trimmedName} (${normalizedEmail}): ${ticketMessage.slice(0, 100)}...`,
              link: '/admin-support.html',
              isRead: false,
            })),
          });
        }
      } catch (notifErr) {
        console.warn('Admin notification error:', notifErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Your inquiry has been received! Our support team will get in touch within 24 hours.',
        data: ticket,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFeaturedPrograms(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: [],
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Record page visit from any browser
   */
  static async recordVisit(req, res, next) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'TOTAL_SITE_VISITS' },
      });

      let currentCount = 0;
      if (setting) {
        if (typeof setting.value === 'number') {
          currentCount = setting.value;
        } else if (typeof setting.value?.count === 'number') {
          currentCount = setting.value.count;
        } else if (!isNaN(Number(setting.value))) {
          currentCount = Number(setting.value);
        }
      }

      const newCount = currentCount + 1;

      await prisma.systemSetting.upsert({
        where: { key: 'TOTAL_SITE_VISITS' },
        update: {
          value: newCount,
          updatedAt: new Date(),
        },
        create: {
          key: 'TOTAL_SITE_VISITS',
          value: newCount,
          category: 'TELEMETRY',
          description: 'Total number of site visits across all browsers',
        },
      });

      res.status(200).json({
        success: true,
        data: {
          totalVisits: newCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current total site visits
   */
  static async getVisitCount(req, res, next) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'TOTAL_SITE_VISITS' },
      });

      let totalVisits = 0;
      if (setting) {
        if (typeof setting.value === 'number') {
          totalVisits = setting.value;
        } else if (typeof setting.value?.count === 'number') {
          totalVisits = setting.value.count;
        } else if (!isNaN(Number(setting.value))) {
          totalVisits = Number(setting.value);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          totalVisits,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
