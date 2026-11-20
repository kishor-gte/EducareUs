import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  CircleAlert,
  Loader2,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  // Token Verification State
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [userEmail, setUserEmail] = useState(emailParam);

  // Password Input State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live password validation indicators
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasLower = /[a-z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordHasLength = password.length >= 6;
  const passwordIsValid = passwordHasUpper && passwordHasLower && passwordHasNumber && passwordHasLength;

  const confirmHasUpper = /[A-Z]/.test(confirmPassword);
  const confirmHasLower = /[a-z]/.test(confirmPassword);
  const confirmHasNumber = /[0-9]/.test(confirmPassword);
  const confirmHasLength = confirmPassword.length >= 6;
  const confirmIsValid = confirmHasUpper && confirmHasLower && confirmHasNumber && confirmHasLength;

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('The password reset link is invalid or incomplete. Please request a new one.');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await api.post('/auth/verify-reset-token', {
          token,
          email: emailParam || undefined,
        });
        if (res.data?.valid) {
          setTokenValid(true);
          if (res.data.email) {
            setUserEmail(res.data.email);
          }
        } else {
          setTokenValid(false);
          setTokenError('This password reset link has expired or is invalid.');
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError(err.friendlyMessage || 'This password reset link has expired or is invalid.');
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token, emailParam]);

  // Handle Save / Reset Password
  const handleSavePassword = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase letter (A-Z).');
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error('Password must contain lowercase letters.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error('Password must contain at least one number (0-9).');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify your password.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        email: userEmail || emailParam || undefined,
        newPassword: password,
      });

      toast.success(res.data?.message || 'Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-mesh-light">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

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
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Choose a strong new password for your Educarrus student account.
          </p>
        </div>

        {verifying ? (
          /* Verifying Token State */
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Validating your reset link...</p>
          </div>
        ) : !tokenValid ? (
          /* Invalid / Expired Token State */
          <div className="space-y-6 text-center">
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <CircleAlert className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-rose-900">Link Expired or Invalid</h3>
              <p className="text-xs text-rose-600 leading-relaxed">
                {tokenError || 'This password reset link is invalid or has expired. Please request a new one.'}
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="w-full py-3.5 rounded-2xl font-black bg-slate-950 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                Request New Reset Link
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Reset Password Form */
          <div className="space-y-4">
            {userEmail && (
              <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
                <span className="text-[11px] text-slate-500 font-medium">Account: </span>
                <span className="text-xs font-bold text-slate-800">{userEmail}</span>
              </div>
            )}
            <form onSubmit={handleSavePassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
                      password.length > 0 && passwordIsValid
                        ? 'border-emerald-500 focus:ring-emerald-500/20'
                        : password.length > 0
                        ? 'border-amber-400 focus:ring-amber-400/20'
                        : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
                      passwordsMatch && confirmIsValid
                        ? 'border-emerald-500 focus:ring-emerald-500/20'
                        : passwordsMismatch || (confirmPassword.length > 0 && !confirmIsValid)
                        ? 'border-rose-400 focus:ring-rose-400/20'
                        : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Format Requirements Helper */}
              {password.length > 0 && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-700 mb-1">Password must include:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <span className={`flex items-center gap-1.5 ${passwordHasLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${passwordHasLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      At least 6 characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordHasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${passwordHasUpper ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      At least 1 Caps (A-Z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordHasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${passwordHasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      At least 1 Number (0-9)
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordHasLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${passwordHasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      Lower letters (a-z)
                    </span>
                  </div>
                </div>
              )}

              {/* Confirm Password Status Helpers */}
              {confirmPassword.length > 0 && (
                <div>
                  {passwordsMismatch ? (
                    <p className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold">
                      <CircleAlert className="w-3.5 h-3.5 shrink-0" />
                      Passwords do not match
                    </p>
                  ) : !confirmIsValid ? (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                      <CircleAlert className="w-3.5 h-3.5 shrink-0" />
                      Confirm password must also meet requirements
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      Passwords match perfectly
                    </p>
                  )}
                </div>
              )}

              {/* Save Password Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving || !passwordIsValid || !passwordsMatch}
                className="w-full py-3.5 rounded-2xl font-black bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Update Password</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted with 256-Bit SSL Protection</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
