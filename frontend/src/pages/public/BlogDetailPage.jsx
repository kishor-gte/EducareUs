import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  Check,
  Tag,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: blog, isLoading, isError } = useQuery({
    queryKey: ['public-blog-detail', slug],
    queryFn: async () => {
      const res = await api.get(`/public/blogs/${slug}`);
      return res.data?.data;
    },
    enabled: Boolean(slug),
  });

  // Set document title & SEO meta dynamically
  useEffect(() => {
    if (blog) {
      document.title = blog.metaTitle || `${blog.title} | EduCareus`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && blog.metaDescription) {
        metaDesc.setAttribute('content', blog.metaDescription);
      }
    }
    return () => {
      document.title = 'EduCareus | Student Crowdfunding & Academic Scholarships';
    };
  }, [blog]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.success('URL: ' + url);
    }
  };

  const calculateReadTime = (content) => {
    if (!content) return '3 min read';
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min read`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-[#07166F] mb-3" />
        <p className="text-sm font-semibold">Loading publication...</p>
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="min-h-screen bg-slate-50 py-24 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-200">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">Publication Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-2">
          The publication you are looking for may have been archived, unpublished, or the URL might be incorrect.
        </p>
        <Link
          to="/blogs"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#07166F] text-white text-xs font-bold hover:bg-[#06125a] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to All Blogs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-14 sm:top-16 z-30 shadow-xs">
        <div className="container-fluid px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto py-3 flex items-center justify-between">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#07166F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Articles</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              title="Copy share link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Article Container */}
      <article className="container-fluid px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto pt-8 sm:pt-12">
        {/* Category & Read Time */}
        <div className="flex items-center gap-3 text-xs mb-4">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-[#07166F] font-bold border border-blue-100 uppercase tracking-wide text-[11px]">
            {blog.category}
          </span>
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {calculateReadTime(blog.content)}
          </span>
        </div>

        {/* Article Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-heading tracking-tight leading-tight sm:leading-snug">
          {blog.title}
        </h1>

        {/* Excerpt / Lead Paragraph */}
        {blog.excerpt && (
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-serif border-l-4 border-[#FFB52E] pl-4 italic bg-amber-50/40 py-2 rounded-r-xl">
            {blog.excerpt}
          </p>
        )}

        {/* Author & Published Date Metadata Row */}
        <div className="flex items-center justify-between py-6 border-y border-slate-200/80 my-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#07166F] text-[#FFB52E] flex items-center justify-center font-bold text-sm shadow-xs">
              {blog.authorName ? blog.authorName.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{blog.authorName || 'EduCareus Editorial Team'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified Author" />
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Published {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Recently'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        {blog.coverImage && (
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 mb-10 max-h-[480px] bg-slate-900">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Rich-Text Body Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs mb-10">
          <div
            className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed
              prose-headings:font-heading prose-headings:font-black prose-headings:text-slate-900
              prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
              prose-a:text-[#07166F] prose-a:font-bold prose-a:underline hover:prose-a:text-blue-700
              prose-blockquote:border-l-4 prose-blockquote:border-[#FFB52E] prose-blockquote:bg-amber-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic
              prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
              prose-img:rounded-2xl prose-img:shadow-md prose-img:my-6"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Tags Section */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 mb-10 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-2">
              <Tag className="w-3.5 h-3.5" />
              Tags:
            </span>
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom CTA Card */}
        <div className="rounded-3xl bg-gradient-to-tr from-[#07166F] to-[#0A1F8F] text-white p-8 sm:p-10 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#FFB52E] flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-heading">
              Need Direct Guidance for Higher Education?
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Connect with our student mentorship team to explore verified educational aid, admission counseling, and institution fee grants.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                to="/userdashboard?tab=enquiry"
                className="px-6 py-3 rounded-full text-xs font-bold bg-[#FFB52E] text-slate-900 hover:bg-amber-400 transition-all shadow-md cursor-pointer"
              >
                Submit Student Enquiry
              </Link>
              <Link
                to="/faq"
                className="px-6 py-3 rounded-full text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
              >
                Browse FAQs
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogDetailPage;
