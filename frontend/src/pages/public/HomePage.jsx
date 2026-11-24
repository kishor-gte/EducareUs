import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  Compass,
  Star,
  BookOpen,
  Send,
  Linkedin,
  Twitter,
  Github,
  ChevronRight,
  Building2,
  Users2,
  Briefcase,
  HeartHandshake,
  Target,
  Eye,
} from 'lucide-react';
import EduChatbot from '../../components/chatbot/EduChatbot';

// Lucide Icon Helper for Dynamic CMS Sections
const renderLucideIcon = (iconName, className = 'w-5 h-5') => {
  const map = {
    Sparkles,
    Briefcase,
    Compass,
    Award,
    BookOpen,
    ShieldCheck,
    CheckCircle2,
    HeartHandshake,
    Building2,
    GraduationCap,
    Users2,
    Target,
    Eye,
    Star,
  };
  const IconComponent = (iconName && map[iconName]) ? map[iconName] : Award;
  return <IconComponent className={className} />;
};

const getCardIconStyle = (color) => {
  switch (color) {
    case 'navy':
      return 'bg-[#07166F] text-[#FFB52E]';
    case 'blue':
      return 'bg-blue-50 text-[#07166F]';
    case 'green':
      return 'bg-emerald-50 text-emerald-600';
    case 'gold':
    default:
      return 'bg-[#FFB52E] text-[#172033]';
  }
};

