import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const data = await login(trimmedEmail, password);
      const user = data?.data?.user;
      toast.success(`Welcome back, ${user?.fullName || 'Scholar'}!`);
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        window.location.href = '/admin.html';
        return;
      } else {
        navigate('/userdashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.friendlyMessage || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden bg-mesh-light">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-10 border border-slate-200/90 shadow-2xl space-y-6 relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-amber-400 flex items-center justify-center mx-auto shadow-lg border border-white/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-8 h-8" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
            Sign In to Educarrus
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Access your student portal, scholarship appeals, and verified academic credentials.
          </p>
        </div>

        {/* Registration Success Banner */}
        {location.state?.registeredMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{location.state.registeredMessage}</span>
          </div>
        )}

        {/* Login Form */}
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Footer Links */}
        <div className="pt-2 text-center text-xs text-slate-500">
          <span>Don't have an Educarrus account? </span>
          <Link to="/register" className="font-black text-slate-900 hover:text-amber-600 transition-colors">
            Register as a Student
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted with 256-Bit SSL Protection</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
