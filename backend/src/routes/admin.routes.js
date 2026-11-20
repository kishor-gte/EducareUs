import { Router } from 'express';
import { z } from 'zod';
import { AdminController } from '../controllers/admin.controller.js';
import { EnquiryController } from '../controllers/enquiry.controller.js';
import { PublicationsController } from '../controllers/publications.controller.js';
import { CoursesController } from '../controllers/courses.controller.js';
import { HomepageSectionsController } from '../controllers/homepageSections.controller.js';
import { ReviewsController } from '../controllers/reviews.controller.js';
import { TrustMembersController } from '../controllers/trustMembers.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { auditLogger } from '../middleware/auditLogger.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Protect all admin routes with authentication, RBAC, and automatic audit logger
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));
router.use(auditLogger);

// 1. System Health
router.get('/system-health', AdminController.getSystemHealth);

// 2. Analytics & Reporting
router.get('/analytics/kpis', AdminController.getDashboardKPIs);
router.get('/analytics/trends', AdminController.getDonationTrends);
router.get('/analytics/top-donors', AdminController.getTopDonors);
router.get('/reports', AdminController.getReports);

// 3. User Management
router.get('/users', AdminController.listUsers);
router.patch(
  '/users/:id',
  validateRequest(
    z.object({
      body: z.object({
        isSuspended: z.boolean().optional(),
        role: z.enum(['DONOR', 'BENEFICIARY', 'ADMIN', 'SUPER_ADMIN']).optional(),
      }),
    })
  ),
  AdminController.updateUser
);
router.delete('/users/:id', AdminController.deleteUser);

// 4. Verification Center
router.get('/verifications', AdminController.listVerifications);
router.patch(
  '/verifications/:id/review',
  validateRequest(
    z.object({
      body: z.object({
        status: z.enum(['VERIFIED', 'REJECTED', 'UNDER_REVIEW']),
        rejectionReason: z.string().optional(),
        remarks: z.string().optional(),
      }),
    })
  ),
  AdminController.reviewVerification
);

// 6. Beneficiary Withdrawal Requests
router.get('/withdrawals', AdminController.listWithdrawals);
router.patch(
  '/withdrawals/:id/review',
  validateRequest(
    z.object({
      body: z.object({
        status: z.enum(['APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED']),
        rejectionReason: z.string().optional(),
        transactionRef: z.string().optional(),
      }),
    })
  ),
  AdminController.reviewWithdrawal
);

// 7. Support Desk
router.get('/support-tickets', AdminController.listSupportTickets);
router.patch(
  '/support-tickets/:id',
  validateRequest(
    z.object({
      body: z.object({
        subject: z.string().min(1).optional(),
        message: z.string().min(1).optional(),
        category: z.string().optional(),
        status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        assignedAdminId: z.string().uuid().nullable().optional(),
        resolutionNotes: z.string().optional(),
      }),
    })
  ),
  AdminController.updateSupportTicket
);
router.delete('/support-tickets/:id', AdminController.deleteSupportTicket);

// 8. Audit Logs
router.get('/audit-logs', AdminController.listAuditLogs);
router.delete('/audit-logs/:id', AdminController.deleteAuditLog);
router.delete('/audit-logs', AdminController.clearAuditLogs);

// 9. System Settings
router.get('/settings', AdminController.getSettings);
router.delete('/settings/:key', AdminController.deleteSetting);
router.put(
  '/settings/:key',
  validateRequest(
    z.object({
      body: z.object({
        value: z.any(),
        category: z.string().optional(),
        description: z.string().optional(),
      }),
    })
  ),
  AdminController.updateSetting
);

// Administrators Suite
router.get('/administrators', AdminController.listAdministrators);
router.post(
  '/administrators',
  validateRequest(
    z.object({
      body: z.object({
        fullName: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Valid email address required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional().default('ADMIN'),
      }),
    })
  ),
  AdminController.createAdministrator
);
router.patch('/administrators/:id', AdminController.updateAdministrator);
router.delete('/administrators/:id', AdminController.deleteAdministrator);

// Security Alerts & Incidents Suite
router.get('/security/alerts', AdminController.getSecurityAlerts);
router.post(
  '/security/alerts',
  validateRequest(
    z.object({
      body: z.object({
        title: z.string().min(2, 'Alert title required'),
        severity: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
        user: z.string().optional().default('System Monitor'),
        description: z.string().optional(),
      }),
    })
  ),
  AdminController.createSecurityAlert
);
router.patch('/security/alerts/:id', AdminController.updateSecurityAlert);
router.delete('/security/alerts/:id', AdminController.deleteSecurityAlert);

// 10. Student Academic & Career Enquiries
router.get('/enquiries', EnquiryController.listAllEnquiries);
router.patch(
  '/enquiries/:id',
  validateRequest(
    z.object({
      body: z.object({
        status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
        adminNotes: z.string().optional(),
      }),
    })
  ),
  EnquiryController.updateEnquiryStatus
);
router.delete('/enquiries/:id', EnquiryController.deleteEnquiry);

// 11. Broadcast Notifications
router.post(
  '/notifications/broadcast',
  validateRequest(
    z.object({
      body: z.object({
        title: z.string().min(1, 'Notification title is required'),
        message: z.string().min(1, 'Notification message is required'),
        audience: z
          .enum(['All Users', 'Beneficiaries Only', 'Donors Only', 'ALL', 'BENEFICIARY', 'DONOR'])
          .optional()
          .default('All Users'),
        link: z.string().optional(),
      }),
    })
  ),
  AdminController.sendBroadcastNotification
);

router.get('/notifications/history', AdminController.getBroadcastHistory);

