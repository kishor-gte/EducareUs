import HomepageSectionsService from '../services/homepageSections.service.js';

export class HomepageSectionsController {
  // =========================================================================
  // ADMIN HANDLERS
  // =========================================================================

  static async getSectionAdmin(req, res, next) {
    try {
      const { key } = req.params;
      const section = await HomepageSectionsService.getSectionAdmin(key);
      res.status(200).json({
        success: true,
        data: section,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSectionDraft(req, res, next) {
    try {
      const { key } = req.params;
      const userEmail = req.user?.email || 'admin';
      const section = await HomepageSectionsService.updateSectionDraft(key, req.body, userEmail);
      res.status(200).json({
        success: true,
        message: 'Draft saved successfully',
        data: section,
      });
    } catch (err) {
      next(err);
    }
  }

  static async publishSection(req, res, next) {
    try {
      const { key } = req.params;
      const userEmail = req.user?.email || 'admin';
      const section = await HomepageSectionsService.publishSection(key, userEmail);
      res.status(200).json({
        success: true,
        message: 'Section published live to website successfully',
        data: section,
      });
    } catch (err) {
      next(err);
    }
  }

  static async unpublishSection(req, res, next) {
    try {
      const { key } = req.params;
      const userEmail = req.user?.email || 'admin';
      const section = await HomepageSectionsService.unpublishSection(key, userEmail);
      res.status(200).json({
        success: true,
        message: 'Section unpublished from live website and moved to Drafts',
        data: section,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // PUBLIC HANDLERS
  // =========================================================================

  static async getSectionPublic(req, res, next) {
    try {
      const { key } = req.params;
      const section = await HomepageSectionsService.getSectionPublic(key);
      if (!section) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'Section is unpublished or not configured',
        });
      }
      res.status(200).json({
        success: true,
        data: section,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default HomepageSectionsController;
