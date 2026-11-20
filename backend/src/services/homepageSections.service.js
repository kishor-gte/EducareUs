import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'])?[^"'>]+(\1)?/gi, '')
    .replace(/javascript:[^"'>]+/gi, '');
}

async function saveBase64Image(dataUri, preferredName = 'section-asset') {
  if (!dataUri || typeof dataUri !== 'string') return null;

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
    return dataUri;
  }

  const ext = matches[1].toLowerCase().replace('jpeg', 'jpg');
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadsDir = path.join(process.cwd(), 'uploads', 'homepage');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const cleanBaseName = slugify(preferredName).slice(0, 30) || 'asset';
  const filename = `${cleanBaseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/homepage/${filename}`;
}

// Default initial templates when section hasn't been initialized in DB yet
function getDefaultSectionData(key) {
  if (key === 'why-choose-us') {
    return {
      badge: 'UNMATCHED VERIFICATION & SUPPORT',
      heading: 'WHY CHOOSE US?',
      highlightedSubtitle: 'Direct, Transparent Crowdfunding For India’s High Ambitions',
      description: 'Connecting meritorious students directly with philanthropic individuals, alumni networks, and institutional sponsors with zero intermediaries.',
      centralImage: '/pdf-extracted/img_8_18765.jpg',
      centralImageAlt: 'EduCareus Verified Medical and Engineering Scholars',
      imageBadgeText: '50+ Accredited College Tie-ups',
      showBadge: true,
      showCentralImage: true,
      cards: [
        {
          id: 'card-1',
          title: 'Personalized Recommendations',
          description: 'Tailored career roadmaps and college recommendations based on your marks, budget, and passion.',
          icon: 'Sparkles',
          iconColor: 'gold',
          displayOrder: 1,
          placement: 'left',
          enabled: true,
        },
        {
          id: 'card-2',
          title: 'Career Opportunities',
          description: 'Direct networking with industry alumni mentors, corporate internships, and campus placement partners.',
          icon: 'Briefcase',
          iconColor: 'gold',
          displayOrder: 2,
          placement: 'left',
          enabled: true,
        },
        {
          id: 'card-3',
          title: 'Simple Career Discovery',
          description: 'Explore verified counseling pathways, entrance exam cutoffs, and transparent fee structures across India.',
          icon: 'Compass',
          iconColor: 'gold',
          displayOrder: 3,
          placement: 'right',
          enabled: true,
        },
        {
          id: 'card-4',
          title: 'Easy Course Comparison',
          description: 'Compare accreditation ratings, hospital clinical rotations, and laboratory infrastructure side by side.',
          icon: 'Award',
          iconColor: 'gold',
          displayOrder: 4,
          placement: 'right',
          enabled: true,
        },
        {
          id: 'card-5',
          title: 'Complete Course Information',
          description: 'Real-time updates on centralized counselling rounds, cutoffs, seat matrices, and institutional fee waivers.',
          icon: 'BookOpen',
          iconColor: 'gold',
          displayOrder: 5,
          placement: 'right',
          enabled: true,
        },
      ],
    };
  }

  if (key === 'about-us') {
    return {
      badge: 'ABOUT EDUCAREUS',
      heading: 'Empowering Meritorious Scholars Across India',
      highlightedHeading: 'With Direct Institutional Fee Transfers & Zero Platform Fees',
      shortDescription: 'EduCareus was established to bridge the higher education financing gap for high-achieving medical, engineering, and professional college students from economically constrained backgrounds.',
      detailedContent: '<h2>Direct, Transparent Student Crowdfunding</h2><p>We believe financial constraints should never stand between an ambitious student and their degree. Our platform enables verified scholars to connect directly with individual donors, alumni groups, and CSR partners.</p><h3>Zero Intermediaries, 100% Impact</h3><p>Every single rupee contributed is transferred directly to the student’s accredited university fee challan, backed by physical and digital institutional verification.</p>',
      mainImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
      mainImageAlt: 'EduCareus Academic Counseling Team',
      secondaryImage: '',
      secondaryImageAlt: '',
      mission: {
        heading: 'Our Mission',
        description: 'To eliminate tuition barriers for India’s high-achieving students through direct institutional crowdfunding and verified fee grants.',
        icon: 'Target',
        enabled: true,
      },
      vision: {
        heading: 'Our Vision',
        description: 'An educational ecosystem where every meritorious scholar receives equitable access to accredited professional degrees.',
        icon: 'Eye',
        enabled: true,
      },
      story: {
        heading: 'The EduCareus Journey',
        description: '<p>Founded by education advocates and university alumni, EduCareus was built to eliminate commercial commissions from student scholarship funding. We have pioneered direct university fee reconciliation across medical and engineering colleges in India.</p>',
        image: '',
        enabled: true,
      },
      values: [
        {
          id: 'val-1',
          title: '100% Direct Transfers',
          description: 'Donation funds are remitted directly to the college or university bank account, never through personal intermediaries.',
          icon: 'Building2',
          displayOrder: 1,
          enabled: true,
        },
        {
          id: 'val-2',
          title: 'Zero Commission',
          description: 'EduCareus operates on a 0% platform fee policy, ensuring 100% of educational assistance reaches student fee accounts.',
          icon: 'Award',
          displayOrder: 2,
          enabled: true,
        },
        {
          id: 'val-3',
          title: 'Rigorous Verification',
          description: 'Class 10/12 marks, entrance scorecard, college admission allotment, and household income are verified thoroughly.',
          icon: 'ShieldCheck',
          displayOrder: 3,
          enabled: true,
        },
      ],
      stats: [
        { label: 'Verified Scholars Supported', value: '500', suffix: '+', icon: 'GraduationCap', displayOrder: 1, enabled: true },
        { label: 'Accredited Partner Colleges', value: '50', suffix: '+', icon: 'Building2', displayOrder: 2, enabled: true },
        { label: 'Zero Platform Fee Guaranteed', value: '100', suffix: '%', icon: 'Award', displayOrder: 3, enabled: true },
      ],
      cta: {
        heading: 'Ready to Support India’s Meritorious Scholars?',
        description: 'Connect with our team to sponsor a student fee challan or explore college admission guidance.',
        buttonText: 'Submit Guidance Inquiry',
        buttonUrl: '/userdashboard?tab=enquiry',
        enabled: true,
      },
    };
  }

  return {};
}