// WhatsApp Bulk Broadcast
router.post(
  '/notifications/whatsapp-broadcast',
  validateRequest(
    z.object({
      body: z.object({
        title: z.string().min(1, 'Notification title is required'),
        message: z.string().min(1, 'WhatsApp message content is required'),
        audience: z
          .enum(['All Users', 'Beneficiaries Only', 'Donors Only', 'Enquiries Only', 'ALL', 'BENEFICIARY', 'DONOR'])
          .optional()
          .default('All Users'),
      }),
    })
  ),
  AdminController.sendWhatsAppBroadcast
);

router.get('/notifications/whatsapp-reach', AdminController.getWhatsAppReach);

// =========================================================================
// 12. PUBLICATIONS MANAGEMENT (Blogs, Legal Pages, FAQs)
// =========================================================================

// Blogs
router.get('/blogs', PublicationsController.listBlogsAdmin);
router.post('/blogs', PublicationsController.createBlog);
router.get('/blogs/:id', PublicationsController.getBlogByIdAdmin);
router.get('/blogs/:id/preview', PublicationsController.getBlogPreviewAdmin);
router.put('/blogs/:id', PublicationsController.updateBlog);
router.patch('/blogs/:id', PublicationsController.updateBlog);
router.post('/blogs/:id/publish', PublicationsController.publishBlog);
router.post('/blogs/:id/unpublish', PublicationsController.unpublishBlog);
router.delete('/blogs/:id', PublicationsController.deleteBlog);

// Site Pages (Terms & Conditions, Privacy Policy)
router.get('/pages/:slug', PublicationsController.getSitePageAdmin);
router.put('/pages/:slug', PublicationsController.updateSitePageDraft);
router.patch('/pages/:slug', PublicationsController.updateSitePageDraft);
router.post('/pages/:slug/publish', PublicationsController.publishSitePage);
router.post('/pages/:slug/unpublish', PublicationsController.unpublishSitePage);
router.get('/pages/:slug/revisions', PublicationsController.getSitePageRevisions);

// FAQs
router.get('/faqs', PublicationsController.listFaqsAdmin);
router.post('/faqs', PublicationsController.createFaq);
router.get('/faqs/:id', PublicationsController.getFaqByIdAdmin);
router.put('/faqs/:id', PublicationsController.updateFaq);
router.patch('/faqs/:id', PublicationsController.updateFaq);
router.post('/faqs/:id/publish', PublicationsController.publishFaq);
router.post('/faqs/:id/unpublish', PublicationsController.unpublishFaq);
router.delete('/faqs/:id', PublicationsController.deleteFaq);
router.patch('/faqs/reorder', PublicationsController.reorderFaqs);
router.post('/faqs/reorder', PublicationsController.reorderFaqs);

// Publication Image Upload
router.post('/publications/upload', PublicationsController.uploadImage);

// =========================================================================
// 13. COURSES & COLLEGES MANAGEMENT
// =========================================================================

// Courses
router.get('/courses', CoursesController.listCoursesAdmin);
router.post('/courses', CoursesController.createCourse);
router.put('/courses/reorder', CoursesController.reorderCourses);
router.patch('/courses/reorder', CoursesController.reorderCourses);
router.get('/courses/:id', CoursesController.getCourseByIdAdmin);
router.put('/courses/:id', CoursesController.updateCourse);
router.patch('/courses/:id', CoursesController.updateCourse);
router.post('/courses/:id/publish', CoursesController.publishCourse);
router.post('/courses/:id/unpublish', CoursesController.unpublishCourse);
router.delete('/courses/:id', CoursesController.deleteCourse);

// Colleges
router.get('/colleges', CoursesController.listCollegesAdmin);
router.post('/colleges', CoursesController.createCollege);
router.get('/colleges/:id', CoursesController.getCollegeByIdAdmin);
router.put('/colleges/:id', CoursesController.updateCollege);
router.patch('/colleges/:id', CoursesController.updateCollege);
router.delete('/colleges/:id', CoursesController.deleteCollege);

// =========================================================================
// 14. HOMEPAGE SECTIONS (About Us & Why Choose Us)
// =========================================================================
router.get('/homepage-sections/:key', HomepageSectionsController.getSectionAdmin);
router.put('/homepage-sections/:key', HomepageSectionsController.updateSectionDraft);
router.patch('/homepage-sections/:key', HomepageSectionsController.updateSectionDraft);
router.post('/homepage-sections/:key/publish', HomepageSectionsController.publishSection);
router.post('/homepage-sections/:key/unpublish', HomepageSectionsController.unpublishSection);

// =========================================================================
// 15. STUDENT SCHOLAR REVIEWS & FEEDBACK
// =========================================================================
router.get('/reviews', ReviewsController.listReviewsAdmin);
router.put('/reviews/:id', ReviewsController.updateReviewAdmin);
router.patch('/reviews/:id', ReviewsController.updateReviewAdmin);
router.delete('/reviews/:id', ReviewsController.deleteReviewAdmin);

// =========================================================================
// 16. TRUST MEMBERS & ACADEMIC MENTORS MANAGEMENT
// =========================================================================
router.get('/trust-members', TrustMembersController.listTrustMembersAdmin);
router.post('/trust-members/upload', TrustMembersController.uploadImage);
router.post('/trust-members', TrustMembersController.createTrustMember);
router.get('/trust-members/:id', TrustMembersController.getTrustMemberById);
router.put('/trust-members/:id', TrustMembersController.updateTrustMember);
router.patch('/trust-members/:id', TrustMembersController.updateTrustMember);
router.delete('/trust-members/:id', TrustMembersController.deleteTrustMember);
router.patch('/trust-members/:id/status', TrustMembersController.toggleStatus);

export default router;
