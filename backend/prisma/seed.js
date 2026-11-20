import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Educarrus database seed...');

  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);

  // 1. Seed System Settings
  console.log('⚙️ Seeding System Settings...');
  const settings = [
    {
      key: 'PLATFORM_NAME',
      value: 'Educarrus Education Foundation',
      category: 'GENERAL',
      description: 'Public name of the admission and education aid platform',
    },
    {
      key: 'SUPPORT_EMAIL',
      value: 'admin@educarrus.org',
      category: 'GENERAL',
      description: 'Official support and enquiry email address',
    },
    {
      key: 'TAX_EXEMPTION_CODE',
      value: '80G-EDUCAREUS-2026-X99',
      category: 'LEGAL',
      description: 'Indian Section 80G tax exemption certificate registration code',
    },
    {
      key: 'PLATFORM_FEE_PERCENT',
      value: 0.0,
      category: 'PAYMENT',
      description: 'Platform commission fee percentage taken from donations',
    },
    {
      key: 'MAX_WITHDRAWAL_PER_DAY',
      value: 200000,
      category: 'PAYMENT',
      description: 'Maximum daily payout limit per beneficiary in INR',
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category, description: s.description },
      create: s,
    });
  }

  // 2. Seed Administrators ONLY
  console.log('👥 Seeding Administrators...');
  await prisma.user.upsert({
    where: { email: 'admin@educarrus.org' },
    update: { role: 'SUPER_ADMIN', verificationStatus: 'VERIFIED', isSuspended: false, passwordHash },
    create: {
      email: 'admin@educarrus.org',
      passwordHash,
      fullName: 'Super Administrator',
      phone: '+91 98765 00000',
      role: 'SUPER_ADMIN',
      verificationStatus: 'VERIFIED',
      location: 'Bengaluru, KA',
    },
  });

  // 3. Seed Default Publications (Terms & Conditions, Privacy Policy, FAQs, Blogs)
  console.log('📚 Seeding Publications & Legal Documents...');

  // 3a. Terms & Conditions
  const termsContent = `
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

  const termsPage = await prisma.sitePage.upsert({
    where: { slug: 'terms-and-conditions' },
    update: {
      title: 'Terms & Conditions',
      publishedContent: termsContent,
      content: termsContent,
      status: 'PUBLISHED',
      version: '1.0',
    },
    create: {
      slug: 'terms-and-conditions',
      title: 'Terms & Conditions',
      introduction: 'Welcome to EducareUs (Educarrus Education Foundation). These Terms and Conditions govern your access to and use of our higher education scholarship crowdfunding and student admission consultancy platform.',
      content: termsContent,
      publishedContent: termsContent,
      effectiveDate: '2026-01-01',
      version: '1.0',
      metaTitle: 'Terms & Conditions — EduCareus Education Foundation',
      metaDescription: 'Read the official terms and conditions for EduCareus higher education aid and admission guidance.',
      status: 'PUBLISHED',
      lastUpdatedBy: 'Super Administrator',
      publishedAt: new Date(),
    },
  });

  await prisma.pageRevision.upsert({
    where: { id: 'initial-terms-rev-1' },
    update: {},
    create: {
      id: 'initial-terms-rev-1',
      pageId: termsPage.id,
      version: '1.0',
      title: 'Terms & Conditions',
      introduction: termsPage.introduction,
      content: termsContent,
      effectiveDate: '2026-01-01',
      publishedBy: 'Super Administrator',
    },
  });

  // 3b. Privacy Policy
  const privacyContent = `
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

  const privacyPage = await prisma.sitePage.upsert({
    where: { slug: 'privacy-policy' },
    update: {
      title: 'Privacy Policy',
      publishedContent: privacyContent,
      content: privacyContent,
      status: 'PUBLISHED',
      version: '1.0',
    },
    create: {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      introduction: 'EducareUs is committed to protecting the privacy, personal data, and rights of our student beneficiaries, donor partners, and platform visitors.',
      content: privacyContent,
      publishedContent: privacyContent,
      effectiveDate: '2026-01-01',
      version: '1.0',
      metaTitle: 'Privacy Policy — EduCareus Education Foundation',
      metaDescription: 'Official privacy policy for EduCareus: details on data collection, protection, and scholarship disbursements.',
      status: 'PUBLISHED',
      lastUpdatedBy: 'Super Administrator',
      publishedAt: new Date(),
    },
  });

  await prisma.pageRevision.upsert({
    where: { id: 'initial-privacy-rev-1' },
    update: {},
    create: {
      id: 'initial-privacy-rev-1',
      pageId: privacyPage.id,
      version: '1.0',
      title: 'Privacy Policy',
      introduction: privacyPage.introduction,
      content: privacyContent,
      effectiveDate: '2026-01-01',
      publishedBy: 'Super Administrator',
    },
  });

  // 3c. Initial FAQs
  const defaultFaqs = [
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

  for (const faqItem of defaultFaqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faqItem.question } });
    if (!existing) {
      await prisma.fAQ.create({
        data: {
          ...faqItem,
          status: 'PUBLISHED',
        },
      });
    }
  }

  // 3d. Initial Published Blogs
  const sampleBlogs = [
    {
      title: 'NEET 2026: Complete Medical Counselling & Seat Allocation Roadmap',
      slug: 'neet-2026-counselling-roadmap',
      excerpt: 'Comprehensive step-by-step handbook covering MCC All India Quota, state quota registrations, choice locking strategies, and fee structures.',
      content: `
<h2>Understanding the 2026 NEET Counselling Structure</h2>
<p>Securing a qualifying NEET score is only the first milestone on your medical journey. Navigating the centralized counselling process through the Medical Counselling Committee (MCC) and respective State Counselling Authorities requires meticulous strategy and timing.</p>

<h3>1. All India Quota (AIQ 15%) vs State Quota (85%)</h3>
<p>MCC conducts 4 rounds of online counselling (Round 1, Round 2, Mop-Up Round, and Stray Vacancy Round) for 15% AIQ seats in government colleges, 100% seats in Deemed/Central Universities, ESIC, AIIMS, and JIPMER.</p>

<h3>2. Critical Document Checklist</h3>
<ul>
  <li>NEET 2026 Admit Card and Official Rank Card</li>
  <li>Class 10 &amp; 12 Marks Statements &amp; Passing Certificates</li>
  <li>Category Certificate (SC/ST/OBC-NCL/EWS) if applicable with current financial year validity</li>
  <li>Identity Proof (Aadhaar Card, Passport, or Voter ID)</li>
  <li>Provisional Allotment Letter generated online</li>
</ul>

<h3>3. Strategic Choice Filling Tips</h3>
<p>Never fill choices solely based on previous year closing ranks. Factor in annual tuition fees, compulsory rural service bonds, clinical patient bed capacity, and college infrastructure before locking options.</p>
      `.trim(),
      category: 'Medical',
      tags: ['NEET 2026', 'MBBS', 'Medical Counselling', 'Admissions'],
      authorName: 'Dr. Anand Saxena',
      status: 'PUBLISHED',
      isFeatured: true,
      coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
      coverImageAlt: 'Medical stethoscope and books',
    },
    {
      title: 'Top Engineering Branches for 2026 & Future-Proof Career Pathways',
      slug: 'top-engineering-branches-future',
      excerpt: 'An in-depth analysis of AI & Data Science, Electronics & VLSI, and Core Engineering streams with 5-year placement outlooks.',
      content: `
<h2>The Evolving Landscape of Engineering Education</h2>
<p>With artificial intelligence reshaping modern industry, students entering B.Tech programs in 2026 face an unprecedented range of interdisciplinary specializations.</p>

<h3>High-Demand Streams in 2026</h3>
<ul>
  <li><strong>Artificial Intelligence &amp; Machine Learning (AI &amp; ML):</strong> Leading software development, predictive analytics, and automated systems.</li>
  <li><strong>Electronics &amp; Communication (VLSI &amp; Embedded Systems):</strong> Supported by India's semiconductor manufacturing initiative.</li>
  <li><strong>Computer Science &amp; Cybersecurity:</strong> Critical infrastructure protection and cloud enterprise engineering.</li>
  <li><strong>Robotics &amp; Automation:</strong> Industrial robotics and smart manufacturing.</li>
</ul>

<h3>Key Evaluation Parameters</h3>
<p>When selecting a college, prioritize NBA &amp; NAAC A++ accreditations, active industry innovation labs, faculty-to-student ratios, and verified campus placement data.</p>
      `.trim(),
      category: 'Engineering',
      tags: ['B.Tech', 'Engineering', 'AI & ML', 'College Selection'],
      authorName: 'Prof. Ramesh Kulkarni',
      status: 'PUBLISHED',
      isFeatured: true,
      coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
      coverImageAlt: 'Engineering technology workstation',
    },
    {
      title: 'How to Access Zero-Commission Higher Education Scholarships in India',
      slug: 'higher-education-scholarships-guide',
      excerpt: 'A complete guide for meritorious and underprivileged students to secure crowdfunding grants with 100% direct college fee transfers.',
      content: `
<h2>Bridging the Higher Education Financing Gap</h2>
<p>Financial constraints should never stand between an ambitious student and their college degree. EducareUs was established on the principle that zero commissions should be taken from educational donations.</p>

<h3>How the Process Works</h3>
<ol>
  <li><strong>Submit Academic Profile:</strong> Upload your Class 12 marks, entrance exam scorecard, and admission allotment letter.</li>
  <li><strong>Direct Verification:</strong> Our team liaises directly with your college admissions office to verify official fee challans.</li>
  <li><strong>Crowdfunding Campaign:</strong> Verified campaigns are displayed to individual donors and philanthropic corporate partners.</li>
  <li><strong>Direct Institutional Disbursement:</strong> 100% of collected scholarship funds are remitted directly to the college account.</li>
</ol>
      `.trim(),
      category: 'Scholarships',
      tags: ['Scholarships', 'Financial Aid', 'Crowdfunding', 'Education'],
      authorName: 'EducareUs Editorial Team',
      status: 'PUBLISHED',
      isFeatured: false,
      coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
      coverImageAlt: 'Graduation cap and student books',
    },
  ];

  for (const b of sampleBlogs) {
    const existing = await prisma.blog.findUnique({ where: { slug: b.slug } });
    if (!existing) {
      await prisma.blog.create({
        data: {
          ...b,
          publishedContent: b.content,
          publishedAt: new Date(),
        },
      });
    }
  }

  console.log('✅ Database seeded successfully with administrator accounts, system settings, and default publications.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
