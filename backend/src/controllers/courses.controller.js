import CoursesService from '../services/courses.service.js';

export class CoursesController {
  // =========================================================================
  // ADMIN COURSE CONTROLLERS
  // =========================================================================

  static async listCoursesAdmin(req, res, next) {
    try {
      const result = await CoursesService.listCoursesAdmin(req.query);
      res.status(200).json({
        success: true,
        data: result.courses,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCourseByIdAdmin(req, res, next) {
    try {
      const course = await CoursesService.getCourseByIdAdmin(req.params.id);
      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createCourse(req, res, next) {
    try {
      const course = await CoursesService.createCourse(req.body);
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateCourse(req, res, next) {
    try {
      const course = await CoursesService.updateCourse(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: course,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteCourse(req, res, next) {
    try {
      await CoursesService.deleteCourse(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async publishCourse(req, res, next) {
    try {
      const course = await CoursesService.publishCourse(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Course published successfully',
        data: course,
      });
    } catch (err) {
      next(err);
    }
  }

  static async unpublishCourse(req, res, next) {
    try {
      const course = await CoursesService.unpublishCourse(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Course unpublished successfully',
        data: course,
      });
    } catch (err) {
      next(err);
    }
  }

  static async reorderCourses(req, res, next) {
    try {
      const result = await CoursesService.reorderCourses(req.body.orderUpdates);
      res.status(200).json({
        success: true,
        message: 'Courses reordered successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // ADMIN COLLEGE CONTROLLERS
  // =========================================================================

  static async listCollegesAdmin(req, res, next) {
    try {
      const result = await CoursesService.listCollegesAdmin(req.query);
      res.status(200).json({
        success: true,
        data: result.colleges,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCollegeByIdAdmin(req, res, next) {
    try {
      const college = await CoursesService.getCollegeByIdAdmin(req.params.id);
      res.status(200).json({
        success: true,
        data: college,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createCollege(req, res, next) {
    try {
      const college = await CoursesService.createCollege(req.body);
      res.status(201).json({
        success: true,
        message: 'College created successfully',
        data: college,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateCollege(req, res, next) {
    try {
      const college = await CoursesService.updateCollege(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'College updated successfully',
        data: college,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteCollege(req, res, next) {
    try {
      await CoursesService.deleteCollege(req.params.id);
      res.status(200).json({
        success: true,
        message: 'College deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // PUBLIC CONTROLLERS
  // =========================================================================

  static async getHomepageCourses(req, res, next) {
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

  static async listCoursesPublic(req, res, next) {
    try {
      const result = await CoursesService.listCoursesPublic(req.query);
      res.status(200).json({
        success: true,
        data: result.courses,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCourseBySlugPublic(req, res, next) {
    try {
      const course = await CoursesService.getCourseBySlugPublic(req.params.slug);
      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listCollegesPublic(req, res, next) {
    try {
      const colleges = await CoursesService.listCollegesPublic(req.query);
      res.status(200).json({
        success: true,
        data: colleges,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCollegeByIdPublic(req, res, next) {
    try {
      const college = await CoursesService.getCollegeByIdPublic(req.params.id);
      res.status(200).json({
        success: true,
        data: college,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default CoursesController;
