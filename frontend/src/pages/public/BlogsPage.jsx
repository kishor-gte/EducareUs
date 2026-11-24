import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import {
  Search,
  BookOpen,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  Tag,
  Loader2,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  Share2,
  TrendingUp,
  Bookmark,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'All',
  'Scholarships',
  'Higher Education',
  'Admissions',
  'Career Guidance',
  'Student Success',
  'Education Policy',
  'General',
];

export const BlogsPage = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const limit = 9;
  const categoryScrollRef = useRef(null);

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-blogs', page, selectedCategory, search],
    queryFn: async () => {
      const params = {
        page,
        limit,
        status: 'PUBLISHED',
      };
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await api.get('/public/blogs', { params });
      if (Array.isArray(res.data?.data)) {
        return {
          blogs: res.data.data,
          total: res.data?.pagination?.total || res.data.data.length,
          totalPages: res.data?.pagination?.totalPages || 1,
        };
      }
      return res.data?.data || { blogs: [], total: 0, totalPages: 1 };
    },
    keepPreviousData: true,
  });

  const blogs = data?.blogs || [];
  const totalPages = data?.totalPages || 1;

  // Find a featured blog if available
  const featuredBlog = useMemo(() => {
    return blogs.find((b) => b.isFeatured) || null;
  }, [blogs]);

  const regularBlogs = useMemo(() => {
    if (featuredBlog && page === 1 && !search && selectedCategory === 'All') {
      return blogs.filter((b) => b.id !== featuredBlog.id);
    }
    return blogs;
  }, [blogs, featuredBlog, page, search, selectedCategory]);

  const calculateReadTime = (content) => {
    if (!content) return '3 min read';
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min read`;
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    toast.success('Thank you for subscribing to Educarrus Insights!');
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 overflow-x-hidden selection:bg-[#FFB52E]/30 selection:text-[#07166F]">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-[#07166F]/5 blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-[#FFB52E]/10 blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#07166F] via-[#091F8E] to-[#0A2699] text-white py-16 sm:py-24 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFB52E_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Floating animated rings */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/10 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-24 -left-24 w-88 h-88 rounded-full border border-[#FFB52E]/20 pointer-events-none"
        />

        <div className="container-fluid px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFB52E] text-xs font-black uppercase tracking-wider mb-4 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>EduCareus Knowledge &amp; Insights Hub</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white max-w-3xl mx-auto leading-tight drop-shadow-sm"
          >
            Educational Insights, Scholarships &amp; Academic Guidance
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-slate-200 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Curated publications by academic counselors, medical &amp; engineering mentors, and scholar advocates to navigate your career and fee funding.
          </motion.p>

          {/* Search bar inside hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 max-w-xl mx-auto relative group"
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 to-[#FFB52E] opacity-30 group-hover:opacity-75 blur-sm transition-all" />
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search articles by title, topic, or keyword..."
                className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold shadow-2xl border-2 border-transparent focus:border-[#FFB52E] focus:outline-none transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Container */}
      <div className="container-fluid px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto -mt-6 relative z-20">
        {/* Category Pills Bar with Smooth Scroll Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-2 sm:p-2.5 mb-10 relative flex items-center gap-1.5"
        >
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-[#07166F] hover:text-[#FFB52E] text-slate-700 transition-colors shrink-0 shadow-xs cursor-pointer z-10"
            aria-label="Scroll categories left"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Track with mouse wheel & drag support */}
          <div
            ref={categoryScrollRef}
            onWheel={(e) => {
              if (e.deltaY !== 0 && categoryScrollRef.current) {
                categoryScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scroll-smooth px-1 py-1 w-full"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPage(1);
                  }}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#07166F] text-white shadow-md scale-102 ring-2 ring-[#FFB52E]/50'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {cat === 'All' && <Sparkles className="w-3.5 h-3.5 text-[#FFB52E]" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollCategories('right')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-[#07166F] hover:text-[#FFB52E] text-slate-700 transition-colors shrink-0 shadow-xs cursor-pointer z-10"
            aria-label="Scroll categories right"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-[#07166F] mb-3" />
            <p className="text-sm font-semibold">Loading published articles...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
            <p className="text-rose-700 font-bold text-sm">Failed to load articles.</p>
            <p className="text-rose-600 text-xs mt-1">Please check your network connection and try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && blogs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-md max-w-md mx-auto my-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#FFB52E] flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
              <BookOpen className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Articles Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              {search || selectedCategory !== 'All'
                ? 'No publications match your current filters. Try searching with different terms or selecting another category.'
                : 'Publications are currently being curated by our editorial team. Check back shortly.'}
            </p>
            {(search || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('All');
                  setPage(1);
                }}
                className="mt-5 px-5 py-2.5 rounded-full bg-[#07166F] text-white text-xs font-bold hover:bg-[#06125a] transition-all cursor-pointer shadow-md"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}

        {/* Featured Blog Spotlight (Page 1 without search) */}
        {!isLoading && featuredBlog && page === 1 && !search && selectedCategory === 'All' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#FFB52E]" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Editor's Featured Spotlight</span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all hover:shadow-2xl group">
              <div className="lg:col-span-7 h-64 sm:h-80 lg:h-full relative overflow-hidden bg-slate-900">
                <img
                  src={featuredBlog.coverImage || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80'}
                  alt={featuredBlog.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3.5 py-1.5 rounded-full bg-[#FFB52E] text-slate-950 font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Featured Story
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50/50">
                <div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-[#07166F] font-black border border-blue-100 text-[11px] uppercase tracking-wider">
                      {featuredBlog.category}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {calculateReadTime(featuredBlog.content)}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 font-heading leading-snug group-hover:text-[#07166F] transition-colors">
                    <Link to={`/blogs/${featuredBlog.slug}`}>{featuredBlog.title}</Link>
                  </h2>

                  <p className="mt-3 text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {featuredBlog.excerpt}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#07166F] text-[#FFB52E] flex items-center justify-center font-bold text-xs shadow-xs border border-white/20">
                      {featuredBlog.authorName ? featuredBlog.authorName.charAt(0).toUpperCase() : 'E'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {featuredBlog.authorName || 'EduCareus Editorial'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {featuredBlog.publishedAt ? new Date(featuredBlog.publishedAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/blogs/${featuredBlog.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#07166F] hover:bg-[#06125a] text-white text-xs font-black transition-all shadow-md group/btn"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular Blog Grid with Staggered Framer Motion */}
        {!isLoading && regularBlogs.length > 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {regularBlogs.map((blog, idx) => (
                <motion.article
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: Math.min(idx * 0.05, 0.4) }}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  <Link to={`/blogs/${blog.slug}`} className="block h-52 overflow-hidden relative bg-slate-900">
                    <img
                      src={blog.coverImage || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80'}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                    <div className="absolute top-3.5 left-3.5">
                      <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#07166F] font-black text-[10px] uppercase tracking-wider shadow-sm border border-white/40">
                        {blog.category}
                      </span>
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-2.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#FFB52E]" />
                          {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : 'Recent'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {calculateReadTime(blog.content)}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading leading-snug group-hover:text-[#07166F] transition-colors line-clamp-2">
                        <Link to={`/blogs/${blog.slug}`}>{blog.title}</Link>
                      </h3>

                      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {blog.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-5 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 truncate max-w-[150px]">
                        By {blog.authorName || 'EduCareus'}
                      </span>
                      <Link
                        to={`/blogs/${blog.slug}`}
                        className="text-[#07166F] font-black flex items-center gap-1 group-hover:text-blue-700 transition-colors"
                      >
                        <span>Read</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Pagination Controls with Motion */}
            {totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
                >
                  &larr; Previous
                </button>
                <span className="text-xs font-bold text-slate-600 px-4 bg-white py-2 rounded-xl border border-slate-200/80 shadow-xs">
                  Page <strong className="text-[#07166F]">{page}</strong> of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Newsletter Subscription Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 rounded-3xl bg-gradient-to-tr from-[#07166F] via-[#091F8E] to-[#0A2699] text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#FFB52E]/10 pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#FFB52E] flex items-center justify-center mx-auto mb-2 backdrop-blur-md shadow-md border border-white/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Stay Informed on Scholarships &amp; Cutoffs
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Get notified when new institutional fee grants, state admission updates, or career guidance articles are published.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
                required
                className="flex-1 px-4 py-3 rounded-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFB52E] shadow-md"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-[#FFB52E] hover:bg-[#ffbe47] text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Subscribe</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogsPage;