export class HomepageSectionsService {
  /**
   * Admin: Get section (returns draft, published, status, version)
   */
  static async getSectionAdmin(key) {
    let section = await prisma.homepageSection.findUnique({ where: { key } });

    if (!section) {
      const defaultData = getDefaultSectionData(key);
      section = await prisma.homepageSection.create({
        data: {
          key,
          title: key === 'why-choose-us' ? 'Why Choose Us' : 'About Us',
          draftData: defaultData,
          publishedData: defaultData,
          status: 'PUBLISHED',
          version: '1.0',
          publishedAt: new Date(),
        },
      });
    }

    return section;
  }

  /**
   * Admin: Save section draft
   */
  static async updateSectionDraft(key, data, userEmail = 'admin') {
    let section = await prisma.homepageSection.findUnique({ where: { key } });
    const currentDraft = section ? (section.draftData || {}) : getDefaultSectionData(key);

    const mergedData = { ...currentDraft, ...data };

    // Process images if Base64
    if (mergedData.centralImage && mergedData.centralImage.startsWith('data:image/')) {
      mergedData.centralImage = await saveBase64Image(mergedData.centralImage, `${key}-central`);
    }
    if (mergedData.mainImage && mergedData.mainImage.startsWith('data:image/')) {
      mergedData.mainImage = await saveBase64Image(mergedData.mainImage, `${key}-main`);
    }
    if (mergedData.secondaryImage && mergedData.secondaryImage.startsWith('data:image/')) {
      mergedData.secondaryImage = await saveBase64Image(mergedData.secondaryImage, `${key}-secondary`);
    }

    // Sanitize rich-text content
    if (mergedData.detailedContent) {
      mergedData.detailedContent = sanitizeHtml(mergedData.detailedContent);
    }
    if (mergedData.story?.description) {
      mergedData.story.description = sanitizeHtml(mergedData.story.description);
    }

    if (section) {
      return prisma.homepageSection.update({
        where: { key },
        data: {
          draftData: mergedData,
          lastUpdatedBy: userEmail,
        },
      });
    } else {
      return prisma.homepageSection.create({
        data: {
          key,
          title: key === 'why-choose-us' ? 'Why Choose Us' : 'About Us',
          draftData: mergedData,
          publishedData: null,
          status: 'DRAFT',
          version: '1.0',
          lastUpdatedBy: userEmail,
        },
      });
    }
  }

  /**
   * Admin: Publish section (promotes draftData to publishedData)
   */
  static async publishSection(key, userEmail = 'admin') {
    let section = await prisma.homepageSection.findUnique({ where: { key } });
    if (!section) {
      section = await this.getSectionAdmin(key);
    }

    const draft = section.draftData || getDefaultSectionData(key);

    // Calculate next version
    const prevVer = parseFloat(section.version || '1.0') || 1.0;
    const nextVer = (prevVer + 0.1).toFixed(1);

    return prisma.homepageSection.update({
      where: { key },
      data: {
        publishedData: draft,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        version: nextVer,
        lastUpdatedBy: userEmail,
      },
    });
  }

  /**
   * Admin: Unpublish section
   */
  static async unpublishSection(key, userEmail = 'admin') {
    const existing = await prisma.homepageSection.findUnique({ where: { key } });
    if (!existing) {
      const err = new Error(`Section "${key}" not found`);
      err.statusCode = 404;
      throw err;
    }

    return prisma.homepageSection.update({
      where: { key },
      data: {
        status: 'DRAFT',
        lastUpdatedBy: userEmail,
      },
    });
  }

  /**
   * Public: Get published section (ONLY returns publishedData when status === 'PUBLISHED')
   */
  static async getSectionPublic(key) {
    const section = await prisma.homepageSection.findUnique({
      where: { key },
    });

    if (!section || section.status !== 'PUBLISHED' || !section.publishedData) {
      return null;
    }

    return {
      key: section.key,
      title: section.title,
      version: section.version,
      publishedAt: section.publishedAt,
      data: section.publishedData,
    };
  }
}

export default HomepageSectionsService;
