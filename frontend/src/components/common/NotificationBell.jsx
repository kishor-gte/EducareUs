import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Headphones,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  Star,
  CheckCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export const NotificationBell = ({ onTabSelect }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Real-time polling every 8 seconds for notifications
  const { data: notifData } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async () => {
      if (!user) return { data: [], unreadCount: 0 };
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: Boolean(user),
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });

  const notifications = Array.isArray(notifData?.data)
    ? notifData.data
    : Array.isArray(notifData)
    ? notifData
    : [];
  const unreadCount =
    notifData?.unreadCount ?? notifications.filter((n) => n && !n.isRead).length;

  // Mark single notification read
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-broadcast-notifications', user?.id] });
    },
  });

  // Mark all notifications read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-broadcast-notifications', user?.id] });
    },
  });

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    setIsOpen(false);

    if (item.link) {
      if (item.link.startsWith('/userdashboard')) {
        const urlParams = new URLSearchParams(item.link.split('?')[1] || '');
        const targetTab = urlParams.get('tab');
        if (targetTab && onTabSelect) {
          onTabSelect(targetTab);
        } else {
          navigate(item.link);
        }
      } else {
        navigate(item.link);
      }
    }
  };

  const handleFooterClick = () => {
    setIsOpen(false);
    if (onTabSelect) {
      onTabSelect('dashboard');
    } else {
      navigate('/userdashboard?tab=dashboard');
    }
  };

  const getIconForType = (item) => {
    if (item.type === 'SUPPORT' || (item.title && item.title.includes('Support'))) {
      return <Headphones className="w-4 h-4 text-[#D97706]" />;
    }
    if (item.type === 'VERIFICATION' || (item.title && item.title.includes('Verif'))) {
      return <ShieldCheck className="w-4 h-4 text-[#059669]" />;
    }
    if (item.title && (item.title.includes('Review') || item.title.includes('Rating'))) {
      return <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />;
    }
    return <Sparkles className="w-4 h-4 text-[#2563EB]" />;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Bell Button (matching Image 2) */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
      >
        <Bell className="w-5 h-5 text-slate-600" />

        {/* Glow Badge (matching Image 2) */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[19px] h-[19px] px-1 text-[10px] font-black text-white bg-[#DC2626] rounded-full border-2 border-white pointer-events-none"
            style={{
              boxShadow: '0 0 10px rgba(220, 38, 38, 0.55)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Floating Dropdown Drawer (matching Image 1) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-24px)] sm:w-[380px] max-w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col"
            style={{
              boxShadow:
                '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.08)',
            }}
          >
            {/* Header (Solid Navy with Golden Bell & Accent Line) */}
            <div className="px-4 py-3.5 bg-[#07166F] text-white flex items-center justify-between border-b-2 border-[#FFB52E]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#FFB52E] fill-[#FFB52E]" />
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white">
                  ALERTS &amp; TELEMETRY
                </span>
                <span className="text-[11px] font-black bg-[#FFB52E] text-[#07166F] px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              </div>

              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending || unreadCount === 0}
                className="flex items-center gap-1 text-xs font-semibold text-[#CBD5E1] hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            </div>

            {/* Filter Sub-header */}
            <div className="px-3.5 py-2 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    filter === 'ALL'
                      ? 'bg-white text-[#07166F] font-bold shadow-sm border border-slate-200/80'
                      : 'text-slate-500 font-semibold hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('UNREAD')}
                  className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    filter === 'UNREAD'
                      ? 'bg-white text-[#07166F] font-bold shadow-sm border border-slate-200/80'
                      : 'text-slate-500 font-semibold hover:text-slate-800'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <span className="text-[11px] font-semibold text-[#94A3B8]">Realtime Sync</span>
            </div>

            {/* Scrollable Notifications List */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-[#F1F5F9]">
              {filteredNotifications.length === 0 ? (
                <div className="py-10 px-5 text-center">
                  <div className="w-11 h-11 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto mb-2.5">
                    <Bell className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-xs font-bold text-slate-700 mb-0.5">
                    {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    Scholar interactions, advisor guidance, and updates will appear here in real-time.
                  </div>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isUnread = !item.isRead;
                  let iconBg = '#EFF6FF';
                  if (item.type === 'SUPPORT' || (item.title && item.title.includes('Support'))) {
                    iconBg = '#FEF3C7';
                  } else if (item.type === 'VERIFICATION' || (item.title && item.title.includes('Verif'))) {
                    iconBg = '#ECFDF5';
                  } else if (item.title && (item.title.includes('Review') || item.title.includes('Rating'))) {
                    iconBg = '#FFFBEB';
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`px-3.5 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#F8FAFC] relative ${
                        isUnread ? 'bg-[#FEF3C7]/35' : 'bg-white'
                      }`}
                    >
                      {/* Circular Icon Bubble */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: iconBg }}
                      >
                        {getIconForType(item)}
                      </div>

                      {/* Middle Text Details */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span
                            className={`text-xs truncate ${
                              isUnread ? 'font-extrabold text-[#0F172A]' : 'font-semibold text-[#475569]'
                            }`}
                          >
                            {item.title || 'Platform Notification'}
                          </span>
                          <span className="text-[11px] text-[#94A3B8] shrink-0 font-medium">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <div className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                          {item.message || ''}
                        </div>
                      </div>

                      {/* Unread Amber Indicator Dot */}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0 self-center mt-1" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer (matching Image 1) */}
            <div className="py-2.5 px-4 bg-[#F8FAFC] border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={handleFooterClick}
                className="text-xs font-bold text-[#07166F] hover:text-[#0A2540] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Full Broadcast Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;