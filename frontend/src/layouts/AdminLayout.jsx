import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckCircle2,
  Users,
  LineChart,
  LifeBuoy,
  ShieldAlert,
  Settings,
  Activity,
  LogOut,
  ExternalLink,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Bell,
  ChevronRight,
  ChevronDown,
  Database,
  ArrowUpRight,
  Loader2,
  BookOpen,
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({ 'Courses & Colleges': true, 'Publications': true });
  const toggleSubmenu = (name) => setOpenSubmenus((prev) => ({ ...prev, [name]: !prev[name] }));
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live KPI stats for dynamic sidebar alert badges
  const { data: kpis } = useQuery({
    queryKey: ['admin-sidebar-kpis'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/analytics/kpis');
        return res.data?.data;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
  });

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      queryClient.clear();
      toast.success('Signed out successfully');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error('Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
      setProfileDropdownOpen(false);
    }
  };

  // Grouped Navigation Structure
  const navSections = [
    {
      title: 'Operations',
      items: [
        {
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
          path: '/admin',
          end: true,
        },
        {
          label: 'Student Enquiries',
          icon: HelpCircle,
          path: '/admin/enquiries',
          badge: kpis?.pendingRequests ? `${kpis.pendingRequests} New` : null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          label: 'Document Verifications',
          icon: CheckCircle2,
          path: '/admin/verifications',
          badge: kpis?.pendingVerification ? `${kpis.pendingVerification} Review` : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          label: 'Courses & Colleges',
          icon: GraduationCap,
          children: [
            { label: 'Manage Courses', path: '/admin-courses.html' },
            { label: 'Manage Colleges', path: '/admin-colleges.html' },
          ],
        },
        {
          label: 'User Directory',
          icon: Users,
          path: '/admin/users',
        },
        {
          label: 'Analytics & Reports',
          icon: LineChart,
          path: '/admin/analytics',
        },
        {
          label: 'Support Desk',
          icon: LifeBuoy,
          path: '/admin/support',
          badge: kpis?.urgentTickets ? `${kpis.urgentTickets} Urgent` : null,
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        },
        {
          label: 'Publications',
          icon: BookOpen,
          children: [
            { label: 'Blogs', path: '/admin-blogs.html' },
            { label: 'Terms & Conditions', path: '/admin-terms.html' },
            { label: 'Privacy Policy', path: '/admin-privacy.html' },
            { label: 'FAQs', path: '/admin-faqs.html' },
            { label: 'About Us', path: '/admin-about.html' },
            { label: 'Why Choose Us', path: '/admin-why-choose-us.html' },
          ],
        },
      ],
    },
    {
      title: 'System & Security',
      items: [
        {
          label: 'Audit Trail',
          icon: ShieldAlert,
          path: '/admin/audit-logs',
        },
        {
          label: 'System Settings',
          icon: Settings,
          path: '/admin/settings',
        },
        {
          label: 'System Health',
          icon: Activity,
          path: '/admin/system-health',
        },
      ],
    },
  ];

  // Derive current page title for breadcrumb
  const currentItem = navSections
    .flatMap((s) => s.items)
    .find((item) =>
      item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
    );
  const pageTitle = currentItem?.label || 'Governance Center';

  return (
    <div className="h-screen bg-slate-100/70 flex flex-col md:flex-row font-sans w-full overflow-hidden text-slate-900 antialiased">
      {/* ─────────────────────────────────────────────────────────────
          MOBILE SLIDE-OVER DRAWER
      ────────────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative w-80 max-w-[85vw] bg-slate-950 text-slate-300 h-full shadow-2xl flex flex-col p-5 z-10 overflow-y-auto no-scrollbar border-r border-slate-800">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <GraduationCap className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-white text-sm tracking-tight">
                    EDUCARRUS
                  </h4>
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    Governance Suite
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation List */}
            <nav className="flex-1 space-y-6 overflow-y-auto py-4 no-scrollbar">
              {navSections.map((sec) => (
                <div key={sec.title} className="space-y-1">
                  <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {sec.title}
                  </p>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    if (item.children) {
                      const isOpen = openSubmenus[item.label] ?? true;
                      return (
                        <div key={item.label} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleSubmenu(item.label)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-slate-500" />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="pl-6 space-y-1">
                              {item.children.map((child) => (
                                <a
                                  key={child.label}
                                  href={child.path}
                                  className="flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-900 transition-colors"
                                >
                                  {child.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive = item.end
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              ))}

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loggingOut ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <LogOut className="w-4 h-4 text-rose-400" />}
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>View Public Site</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          DESKTOP SIDEBAR (Enterprise Obsidian Theme)
      ══════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-full bg-[#0B1120] text-slate-300 border-r border-slate-800/90 shadow-xl overflow-hidden select-none">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-white text-sm tracking-tight">
                  EDUCARRUS
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                Governance Suite
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6 no-scrollbar">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                if (item.children) {
                  const isOpen = openSubmenus[item.label] ?? true;
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleSubmenu(item.label)}
                        className="w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-300" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="pl-6 space-y-1">
                          {item.children.map((child) => (
                            <a
                              key={child.label}
                              href={child.path}
                              className="flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-900/50 transition-colors"
                            >
                              {child.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = item.end
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                        : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    ) : isActive ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          ))}

          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/15 transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                ) : (
                  <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-300" />
                )}
                <span>Sign Out</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Administrator Identity & Quick Logout Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#070D18] space-y-2.5">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 border border-slate-700">
                {user?.fullName?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.fullName || 'Super Administrator'}
                </p>
                <p className="text-[10px] text-amber-400/90 font-mono truncate">
                  {user?.role || 'SUPER_ADMIN'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loggingOut ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <LogOut className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold border border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════════
          MAIN SHELL (Header + Scrollable Content)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between shadow-2xs z-10">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-700 hover:text-slate-950 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-400 hidden sm:inline">Admin Governance</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
              <h1 className="font-heading font-black text-slate-900 text-sm sm:text-base tracking-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Telemetry & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Database Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL Online</span>
            </div>

            {/* Public Link Shortcut */}
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80"
            >
              <span>Public Site</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {/* Profile Avatar Pill with Dropdown */}
            <div className="relative pl-1 sm:pl-2 sm:border-l sm:border-slate-200" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left focus:outline-none"
                aria-expanded={profileDropdownOpen}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-amber-400 flex items-center justify-center font-black text-xs shadow-xs border border-slate-200 shrink-0">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {user?.fullName || 'Super Administrator'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    {user?.email || 'admin@educarrus.org'}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden xl:block transition-transform duration-150 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {user?.fullName || 'Super Administrator'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate font-mono">
                      {user?.email || 'admin@educarrus.org'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 border border-amber-500/20">
                      {user?.role || 'SUPER_ADMIN'}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/admin/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Platform Settings</span>
                    </Link>
                    <Link
                      to="/"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      <span>View Public Site</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {loggingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Header Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/80 transition-all shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Sign Out of Admin Portal"
            >
              {loggingOut ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
