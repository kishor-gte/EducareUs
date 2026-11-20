import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Headphones,
  Mail,
  Loader2,
  CheckCircle2,
  BookOpen,
  X,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Bot,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'All',
  'General',
  'Student Registration',
  'Education',
  'Scholarships',
  'Donations',
  'Account Management',
  'Technical Support',
];

export const FaqPage = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const categoryScrollRef = useRef(null);

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  const { data: faqs = [], isLoading, isError } = useQuery({
    queryKey: ['public-faqs', selectedCategory],
    queryFn: async () => {
      const params = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      const res = await api.get('/public/faqs', { params });
      return res.data?.data || [];
    },
  });

  // Filter by search query client-side across question and answer
  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return faqs;
    const q = search.toLowerCase().trim();
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        (f.answer && f.answer.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q))
    );
  }, [faqs, search]);

  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleVote = (id, type, e) => {
    e.stopPropagation();
    if (helpfulVotes[id]) return;
    setHelpfulVotes((prev) => ({ ...prev, [id]: type }));
    toast.success(type === 'yes' ? 'Thanks for your feedback!' : 'We will improve this answer!');
  };

  const handleCopyQuestion = (question, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/faq?q=${encodeURIComponent(question)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Question link copied!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 overflow-x-hidden selection:bg-[#FFB52E]/30 selection:text-[#07166F]">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-[#07166F]/5 blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-[#FFB52E]/10 blur-3xl" />
      </div>

      {/* Hero Header with Animated Mesh & Rings */}
      <section className="bg-gradient-to-br from-[#07166F] via-[#091F8E] to-[#0A2699] text-white py-16 sm:py-24 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFB52E_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />

        {/* Floating animated decorative circles */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/10 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-24 -left-24 w-88 h-88 rounded-full border border-[#FFB52E]/20 pointer-events-none"
        />

        <div className="container-fluid px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFB52E] text-xs font-black uppercase tracking-wider mb-4 shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Center &amp; Instant Knowledge Base</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white leading-tight drop-shadow-sm"
          >
            Frequently Asked Questions
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-slate-200 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Find immediate answers regarding scholar verification, institutional university fee reconciliation, counseling procedures, and platform governance.
          </motion.p>

          {/* Search Bar with Live Clear and Focus Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 max-w-xl mx-auto relative group"
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 to-[#FFB52E] opacity-30 group-hover:opacity-75 blur-sm transition-all" />
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions by keyword, topic, or phrase..."
                className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold shadow-2xl border-2 border-transparent focus:border-[#FFB52E] focus:outline-none transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Quick Counter */}
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-[11px] font-bold text-slate-300"
            >
              Showing <span className="text-[#FFB52E] font-black">{filteredFaqs.length}</span> verified solutions
            </motion.div>
          )}
        </div>
      </section>

      {/* Main Container */}
      <main className="container-fluid px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto -mt-6 relative z-20">
        {/* Category Pills Bar with Smooth Scroll Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-2 sm:p-2.5 mb-8 relative flex items-center gap-1.5"
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
                    setExpandedId(null);
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
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#07166F] mb-3" />
            <p className="text-sm font-semibold">Fetching verified institutional FAQs...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-700 my-8 shadow-sm">
            <p className="font-bold text-sm">Failed to load FAQs.</p>
            <p className="text-xs mt-1">Please check your internet connection and try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredFaqs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-md my-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#FFB52E] flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
              <HelpCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Questions Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              {search
                ? `No FAQs match your search "${search}". Try searching with different keywords or topics.`
                : 'No FAQs have been published under this category yet.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-5 px-5 py-2.5 rounded-full bg-[#07166F] text-white text-xs font-bold hover:bg-[#06125a] transition-all cursor-pointer shadow-md"
              >
                Clear Search Query
              </button>
            )}
          </motion.div>
        )}

        {/* FAQs Accordion with Staggered Entrance */}
        {!isLoading && filteredFaqs.length > 0 && (
          <div className="space-y-3.5 mb-12">
            {filteredFaqs.map((faq, index) => {
              const isOpen = expandedId === faq.id;
              const userVote = helpfulVotes[faq.id];
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? 'border-[#07166F]/40 shadow-lg ring-2 ring-[#07166F]/10'
                      : 'border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-3.5">
                      <span
                        className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                          isOpen
                            ? 'bg-[#07166F] text-[#FFB52E] border-[#07166F]'
                            : 'bg-blue-50 text-[#07166F] border-blue-100'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 mb-1.5 border border-slate-200/60">
                          {faq.category}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug tracking-tight">
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? 'rotate-180 bg-[#07166F] text-[#FFB52E] shadow-sm'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed sm:pl-15">
                          <div
                            className="prose prose-sm prose-slate max-w-none
                              prose-headings:font-black prose-headings:text-slate-900
                              prose-a:text-[#07166F] prose-a:font-bold prose-a:underline hover:prose-a:text-blue-700
                              prose-p:leading-relaxed prose-p:text-slate-700
                              prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5"
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />

                          {/* Accordion Footer: Share & Helpful Rating */}
                          <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
                            <button
                              type="button"
                              onClick={(e) => handleCopyQuestion(faq.question, e)}
                              className="inline-flex items-center gap-1.5 hover:text-[#07166F] font-semibold transition-colors cursor-pointer"
                              title="Copy link to this answer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share Question</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 font-medium">Was this helpful?</span>
                              <button
                                type="button"
                                onClick={(e) => handleVote(faq.id, 'yes', e)}
                                disabled={Boolean(userVote)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                                  userVote === 'yes'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>Yes</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleVote(faq.id, 'no', e)}
                                disabled={Boolean(userVote)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                                  userVote === 'no'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                                }`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>No</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* High-Impact Support Help Banner with EduBot Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-3xl bg-gradient-to-tr from-[#07166F] via-[#091F8E] to-[#0A2699] text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl"
        >
          {/* Background circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#FFB52E]/10 pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#FFB52E] flex items-center justify-center mx-auto mb-2 backdrop-blur-md shadow-md border border-white/20">
              <Headphones className="w-7 h-7" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-heading tracking-tight leading-tight">
              Have Questions? Our Support Team is Here to Help.
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              If your question isn’t answered above, reach out to our dedicated student counseling team or chat with EduBot AI in real-time.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/userdashboard?tab=enquiry"
                className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-black bg-[#FFB52E] hover:bg-[#ffbe47] text-slate-950 transition-all shadow-md hover:shadow-lg cursor-pointer uppercase tracking-wider"
              >
                Submit Support Enquiry
              </Link>
              <Link
                to="/blogs"
                className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
              >
                Explore Knowledge Hub
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default FaqPage;
