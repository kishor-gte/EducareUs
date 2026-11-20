import { Router } from 'express';
import { PublicController } from '../controllers/public.controller.js';
import { PublicationsController } from '../controllers/publications.controller.js';
import { CoursesController } from '../controllers/courses.controller.js';
import { HomepageSectionsController } from '../controllers/homepageSections.controller.js';
import { ReviewsController } from '../controllers/reviews.controller.js';

const router = Router();

router.get('/stats', PublicController.getPlatformStats);
router.get('/courses/homepage', CoursesController.getHomepageCourses);
router.get('/courses', CoursesController.getHomepageCourses);
router.get('/courses/catalog', CoursesController.listCoursesPublic);
router.get('/courses/:slug', CoursesController.getCourseBySlugPublic);
router.get('/colleges', CoursesController.listCollegesPublic);
router.get('/colleges/:id', CoursesController.getCollegeByIdPublic);
router.get('/testimonials', PublicController.getTestimonials);
router.get('/reviews', ReviewsController.getHomepageReviews);
router.get('/reviews/my', ReviewsController.getMyReview);
router.post('/reviews', ReviewsController.submitReview);
router.get('/mentors', PublicController.getMentors);
router.post('/contact', PublicController.submitContact);
router.post('/visit', PublicController.recordVisit);
router.get('/visits', PublicController.getVisitCount);
router.get('/featured', PublicController.getFeaturedPrograms);
router.get('/locations/states', PublicController.getStates);
router.get('/locations/cities', PublicController.getCities);

// Public Publications Endpoints
router.get('/blogs', PublicationsController.listBlogsPublic);
router.get('/blogs/:slug', PublicationsController.getBlogBySlugPublic);
router.get('/pages/terms-and-conditions', (req, res, next) => {
  req.params.slug = 'terms-and-conditions';
  return PublicationsController.getSitePagePublic(req, res, next);
});
router.get('/pages/privacy-policy', (req, res, next) => {
  req.params.slug = 'privacy-policy';
  return PublicationsController.getSitePagePublic(req, res, next);
});
router.get('/pages/:slug', PublicationsController.getSitePagePublic);
router.get('/faqs', PublicationsController.listFaqsPublic);

// Public Homepage Dynamic Sections (About Us & Why Choose Us)
router.get('/homepage-sections/:key', HomepageSectionsController.getSectionPublic);

export default router;
