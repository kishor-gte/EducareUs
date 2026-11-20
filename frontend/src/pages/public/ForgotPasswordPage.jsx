import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  CircleAlert,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setEmailError('Please enter your registered email address.');
      toast.error('Please enter your registered email address.');
      return;
    }

    setEmailError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: cleanEmail });
      setSubmitted(true);
      toast.success(res.data?.message || 'Password reset link sent to your email!');
    } catch (err) {
      let errorMsg = err.friendlyMessage || 'Unable to process request.';
      if (
        errorMsg.toLowerCase().includes('not registered') ||
        errorMsg.toLowerCase().includes('not found') ||
        errorMsg.toLowerCase().includes('no account')
      ) {
        errorMsg = 'Email is not registered';
      }
      setEmailError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-mesh-light">
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-10 border border-slate-200/90 shadow-2xl space-y-6 relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-amber-400 flex items-center justify-center mx-auto shadow-lg border border-white/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-slate-900">
            {submitted ? 'Check Your Inbox' : 'Forgot Password?'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {submitted
              ? `We have dispatched a password reset link to ${email}`
              : 'Enter your registered email address and we will send you a secure link to reset your password.'}
          </p>
        </div>

        {submitted ? (
          /* Confirmation Success State */
          <div className="space-y-6">
            <div className="p-5 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Click the reset password button in the email to set a new password. The link is valid for <strong>30 minutes</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/login"
                className="w-full py-3.5 rounded-2xl font-black bg-slate-950 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                Back to Sign In
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmailError('');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Resend to another email address
              </button>
            </div>
          </div>
        ) : (
          /* Request Reset Link Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="student@example.com"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    emailError
                      ? 'border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                  }`}
                />
              </div>
              {emailError && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-semibold animate-in fade-in">
                  <CircleAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted with 256-Bit SSL Protection</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
