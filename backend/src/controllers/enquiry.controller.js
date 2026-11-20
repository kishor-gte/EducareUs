import { EnquiryService } from '../services/enquiry.service.js';

export class EnquiryController {
  static async submitEnquiry(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const data = {
        userId,
        ...req.body,
      };

      const enquiry = await EnquiryService.createEnquiry(data);
      res.status(201).json({
        success: true,
        message: 'Your enquiry has been successfully submitted! Our counselors will get in touch soon.',
        data: enquiry,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMyEnquiries(req, res, next) {
    try {
      const userId = req.user.id;
      const enquiries = await EnquiryService.getUserEnquiries(userId);
      res.status(200).json({
        success: true,
        data: enquiries,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listAllEnquiries(req, res, next) {
    try {
      const result = await EnquiryService.listAllEnquiries(req.query);
      res.status(200).json({
        success: true,
        data: result.enquiries,
        stats: result.stats,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEnquiryStatus(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await EnquiryService.updateEnquiryStatus(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Enquiry status updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteEnquiry(req, res, next) {
    try {
      const { id } = req.params;
      const result = await EnquiryService.deleteEnquiry(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
