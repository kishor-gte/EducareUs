import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import {
  FileText,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Clock,
  Sparkles,
  CheckCircle2,
  Printer,
  Share2,
  HelpCircle,
  Building2,
  Scale,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const TermsPage = () => {
  const [copied, setCopied] = useState(false);

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['public-page', 'terms-and-conditions'],
    queryFn: async () => {
      const res = await api.get('/public/pages/terms-and-conditions');
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (page) {
      document.title = page.metaTitle || `${page.title} | EduCareus`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && page.metaDescription) {
        metaDesc.setAttribute('content', page.metaDescription);
      }
    }
    return () => {
      document.title = 'EduCareus | Student Crowdfunding & Academic Scholarships';
    };
  }, [page]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Terms link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.success('URL: ' + window.location.href);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 overflow-x-hidden selection:bg-[#FFB52E]/30 selection:text-[#07166F]">
      {/* Dynamic Animated Ambient Background Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-[#07166F]/5 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-[#FFB52E]/10 blur-3xl" />
      </div>

      {/* Hero Header with Entrance Animation */}
      <section className="bg-gradient-to-br from-[#07166F] via-[#091F8E] to-[#0D2CA3] text-white py-16 sm:py-20 relative overflow-hidden shadow-xl">
        {/* Subtle dot mesh pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFB52E_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Floating decorative glowing rings */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full border border-white/10 pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.08, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border border-[#FFB52E]/20 pointer-events-none"
        />

        <div className="container-fluid px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFB52E] text-xs font-black uppercase tracking-wider mb-4 shadow-sm"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Official Legal Governance</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white leading-tight drop-shadow-sm"
          >
            {page?.title || 'Terms & Conditions'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-3 text-slate-200 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed"
          >
            Please read these terms carefully before utilizing Educarrus platforms for institutional fee grants, college guidance, and scholar onboarding.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-200"
          >
            {page?.effectiveDate && (
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-[#FFB52E]" />
                Effective Date: {new Date(page.effectiveDate).toLocaleDateString()}
              </span>
            )}
            {page?.version && (
              <span className="px-3 py-1 rounded-full bg-[#FFB52E] text-slate-950 font-black shadow-sm">
                Version {page.version}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Legally Binding Agreement
            </span>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container-fluid px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto -mt-6 relative z-20">
        {/* Quick Summary Highlights Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#07166F]/10 text-[#07166F] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Direct Institutional Fees</div>
              <div className="text-[11px] text-slate-500">100% remitted to college challans</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FFB52E] flex items-center justify-center shrink-0 border border-amber-200/50">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">0% Commission Policy</div>
              <div className="text-[11px] text-slate-500">Zero deductions from scholar grants</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Verified Credentials</div>
              <div className="text-[11px] text-slate-500">Rigorous marks & fee authentication</div>
            </div>
          </div>
        </motion.div>

        {isLoading && (
          <div className="bg-white rounded-3xl p-16 shadow-md border border-slate-200 text-center flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-[#07166F] mb-3" />
            <p className="text-sm font-semibold">Loading verified legal terms...</p>
          </div>
        )}

        {isError && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-700 shadow-sm">
            <p className="font-bold text-sm">Failed to retrieve Terms &amp; Conditions.</p>
            <p className="text-xs mt-1">Please try refreshing the page or check back shortly.</p>
          </div>
        )}

        {!isLoading && !isError && page && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-200/80 relative"
          >
            {/* Top Toolbar: Print & Copy Link */}
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <FileText className="w-4 h-4 text-[#07166F]" />
                <span>Document ID: <strong className="text-slate-800 font-bold">{page.slug || 'terms-and-conditions'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                  title="Copy permanent document link"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copied ? 'Copied!' : 'Share'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                  title="Print this agreement"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Introduction Callout */}
            {page.introduction && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-r from-amber-50/90 to-amber-100/40 border-l-4 border-amber-500 rounded-r-2xl p-5 mb-8 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium shadow-xs"
              >
                <div className="flex items-center gap-2 font-black text-amber-900 uppercase text-[11px] tracking-wider mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Executive Notice
                </div>
                {page.introduction}
              </motion.div>
            )}

            {/* Rich Text Body */}
            <div
              className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed
                prose-headings:font-heading prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight
                prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-3 prose-h2:mt-10 prose-h2:text-[#07166F]
                prose-h3:text-lg prose-h3:mt-6 prose-h3:text-slate-900
                prose-a:text-[#07166F] prose-a:font-bold prose-a:underline hover:prose-a:text-blue-700
                prose-p:leading-relaxed prose-p:text-slate-700
                prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-1.5
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-1.5
                prose-strong:text-slate-900 prose-strong:font-black"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />

            {/* Help / Guidance Callout */}
            <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#07166F] text-white flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5 text-[#FFB52E]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Have questions about our legal policies?</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Our support counselors and AI Assistant are ready to assist 24/7.</p>
                </div>
              </div>
              <Link
                to="/faq"
                className="px-5 py-2.5 rounded-full bg-[#07166F] hover:bg-[#06125a] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm whitespace-nowrap"
              >
                Visit Help Center
              </Link>
            </div>

            {/* Footer Metadata */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
              <span>Last updated: <strong className="text-slate-700 font-bold">{page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'Recently'}</strong></span>
              <div className="flex items-center gap-4">
                <Link to="/privacy-policy" className="hover:text-[#07166F] font-bold transition-colors">
                  Privacy Policy &rarr;
                </Link>
                <Link to="/faq" className="hover:text-[#07166F] font-bold transition-colors">
                  Frequently Asked Questions &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default TermsPage;
