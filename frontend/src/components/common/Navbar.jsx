import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Home,
  Sparkles,
  ChevronRight,
  UserPlus,
  LogIn,
  HelpCircle,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll detection for sticky navbar depth
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navLinks = [
    { name: 'Courses', id: 'courses' },
    { name: 'Why Choose Us', id: 'why-choose-us' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200/80 py-2'
            : 'bg-white border-b border-slate-100 py-3'
        }`}
      >
        <div className="container-fluid px-3 px-sm-4 px-md-5 px-lg-5 w-100">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo matching EducareUs PDF */}
            <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-[#07166F] flex items-center justify-center text-[#FFB52E] shadow-sm group-hover:shadow-md transition-shadow"
              >
                <GraduationCap className="w-6 h-6" />
              </motion.div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-[#172033] font-heading leading-tight flex items-center">
                  Edu<span className="text-[#FFB52E]">careUs</span>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-[#64748B] font-bold -mt-0.5">
                  Direct Student Aid
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links with explicit CSS flex gap */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-7 text-xs xl:text-sm font-semibold text-[#172033]">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="relative py-1 text-slate-700 hover:text-[#07166F] transition-colors cursor-pointer group font-semibold whitespace-nowrap"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFB52E] transition-all duration-300 group-hover:w-full rounded-full" />
                </button>
              ))}
              <Link
                to="/blogs"
                className="relative py-1 text-slate-700 hover:text-[#07166F] transition-colors cursor-pointer group font-semibold whitespace-nowrap"
              >
                Blogs
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFB52E] transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
              <Link
                to="/faq"
                className="relative py-1 text-slate-700 hover:text-[#07166F] transition-colors cursor-pointer group font-semibold whitespace-nowrap"
              >
                FAQs
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFB52E] transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
              <Link
                to="/terms-and-conditions"
                className="hidden xl:inline-block relative py-1 text-slate-700 hover:text-[#07166F] transition-colors cursor-pointer group font-semibold whitespace-nowrap"
              >
                Terms &amp; Conditions
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFB52E] transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
              <Link
                to="/privacy-policy"
                className="hidden xl:inline-block relative py-1 text-slate-700 hover:text-[#07166F] transition-colors cursor-pointer group font-semibold whitespace-nowrap"
              >
                Privacy Policy
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFB52E] transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            </nav>

            {/* Desktop Auth & CTAs with explicit CSS flex gap */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2.5">
                  {/* Realtime Notification Bell directly beside scholar portal box */}
                  <NotificationBell />

                  <div className="relative">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none border border-slate-200/80 cursor-pointer"
                    >
                    <div className="w-9 h-9 rounded-full bg-[#07166F] text-[#FFB52E] flex items-center justify-center font-bold text-sm shadow-xs border border-white/20 overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className="text-left hidden lg:block pr-2">
                      <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                        {user.fullName}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Scholar Portal
                      </div>
                    </div>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 py-2 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
                          <p className="text-xs font-black text-slate-900 truncate">{user.fullName}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Verified Student Scholar
                          </span>
                        </div>

                        <div className="p-1 space-y-0.5">
                          <Link
                            to="/userdashboard?tab=dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-amber-500" />
                            <span>Scholar Dashboard</span>
                          </Link>

                          <Link
                            to="/userdashboard?tab=profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                          >
                            <User className="w-4 h-4 text-amber-500" />
                            <span>Student Profile & College</span>
                          </Link>

                          <Link
                            to="/userdashboard?tab=enquiry"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4 text-amber-500" />
                            <span>Course & Career Enquiry</span>
                          </Link>

                          {isAdmin && (
                            <a
                              href="/admin.html"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4 text-purple-600" />
                              <span>Admin Governance Suite</span>
                            </a>
                          )}
                        </div>

                        <div className="p-1 border-t border-slate-100">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out of Educarrus</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-bold text-[#172033] hover:text-[#07166F] transition-colors"
                  >
                    Sign In
                  </Link>

                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/register"
                      className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-black bg-[#FFB52E] hover:bg-[#ffa81a] text-[#172033] transition-all shadow-md hover:shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#172033]" />
                      <span>Join Educarrus</span>
                    </Link>
                  </motion.div>
                </div>
              )}

              {/* Quick Admin link if logged in as admin */}
              {isAdmin && (
                <a
                  href="/admin.html"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-800 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Admin
                </a>
              )}
            </div>

            {/* Mobile Actions: Notification Bell + Mobile Menu Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              {user && <NotificationBell />}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden border-t border-slate-200 bg-white px-5 pt-4 pb-6 space-y-4 shadow-xl overflow-hidden"
            >
              {/* User Identity Card if Logged In */}
              {user ? (
                <div className="p-4 rounded-2xl bg-[#07166F] text-white shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#FFB52E] text-[#172033] font-black text-base flex items-center justify-center shrink-0 overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        user.fullName?.charAt(0).toUpperCase() || 'S'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-300 truncate">{user.email}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FFB52E] mt-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Student Scholar
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                    <Link
                      to="/userdashboard?tab=dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-center text-xs font-bold bg-[#FFB52E] text-[#172033] hover:bg-amber-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/userdashboard?tab=profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-center text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/20"
                    >
                      Student Profile
                    </Link>
                    <Link
                      to="/userdashboard?tab=enquiry"
                      onClick={() => setMobileMenuOpen(false)}
                      className="col-span-2 px-3 py-2 rounded-xl text-center text-xs font-bold bg-[#FFB52E]/20 text-[#FFB52E] hover:bg-[#FFB52E]/30 transition-colors border border-[#FFB52E]/30 flex items-center justify-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#FFB52E]" />
                      <span>Course & Career Enquiry</span>
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* Navigation Options */}
              <div className="space-y-1 pt-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-[#07166F]" />
                    <span>Home</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="text-[#172033] font-semibold">{link.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}

                <Link
                  to="/blogs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[#172033] font-semibold">Blogs &amp; Insights</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[#172033] font-semibold">FAQs</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/terms-and-conditions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[#172033] font-semibold">Terms &amp; Conditions</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/privacy-policy"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[#172033] font-semibold">Privacy Policy</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                {isAdmin && (
                  <a
                    href="/admin.html"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50/70 hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Admin Governance Suite</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </a>
                )}
              </div>

              {/* Mobile Auth Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 text-center text-xs font-black bg-[#FFB52E] hover:bg-[#ffa81a] text-[#172033] rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#172033]" />
                      <span>Join Educarrus</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Navbar;
