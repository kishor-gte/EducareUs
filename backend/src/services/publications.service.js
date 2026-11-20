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

// Ensure unique slug for blogs
async function generateUniqueBlogSlug(title, currentId = null) {
  let baseSlug = slugify(title) || 'blog-post';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Helper: Basic HTML sanitizer to prevent malicious script injection in rich text
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  // Strip <script> tags and onerror/javascript: pseudo protocols
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'])?[^"'>]+(\1)?/gi, '')
    .replace(/javascript:[^"'>]+/gi, '');
}

export class PublicationsService {
  // =========================================================================
  // 1. BLOGS MANAGEMENT
  // =========================================================================

  static async listBlogsAdmin({ search, category, status, page = 1, limit = 10 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { authorName: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, blogs] = await Promise.all([
      prisma.blog.count({ where }),
      prisma.blog.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          author: { select: { id: true, fullName: true, email: true } },
        },
      }),
    ]);

    return {
      blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  static async getBlogById(id) {
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!blog) {
      const err = new Error('Blog not found');
      err.statusCode = 404;
      throw err;
    }
    return blog;
  }

  static async createBlog(data, adminUser) {
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category,
      tags,
      coverImage,
      coverImageAlt,
      metaTitle,
      metaDescription,
      canonicalUrl,
      status = 'DRAFT',
      isFeatured = false,
      publishNow = false,
    } = data;

    if (!title || !title.trim()) {
      const err = new Error('Blog title is required');
      err.statusCode = 400;
      throw err;
    }
    if (!excerpt || !excerpt.trim()) {
      const err = new Error('Short description/excerpt is required');
      err.statusCode = 400;
      throw err;
    }
    if (!content || !content.trim()) {
      const err = new Error('Blog content is required');
      err.statusCode = 400;
      throw err;
    }

    const finalSlug = customSlug && customSlug.trim()
      ? slugify(customSlug)
      : await generateUniqueBlogSlug(title);

    // Verify slug uniqueness
    const existing = await prisma.blog.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      const err = new Error(`Slug "${finalSlug}" is already taken. Please choose another.`);
      err.statusCode = 409;
      throw err;
    }

    const cleanContent = sanitizeHtml(content);
    const finalStatus = publishNow ? 'PUBLISHED' : status;
    const isPublished = finalStatus === 'PUBLISHED';

    const blog = await prisma.blog.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content: cleanContent,
        publishedContent: isPublished ? cleanContent : null,
        category: category?.trim() || 'General',
        tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        authorName: adminUser?.fullName || 'EducareUs Editorial Team',
        authorId: adminUser?.id || null,
        coverImage: coverImage || null,
        coverImageAlt: coverImageAlt?.trim() || title.trim(),
        metaTitle: metaTitle?.trim() || title.trim(),
        metaDescription: metaDescription?.trim() || excerpt.trim(),
        canonicalUrl: canonicalUrl?.trim() || null,
        status: finalStatus,
        isFeatured: Boolean(isFeatured),
        publishedAt: isPublished ? new Date() : null,
      },
      include: {
        author: { select: { id: true, fullName: true, email: true } },
      },
    });

    return blog;
  }

  static async updateBlog(id, data, adminUser) {
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Blog not found');
      err.statusCode = 404;
      throw err;
    }

    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category,
      tags,
      coverImage,
      coverImageAlt,
      metaTitle,
      metaDescription,
      canonicalUrl,
      status,
      isFeatured,
      publishNow,
    } = data;

    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt.trim();

    if (customSlug && customSlug.trim()) {
      const cleanSlug = slugify(customSlug);
      if (cleanSlug !== existing.slug) {
        const slugExists = await prisma.blog.findUnique({ where: { slug: cleanSlug } });
        if (slugExists && slugExists.id !== id) {
          const err = new Error(`Slug "${cleanSlug}" is already taken by another blog.`);
          err.statusCode = 409;
          throw err;
        }
        updateData.slug = cleanSlug;
      }
    }

    if (content !== undefined) {
      updateData.content = sanitizeHtml(content);
    }
    if (category !== undefined) updateData.category = category.trim();
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    }
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (coverImageAlt !== undefined) updateData.coverImageAlt = coverImageAlt?.trim();
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle?.trim();
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription?.trim();
    if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl?.trim();
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);

    // If admin explicitly requested publishNow, snapshot draft content to publishedContent
    if (publishNow || status === 'PUBLISHED') {
      updateData.status = 'PUBLISHED';
      updateData.publishedContent = updateData.content !== undefined ? updateData.content : existing.content;
      if (!existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    } else if (status) {
      updateData.status = status;
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, fullName: true, email: true } },
      },
    });

    return updated;
  }

  static async publishBlog(id) {
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Blog not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.blog.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedContent: existing.content,
        publishedAt: existing.publishedAt || new Date(),
      },
    });
  }

  static async unpublishBlog(id) {
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Blog not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.blog.update({
      where: { id },
      data: {
        status: 'DRAFT',
      },
    });
  }

  static async deleteBlog(id) {
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Blog not found');
      err.statusCode = 404;
      throw err;
    }

    return prisma.blog.delete({ where: { id } });
  }

  static async listBlogsPublic({ search, category, page = 1, limit = 9, featured }) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      status: 'PUBLISHED',
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (featured === 'true' || featured === true) {
      where.isFeatured = true;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { authorName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, blogs] = await Promise.all([
      prisma.blog.count({ where }),
      prisma.blog.findMany({
        where,
        skip,
        take,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedContent: true,
          category: true,
          tags: true,
          authorName: true,
          coverImage: true,
          coverImageAlt: true,
          isFeatured: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
    ]);

    // Format content for public response
    const formatted = blogs.map((b) => ({
      ...b,
      content: b.publishedContent || b.excerpt,
    }));

    return {
      blogs: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  static async getBlogBySlugPublic(slug) {
    const blog = await prisma.blog.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedContent: true,
        category: true,
        tags: true,
        authorName: true,
        coverImage: true,
        coverImageAlt: true,
        metaTitle: true,
        metaDescription: true,
        canonicalUrl: true,
        isFeatured: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!blog) {
      const err = new Error('Blog article not found or is unpublished');
      err.statusCode = 404;
      throw err;
    }

    return {
      ...blog,
      content: blog.publishedContent || blog.excerpt,
    };
  }

  // =========================================================================
  // 2. SITE PAGES (TERMS & CONDITIONS, PRIVACY POLICY)
  // =========================================================================

  static async getOrCreateSitePage(slug, defaultTitle = '') {
    const validSlugs = ['terms-and-conditions', 'privacy-policy'];
    if (!validSlugs.includes(slug)) {
      const err = new Error('Invalid site page slug requested');
      err.statusCode = 400;
      throw err;
    }

    let page = await prisma.sitePage.findUnique({
      where: { slug },
      include: {
        revisions: {
          orderBy: { publishedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!page) {
      const isTerms = slug === 'terms-and-conditions';
      const initialTitle = defaultTitle || (isTerms ? 'Terms & Conditions' : 'Privacy Policy');
      const initialIntro = isTerms
        ? 'Welcome to EducareUs (Educarrus Education Foundation). These Terms and Conditions govern your access to and use of our higher education scholarship crowdfunding and student admission consultancy platform.'
        : 'EducareUs is committed to protecting the privacy, personal data, and rights of our student beneficiaries, donor partners, and platform visitors.';

      const initialContent = isTerms ? getDefaultTermsContent() : getDefaultPrivacyContent();

      page = await prisma.sitePage.create({
        data: {
          slug,
          title: initialTitle,
          introduction: initialIntro,
          content: initialContent,
          publishedContent: initialContent,
          effectiveDate: new Date().toISOString().split('T')[0],
          version: '1.0',
          metaTitle: `${initialTitle} — EduCareus Education Foundation`,
          metaDescription: initialIntro.slice(0, 155),
          status: 'PUBLISHED',
          lastUpdatedBy: 'System Administrator',
          publishedAt: new Date(),
        },
        include: {
          revisions: true,
        },
      });

      // Create initial revision
      await prisma.pageRevision.create({
        data: {
          pageId: page.id,
          version: '1.0',
          title: initialTitle,
          introduction: initialIntro,
          content: initialContent,
          effectiveDate: page.effectiveDate,
          publishedBy: 'System Administrator',
        },
      });
    }

    return page;
  }

  static async updateSitePageDraft(slug, data, adminUser) {
    const page = await this.getOrCreateSitePage(slug);

    const {
      title,
      introduction,
      content,
      effectiveDate,
      version,
      metaTitle,
      metaDescription,
      status,
    } = data;

    const updateData = {
      lastUpdatedBy: adminUser?.fullName || 'Administrator',
      lastUpdatedById: adminUser?.id || null,
    };

    if (title !== undefined) updateData.title = title.trim();
    if (introduction !== undefined) updateData.introduction = introduction.trim();
    if (content !== undefined) updateData.content = sanitizeHtml(content);
    if (effectiveDate !== undefined) updateData.effectiveDate = effectiveDate;
    if (version !== undefined) updateData.version = version.trim();
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle?.trim();
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription?.trim();
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.sitePage.update({
      where: { id: page.id },
      data: updateData,
      include: {
        revisions: {
          orderBy: { publishedAt: 'desc' },
          take: 10,
        },
      },
    });

    return updated;
  }

  static async publishSitePage(slug, data = {}, adminUser) {
    const page = await this.getOrCreateSitePage(slug);

    const title = data.title?.trim() || page.title;
    const introduction = data.introduction?.trim() || page.introduction;
    const content = data.content ? sanitizeHtml(data.content) : page.content;
    const effectiveDate = data.effectiveDate || page.effectiveDate || new Date().toISOString().split('T')[0];
    const newVersion = data.version?.trim() || incrementVersion(page.version);

    // 1. Update active page
    const updated = await prisma.sitePage.update({
      where: { id: page.id },
      data: {
        title,
        introduction,
        content,
        publishedContent: content,
        effectiveDate,
        version: newVersion,
        metaTitle: data.metaTitle?.trim() || `${title} — EduCareus`,
        metaDescription: data.metaDescription?.trim() || introduction?.slice(0, 155),
        status: 'PUBLISHED',
        publishedAt: new Date(),
        lastUpdatedBy: adminUser?.fullName || 'Administrator',
        lastUpdatedById: adminUser?.id || null,
      },
    });

    // 2. Record immutable revision entry
    await prisma.pageRevision.create({
      data: {
        pageId: page.id,
        version: newVersion,
        title,
        introduction,
        content,
        effectiveDate,
        publishedBy: adminUser?.fullName || 'Administrator',
        publishedById: adminUser?.id || null,
      },
    });

    return this.getOrCreateSitePage(slug);
  }

  static async unpublishSitePage(slug) {
    const page = await this.getOrCreateSitePage(slug);
    return prisma.sitePage.update({
      where: { id: page.id },
      data: { status: 'DRAFT' },
    });
  }

  static async getSitePageRevisions(slug) {
    const page = await this.getOrCreateSitePage(slug);
    return prisma.pageRevision.findMany({
      where: { pageId: page.id },
      orderBy: { publishedAt: 'desc' },
      include: {
        publisher: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  static async getSitePagePublic(slug) {
    const page = await prisma.sitePage.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      select: {
        title: true,
        slug: true,
        introduction: true,
        publishedContent: true,
        effectiveDate: true,
        version: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!page) {
      // If not seeded yet, seed and return default
      const seeded = await this.getOrCreateSitePage(slug);
      return {
        title: seeded.title,
        slug: seeded.slug,
        introduction: seeded.introduction,
        publishedContent: seeded.publishedContent || seeded.content,
        effectiveDate: seeded.effectiveDate,
        version: seeded.version,
        metaTitle: seeded.metaTitle,
        metaDescription: seeded.metaDescription,
        publishedAt: seeded.publishedAt,
        updatedAt: seeded.updatedAt,
      };
    }

    return {
      ...page,
      content: page.publishedContent,
    };
  }

  // =========================================================================
  // 3. FAQS MANAGEMENT
  // =========================================================================

  static async listFaqsAdmin({ category, status, search }) {
    const where = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { question: { contains: q, mode: 'insensitive' } },
        { answer: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    return faqs;
  }

  static async getFaqById(id) {
    const faq = await prisma.fAQ.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!faq) {
      const err = new Error('FAQ item not found');
      err.statusCode = 404;
      throw err;
    }
    return faq;
  }

  static async createFaq(data, adminUser) {
    const { question, answer, category = 'General', displayOrder = 0, status = 'PUBLISHED' } = data;

    if (!question || !question.trim()) {
      const err = new Error('FAQ Question is required');
      err.statusCode = 400;
      throw err;
    }
    if (!answer || !answer.trim()) {
      const err = new Error('FAQ Answer is required');
      err.statusCode = 400;
      throw err;
    }

    return prisma.fAQ.create({
      data: {
        question: question.trim(),
        answer: sanitizeHtml(answer),
        category: category.trim(),
        displayOrder: Number(displayOrder) || 0,
        status,
        createdById: adminUser?.id || null,
      },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  static async updateFaq(id, data) {
    const existing = await prisma.fAQ.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('FAQ item not found');
      err.statusCode = 404;
      throw err;
    }

    const { question, answer, category, displayOrder, status } = data;
    const updateData = {};

    if (question !== undefined) updateData.question = question.trim();
    if (answer !== undefined) updateData.answer = sanitizeHtml(answer);
    if (category !== undefined) updateData.category = category.trim();
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
    if (status !== undefined) updateData.status = status;

    return prisma.fAQ.update({
      where: { id },
      data: updateData,
    });
  }

  static async publishFaq(id) {
    const existing = await prisma.fAQ.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('FAQ item not found');
      err.statusCode = 404;
      throw err;
    }
    return prisma.fAQ.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  static async unpublishFaq(id) {
    const existing = await prisma.fAQ.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('FAQ item not found');
      err.statusCode = 404;
      throw err;
    }
    return prisma.fAQ.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }

  static async deleteFaq(id) {
    const existing = await prisma.fAQ.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('FAQ item not found');
      err.statusCode = 404;
      throw err;
    }
    return prisma.fAQ.delete({ where: { id } });
  }

  static async reorderFaqs(items) {
    if (!Array.isArray(items)) {
      const err = new Error('Items must be an array of { id, displayOrder }');
      err.statusCode = 400;
      throw err;
    }

    const updates = items.map((item) =>
      prisma.fAQ.update({
        where: { id: item.id },
        data: { displayOrder: Number(item.displayOrder) || 0 },
      })
    );

    await prisma.$transaction(updates);
    return { success: true, count: updates.length };
  }

  static async listFaqsPublic({ category, search }) {
    const where = {
      status: 'PUBLISHED',
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { question: { contains: q, mode: 'insensitive' } },
        { answer: { contains: q, mode: 'insensitive' } },
      ];
    }

    let faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        displayOrder: true,
      },
    });

    // If zero FAQs exist, auto-seed defaults from existing knowledge base
    if (faqs.length === 0 && !search && (!category || category === 'ALL')) {
      await this.seedDefaultFaqs();
      faqs = await prisma.fAQ.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ displayOrder: 'asc' }],
        select: {
          id: true,
          question: true,
          answer: true,
          category: true,
          displayOrder: true,
        },
      });
    }

    return faqs;
  }

  // =========================================================================
  // 4. IMAGE UPLOAD & ASSET MANAGEMENT
  // =========================================================================

  static async saveBase64Image(dataUri, preferredName = 'publication') {
    if (!dataUri || typeof dataUri !== 'string') {
      const err = new Error('Valid image data is required');
      err.statusCode = 400;
      throw err;
    }

    // Match data URI pattern
    const matches = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches) {
      // If already a valid URL, return as is
      if (dataUri.startsWith('http://') || dataUri.startsWith('https://') || dataUri.startsWith('/uploads/')) {
        return dataUri;
      }
      const err = new Error('Invalid base64 image data URI');
      err.statusCode = 400;
      throw err;
    }

    const ext = matches[1].toLowerCase().replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadsDir = path.join(process.cwd(), 'uploads', 'publications');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanBaseName = slugify(preferredName).slice(0, 30) || 'image';
    const filename = `${cleanBaseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    return `/uploads/publications/${filename}`;
  }

  // =========================================================================
  // SEED DEFAULTS
  // =========================================================================

  static async seedDefaultFaqs() {
    const defaults = [
      {
        question: 'Which courses does Educarrus help students with?',
        answer: 'Educarrus provides complete admission guidance and scholarship assistance across Medical (MBBS/BDS), Engineering (B.Tech/BE), Pharmacy (B.Pharm), Ayurveda (BAMS), Management (MBA/BBA), and other recognized professional degree programs across India.',
        category: 'Education',
        displayOrder: 1,
      },
      {
        question: 'Can you help me choose the right course based on my profile?',
        answer: 'Yes, absolutely! Our 1-on-1 career counselling evaluates your Class 12 marks, entrance exam scores (NEET/JEE/CET), personal interests, and long-term career goals to suggest optimal degree pathways.',
        category: 'Student Registration',
        displayOrder: 2,
      },
      {
        question: 'Do you assist with college selection and shortlisting?',
        answer: 'Yes. We help students shortlist recognized and accredited colleges based on academic cutoff, budget expectations, campus infrastructure, hostel safety, and placement track record.',
        category: 'Education',
        displayOrder: 3,
      },
      {
        question: 'How does the scholarship crowdfunding process work?',
        answer: 'Students register, verify their academic credentials and college fee structures with our verification team. Once approved, campaigns receive zero-commission crowdfunding from verified donors, and 100% of collected fees are disbursed directly to institutional accounts.',
        category: 'Scholarships',
        displayOrder: 4,
      },
      {
        question: 'Are donations eligible for tax exemption under Section 80G?',
        answer: 'Yes, every donor receives an instant verifiable Section 80G tax exemption receipt upon successful completion of their contribution via Razorpay.',
        category: 'Donations',
        displayOrder: 5,
      },
      {
        question: 'Can parents participate in the counselling session?',
        answer: 'We strongly encourage parents to join all counselling sessions! College selection is a major family decision, and we address all parental concerns regarding fees, safety, and recognition.',
        category: 'General',
        displayOrder: 6,
      },
      {
        question: 'Is counselling available both online and offline?',
        answer: 'Yes! We offer face-to-face counselling at our main office as well as seamless online video calls and phone consultations for students and families across India.',
        category: 'General',
        displayOrder: 7,
      },
      {
        question: 'How do I raise a support ticket or track my application?',
        answer: 'Registered students can open their Student Dashboard at any time, navigate to the Support tab, submit a ticket, and track live updates from our academic advisory team.',
        category: 'Technical Support',
        displayOrder: 8,
      },
    ];

    for (const item of defaults) {
      await prisma.fAQ.create({
        data: {
          ...item,
          status: 'PUBLISHED',
        },
      });
    }
  }
}

// Version increment utility (e.g. "1.0" -> "1.1")
function incrementVersion(ver = '1.0') {
  try {
    const parts = ver.split('.');
    if (parts.length === 2) {
      return `${parts[0]}.${parseInt(parts[1], 10) + 1}`;
    }
    return '1.1';
  } catch {
    return '1.1';
  }
}

// Default Rich Content templates
function getDefaultTermsContent() {
  return `
<h2>1. Introduction</h2>
<p>These Terms &amp; Conditions ("Terms") govern your access to and use of the <strong>EducareUs</strong> platform (accessible via educarrus.org and related subdomains), operated by Educarrus Education Foundation. By creating an account, donating, or submitting an application, you agree to be bound by these Terms.</p>

<h2>2. Eligibility and User Accounts</h2>
<p>To register as a student scholar or donor, you must provide true, accurate, and current identity details. Users under 18 years of age must participate with parental or guardian consent.</p>
<ul>
  <li><strong>Beneficiaries:</strong> Must submit genuine academic transcripts, fee structures, and identity credentials.</li>
  <li><strong>Donors:</strong> Must utilize authorized payment methods. All contributions are subject to anti-money laundering and Section 80G compliance.</li>
  <li><strong>Account Security:</strong> You are responsible for safeguarding your login credentials.</li>
</ul>

<h2>3. User Responsibilities &amp; Verification</h2>
<p>All student beneficiaries agree to undergo our multi-tier verification process (including Aadhaar, College ID, and Fee Invoices). Providing fraudulent information will result in immediate suspension, account termination, and notification to relevant educational authorities.</p>

<h2>4. Educational &amp; Counselling Services</h2>
<p>Educarrus provides guidance, counselling, and college shortlisting. While our advisors use their highest expertise and verified historical cutoffs, admission outcomes remain subject to official university selection boards, counselling authorities, and entrance examinations.</p>

<h2>5. Payments, Donations &amp; Disbursements</h2>
<p>Educarrus operates a <strong>Zero Commission Platform</strong> policy. Platform fees are 0.00%. All scholarship payouts are transferred directly to verified accredited college accounts or audited student fee ledgers. Donation refunds are permitted within 7 days in cases of accidental duplicate transactions.</p>

<h2>6. Intellectual Property</h2>
<p>All platform logos, trademarks, editorial guides, and digital materials are proprietary to Educarrus Education Foundation. You may not reproduce platform assets without express written consent.</p>

<h2>7. Limitation of Liability</h2>
<p>In no event shall Educarrus or its trustees be held liable for indirect, incidental, or consequential damages arising from college policy modifications, entrance exam cancellations, or third-party bank gateway downtimes.</p>

<h2>8. Governing Law &amp; Jurisdiction</h2>
<p>These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts of New Delhi, India.</p>

<h2>9. Contact Information</h2>
<p>For legal inquiries, dispute resolution, or compliance questions, please contact:</p>
<p><strong>Legal &amp; Compliance Cell</strong><br>
Educarrus Education Foundation<br>
Email: legal@educarrus.org | Phone: +91 98765 43210</p>
  `.trim();
}

function getDefaultPrivacyContent() {
  return `
<h2>1. Introduction &amp; Scope</h2>
<p>At <strong>EducareUs</strong> (Educarrus Education Foundation), we recognize the paramount importance of data privacy. This Privacy Policy details how we collect, store, safeguard, and process personal and academic information collected through our web portal.</p>

<h2>2. Information We Collect</h2>
<ul>
  <li><strong>Personal Identification:</strong> Full Name, Email Address, Contact Phone, and Residential Location.</li>
  <li><strong>Academic Documentation:</strong> Class 10 &amp; 12 Marks, NEET/JEE Scorecards, College Bonafide Certificates, and College Fee Invoices.</li>
  <li><strong>Financial Information:</strong> Verified Bank Account Name, Account Number, and IFSC Code (for approved tuition fee disbursement only). We do not store raw credit card numbers or UPI PINs.</li>
  <li><strong>Technical Telemetry:</strong> Browser user agent, IP address for audit logging, and cookie identifiers for secure session authentication.</li>
</ul>

<h2>3. How We Use Information</h2>
<p>We process your data exclusively for:</p>
<ul>
  <li>Verifying student eligibility for scholarship funds and college admissions.</li>
  <li>Facilitating direct tuition disbursements to accredited higher education institutions.</li>
  <li>Generating Section 80G tax exemption donation receipts.</li>
  <li>Maintaining immutable administrative audit trails for regulatory compliance.</li>
  <li>Answering questions submitted through our Support Desk.</li>
</ul>

<h2>4. Information Sharing &amp; Third Parties</h2>
<p><strong>We never sell, rent, or trade your personal data.</strong> Information is shared solely with:</p>
<ul>
  <li>Accredited Colleges and Admission Authorities (upon student consent for application processing).</li>
  <li>Razorpay Payment Gateway (for encrypted transaction processing).</li>
  <li>Government Tax Authorities (for Section 80G exemption validation).</li>
</ul>

<h2>5. Data Storage &amp; Security Standards</h2>
<p>All sensitive student data and documents are stored on secure PostgreSQL databases protected by role-based access control, cryptographic hash algorithms (bcrypt), and TLS encryption in transit.</p>

<h2>6. Data Retention &amp; User Rights</h2>
<p>You possess the right to inspect, correct, or request the deletion of your personal account data at any time by contacting our privacy compliance officer, subject to mandatory educational grant record retention laws.</p>

<h2>7. Cookies &amp; Local Storage</h2>
<p>We use HTTP-only, secure cookies for session authentication and CSRF protection. You may manage cookie preferences through your web browser.</p>

<h2>8. Policy Updates &amp; Notifications</h2>
<p>We periodically review this policy to reflect updated statutory requirements. When revisions occur, the revised Effective Date and Version Number will be prominently posted at this URL.</p>

<h2>9. Data Protection Officer</h2>
<p>Questions regarding our privacy framework may be directed to:</p>
<p><strong>Data Protection Officer</strong><br>
Educarrus Education Foundation<br>
Email: privacy@educarrus.org | New Delhi, India</p>
  `.trim();
}
