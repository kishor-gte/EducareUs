import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

// Helper: slugify text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// Generate unique slug for courses
async function generateUniqueCourseSlug(name, currentId = null) {
  let baseSlug = slugify(name) || 'course';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Basic HTML sanitizer for rich-text
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'])?[^"'>]+(\1)?/gi, '')
    .replace(/javascript:[^"'>]+/gi, '');
}

// Save Base64 image
async function saveBase64Image(dataUri, preferredName = 'course', subfolder = 'courses') {
  if (!dataUri || typeof dataUri !== 'string') {
    return null;
  }

  // If already an HTTP URL or local static path, return as is
  if (
    dataUri.startsWith('http://') ||
    dataUri.startsWith('https://') ||
    dataUri.startsWith('/uploads/') ||
    dataUri.startsWith('/pdf-extracted/')
  ) {
    return dataUri;
  }

  const matches = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches) {
    const err = new Error('Invalid base64 image data URI');
    err.statusCode = 400;
    throw err;
  }

  const ext = matches[1].toLowerCase().replace('jpeg', 'jpg');
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadsDir = path.join(process.cwd(), 'uploads', subfolder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const cleanBaseName = slugify(preferredName).slice(0, 30) || 'asset';
  const filename = `${cleanBaseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/${subfolder}/${filename}`;
}

export class CoursesService {
  // =========================================================================
  // 1. COURSES MANAGEMENT (ADMIN)
  // =========================================================================

  static async listCoursesAdmin({ search, category, status, showOnHomepage, page = 1, limit = 10 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (status && status !== 'ALL') {
      where.publicationStatus = status;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (showOnHomepage !== undefined && showOnHomepage !== 'ALL' && showOnHomepage !== '') {
      where.showOnHomepage = showOnHomepage === 'true' || showOnHomepage === true;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { institutionDisplayText: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          colleges: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
        },
      }),
    ]);

    return {
      courses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  static async getCourseByIdAdmin(id) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        colleges: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    return course;
  }

  static async createCourse(data) {
    const {
      name,
      fullName,
      slug: customSlug,
      category,
      duration,
      shortDescription,
      detailedDescription,
      imageUrl,
      imageAlt,
      institutionDisplayText,
      buttonText,
      buttonDestination,
      showOnHomepage,
      isFeatured,
      displayOrder,
      publicationStatus = 'DRAFT',
      collegeIds = [],
    } = data;

    if (!name || !name.trim()) {
      const err = new Error('Course name is required');
      err.statusCode = 400;
      throw err;
    }
    if (!category || !category.trim()) {
      const err = new Error('Category is required');
      err.statusCode = 400;
      throw err;
    }
    if (!duration || !duration.trim()) {
      const err = new Error('Duration is required');
      err.statusCode = 400;
      throw err;
    }
    if (!shortDescription || !shortDescription.trim()) {
      const err = new Error('Short description is required');
      err.statusCode = 400;
      throw err;
    }

    const finalSlug = customSlug && customSlug.trim()
      ? slugify(customSlug)
      : await generateUniqueCourseSlug(name);

    // Check if custom slug already taken
    const existingSlug = await prisma.course.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      const err = new Error(`Slug "${finalSlug}" is already in use by another course`);
      err.statusCode = 400;
      throw err;
    }

    // Process image
    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      finalImageUrl = await saveBase64Image(imageUrl, name, 'courses');
    }

    const sanitizedDetailed = sanitizeHtml(detailedDescription);
    const isPublished = publicationStatus === 'PUBLISHED';

    return prisma.course.create({
      data: {
        name: name.trim(),
        fullName: fullName ? fullName.trim() : null,
        slug: finalSlug,
        category: category.trim(),
        duration: duration.trim(),
        shortDescription: shortDescription.trim(),
        detailedDescription: sanitizedDetailed,
        draftContent: sanitizedDetailed,
        publishedContent: isPublished ? sanitizedDetailed || shortDescription.trim() : null,
        imageUrl: finalImageUrl,
        imageAlt: imageAlt || name.trim(),
        institutionDisplayText: institutionDisplayText ? institutionDisplayText.trim() : null,
        buttonText: buttonText ? buttonText.trim() : `Explore ${name.trim()} Guidance`,
        buttonDestination: buttonDestination ? buttonDestination.trim() : `/courses/${finalSlug}`,
        showOnHomepage: Boolean(showOnHomepage),
        isFeatured: Boolean(isFeatured),
        displayOrder: Number(displayOrder) || 0,
        publicationStatus,
        publishedAt: isPublished ? new Date() : null,
        colleges: Array.isArray(collegeIds) && collegeIds.length > 0
          ? { connect: collegeIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        colleges: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
    });
  }

  static async updateCourse(id, data) {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    const {
      name,
      fullName,
      slug: customSlug,
      category,
      duration,
      shortDescription,
      detailedDescription,
      imageUrl,
      imageAlt,
      institutionDisplayText,
      buttonText,
      buttonDestination,
      showOnHomepage,
      isFeatured,
      displayOrder,
      publicationStatus,
      collegeIds,
    } = data;

    let finalSlug = existing.slug;
    if (customSlug && customSlug.trim() && customSlug !== existing.slug) {
      finalSlug = slugify(customSlug);
      const conflict = await prisma.course.findUnique({ where: { slug: finalSlug } });
      if (conflict && conflict.id !== id) {
        const err = new Error(`Slug "${finalSlug}" is already taken`);
        err.statusCode = 400;
        throw err;
      }
    }

    let finalImageUrl = existing.imageUrl;
    if (imageUrl !== undefined) {
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        finalImageUrl = await saveBase64Image(imageUrl, name || existing.name, 'courses');
      } else {
        finalImageUrl = imageUrl;
      }
    }

    const sanitizedDetailed = detailedDescription !== undefined
      ? sanitizeHtml(detailedDescription)
      : existing.detailedDescription;

    const nextStatus = publicationStatus || existing.publicationStatus;
    const isNowPublished = nextStatus === 'PUBLISHED';

    let publishedContent = existing.publishedContent;
    let publishedAt = existing.publishedAt;

    if (isNowPublished) {
      publishedContent = sanitizedDetailed || shortDescription || existing.shortDescription;
      if (!existing.publishedAt) {
        publishedAt = new Date();
      }
    }

    const updateData = {
      ...(name !== undefined && { name: name.trim() }),
      ...(fullName !== undefined && { fullName: fullName ? fullName.trim() : null }),
      slug: finalSlug,
      ...(category !== undefined && { category: category.trim() }),
      ...(duration !== undefined && { duration: duration.trim() }),
      ...(shortDescription !== undefined && { shortDescription: shortDescription.trim() }),
      detailedDescription: sanitizedDetailed,
      draftContent: sanitizedDetailed,
      publishedContent,
      imageUrl: finalImageUrl,
      ...(imageAlt !== undefined && { imageAlt }),
      ...(institutionDisplayText !== undefined && { institutionDisplayText: institutionDisplayText ? institutionDisplayText.trim() : null }),
      ...(buttonText !== undefined && { buttonText: buttonText ? buttonText.trim() : `Explore ${name || existing.name} Guidance` }),
      ...(buttonDestination !== undefined && { buttonDestination: buttonDestination ? buttonDestination.trim() : `/courses/${finalSlug}` }),
      ...(showOnHomepage !== undefined && { showOnHomepage: Boolean(showOnHomepage) }),
      ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) || 0 }),
      publicationStatus: nextStatus,
      publishedAt,
    };

    if (Array.isArray(collegeIds)) {
      updateData.colleges = {
        set: collegeIds.map((cId) => ({ id: cId })),
      };
    }

    return prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        colleges: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
    });
  }

  static async publishCourse(id) {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.course.update({
      where: { id },
      data: {
        publicationStatus: 'PUBLISHED',
        publishedContent: existing.detailedDescription || existing.shortDescription,
        publishedAt: new Date(),
      },
      include: {
        colleges: true,
      },
    });
  }

  static async unpublishCourse(id) {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.course.update({
      where: { id },
      data: {
        publicationStatus: 'DRAFT',
      },
    });
  }

  static async reorderCourses(orderUpdates = []) {
    if (!Array.isArray(orderUpdates) || orderUpdates.length === 0) {
      const err = new Error('orderUpdates must be an array of { id, displayOrder }');
      err.statusCode = 400;
      throw err;
    }

    const operations = orderUpdates.map(({ id, displayOrder }) =>
      prisma.course.update({
        where: { id },
        data: { displayOrder: Number(displayOrder) || 0 },
      })
    );

    await prisma.$transaction(operations);
    return { success: true, count: operations.length };
  }

  static async deleteCourse(id) {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.course.delete({ where: { id } });
  }

  // =========================================================================
  // 2. COLLEGES MANAGEMENT (ADMIN)
  // =========================================================================

  static async listCollegesAdmin({ search, status, page = 1, limit = 10 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
        { institutionType: { contains: q, mode: 'insensitive' } },
        { universityAffiliation: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, colleges] = await Promise.all([
      prisma.college.count({ where }),
      prisma.college.findMany({
        where,
        skip,
        take,
        orderBy: [{ name: 'asc' }],
        include: {
          courses: {
            select: {
              id: true,
              name: true,
              category: true,
              publicationStatus: true,
            },
          },
        },
      }),
    ]);

    return {
      colleges,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  static async getCollegeByIdAdmin(id) {
    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            duration: true,
            publicationStatus: true,
          },
        },
      },
    });

    if (!college) {
      const err = new Error('College not found');
      err.statusCode = 404;
      throw err;
    }

    return college;
  }

  static async createCollege(data) {
    const {
      name,
      logoUrl,
      imageUrl,
      city,
      state,
      country = 'India',
      institutionType,
      universityAffiliation,
      description,
      websiteUrl,
      status = 'ACTIVE',
      courseIds = [],
    } = data;

    if (!name || !name.trim()) {
      const err = new Error('College name is required');
      err.statusCode = 400;
      throw err;
    }

    let finalLogoUrl = logoUrl;
    if (logoUrl && logoUrl.startsWith('data:image/')) {
      finalLogoUrl = await saveBase64Image(logoUrl, `${name}-logo`, 'colleges');
    }

    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      finalImageUrl = await saveBase64Image(imageUrl, `${name}-campus`, 'colleges');
    }

    return prisma.college.create({
      data: {
        name: name.trim(),
        logoUrl: finalLogoUrl,
        imageUrl: finalImageUrl,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        country: country ? country.trim() : 'India',
        institutionType: institutionType ? institutionType.trim() : null,
        universityAffiliation: universityAffiliation ? universityAffiliation.trim() : null,
        description: description ? description.trim() : null,
        websiteUrl: websiteUrl ? websiteUrl.trim() : null,
        status,
        courses: Array.isArray(courseIds) && courseIds.length > 0
          ? { connect: courseIds.map((cId) => ({ id: cId })) }
          : undefined,
      },
      include: {
        courses: {
          select: { id: true, name: true },
        },
      },
    });
  }

  static async updateCollege(id, data) {
    const existing = await prisma.college.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('College not found');
      err.statusCode = 404;
      throw err;
    }

    const {
      name,
      logoUrl,
      imageUrl,
      city,
      state,
      country,
      institutionType,
      universityAffiliation,
      description,
      websiteUrl,
      status,
      courseIds,
    } = data;

    let finalLogoUrl = existing.logoUrl;
    if (logoUrl !== undefined) {
      if (logoUrl && logoUrl.startsWith('data:image/')) {
        finalLogoUrl = await saveBase64Image(logoUrl, `${name || existing.name}-logo`, 'colleges');
      } else {
        finalLogoUrl = logoUrl;
      }
    }

    let finalImageUrl = existing.imageUrl;
    if (imageUrl !== undefined) {
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        finalImageUrl = await saveBase64Image(imageUrl, `${name || existing.name}-campus`, 'colleges');
      } else {
        finalImageUrl = imageUrl;
      }
    }

    const updateData = {
      ...(name !== undefined && { name: name.trim() }),
      logoUrl: finalLogoUrl,
      imageUrl: finalImageUrl,
      ...(city !== undefined && { city: city ? city.trim() : null }),
      ...(state !== undefined && { state: state ? state.trim() : null }),
      ...(country !== undefined && { country: country ? country.trim() : 'India' }),
      ...(institutionType !== undefined && { institutionType: institutionType ? institutionType.trim() : null }),
      ...(universityAffiliation !== undefined && { universityAffiliation: universityAffiliation ? universityAffiliation.trim() : null }),
      ...(description !== undefined && { description: description ? description.trim() : null }),
      ...(websiteUrl !== undefined && { websiteUrl: websiteUrl ? websiteUrl.trim() : null }),
      ...(status !== undefined && { status }),
    };

    if (Array.isArray(courseIds)) {
      updateData.courses = {
        set: courseIds.map((cId) => ({ id: cId })),
      };
    }

    return prisma.college.update({
      where: { id },
      data: updateData,
      include: {
        courses: {
          select: { id: true, name: true },
        },
      },
    });
  }

  static async deleteCollege(id) {
    const existing = await prisma.college.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('College not found');
      err.statusCode = 404;
      throw err;
    }

    // Safely delete college without deleting course records
    return prisma.college.delete({ where: { id } });
  }

  // =========================================================================
  // 3. PUBLIC HOMEPAGE & CATALOG APIS
  // =========================================================================

  /**
   * CRITICAL REQUIREMENT:
   * Homepage API must return ONLY published courses where:
   * - publicationStatus = PUBLISHED
   * - showOnHomepage = true
   * - publishedContent is not null (or shortDescription exists)
   * Sorted strictly by displayOrder ascending, then createdAt descending.
   * NEVER returns hardcoded, fake, or sample courses.
   */
  static async getHomepageCourses() {
    const courses = await prisma.course.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        showOnHomepage: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        colleges: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });

    // Map to the exact frontend card shape expected by the homepage carousel
    return courses.map((c) => {
      let collegeText = c.institutionDisplayText;
      if (!collegeText && c.colleges && c.colleges.length > 0) {
        collegeText = c.colleges.map((col) => col.name).join(', ');
      }
      if (!collegeText) {
        collegeText = 'Recognized Universities & Colleges';
      }

      return {
        id: c.id,
        slug: c.slug,
        title: c.name,
        fullName: c.fullName || c.name,
        category: c.category,
        image: c.imageUrl || '/pdf-extracted/img_16_58909.jpg',
        imageAlt: c.imageAlt || c.name,
        duration: c.duration,
        colleges: collegeText,
        desc: c.shortDescription,
        actionText: c.buttonText || `Explore ${c.name} Guidance`,
        destination: c.buttonDestination || `/courses/${c.slug}`,
        isFeatured: c.isFeatured,
        displayOrder: c.displayOrder,
      };
    });
  }

  static async listCoursesPublic({ search, category, page = 1, limit = 12 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      publicationStatus: 'PUBLISHED',
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          colleges: {
            select: { id: true, name: true, city: true, state: true, logoUrl: true },
          },
        },
      }),
    ]);

    return {
      courses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  static async getCourseBySlugPublic(slug) {
    const course = await prisma.course.findFirst({
      where: {
        slug,
        publicationStatus: 'PUBLISHED',
      },
      include: {
        colleges: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            logoUrl: true,
            imageUrl: true,
            institutionType: true,
            universityAffiliation: true,
            websiteUrl: true,
            description: true,
          },
        },
      },
    });

    if (!course) {
      const err = new Error('Course not found or is unpublished');
      err.statusCode = 404;
      throw err;
    }

    return {
      ...course,
      content: course.publishedContent || course.detailedDescription || course.shortDescription,
    };
  }

  static async listCollegesPublic({ search, city, state, limit = 50 }) {
    const where = { status: 'ACTIVE' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { universityAffiliation: { contains: q, mode: 'insensitive' } },
      ];
    }

    return prisma.college.findMany({
      where,
      take: Number(limit),
      orderBy: [{ name: 'asc' }],
      include: {
        courses: {
          where: { publicationStatus: 'PUBLISHED' },
          select: { id: true, name: true, slug: true, category: true, duration: true },
        },
      },
    });
  }

  static async getCollegeByIdPublic(id) {
    const college = await prisma.college.findFirst({
      where: { id, status: 'ACTIVE' },
      include: {
        courses: {
          where: { publicationStatus: 'PUBLISHED' },
          select: { id: true, name: true, slug: true, category: true, duration: true, imageUrl: true },
        },
      },
    });

    if (!college) {
      const err = new Error('College not found');
      err.statusCode = 404;
      throw err;
    }

    return college;
  }
}

export default CoursesService;