// Animated Counter Component with smooth, real-time animation
const Counter = ({ target = 0, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  useEffect(() => {
    if (!isInView) return;
    const end = parseInt(target, 10);
    if (isNaN(end) || end <= 0) {
      setCount(0);
      return;
    }

    let startTime;
    const duration = 1200; // 1.2s smooth animation

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.floor(progress === 1 ? end : end * (1 - Math.pow(2, -10 * progress)));
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animateCount);
  }, [isInView, target]);

  return (
    <span ref={ref} className="font-heading font-black tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

export const HomePage = () => {
  const queryClient = useQueryClient();
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);
  const courseCarouselRef = useRef(null);
  const mentorCarouselRef = useRef(null);

  // Contact form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  // 1. Fetch Real Platform Statistics from Database
  const { data: statsData } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const res = await api.get('/public/stats');
      return res.data?.data;
    },
    staleTime: 60 * 1000,
  });

  // 1.1 Track real-time visitor from any browser
  useEffect(() => {
    api.post('/public/visit').catch((err) => {
      console.warn('Visitor tracking ping error:', err?.message);
    });
  }, []);

  // 2. Fetch Real Courses from Database / Backend (Homepage published only)
  const {
    data: coursesData,
    isLoading: coursesLoading,
    isError: coursesError,
  } = useQuery({
    queryKey: ['public-courses-homepage'],
    queryFn: async () => {
      const res = await api.get('/public/courses/homepage');
      return res.data?.data || [];
    },
    staleTime: 60 * 1000,
  });

  // Dynamic Publications CMS: Why Choose Us
  const { data: whySection } = useQuery({
    queryKey: ['public-why-choose-us'],
    queryFn: async () => {
      const res = await api.get('/public/homepage-sections/why-choose-us');
      return res.data?.data?.data || null;
    },
    staleTime: 60 * 1000,
  });


  // 3. Fetch Real Student Testimonials from Backend
  const { data: testimonialsData } = useQuery({
    queryKey: ['public-testimonials'],
    queryFn: async () => {
      const res = await api.get('/public/testimonials');
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // 4. Fetch Real Mentors from Backend
  const { data: mentorsData } = useQuery({
    queryKey: ['public-mentors'],
    queryFn: async () => {
      const res = await api.get('/public/mentors');
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // 5. Real Contact Form Submission via PostgreSQL Enquiry API
  const contactMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/public/contact', payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Your inquiry has been received! Our advisor will contact you within 24 hours.');
      setFormData({ fullName: '', email: '', subject: '', message: '' });
      // Invalidate live stats to reflect newly submitted inquiries in real-time
      queryClient.invalidateQueries({ queryKey: ['public-stats'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to submit enquiry. Please check your inputs and try again.';
      toast.error(msg);
    },
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error('Please enter your full name and a valid email address.');
      return;
    }
    contactMutation.mutate(formData);
  };

  const courses = coursesData || [];
  const testimonials = (testimonialsData || []).slice(0, 5);
  const mentors = mentorsData || [];

  return (
    <div className="bg-[#F8FAFC] text-[#172033] overflow-x-hidden font-sans w-100">
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION B: HERO SECTION (Deep Navy #07166F with Gold Highlights - Fluid Wider)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#07166F] text-white pt-12 pb-20 md:pt-16 md:pb-24 lg:pt-20 lg:pb-28 overflow-hidden w-100">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-[#FFB52E]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 w-100 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headlines & High-Impact CTA */}
            <div className="md:col-span-7 space-y-6 text-center md:text-left">
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-black tracking-tight leading-[1.1] text-white uppercase">
                <span style={{ color: '#ffffff' }}>FUND A STUDENT’S DREAM. </span>
                <span style={{ color: '#FFB52E' }} className="block sm:inline">
                  BREAK TUITION BARRIERS.
                </span>
              </h1>

              {/* Supporting Description */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-3xl leading-relaxed mx-auto md:mx-0 font-normal">
                Direct, transparent crowdfunding for India’s high-achieving medical, engineering, and professional college students. Verified identities, zero platform fee, and 100% direct fee transfers.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <a
                    href="#courses"
                    className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-black bg-[#FFB52E] hover:bg-[#ffa710] text-[#172033] transition-all shadow-xl hover:shadow-[#FFB52E]/30 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Explore Verified Scholars</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Link
                    to="/userdashboard?tab=enquiry"
                    className="w-full sm:w-auto px-7 py-4 rounded-full text-sm font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all text-center flex items-center justify-center gap-2 backdrop-blur-md cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#FFB52E]" />
                    <span>Free Career Counseling</span>
                  </Link>
                </motion.div>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-white/15 flex items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Institution Verified</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Student Visual Composition from PDF */}
            <div className="md:col-span-5 relative flex items-center justify-center pt-4 md:pt-0">
              <div className="relative w-full max-w-[380px] lg:max-w-[460px] xl:max-w-[500px] flex items-center justify-center">
                {/* Golden & Blue Radiant Circular Backdrop matching PDF img_18 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[300px] h-[300px] lg:w-[380px] lg:h-[380px] rounded-full bg-gradient-to-tr from-[#FFB52E]/30 via-blue-500/30 to-[#FFB52E]/20 blur-xl animate-pulse" />
                  <div className="absolute w-[260px] h-[260px] lg:w-[330px] lg:h-[330px] rounded-full border-4 border-[#FFB52E]/60 border-dashed" />
                  <div className="absolute w-[230px] h-[230px] lg:w-[290px] lg:h-[290px] rounded-full bg-[#040e48] border-2 border-white/20" />
                </div>

                {/* Main Hero Student Image from PDF */}
                <img
                  src="/pdf-extracted/img_21_164295.jpg"
                  alt="Educarrus Student Scholar"
                  width="340"
                  height="380"
                  fetchPriority="high"
                  decoding="async"
                  className="relative z-10 w-[240px] sm:w-[280px] lg:w-[320px] xl:w-[340px] h-auto object-contain drop-shadow-2xl rounded-3xl"
                />

                {/* Floating Achievement Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -bottom-3 -left-2 sm:-left-4 z-20 bg-white text-[#172033] px-4 py-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFB52E] flex items-center justify-center font-black text-[#172033] shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#172033]">
                      {statsData?.studentsGuided !== undefined ? `${statsData.studentsGuided.toLocaleString()}+ Scholars Guided` : 'Scholars Guided'}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 100% Verified Admissions
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION C: STATISTICS SECTION (Live Real Database Numbers)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-12 border-b border-slate-200 shadow-sm relative z-20 w-100">
        <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 w-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100 max-w-5xl mx-auto">
            {/* Stat 1: Years */}
            <div className="px-4 py-2">
              <div className="text-3xl sm:text-4xl lg:text-5xl text-[#07166F] font-black tracking-tight">
                <Counter target={statsData?.yearsOfGuidance ?? 0} suffix="+" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#64748B] uppercase tracking-wider mt-2">
                Years of Guidance
              </p>
            </div>

            {/* Stat 2: Real Active Students from DB */}
            <div className="px-4 py-2">
              <div className="text-3xl sm:text-4xl lg:text-5xl text-[#FFB52E] font-black tracking-tight">
                <Counter target={statsData?.studentsGuided ?? 0} suffix="+" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#64748B] uppercase tracking-wider mt-2">
                Students Supported
              </p>
            </div>

            {/* Stat 3: College Tie-ups */}
            <div className="px-4 py-2">
              <div className="text-3xl sm:text-4xl lg:text-5xl text-[#07166F] font-black tracking-tight">
                <Counter target={statsData?.collegeTieUps ?? 0} suffix="+" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#64748B] uppercase tracking-wider mt-2">
                College Tie-ups
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION D: CAREER DISCOVERY SECTION ("Confused About What to Study Next?")
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-[#F8FAFC] relative overflow-hidden w-100">
        <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 w-100">
          
          {/* Top: Large Full-Width Image Card to fit the screen */}
          <div className="w-full max-w-6xl xl:max-w-7xl mx-auto mb-12 lg:mb-16">
            <div className="relative w-full">
              {/* Floating Question Mark Motion Decorations */}
              <motion.div
                animate={{ y: [-6, 6, -6], rotate: [-6, 6, -6] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-5 sm:-top-7 left-4 sm:left-12 z-20 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FFB52E] text-[#172033] font-black text-2xl sm:text-3xl flex items-center justify-center shadow-2xl border-4 border-white"
              >
                ?
              </motion.div>
              <motion.div
                animate={{ y: [6, -6, 6], rotate: [6, -6, 6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -top-4 sm:-top-5 right-4 sm:right-12 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#07166F] text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-2xl border-4 border-white"
              >
                ?
              </motion.div>

              {/* Main Confused Student Photo — Full Screen Width */}
              <div className="relative rounded-3xl sm:rounded-[36px] overflow-hidden shadow-2xl bg-slate-900 border-4 sm:border-8 border-white group">
                <img
                  src="/pdf-extracted/img_19_139563.jpg"
                  alt="Confused about what to study next"
                  loading="lazy"
                  decoding="async"
                  width="1000"
                  height="600"
                  className="w-full max-h-[70vh] sm:max-h-[80vh] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-10 right-6 sm:right-10 text-white text-center">
                  <span className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-[#FFB52E] drop-shadow-md">
                    Free Expert Career Counseling
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Whatever was beside that is now placed DOWN below the image */}
          <div className="w-full max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFB52E]/20 text-[#07166F] border border-[#FFB52E]/40 text-xs sm:text-sm font-bold tracking-wide">
              <Compass className="w-4 h-4 text-[#07166F]" />
              <span>PERSONALIZED ROADMAPS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-black tracking-tight leading-tight uppercase">
              <span style={{ color: '#FFB52E' }}>CONFUSED ABOUT </span> <br className="hidden sm:inline" />
              <span style={{ color: '#07166F' }}>What To Study Next?</span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl mx-auto">
              Choosing the right college course after 12th or graduation is the single biggest decision of your life. Educarrus helps you evaluate academic strengths, institutional accreditations, and future career opportunities to make an informed higher-education choice.
            </p>

            {/* 3 Step Cards in balanced grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left pt-2">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#07166F] flex items-center justify-center shrink-0 font-bold text-base shadow-xs">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172033]">Curriculum & Specialization</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    In-depth breakdowns of core semester subjects, laboratory requirements, and practical skill modules.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold text-base shadow-xs">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172033]">Accredited College Comparison</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Transparent comparison of NAAC grades, university affiliations, campus facilities, and degree credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-base shadow-xs">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172033]">Placement & Industry Outcomes</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Comprehensive insights on campus placement records, top recruiters, average packages, and industry trends.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/userdashboard?tab=enquiry"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full bg-[#07166F] hover:bg-[#040e48] text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <span>Start Free Career Discovery</span>
                <ArrowRight className="w-4 h-4 text-[#FFB52E]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION E: EXPLORE COURSES (100% Dynamic Admin-Controlled from DB)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="courses" className="py-20 lg:py-28 bg-white border-t border-slate-200 relative w-100">
        <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 w-100">
          {/* Section Header Centered */}
          <div className="text-center max-w-4xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold tracking-wide uppercase">
              <BookOpen className="w-3.5 h-3.5 text-[#07166F]" />
              <span>POPULAR ACADEMIC PROGRAMS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight text-[#172033] uppercase">
              EXPLORE COURSES —{' '}
              <span className="text-[#07166F]">That Match Your Interest</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto">
              Top accredited undergraduate &amp; professional degrees with direct institutional support and career roadmaps.
            </p>

            {/* Slider Navigation Buttons (Active when multiple courses exist) */}
            {courses.length > 3 && (
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    courseCarouselRef.current?.scrollBy({ left: -380, behavior: 'smooth' });
                    setActiveCourseIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, courses.length - 1)));
                  }}
                  className="w-10 h-10 rounded-full border border-slate-300 hover:border-[#07166F] hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-[#07166F] transition-all cursor-pointer shadow-xs"
                  aria-label="Previous Course"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    courseCarouselRef.current?.scrollBy({ left: 380, behavior: 'smooth' });
                    setActiveCourseIndex((prev) => (prev < courses.length - 1 ? prev + 1 : 0));
                  }}
                  className="w-10 h-10 rounded-full bg-[#07166F] hover:bg-[#040e48] text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                  aria-label="Next Course"
                >
                  <ArrowRight className="w-4 h-4 text-[#FFB52E]" />
                </button>
              </div>
            )}
          </div>

          {/* Loading Skeletons */}
          {coursesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 animate-pulse h-96 flex flex-col">
                  <div className="h-60 bg-slate-200" />
                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State (When no courses published by admin) */}
          {!coursesLoading && courses.length === 0 && (
            <div className="max-w-md mx-auto text-center py-12 px-4 bg-slate-50 rounded-3xl border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#FFB52E] flex items-center justify-center mx-auto mb-3 border border-amber-200 shadow-xs">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-800 font-heading">Academic Catalog Updating</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Academic programs are currently being curated for the upcoming admissions cycle. Please check back shortly or reach out to our counseling desk.
              </p>
              <div className="mt-4">
                <Link
                  to="/userdashboard?tab=enquiry"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#07166F] text-white text-xs font-bold hover:bg-[#06125a] transition-all"
                >
                  <span>Submit Course Inquiry</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FFB52E]" />
                </Link>
              </div>
            </div>
          )}

          {/* Dynamic Course Cards Grid / Carousel */}
          {!coursesLoading && courses.length > 0 && (
            <div
              ref={courseCarouselRef}
              className={`flex gap-8 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-1 ${
                courses.length <= 3 ? 'justify-center flex-wrap' : ''
              }`}
              style={{ scrollSnapType: courses.length > 3 ? 'x mandatory' : 'none' }}
            >
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col hover:-translate-y-1.5 shrink-0 ${
                    courses.length === 1
                      ? 'w-full max-w-md'
                      : courses.length === 2
                      ? 'w-full sm:w-[calc(50%-16px)] max-w-md'
                      : 'w-full sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-22px)] min-w-[min(100%,280px)]'
                  }`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Course Image with Zoom on Hover */}
                  <div className="relative h-60 sm:h-64 overflow-hidden bg-slate-900">
                    <img
                      src={course.image || '/pdf-extracted/img_16_58909.jpg'}
                      alt={course.title}
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="260"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.src = '/pdf-extracted/img_16_58909.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 bg-[#FFB52E] text-[#172033] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                      {course.category}
                    </span>
                    <span className="absolute bottom-3 right-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/20">
                      {course.duration}
                    </span>
                  </div>

                  {/* Course Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-heading font-black text-[#172033] group-hover:text-[#07166F] transition-colors leading-snug">
                        <Link to={course.destination || `/courses/${course.slug}`}>
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#07166F] shrink-0" />
                        <span className="truncate">{course.colleges}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
                        {course.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to={course.destination || `/courses/${course.slug}`}
                        className="text-xs font-black text-[#07166F] hover:text-[#FFB52E] flex items-center gap-1.5 transition-colors group-hover:translate-x-0.5"
                      >
                        <span>{course.actionText || 'Explore Guidance'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        to={course.destination || `/courses/${course.slug}`}
                        className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#FFB52E] text-slate-700 group-hover:text-[#172033] flex items-center justify-center transition-colors shadow-xs"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION F: WHY CHOOSE US? (Dynamic Publications CMS - Central Student Image & Feature Cards)
      ═══════════════════════════════════════════════════════════════════════ */}
      {whySection && (
        <section id="why-choose-us" className="py-20 lg:py-28 bg-[#F8FAFC] border-t border-slate-200 relative overflow-hidden w-100">
          <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 w-100">
            {/* Section Heading */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              {whySection.badge && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07166F]/10 text-[#07166F] text-xs font-bold uppercase tracking-wide">
                  <span>{whySection.badge}</span>
                </div>
              )}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight text-[#172033] uppercase">
                {whySection.heading || 'WHY CHOOSE US?'}
                {whySection.highlightedSubtitle && (
                  <>
                    <br />
                    <span className="text-[#07166F]">{whySection.highlightedSubtitle}</span>
                  </>
                )}
              </h2>
              {whySection.description && (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {whySection.description}
                </p>
              )}
            </div>

            {/* Central 3-Column or Responsive Grid Composition */}
            {(() => {
              const enabledCards = (whySection.cards || [])
                .filter((c) => c.enabled !== false)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

              const showCentral = whySection.showCentralImage !== false && !!whySection.centralImage;

              if (!showCentral) {
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {enabledCards.map((card, idx) => (
                      <div
                        key={card.id || idx}
                        className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold mb-3 shadow-xs ${getCardIconStyle(card.iconColor)}`}>
                          {renderLucideIcon(card.icon, 'w-5 h-5')}
                        </div>
                        <h4 className="text-sm font-black text-[#172033]">{card.title}</h4>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.description}</p>
                      </div>
                    ))}
                  </div>
                );
              }

              const leftCards = [];
              const rightCards = [];
              enabledCards.forEach((c) => {
                if (c.placement === 'left') {
                  leftCards.push(c);
                } else if (c.placement === 'right') {
                  rightCards.push(c);
                } else {
                  if (leftCards.length <= rightCards.length) {
                    leftCards.push(c);
                  } else {
                    rightCards.push(c);
                  }
                }
              });

              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
                  {/* Left Points */}
                  <div className="md:col-span-3 space-y-5">
                    {leftCards.map((card, idx) => (
                      <div
                        key={card.id || idx}
                        className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold mb-3 shadow-xs ${getCardIconStyle(card.iconColor)}`}>
                          {renderLucideIcon(card.icon, 'w-5 h-5')}
                        </div>
                        <h4 className="text-sm font-black text-[#172033]">{card.title}</h4>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Central Student Photo with gold dashed ring */}
                  <div className="md:col-span-6 flex flex-col items-center justify-center text-center px-2 py-4">
                    <div className="relative max-w-[360px] lg:max-w-[420px] xl:max-w-[460px] w-full">
                      <div className="absolute -inset-3 rounded-full border-4 border-dashed border-[#FFB52E]/60 pointer-events-none" />
                      <div className="relative rounded-full aspect-square overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                        <img
                          src={whySection.centralImage}
                          alt={whySection.centralImageAlt || 'Why Choose EduCareus'}
                          loading="lazy"
                          decoding="async"
                          width="460"
                          height="460"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (!e.target.dataset.retried && whySection.centralImage?.startsWith('/uploads')) {
                              e.target.dataset.retried = 'true';
                              e.target.src = `http://localhost:5001${whySection.centralImage}`;
                            } else {
                              e.target.src = '/pdf-extracted/img_8_18765.jpg';
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                      </div>

                      {/* Center Badge */}
                      {whySection.showBadge !== false && whySection.imageBadgeText && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#07166F] text-white px-5 py-2 rounded-full text-xs font-black shadow-xl border border-white/20 whitespace-nowrap">
                          {whySection.imageBadgeText}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Points */}
                  <div className="md:col-span-3 space-y-4">
                    {rightCards.map((card, idx) => (
                      <div
                        key={card.id || idx}
                        className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold mb-2 shadow-xs ${getCardIconStyle(card.iconColor)}`}>
                          {renderLucideIcon(card.icon, 'w-4 h-4')}
                        </div>
                        <h4 className="text-xs font-black text-[#172033]">{card.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{card.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}



      {/* ══════════════════════════════════════════════════════════════════════
          SECTION H: TESTIMONIALS (Dynamic Verified Student Reviews - Fluid Wider)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-20 lg:py-28 bg-[#F8FAFC] border-t border-slate-200 w-100">
        <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 w-100">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <span className="text-xs font-black text-[#07166F] uppercase tracking-wider">
                EDUCARRUS REVIEWS
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-[#172033] mt-1 uppercase">
                Real People. Real Experience.
              </h2>
            </div>

            {testimonials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((review) => (
                  <div
                    key={review.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 relative hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[#FFB52E]">
                          {[...Array(review.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {review.role}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                        “{review.comment}”
                      </p>
                    </div>
                    <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-[#07166F] text-[#FFB52E] font-bold text-xs flex items-center justify-center">
                        {review.initials || (review.name ? review.name.trim().substring(0, 2).toUpperCase() : 'S')}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#172033]">{review.name}</h4>
                        <p className="text-[10px] text-slate-500">{review.institution || 'Verified Scholar'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-dashed border-slate-200 text-center text-slate-400 max-w-md mx-auto">
                <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No scholar reviews published yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Real scholar reviews will dynamically appear here when submitted.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION I: TRUSTED MENTORS (Dynamic from Backend - Fluid Wider)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-white border-t border-slate-200 w-100">
        <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 w-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-extrabold text-[#07166F] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                ACADEMIC & INDUSTRY LEADERS
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-[#172033] mt-2 uppercase">
                Our Trusted Mentors
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Learn directly from top university alumni and career specialists guiding thousands of scholars.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-end">
              {/* Slider Navigation Buttons (Active when more than 3 mentors exist) */}
              {mentors.length > 3 && (
                <div className="flex items-center gap-2 mr-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (mentorCarouselRef.current) {
                        const scrollAmount = mentorCarouselRef.current.clientWidth / 3 + 12;
                        mentorCarouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    className="w-9 h-9 rounded-full border border-slate-300 hover:border-[#07166F] hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-[#07166F] transition-all cursor-pointer shadow-xs"
                    aria-label="Previous Mentors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (mentorCarouselRef.current) {
                        const scrollAmount = mentorCarouselRef.current.clientWidth / 3 + 12;
                        mentorCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-[#07166F] hover:bg-[#040e48] text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                    aria-label="Next Mentors"
                  >
                    <ArrowRight className="w-4 h-4 text-[#FFB52E]" />
                  </button>
                </div>
              )}

              <Link
                to="/userdashboard?tab=enquiry"
                className="text-xs font-bold text-[#07166F] hover:text-[#FFB52E] flex items-center gap-1 transition-colors px-3 py-1.5 rounded-xl hover:bg-blue-50"
              >
                <span>View All Mentors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {mentors.length > 0 ? (
            <div
              ref={mentorCarouselRef}
              className={`flex gap-6 lg:gap-8 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-1 ${
                mentors.length < 3 ? 'justify-center' : 'justify-start'
              }`}
              style={{ scrollSnapType: mentors.length > 3 ? 'x mandatory' : 'none' }}
            >
              {mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className={`group bg-[#F8FAFC] rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1.5 flex flex-col justify-between shrink-0 snap-start ${
                    mentors.length === 1
                      ? 'w-full max-w-sm'
                      : mentors.length === 2
                      ? 'w-full sm:w-[calc(50%-16px)] max-w-sm'
                      : 'w-full sm:w-[calc(50%-16px)] lg:w-[calc(33.333333%-22px)]'
                  }`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div>
                    <div className="relative h-72 sm:h-80 overflow-hidden bg-slate-100">
                      <img
                        src={mentor.image || '/pdf-extracted/img_4_26483.jpg'}
                        alt={mentor.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/pdf-extracted/img_4_26483.jpg';
                        }}
                        style={{ objectPosition: 'center 25%' }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                      <span
                        className={`absolute top-4 right-4 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs ${mentor.badgeColor || 'bg-[#FFB52E] text-[#172033]'}`}
                      >
                        {mentor.tag || 'Academic Leader'}
                      </span>
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="text-base font-black text-[#172033]">{mentor.name}</h3>
                      <p className="text-xs text-[#07166F] font-bold">{mentor.role || mentor.specialization}</p>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{mentor.bio || mentor.description}</p>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-slate-200 flex items-center gap-3 text-slate-400">
                      {mentor.linkedinUrl ? (
                        <a href={mentor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#07166F] transition-colors" title="LinkedIn Profile" aria-label={`${mentor.name}'s LinkedIn`}>
                          <Linkedin className="w-4 h-4" />
                        </a>
                      ) : (
                        <Linkedin className="w-4 h-4 hover:text-[#07166F] cursor-pointer transition-colors" />
                      )}
                      {mentor.twitterUrl ? (
                        <a href={mentor.twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#07166F] transition-colors" title="Twitter Profile" aria-label={`${mentor.name}'s Twitter`}>
                          <Twitter className="w-4 h-4" />
                        </a>
                      ) : (
                        <Twitter className="w-4 h-4 hover:text-[#07166F] cursor-pointer transition-colors" />
                      )}
                      {mentor.githubUrl ? (
                        <a href={mentor.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#07166F] transition-colors" title="GitHub Profile" aria-label={`${mentor.name}'s GitHub`}>
                          <Github className="w-4 h-4" />
                        </a>
                      ) : (
                        <Github className="w-4 h-4 hover:text-[#07166F] cursor-pointer transition-colors" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 bg-[#F8FAFC] rounded-3xl border border-dashed border-slate-300 text-center text-slate-400 max-w-2xl mx-auto">
              <Users2 className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No Trust Members Added Yet</p>
              <p className="text-xs text-slate-400 mt-1">Trust members and academic mentors added by administrators will dynamically appear here.</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION J: CONTACT / SUPPORT SECTION (Live Database Submission - Fluid Wider)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-[#F8FAFC] border-t border-slate-200 w-100">
        <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 w-100">
          <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <div>
              <span className="text-xs font-black text-[#07166F] uppercase tracking-wider">
                EDUCAREUS SUPPORT DESK
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#172033] mt-1">
                Have Questions? Our Support Team is Here to Help.
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the form below and an educational advisor will get back to you within 24 hours.
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#172033] uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#07166F] focus:ring-2 focus:ring-[#07166F]/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#172033] uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#07166F] focus:ring-2 focus:ring-[#07166F]/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#172033] uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. MBBS Admission Aid"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#07166F] focus:ring-2 focus:ring-[#07166F]/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#172033] uppercase tracking-wider mb-1.5">
                  Your Message / Question
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about the college or degree program you are seeking guidance for..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#07166F] focus:ring-2 focus:ring-[#07166F]/10 outline-none text-xs font-semibold text-slate-800 transition-all resize-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={contactMutation.isPending}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#FFB52E] hover:bg-[#ffa710] text-[#172033] font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {contactMutation.isPending ? (
                  <span>Submitting to Database...</span>
                ) : (
                  <>
                    <span>Get In Touch</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </section>

      {/* Realtime Floating Support Cluster (AI Chatbot & WhatsApp Colliding Bound Orbs) at Bottom-Right */}
      <EduChatbot />
    </div>
  );
};

export default HomePage;
