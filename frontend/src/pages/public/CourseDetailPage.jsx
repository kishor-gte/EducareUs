import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  GraduationCap,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Award,
  Loader2,
  BookOpen,
} from 'lucide-react';

export const CourseDetailPage = () => {
  const { slug } = useParams();

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['public-course-detail', slug],
    queryFn: async () => {
      const res = await api.get(`/public/courses/${slug}`);
      return res.data?.data;
    },
    enabled: Boolean(slug),
  });

  useEffect(() => {
    if (course) {
      document.title = `${course.name} Guidance & Admissions | EduCareus`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && course.shortDescription) {
        metaDesc.setAttribute('content', course.shortDescription);
      }
    }
    return () => {
      document.title = 'EduCareus | Student Crowdfunding & Academic Scholarships';
    };
  }, [course]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-[#07166F] mb-3" />
        <p className="text-sm font-semibold">Loading academic course guidance...</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="min-h-screen bg-slate-50 py-24 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#FFB52E] flex items-center justify-center mb-4 border border-amber-200">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">Course Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-2">
          The requested course may have been updated, unpublished, or the URL slug might be incorrect.
        </p>
        <Link
          to="/#courses"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#07166F] text-white text-xs font-bold hover:bg-[#06125a] transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore All Programs</span>
        </Link>
      </div>
    );
  }

  const colleges = course.colleges || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-14 sm:top-16 z-30 shadow-xs">
        <div className="container-fluid px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto py-3 flex items-center justify-between">
          <Link
            to="/#courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#07166F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explore Courses</span>
          </Link>

          <Link
            to={`/userdashboard?tab=enquiry&course=${encodeURIComponent(course.name)}`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#07166F] text-white text-xs font-bold hover:bg-[#06125a] transition-all shadow-xs"
          >
            <span>Get Admission Guidance</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FFB52E]" />
          </Link>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#07166F] to-[#0A1F8F] text-white py-12 sm:py-16 relative overflow-hidden">
        <div className="container-fluid px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-[#FFB52E] text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm">
              {course.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#FFB52E]" />
              {course.duration}
            </span>
            {course.isFeatured && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                Featured Program
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white leading-tight">
            {course.name}
          </h1>

          {course.fullName && course.fullName !== course.name && (
            <p className="mt-2 text-base sm:text-lg text-slate-300 font-medium">
              {course.fullName}
            </p>
          )}

          {course.institutionDisplayText && (
            <p className="mt-4 text-xs sm:text-sm text-[#FFB52E] font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>{course.institutionDisplayText}</span>
            </p>
          )}
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="container-fluid px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto -mt-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image, Overview, Detailed Syllabus */}
          <div className="lg:col-span-8 space-y-6">
            {/* Featured Image */}
            {course.imageUrl && (
              <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-900 max-h-[380px]">
                <img
                  src={course.imageUrl}
                  alt={course.imageAlt || course.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Short Description Lead Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              <h3 className="text-base font-black text-slate-900 font-heading mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#07166F]" />
                Program Overview
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {course.shortDescription}
              </p>
            </div>

            {/* Detailed Description / Syllabus */}
            {course.detailedDescription && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
                <h3 className="text-base font-black text-slate-900 font-heading mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#07166F]" />
                  Curriculum, Specializations &amp; Career Scope
                </h3>
                <div
                  className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed
                    prose-headings:font-heading prose-headings:font-black prose-headings:text-slate-900
                    prose-h2:text-xl prose-h2:mt-6 prose-h3:text-lg prose-h3:mt-4
                    prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6"
                  dangerouslySetInnerHTML={{ __html: course.detailedDescription }}
                />
              </div>
            )}

            {/* Associated Colleges Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              <h3 className="text-base font-black text-slate-900 font-heading mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#07166F]" />
                Accredited Universities &amp; Colleges Offering This Course
              </h3>

              {colleges.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    Multiple top accredited universities and autonomous institutes offer this degree through EduCareus centralized counselling.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {colleges.map((col) => (
                    <div
                      key={col.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-start gap-3.5"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        <img
                          src={col.logoUrl || 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&auto=format&fit=crop&q=80'}
                          alt={col.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                          {col.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {col.city ? col.city + ', ' : ''}{col.state || col.country || 'India'}
                        </p>
                        {col.institutionType && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-[#07166F]">
                            {col.institutionType}
                          </span>
                        )}
                        {col.websiteUrl && (
                          <a
                            href={col.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Guidance & Counseling Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-md sticky top-28">
              <div className="w-10 h-10 rounded-2xl bg-[#07166F] text-[#FFB52E] flex items-center justify-center font-bold mb-4 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-black font-heading text-slate-900">
                Course Guidance &amp; Direct Admission Support
              </h3>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Connect directly with EduCareus academic mentors for cutoff analysis, scholarship verification, and fee subsidy assistance.
              </p>

              <div className="space-y-3 py-5 border-y border-slate-100 my-5 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Verified Accredited Institutions</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct Fee Remittance to College</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero Commission / Zero Intermediary Fee</span>
                </div>
              </div>

              <Link
                to={`/userdashboard?tab=enquiry&course=${encodeURIComponent(course.name)}`}
                className="w-full py-3.5 rounded-2xl bg-[#07166F] hover:bg-[#06125a] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>{course.buttonText || `Explore ${course.name} Guidance`}</span>
                <ArrowRight className="w-4 h-4 text-[#FFB52E]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetailPage;
