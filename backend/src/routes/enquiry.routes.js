import { Router } from 'express';
import { z } from 'zod';
import { EnquiryController } from '../controllers/enquiry.controller.js';
import { optionalAuthenticate, authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

const createEnquirySchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().trim().toLowerCase().email('Valid email address is required'),
    phone: z.string().optional().or(z.literal('')),
    location: z.string().optional().or(z.literal('')),
    highestEducation: z.string().min(1, 'Please select or enter your highest completed education'),
    currentStream: z.string().optional().or(z.literal('')),
    interestedCourse: z.string().min(1, 'Please select or enter what you wish to pursue'),
    preferredInstitutions: z.string().optional().or(z.literal('')),
    queryDetails: z.string().min(10, 'Please provide details or questions about your educational enquiry (min 10 characters)'),
  }),
});

// Student enquiry submission (works for logged-in students or authenticated beneficiaries)
router.post('/', optionalAuthenticate, validateRequest(createEnquirySchema), EnquiryController.submitEnquiry);

// View user's own submitted enquiries
router.get('/my', authenticate, EnquiryController.getMyEnquiries);

export default router;
