import { PublicationsService } from '../services/publications.service.js';

export class PublicationsController {
  // =========================================================================
  // ADMIN BLOGS
  // =========================================================================

  static async listBlogsAdmin(req, res, next) {
    try {
      const result = await PublicationsService.listBlogsAdmin(req.query);
      res.status(200).json({
        success: true,
        data: result.blogs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBlogByIdAdmin(req, res, next) {
    try {
      const blog = await PublicationsService.getBlogById(req.params.id);
      res.status(200).json({
        success: true,
        data: blog,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createBlog(req, res, next) {
    try {
      const blog = await PublicationsService.createBlog(req.body, req.user);
      res.status(201).json({
        success: true,
        message: blog.status === 'PUBLISHED' ? 'Blog created and published successfully!' : 'Blog draft saved successfully!',
        data: blog,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateBlog(req, res, next) {
    try {
      const blog = await PublicationsService.updateBlog(req.params.id, req.body, req.user);
      res.status(200).json({
        success: true,
        message: 'Blog updated successfully!',
        data: blog,
      });
    } catch (err) {
      next(err);
    }
  }

  static async publishBlog(req, res, next) {
    try {
      const blog = await PublicationsService.publishBlog(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Blog published successfully to public website!',
        data: blog,
      });
    } catch (err) {
      next(err);
    }
  }

  static async unpublishBlog(req, res, next) {
    try {
      const blog = await PublicationsService.unpublishBlog(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Blog has been unpublished and moved to Drafts.',
        data: blog,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteBlog(req, res, next) {
    try {
      await PublicationsService.deleteBlog(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Blog deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBlogPreviewAdmin(req, res, next) {
    try {
      const blog = await PublicationsService.getBlogById(req.params.id);
      res.status(200).json({
        success: true,
        data: blog,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // ADMIN SITE PAGES (TERMS & CONDITIONS, PRIVACY POLICY)
  // =========================================================================

  static async getSitePageAdmin(req, res, next) {
    try {
      const page = await PublicationsService.getOrCreateSitePage(req.params.slug);
      res.status(200).json({
        success: true,
        data: page,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSitePageDraft(req, res, next) {
    try {
      const page = await PublicationsService.updateSitePageDraft(req.params.slug, req.body, req.user);
      res.status(200).json({
        success: true,
        message: 'Page draft saved successfully!',
        data: page,
      });
    } catch (err) {
      next(err);
    }
  }

  static async publishSitePage(req, res, next) {
    try {
      const page = await PublicationsService.publishSitePage(req.params.slug, req.body, req.user);
      res.status(200).json({
        success: true,
        message: `Version ${page.version} published successfully to public website!`,
        data: page,
      });
    } catch (err) {
      next(err);
    }
  }

  static async unpublishSitePage(req, res, next) {
    try {
      const page = await PublicationsService.unpublishSitePage(req.params.slug);
      res.status(200).json({
        success: true,
        message: 'Page has been unpublished.',
        data: page,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSitePageRevisions(req, res, next) {
    try {
      const revisions = await PublicationsService.getSitePageRevisions(req.params.slug);
      res.status(200).json({
        success: true,
        data: revisions,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // ADMIN FAQS
  // =========================================================================

  static async listFaqsAdmin(req, res, next) {
    try {
      const faqs = await PublicationsService.listFaqsAdmin(req.query);
      res.status(200).json({
        success: true,
        data: faqs,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFaqByIdAdmin(req, res, next) {
    try {
      const faq = await PublicationsService.getFaqById(req.params.id);
      res.status(200).json({
        success: true,
        data: faq,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createFaq(req, res, next) {
    try {
      const faq = await PublicationsService.createFaq(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'FAQ entry created successfully!',
        data: faq,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateFaq(req, res, next) {
    try {
      const faq = await PublicationsService.updateFaq(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'FAQ entry updated successfully!',
        data: faq,
      });
    } catch (err) {
      next(err);
    }
  }

  static async publishFaq(req, res, next) {
    try {
      const faq = await PublicationsService.publishFaq(req.params.id);
      res.status(200).json({
        success: true,
        message: 'FAQ published successfully to public website!',
        data: faq,
      });
    } catch (err) {
      next(err);
    }
  }

  static async unpublishFaq(req, res, next) {
    try {
      const faq = await PublicationsService.unpublishFaq(req.params.id);
      res.status(200).json({
        success: true,
        message: 'FAQ unpublished and moved to Drafts.',
        data: faq,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteFaq(req, res, next) {
    try {
      await PublicationsService.deleteFaq(req.params.id);
      res.status(200).json({
        success: true,
        message: 'FAQ deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async reorderFaqs(req, res, next) {
    try {
      const result = await PublicationsService.reorderFaqs(req.body.items);
      res.status(200).json({
        success: true,
        message: 'FAQ display order updated successfully!',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // IMAGE ASSET UPLOAD
  // =========================================================================

  static async uploadImage(req, res, next) {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, message: 'Image data is required' });
      }
      const url = await PublicationsService.saveBase64Image(image, name);
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully!',
        url,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // PUBLIC APIS
  // =========================================================================

  static async listBlogsPublic(req, res, next) {
    try {
      const result = await PublicationsService.listBlogsPublic(req.query);
      res.status(200).json({
        success: true,
        data: result.blogs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBlogBySlugPublic(req, res, next) {
    try {
      const blog = await PublicationsService.getBlogBySlugPublic(req.params.slug);
      res.status(200).json({
        success: true,
        data: blog,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSitePagePublic(req, res, next) {
    try {
      const page = await PublicationsService.getSitePagePublic(req.params.slug);
      res.status(200).json({
        success: true,
        data: page,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listFaqsPublic(req, res, next) {
    try {
      const faqs = await PublicationsService.listFaqsPublic(req.query);
      res.status(200).json({
        success: true,
        data: faqs,
      });
    } catch (err) {
      next(err);
    }
  }
}
