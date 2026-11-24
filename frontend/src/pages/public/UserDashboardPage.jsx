import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EduChatbot from '../../components/chatbot/EduChatbot';
import NotificationBell from '../../components/common/NotificationBell';
import {
  LayoutDashboard,
  GraduationCap,
  User,
  ShieldCheck,
  LifeBuoy,
  Menu,
  X,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Lock,
  Building,
  Check,
  Award,
  BookOpen,
  Send,
  HelpCircle,
  LogOut,
  Sparkles,
  Edit3,
  Camera,
  Upload,
  Trash2,
  Building2,
  School,
  Loader2,
  Hash,
  Compass,
  FileText,
  BadgeCheck,
  PhoneCall,
  Bell,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  ThumbsUp,
  Eye,
  EyeOff,
  Laptop,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export const UserDashboardPage = () => {
  const { user: authUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const mainContentRef = useRef(null);

  // Tab navigation state (synced with URL ?tab=...)
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Synchronize activeTab whenever searchParams URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'dashboard';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchParams]);

  // Mobile sidebar drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Profile edit & saving state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Indian States & Cities auto-fetch states
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Comprehensive Student Profile State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    profilePhoto: '',
    state: '',
    stateCode: '',
    city: '',
    residentialAddress: '',
    pincode: '',
    collegeName: '',
    collegeAddress: '',
    collegeType: '',
    rollNumber: '',
    courseName: '',
    branchName: '',
    academicYear: '',
    semester: '',
    cgpa: '',
    admissionYear: '',
    graduationYear: '',
    studentBio: '',
  });

  // Security password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  // Security activity & session query (Real-time)
  const {
    data: securityActivity,
    isLoading: isLoadingSecurity,
    refetch: refetchSecurity,
    isFetching: isFetchingSecurity,
  } = useQuery({
    queryKey: ['security-activity', authUser?.id],
    queryFn: async () => {
      const res = await api.get('/auth/security-activity');
      return res.data?.data;
    },
    enabled: !!authUser,
  });

  // Support ticket form
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: 'Academic Profile Inquiry',
    message: '',
  });

  // Academic & Career Guidance Enquiry Form state
  const [enquiryForm, setEnquiryForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    highestEducation: '12th Standard / PUC / Intermediate',
    currentStream: 'Science (PCM)',
    interestedCourse: 'Engineering (B.Tech / BE)',
    preferredInstitutions: 'Government / Merit Seats',
    queryDetails: '',
  });
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  // Sync tab with URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setMobileSidebarOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch user profile & dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['user-dashboard', authUser?.id],
    queryFn: async () => {
      const res = await api.get('/auth/dashboard');
      return res.data?.data;
    },
    enabled: !!authUser,
  });

  const user = dashboardData?.user || authUser;

  // Real-time broadcast notifications query & dismiss state
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);
  const { data: notificationsData } = useQuery({
    queryKey: ['user-broadcast-notifications', authUser?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications');
        return res.data?.data || [];
      } catch {
        return dashboardData?.notifications || [];
      }
    },
    enabled: !!authUser,
    refetchInterval: 10000,
  });

  const rawNotifications = notificationsData || dashboardData?.notifications || [];
  const notificationsList = Array.isArray(rawNotifications)
    ? rawNotifications
    : Array.isArray(rawNotifications?.data)
    ? rawNotifications.data
    : [];

  const handleDismissNotification = async (notifId) => {
    setDismissedNotifIds((prev) => [...prev, notifId]);
    try {
      await api.patch(`/notifications/${notifId}/read`);
      queryClient.invalidateQueries({ queryKey: ['user-broadcast-notifications', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications', authUser?.id] });
    } catch {
      // ignore network errors
    }
  };

  const activeBroadcasts = notificationsList.filter(
    (n) => n && !n.isRead && !dismissedNotifIds.includes(n.id)
  );

  // Fetch user's support tickets with live status & admin replies
  const {
    data: supportTickets = [],
    isLoading: loadingTickets,
  } = useQuery({
    queryKey: ['user-support-tickets', authUser?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/support-tickets/my');
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!authUser,
    refetchInterval: 10000,
  });

  const [showAllTickets, setShowAllTickets] = useState(false);

  // Show only recent 5 inquiries/replies by default to keep the page neat and concise
  const displayedTickets = useMemo(() => {
    if (!Array.isArray(supportTickets)) return [];
    return showAllTickets ? supportTickets : supportTickets.slice(0, 5);
  }, [supportTickets, showAllTickets]);

  // 1. Fetch Indian States on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const res = await api.get('/public/locations/states');
        if (isMounted && res.data?.success && Array.isArray(res.data?.data)) {
          setStates(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load Indian states:', err);
      } finally {
        if (isMounted) setLoadingStates(false);
      }
    };

    fetchStates();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Auto-fetch Cities whenever stateCode changes
  useEffect(() => {
    let isMounted = true;
    if (!profileForm.stateCode) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await api.get(`/public/locations/cities?stateCode=${profileForm.stateCode}`);
        if (isMounted && res.data?.success && Array.isArray(res.data?.data)) {
          setCities(res.data.data);
        }
      } catch (err) {
        console.error(`Failed to load cities for state ${profileForm.stateCode}:`, err);
      } finally {
        if (isMounted) setLoadingCities(false);
      }
    };

    fetchCities();
    return () => {
      isMounted = false;
    };
  }, [profileForm.stateCode]);

  // 3. Populate profile form with saved profile & backend user data
  useEffect(() => {
    if (isEditingProfile) return; // Do not overwrite form fields while student is actively editing

    if (user) {
      const storageKey = `student_profile_${user.id || user.email || 'default'}`;
      let savedLocal = {};
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) savedLocal = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse saved profile:', e);
      }

      // Parse user location if available (e.g. "Bangalore, Karnataka")
      const locParts = user.location ? user.location.split(',').map((s) => s.trim()) : [];
      const fallbackCity = locParts.length > 1 ? locParts[0] : (locParts[0] || '');
      const fallbackState = locParts.length > 1 ? locParts[1] : '';

      setProfileForm((prev) => {
        const rawPhone = user.phone || savedLocal.phone || prev.phone || '';
        const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
        const rawAltPhone = savedLocal.alternatePhone || prev.alternatePhone || '';
        const cleanAltPhone = rawAltPhone.replace(/\D/g, '').slice(-10);

        return {
          ...prev,
          fullName: user.fullName || savedLocal.fullName || prev.fullName || '',
          email: user.email || prev.email || '',
          phone: cleanPhone,
          alternatePhone: cleanAltPhone,
          profilePhoto: user.avatarUrl || savedLocal.profilePhoto || prev.profilePhoto || '',
          state: savedLocal.state || fallbackState || prev.state || '',
          stateCode: savedLocal.stateCode || prev.stateCode || '',
          city: savedLocal.city || fallbackCity || prev.city || '',
          residentialAddress: savedLocal.residentialAddress || prev.residentialAddress || '',
          pincode: savedLocal.pincode || prev.pincode || '',
          collegeName: savedLocal.collegeName || user.collegeName || prev.collegeName || '',
          collegeAddress: savedLocal.collegeAddress || prev.collegeAddress || '',
          collegeType: savedLocal.collegeType || prev.collegeType || '',
          rollNumber: savedLocal.rollNumber || prev.rollNumber || '',
          courseName: savedLocal.courseName || prev.courseName || '',
          branchName: savedLocal.branchName || prev.branchName || '',
          academicYear: savedLocal.academicYear || prev.academicYear || '',
          semester: savedLocal.semester || prev.semester || '',
          cgpa: savedLocal.cgpa || prev.cgpa || '',
          admissionYear: savedLocal.admissionYear || prev.admissionYear || '',
          graduationYear: savedLocal.graduationYear || prev.graduationYear || '',
          studentBio: savedLocal.studentBio || prev.studentBio || '',
        };
      });

      // Autofetch user details into Enquiry Form
      setEnquiryForm((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName || '',
        email: user.email || prev.email || '',
        phone: user.phone || prev.phone || '',
        location: user.location || prev.location || '',
      }));
    }
  }, [user, isEditingProfile]);

  // Fetch student's own submitted enquiries history
  const { data: userEnquiriesData, refetch: refetchUserEnquiries } = useQuery({
    queryKey: ['my-enquiries', authUser?.id],
    queryFn: async () => {
      const res = await api.get('/enquiries/my');
      return res.data?.data || [];
    },
    enabled: Boolean(authUser?.id),
  });
  const myEnquiries = userEnquiriesData || [];

  // Handle Enquiry Form Submit
  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!enquiryForm.queryDetails.trim()) {
      toast.error('Please describe what guidance or questions you have');
      return;
    }
    setSubmittingEnquiry(true);
    try {
      const res = await api.post('/enquiries', enquiryForm);
      if (res.data?.success) {
        toast.success('Your educational enquiry has been sent to our academic counselors!');
        setEnquiryForm((prev) => ({
          ...prev,
          queryDetails: '',
        }));
        refetchUserEnquiries();
      }
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Profile photo must be less than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({
        ...prev,
        profilePhoto: reader.result,
      }));
      toast.success('Photo preview loaded! Click "Save Changes" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileForm((prev) => ({
      ...prev,
      profilePhoto: '',
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Profile photo removed.');
  };

  // Handle State Selection (Triggers City Auto-fetch)
  const handleStateChange = (e) => {
    const selectedIso = e.target.value;
    const foundState = states.find((s) => s.isoCode === selectedIso);
    setProfileForm((prev) => ({
      ...prev,
      stateCode: selectedIso,
      state: foundState ? foundState.name : selectedIso,
      city: '', // Reset city so user selects from new state cities
    }));
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Handle Profile Update & Save
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileForm.fullName.trim()) {
      toast.error('Full legal name is required');
      return;
    }

    const rawPhoneDigits = profileForm.phone ? profileForm.phone.replace(/\D/g, '') : '';
    const normalizedPhone = rawPhoneDigits.length > 10 ? rawPhoneDigits.slice(-10) : rawPhoneDigits;

    const rawAltDigits = profileForm.alternatePhone ? profileForm.alternatePhone.replace(/\D/g, '') : '';
    const normalizedAltPhone = rawAltDigits.length > 10 ? rawAltDigits.slice(-10) : rawAltDigits;

    if (normalizedPhone && normalizedPhone.length !== 10) {
      toast.error('Primary contact must be a valid 10-digit mobile number');
      return;
    }

    if (normalizedAltPhone && normalizedAltPhone.length !== 10) {
      toast.error('Alternate contact must be a valid 10-digit mobile number');
      return;
    }

    if (profileForm.pincode && !/^\d{6}$/.test(profileForm.pincode.trim())) {
      toast.error('Pincode must be a 6-digit postal code');
      return;
    }

    setIsSavingProfile(true);

    try {
      const locationParts = [profileForm.city?.trim(), profileForm.state?.trim()].filter(Boolean);
      const locationStr = locationParts.length > 0 ? locationParts.join(', ') : (user?.location || 'India');

      // 1. Persist core identity to PostgreSQL via backend PATCH /api/auth/profile
      const patchRes = await api.patch('/auth/profile', {
        fullName: profileForm.fullName.trim(),
        phone: normalizedPhone || null,
        location: locationStr,
        avatarUrl: profileForm.profilePhoto || null,
      });

      const updatedUser = patchRes.data?.data || {
        ...user,
        fullName: profileForm.fullName.trim(),
        phone: normalizedPhone || null,
        location: locationStr,
        avatarUrl: profileForm.profilePhoto || null,
      };

      // 2. Persist extended academic & college credentials to localStorage
      const storageKey = `student_profile_${user?.id || user?.email || 'default'}`;
      const payloadToSave = {
        ...profileForm,
        fullName: updatedUser.fullName,
        phone: normalizedPhone,
        alternatePhone: normalizedAltPhone,
        city: profileForm.city || '',
        state: profileForm.state || '',
        location: locationStr,
        profilePhoto: updatedUser.avatarUrl || profileForm.profilePhoto,
      };
      localStorage.setItem(storageKey, JSON.stringify(payloadToSave));

      // 3. Update AuthContext & localStorage globally
      if (updateUser) {
        updateUser(updatedUser);
      }

      // 4. Update React Query cached user dashboard data directly for immediate UI sync
      queryClient.setQueryData(['user-dashboard', authUser?.id], (old) => {
        if (!old) return { user: updatedUser };
        return { ...old, user: { ...old.user, ...updatedUser } };
      });

      // 5. Invalidate React Query cache using TanStack Query v5 object syntax
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });

      // 6. Keep profileForm state aligned with confirmed values
      setProfileForm((prev) => ({
        ...prev,
        ...payloadToSave,
      }));

      setIsEditingProfile(false);
      toast.success('Student profile, college credentials & photo updated successfully!');
    } catch (err) {
      console.warn('Backend update failed, saving locally:', err);
      const storageKey = `student_profile_${user?.id || user?.email || 'default'}`;
      const payloadToSave = {
        ...profileForm,
        phone: normalizedPhone,
        alternatePhone: normalizedAltPhone,
      };
      localStorage.setItem(storageKey, JSON.stringify(payloadToSave));
      setIsEditingProfile(false);
      toast.success('Profile changes saved locally!');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Update (Real API)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }
    try {
      setIsChangingPassword(true);
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Password updated successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        queryClient.invalidateQueries({ queryKey: ['security-activity', authUser?.id] });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.friendlyMessage || 'Failed to update password. Please check your current password.';
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle 2FA Toggle (Real API)
  const handleToggle2FA = async () => {
    const nextState = !securityActivity?.twoFactorEnabled;
    try {
      setIsToggling2FA(true);
      const res = await api.post('/auth/toggle-2fa', { enabled: nextState });
      if (res.data?.success) {
        toast.success(nextState ? 'Two-Factor Authentication activated!' : 'Two-Factor Authentication deactivated.');
        queryClient.invalidateQueries({ queryKey: ['security-activity', authUser?.id] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update 2FA status');
    } finally {
      setIsToggling2FA(false);
    }
  };

  // Handle Revoke Other Sessions (Real API)
  const handleRevokeSessions = async () => {
    try {
      setIsRevokingSessions(true);
      const res = await api.post('/auth/revoke-sessions');
      if (res.data?.success) {
        toast.success('All other sessions terminated successfully!');
        queryClient.invalidateQueries({ queryKey: ['security-activity', authUser?.id] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate other sessions');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const [submittingSupport, setSubmittingSupport] = useState(false);

  // Handle Support Ticket Submit (Real API with instant refresh)
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      toast.error('Please enter a subject and your message');
      return;
    }
    try {
      setSubmittingSupport(true);
      const res = await api.post('/support-tickets', {
        subject: supportForm.subject.trim(),
        category: supportForm.category || 'Academic Profile Inquiry',
        message: supportForm.message.trim(),
        priority: 'MEDIUM',
      });
      if (res.data?.success) {
        toast.success('Your support ticket has been dispatched to the EduCareus Admin Desk!');
        setSupportForm({ subject: '', category: 'Academic Profile Inquiry', message: '' });
        queryClient.invalidateQueries({ queryKey: ['user-support-tickets', authUser?.id] });
      }
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to submit support ticket. Please try again.');
    } finally {
      setSubmittingSupport(false);
    }
  };

  // Review submission state for Admin Problem Resolution
  const [reviewForm, setReviewForm] = useState({
    name: '',
    role: 'Verified Student Scholar',
    institution: '',
    rating: 5,
    problemType: 'Direct College Fee Payment & Challan Verification',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // 1.2 Fetch existing review if scholar has previously submitted (one review per user constraint)
  const { data: existingScholarReview, refetch: refetchScholarReview } = useQuery({
    queryKey: ['my-existing-scholar-review', authUser?.id, authUser?.fullName],
    queryFn: async () => {
      if (!authUser?.id && !authUser?.fullName) return null;
      const res = await api.get('/public/reviews/my', {
        params: {
          userId: authUser?.id,
          name: authUser?.fullName,
        },
      });
      return res.data?.data || null;
    },
    enabled: Boolean(authUser?.id || authUser?.fullName),
    staleTime: 10 * 1000,
  });

  // Sync authenticated scholar name & college, or load existing review to allow replacement
  useEffect(() => {
    if (existingScholarReview) {
      setReviewForm({
        name: existingScholarReview.name || authUser?.fullName || '',
        role: existingScholarReview.role || 'Verified Student Scholar',
        institution: existingScholarReview.institution || '',
        rating: existingScholarReview.rating || 5,
        problemType: existingScholarReview.problemType || 'Direct College Fee Payment & Challan Verification',
        comment: existingScholarReview.comment || '',
      });
    } else if (authUser) {
      setReviewForm((prev) => ({
        ...prev,
        name: prev.name || authUser.fullName || '',
        institution: prev.institution || (profileForm.courseName ? `${profileForm.courseName}${profileForm.collegeName ? `, ${profileForm.collegeName}` : ''}` : profileForm.collegeName || ''),
      }));
    }
  }, [existingScholarReview, authUser, profileForm.collegeName, profileForm.courseName]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error('Please describe how our admin helped get you through your problem.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await api.post('/public/reviews', {
        userId: authUser?.id || null,
        name: reviewForm.name.trim() || authUser?.fullName || 'Verified Scholar',
        role: reviewForm.role.trim() || 'Verified Student Scholar',
        institution: reviewForm.institution.trim() || null,
        rating: reviewForm.rating,
        problemType: reviewForm.problemType,
        comment: reviewForm.comment.trim(),
      });
      const isReplaced = res.data?.replaced;
      toast.success(
        res.data?.message ||
          (isReplaced
            ? 'Your previous review has been successfully replaced and updated!'
            : 'Thank you! Your rating & review have been submitted and posted to the homepage!')
      );
      refetchScholarReview();
      queryClient.invalidateQueries({ queryKey: ['my-existing-scholar-review'] });
      queryClient.invalidateQueries({ queryKey: ['public-testimonials'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Clean Sidebar navigation options
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & key metrics',
    },
    {
      id: 'enquiry',
      label: 'Course & Career Enquiry',
      icon: HelpCircle,
      description: 'Guidance after 12th or degree',
    },
    {
      id: 'profile',
      label: 'Student Profile',
      icon: User,
      description: 'Personal & college details',
    },
    {
      id: 'security',
      label: 'Security & Access',
      icon: ShieldCheck,
      description: 'Password, sessions & OTP',
    },
    {
      id: 'support',
      label: 'Help & Support',
      icon: LifeBuoy,
      description: 'Helpline & queries',
    },
    {
      id: 'review',
      label: 'Rate & Review Admin',
      icon: Star,
      description: 'Rate problem resolution',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <LoadingSpinner text="Loading Student Portal & Dashboard..." />
      </div>
    );
  }

  return (
    <div className="h-full flex-1 w-full flex flex-col bg-slate-50/70 overflow-hidden min-h-0">
      {/* ─────────────────────────────────────────────────────────────
          MOBILE TOP SUB-HEADER BAR (Sticky under main navbar)
      ────────────────────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-16 sm:top-20 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors flex items-center gap-2 text-xs font-bold"
              aria-label="Open portal navigation menu"
            >
              <Menu className="w-5 h-5 text-amber-400" />
              <span>Menu</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">
                {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || authUser?.role === 'ADMIN' || authUser?.role === 'SUPER_ADMIN') && (
              <a
                href="/admin-users.html"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-xs"
                title="Open Admin User Verification Directory"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Users</span>
              </a>
            )}

            <NotificationBell onTabSelect={handleTabChange} />

            <button
              onClick={() => handleTabChange('profile')}
              className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center overflow-hidden">
                {profileForm.profilePhoto || authUser?.avatarUrl ? (
                  <img
                    src={profileForm.profilePhoto || authUser?.avatarUrl}
                    alt={profileForm.fullName || 'Student'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileForm.fullName?.charAt(0).toUpperCase() || 'S'
                )}
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate">
                {profileForm.fullName || authUser?.fullName || 'Student'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Fast Tab Strip */}
        <div className="px-2 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE SLIDE-OVER SIDEBAR DRAWER
      ────────────────────────────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Pane */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10 flex flex-col p-5 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black overflow-hidden">
                  {profileForm.profilePhoto || user?.avatarUrl ? (
                    <img
                      src={profileForm.profilePhoto || user?.avatarUrl}
                      alt={profileForm.fullName || 'Student'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-slate-950" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm leading-tight">Student Portal</h3>
                  <p className="text-[11px] text-slate-500">Educarrus Scholar</p>
                </div>
              </div>

              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info Card in Drawer */}
            <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Signed In As</p>
              <p className="font-black text-slate-900 text-xs truncate mt-0.5">
                {profileForm.fullName || user?.fullName || 'Student Scholar'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md w-fit ${
                user?.verificationStatus === 'VERIFIED'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-amber-800 bg-amber-50'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                {user?.verificationStatus === 'VERIFIED' ? 'Verified Scholar' : 'Pending Verification'}
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-slate-900 text-amber-400 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div className="flex-1">
                      <p className="leading-none">{item.label}</p>
                      <p className={`text-[10px] mt-0.5 font-normal ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Logout Footer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || authUser?.role === 'ADMIN' || authUser?.role === 'SUPER_ADMIN') && (
                <a
                  href="/admin-users.html"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#07166F] text-white hover:bg-[#051152] transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#FFB52E]" />
                  <span>Admin User Directory</span>
                </a>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA (Bootstrap Fluid + Responsive 100% Layout)
      ────────────────────────────────────────────────────────────── */}
      <div className="container-fluid px-3 sm:px-6 lg:px-8 py-3 lg:py-6 flex-1 w-full max-w-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 w-full flex-1 min-h-0 overflow-hidden">
          {/* ═════════════════════════════════════════════════════════
              DESKTOP SIDEBAR (Fixed Left Column)
          ══════════════════════════════════════════════════════════ */}
          <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 space-y-4 pb-8 pr-1 h-full overflow-y-auto no-scrollbar">
              {/* Student Identity Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0 overflow-hidden">
                    {profileForm.profilePhoto || user?.avatarUrl ? (
                      <img
                        src={profileForm.profilePhoto || user?.avatarUrl}
                        alt={profileForm.fullName || 'Student'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profileForm.fullName?.charAt(0).toUpperCase() || 'S'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 text-sm truncate">
                      {profileForm.fullName || user?.fullName || 'Student Scholar'}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      user?.verificationStatus === 'VERIFIED'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {user?.verificationStatus === 'VERIFIED' ? 'Verified Scholar' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                {/* College Info in Sidebar */}
                <div className="mt-3 pt-1 text-[11px] space-y-1">
                  {profileForm.collegeName ? (
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                      <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{profileForm.collegeName}</span>
                    </div>
                  ) : null}
                  {profileForm.courseName ? (
                    <div className="flex items-center gap-1.5 text-slate-500 truncate">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{profileForm.courseName}</span>
                    </div>
                  ) : null}
                  {!profileForm.collegeName && !profileForm.courseName && (
                    <p className="text-[11px] text-slate-400 italic">No college details linked yet</p>
                  )}
                </div>
              </div>

              {/* Sidebar Navigation Card */}
              <nav className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-xs space-y-1">
                <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Portal Navigation
                </p>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left group cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-amber-400 shadow-md translate-x-1'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-slate-800 text-amber-400'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="leading-tight truncate">{item.label}</p>
                        <p className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                          {item.description}
                        </p>
                      </div>
                      {isActive && <div className="w-1.5 h-6 rounded-full bg-amber-400" />}
                    </button>
                  );
                })}

                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || authUser?.role === 'ADMIN' || authUser?.role === 'SUPER_ADMIN') && (
                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href="/admin-users.html"
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left bg-[#07166F] text-white hover:bg-[#051152] shadow-sm group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/15 text-[#FFB52E]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="leading-tight truncate text-white font-black">User Directory</p>
                        <p className="text-[10px] text-blue-200 font-normal truncate mt-0.5">
                          Verify Users & Scholars
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#FFB52E] group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              </nav>

              {/* Scholar Verification Status Card */}
              <div className={`rounded-2xl border p-4 text-xs space-y-2 ${
                user?.verificationStatus === 'VERIFIED'
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className={`w-4 h-4 ${user?.verificationStatus === 'VERIFIED' ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span className={user?.verificationStatus === 'VERIFIED' ? 'text-amber-800' : 'text-slate-700'}>
                    {user?.verificationStatus === 'VERIFIED' ? 'Authenticated Scholar' : 'Pending Verification'}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${user?.verificationStatus === 'VERIFIED' ? 'text-amber-900/80' : 'text-slate-500'}`}>
                  {user?.verificationStatus === 'VERIFIED'
                    ? 'Your academic record and enrollment credentials are officially registered on Educarrus.'
                    : 'Complete your student profile to authenticate your academic record on Educarrus.'}
                </p>
              </div>
          </aside>

          {/* ═════════════════════════════════════════════════════════
              DYNAMIC TAB VIEW CONTAINER (Scrollable Right Column)
          ══════════════════════════════════════════════════════════ */}
          <main ref={mainContentRef} className="flex-1 min-w-0 w-full space-y-6 pb-24 lg:pb-12 pr-1.5 pl-0.5 h-full overflow-y-auto">
            {/* ═════════════════════════════════════════════════════════
                VIEW 1: DASHBOARD (OVERVIEW)
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* 1. Header Hero Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-10 -top-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shrink-0 overflow-hidden border-2 border-white/20">
                        {profileForm.profilePhoto || user?.avatarUrl ? (
                          <img
                            src={profileForm.profilePhoto || user?.avatarUrl}
                            alt={profileForm.fullName || user?.fullName || 'Student'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950" />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Welcome, {profileForm.fullName || user?.fullName || 'Student Scholar'}!
                          </h1>

                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            Student Scholar
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            user?.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {user?.verificationStatus === 'VERIFIED' ? 'Verified Scholar' : 'Pending Verification'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {user?.email}
                          </span>

                          {(profileForm.phone || user?.phone) && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              +91 {profileForm.phone || user?.phone}
                            </span>
                          )}

                          {(profileForm.city || profileForm.state || user?.location) && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {profileForm.city && profileForm.state
                                ? `${profileForm.city}, ${profileForm.state}`
                                : profileForm.city || profileForm.state || user?.location}
                            </span>
                          )}

                          {profileForm.collegeName && (
                            <span className="flex items-center gap-1.5 text-amber-300">
                              <Building className="w-3.5 h-3.5" />
                              {profileForm.collegeName}
                            </span>
                          )}

                          {user?.createdAt && (
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              Scholar Since{' '}
                              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Screenshot 1 items removed: [View & Edit Profile] and [Security Settings] buttons removed */}
                  </div>
                </div>

                {/* 📢 Broadcast Notifications from Admin */}
                {activeBroadcasts && activeBroadcasts.length > 0 && (
                  <div className="space-y-3">
                    {activeBroadcasts.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/5 border border-amber-400/40 p-5 sm:p-6 shadow-sm backdrop-blur-xs"
                      >
                        {/* Ambient decorative glow */}
                        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                              <Bell className="w-5 h-5 text-slate-950" />
                            </div>

                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                                  Official Announcement
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {new Date(notif.createdAt).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <h3 className="text-base sm:text-lg font-heading font-black text-slate-900 tracking-tight leading-snug">
                                {notif.title}
                              </h3>

                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {notif.message}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-1 sm:pt-0">
                            {notif.link && notif.link !== '/userdashboard?tab=dashboard' && (
                              <a
                                href={notif.link}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-2xs"
                              >
                                <span>View Details</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDismissNotification(notif.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                              title="Dismiss announcement"
                              aria-label="Dismiss announcement"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 2. Key Student Metrics (Screenshot 2 item removed: Security Level stat card removed) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    title="Account Verification"
                    value={user?.verificationStatus || 'UNVERIFIED'}
                    icon={ShieldCheck}
                    subtitle={
                      user?.verificationStatus === 'VERIFIED'
                        ? 'Academic status authenticated'
                        : 'Profile verification pending'
                    }
                  />

                  <StatCard
                    title="Registered Degree"
                    value={
                      profileForm.courseName
                        ? profileForm.courseName.length > 24
                          ? profileForm.courseName.slice(0, 24) + '...'
                          : profileForm.courseName
                        : 'Not Provided'
                    }
                    icon={GraduationCap}
                    subtitle={profileForm.branchName || (profileForm.courseName ? 'Specialization' : 'No course linked yet')}
                  />

                  <StatCard
                    title="Academic Year"
                    value={profileForm.academicYear || 'Not Provided'}
                    icon={BookOpen}
                    subtitle={profileForm.semester ? `${profileForm.semester} Active Session` : 'No semester linked yet'}
                  />
                </div>

                {/* 3. Quick Action Shortcuts Banner */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Need to update your college credentials or contact number?
                      </h3>
                      <p className="text-xs text-slate-500">
                        You can update your academic details, profile photo, and college info anytime in your student profile.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleTabChange('profile')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shrink-0 cursor-pointer"
                    >
                      Update Profile
                    </button>
                    <button
                      onClick={() => handleTabChange('support')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
                    >
                      Contact Support
                    </button>
                  </div>
                </div>

                {/* 4. Academic Details & Security Overview 2-Col Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Academic Profile Summary Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Academic Credentials</h4>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        profileForm.collegeName
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-amber-700 bg-amber-50'
                      }`}>
                        {profileForm.collegeName ? 'Enrolled' : 'Pending Details'}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Institution</span>
                        <span className="text-slate-900 font-bold truncate max-w-[65%] text-right">
                          {profileForm.collegeName || 'Not Provided'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Course & Branch</span>
                        <span className="text-slate-900 font-bold truncate max-w-[65%] text-right">
                          {profileForm.courseName
                            ? `${profileForm.courseName}${profileForm.branchName ? ` (${profileForm.branchName})` : ''}`
                            : 'Not Provided'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Current Session</span>
                        <span className="text-slate-900 font-bold">
                          {profileForm.academicYear
                            ? `${profileForm.academicYear}${profileForm.semester ? ` (${profileForm.semester})` : ''}`
                            : 'Not Provided'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Academic Performance</span>
                        <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                          {profileForm.cgpa ? profileForm.cgpa : 'Not Provided'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTabChange('profile')}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {profileForm.collegeName ? 'View Complete Profile' : 'Complete Academic Profile'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Security & Access Overview Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Account Security Status</h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Protected
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">Email OTP Authentication</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Verified
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">HTTP-Only JWT Cookie Encryption</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">Password Protection</span>
                        <span className="text-slate-900 font-bold text-[11px]">Enforced</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">Session Status</span>
                        <span className="text-emerald-700 font-bold text-[11px]">Single Active Session</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTabChange('security')}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Manage Security Settings
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                VIEW: COURSE & CAREER GUIDANCE ENQUIRY (POST 12TH / DEGREE)
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'enquiry' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>100% Free Scholar Counseling & Career Advisory</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                        Course & Career Guidance Enquiry
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                        Unsure whether what to do after 12th class, intermediate, or your college degree? Fill in your educational background and career goals below to receive personalized guidance from our senior academic counselors.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-xs space-y-1.5 shrink-0 max-w-xs">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-emerald-400" /> Direct Counselor Review
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        Your request directly reaches our Admin Advisory Desk. Counselors analyze your profile and contact you with tailored college options, fee structures, and scholarship insights.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enquiry Submission Form */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-amber-500" />
                      <span>Academic Background & Career Inquiry Form</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your identity credentials have been autofetched from your verified account. Update any details and specify your guidance questions below.
                    </p>
                  </div>

                  <form onSubmit={handleEnquirySubmit} className="space-y-6">
                    {/* Section 1: Autofetched Student Contact Information */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500" />
                          <span>Student Details (Autofetched)</span>
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Autofetched from your profile
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={enquiryForm.fullName}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, fullName: e.target.value })}
                            placeholder="Student Name"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                          <input
                            type="email"
                            required
                            value={enquiryForm.email}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                            placeholder="student@example.com"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Contact Phone</label>
                          <input
                            type="tel"
                            required
                            value={enquiryForm.phone}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                            placeholder="+91 98765 00000"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">City / State</label>
                          <input
                            type="text"
                            value={enquiryForm.location}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, location: e.target.value })}
                            placeholder="e.g., Bengaluru, Karnataka"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Education Completed & Career Aspirations */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Educational Background & Goals</span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Completed Education */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Highest / Completed Education <span className="text-amber-600">*</span>
                          </label>
                          <select
                            required
                            value={enquiryForm.highestEducation}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, highestEducation: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="12th Standard / PUC / Intermediate">12th Standard / PUC / Intermediate</option>
                            <option value="Degree / Undergraduate Completed">Degree / Undergraduate Completed</option>
                            <option value="Degree / Undergraduate (Ongoing / Final Year)">Degree / Undergraduate (Ongoing / Final Year)</option>
                            <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
                            <option value="10th Standard / Matriculation">10th Standard / Matriculation</option>
                            <option value="Post Graduation / Master's Degree">Post Graduation / Master's Degree</option>
                            <option value="Other Certification">Other Qualification</option>
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Select the highest education qualification you have currently completed or are attending.
                          </span>
                        </div>

                        {/* Stream / Field */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Stream / Major Subject <span className="text-amber-600">*</span>
                          </label>
                          <select
                            required
                            value={enquiryForm.currentStream}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, currentStream: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="Science (PCM - Physics, Chemistry, Maths)">Science (PCM - Physics, Chemistry, Maths)</option>
                            <option value="Science (PCB - Physics, Chemistry, Biology)">Science (PCB - Physics, Chemistry, Biology)</option>
                            <option value="Science (PCMB)">Science (PCMB)</option>
                            <option value="Commerce (with Mathematics / Accounts)">Commerce (with Mathematics / Accounts)</option>
                            <option value="Commerce (General / Economics)">Commerce (General / Economics)</option>
                            <option value="Arts & Humanities">Arts & Humanities</option>
                            <option value="Engineering / Computer Science">Engineering / Computer Science</option>
                            <option value="Computer Applications / IT (BCA / B.Sc)">Computer Applications / IT (BCA / B.Sc)</option>
                            <option value="Business Administration / BBA">Business Administration / BBA</option>
                            <option value="Pharmacy / Paramedical">Pharmacy / Paramedical</option>
                            <option value="Other Stream">Other Stream</option>
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Specify your subject stream (PCM, PCB, Commerce, Arts, etc.).
                          </span>
                        </div>

                        {/* What to pursue */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            What Do You Wish to Pursue? <span className="text-amber-600">*</span>
                          </label>
                          <select
                            required
                            value={enquiryForm.interestedCourse}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, interestedCourse: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="Engineering (B.Tech / BE - CSE, AI, Mech, Civil, ECE)">Engineering (B.Tech / BE - CSE, AI, Mech, Civil, ECE)</option>
                            <option value="Medical Sciences (MBBS / BDS / BAMS / BHMS / Nursing)">Medical Sciences (MBBS / BDS / BAMS / BHMS / Nursing)</option>
                            <option value="Pharmacy & Pharmaceutical Sciences (B.Pharm / Pharm.D)">Pharmacy & Pharmaceutical Sciences (B.Pharm / Pharm.D)</option>
                            <option value="Management & Commerce (BBA / MBA / Finance / Marketing)">Management & Commerce (BBA / MBA / Finance / Marketing)</option>
                            <option value="Computer Applications & IT (BCA / MCA / Data Science)">Computer Applications & IT (BCA / MCA / Data Science)</option>
                            <option value="Pure & Applied Sciences (B.Sc / M.Sc)">Pure & Applied Sciences (B.Sc / M.Sc)</option>
                            <option value="Law & Corporate Law (BA LLB / BBA LLB)">Law & Corporate Law (BA LLB / BBA LLB)</option>
                            <option value="Civil Services & Govt Competitive Exams (UPSC, Banking)">Civil Services & Govt Competitive Exams (UPSC, Banking)</option>
                            <option value="Study Abroad (USA, UK, Canada, Australia, Europe)">Study Abroad (USA, UK, Canada, Australia, Europe)</option>
                            <option value="Job-Oriented Diploma / Tech Certification">Job-Oriented Diploma / Tech Certification</option>
                            <option value="Confused / Need Advice on Career Options">Confused / Need Advice on Career Options</option>
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Select the academic course or career pathway you are interested in exploring.
                          </span>
                        </div>

                        {/* Preferred Institution */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Preferred College / Institution Category
                          </label>
                          <select
                            value={enquiryForm.preferredInstitutions}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, preferredInstitutions: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="Government / Merit Seats (Subsidized Fees)">Government / Merit Seats (Subsidized Fees)</option>
                            <option value="Top Tier Private / Deemed Universities">Top Tier Private / Deemed Universities</option>
                            <option value="Affiliated State University Colleges">Affiliated State University Colleges</option>
                            <option value="Institutes offering Scholarship / Fee Waivers">Institutes offering Scholarship / Fee Waivers</option>
                            <option value="Flexible / Need Counselor Recommendations">Flexible / Need Counselor Recommendations</option>
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Choose your preferred college category or financial aid requirement.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Questions & Suggestions */}
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-800">
                        Describe What You Need Guidance On (Questions & Suggestions) <span className="text-amber-600">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={enquiryForm.queryDetails}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, queryDetails: e.target.value })}
                        placeholder="e.g. I have completed 12th class with 82% in Science PCM. I am confused whether to pursue B.Tech Computer Science or BCA. Which career path has better campus placements? What entrance exams should I apply for? Can I get scholarship support on Educarrus?"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-amber-500 leading-relaxed"
                      />
                      <span className="text-[11px] text-slate-400 block">
                        Provide as much context as possible (percentage, subjects of interest, budget constraints) so our counselors can provide precise recommendations.
                      </span>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submittingEnquiry}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>{submittingEnquiry ? 'Submitting to Counselors...' : 'Submit Career & Education Enquiry'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section 4: My Submitted Enquiries History */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-500" />
                        <span>My Submitted Enquiries & Counselor Feedback</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Track status and responses from Educarrus academic advisors in real-time.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                      {myEnquiries.length} {myEnquiries.length === 1 ? 'Enquiry' : 'Enquiries'}
                    </span>
                  </div>

                  {myEnquiries.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Enquiries Submitted Yet</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Submit your first career inquiry using the form above. Our academic counselors will review your background and provide guidance.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myEnquiries.map((item) => {
                        const statusConfig = {
                          PENDING: { label: 'Pending Review', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                          IN_PROGRESS: { label: 'In Progress / Counselor Contacted', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                          RESOLVED: { label: 'Counseling Completed', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                          CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                        };
                        const cfg = statusConfig[item.status] || statusConfig.PENDING;

                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                              <div>
                                <span className="text-xs font-black text-slate-900 block">
                                  {item.highestEducation} &rarr; {item.interestedCourse}
                                </span>
                                {item.currentStream && (
                                  <span className="text-[11px] text-slate-500">
                                    Current Stream: {item.currentStream}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-slate-700 leading-relaxed font-medium">
                              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-0.5 text-slate-500">
                                Your Inquiry / Question:
                              </span>
                              "{item.queryDetails}"
                            </div>

                            {/* Counselor Recommendations / Admin Notes */}
                            {item.adminNotes && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  Counselor Advice & Recommendations:
                                </span>
                                <p className="text-xs text-emerald-800 whitespace-pre-wrap leading-relaxed">
                                  {item.adminNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                VIEW 2: STUDENT PROFILE (Comprehensive & Enhanced)
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Profile Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      Student Profile & Academic Record
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage your profile photo, college credentials, personal contact, and location.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-sm self-start sm:self-auto cursor-pointer"
                  >
                    {isEditingProfile ? (
                      <>
                        <X className="w-4 h-4" />
                        Cancel Editing
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        Edit Profile Information
                      </>
                    )}
                  </button>
                </div>

                {/* Main Profile Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (Span 2): Profile Overview or Edit Form */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Top Identity Header Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      {/* Avatar with Upload Trigger */}
                      <div className="relative group shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-3xl sm:text-4xl shadow-md border-4 border-slate-100 overflow-hidden">
                          {profileForm.profilePhoto || user?.avatarUrl ? (
                            <img
                              src={profileForm.profilePhoto || user?.avatarUrl}
                              alt={profileForm.fullName || 'Student'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            profileForm.fullName?.charAt(0).toUpperCase() || 'S'
                          )}
                        </div>

                        {isEditingProfile && (
                          <div className="mt-2.5 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 text-[10px] font-bold hover:bg-amber-500 hover:text-slate-950 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Camera className="w-3 h-3" />
                              Change
                            </button>
                            {profileForm.profilePhoto && (
                              <button
                                type="button"
                                onClick={handleRemovePhoto}
                                className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Header Details */}
                      <div className="flex-1 text-center sm:text-left min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className="text-xl font-black text-slate-900 truncate">
                            {profileForm.fullName || user?.fullName || 'Student Scholar'}
                          </h3>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            user?.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <Check className="w-3 h-3" />
                            {user?.verificationStatus === 'VERIFIED' ? 'Verified Scholar' : 'Pending Verification'}
                          </span>
                        </div>

                        {profileForm.courseName || profileForm.rollNumber ? (
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {[profileForm.courseName, profileForm.rollNumber].filter(Boolean).join(' • ')}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No course or roll number added yet</p>
                        )}

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-slate-500">
                          {profileForm.collegeName ? (
                            <span className="flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-amber-600" />
                              <span className="truncate max-w-[280px]">{profileForm.collegeName}</span>
                            </span>
                          ) : null}
                          {(profileForm.city || profileForm.state) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {profileForm.city && profileForm.state
                                ? `${profileForm.city}, ${profileForm.state}`
                                : profileForm.city || profileForm.state}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* EDIT MODE: Interactive Form */}
                    {isEditingProfile ? (
                      <form
                        onSubmit={handleProfileSubmit}
                        className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-8 shadow-xs"
                      >
                        {/* 1. College & Academic Details Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <School className="w-4 h-4 text-amber-600" />
                            <h4 className="font-black text-slate-900 text-sm">
                              College & Academic Credentials
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="sm:col-span-2">
                              <label className="font-bold text-slate-700 block mb-1">
                                College / University Full Name
                              </label>
                              <input
                                type="text"
                                value={profileForm.collegeName}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, collegeName: e.target.value })
                                }
                                placeholder="e.g., Indian Institute of Information Technology"
                                className="w-full font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-sm"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="font-bold text-slate-700 block mb-1">
                                College Campus Address
                              </label>
                              <input
                                type="text"
                                value={profileForm.collegeAddress}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, collegeAddress: e.target.value })
                                }
                                placeholder="e.g., 26/C Electronics City Phase 1, Hosur Road, Bangalore"
                                className="w-full text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Institution / College Type
                              </label>
                              <select
                                value={profileForm.collegeType}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, collegeType: e.target.value })
                                }
                                className="w-full font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              >
                                <option value="">Select Institution Type</option>
                                <option value="Autonomous Institute / Deemed University">
                                  Autonomous Institute / Deemed University
                                </option>
                                <option value="Central University / IIT / NIT">
                                  Central University / IIT / NIT
                                </option>
                                <option value="State Government University / College">
                                  State Government University / College
                                </option>
                                <option value="Private Recognized College">
                                  Private Recognized College
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Student Roll / Enrollment Number
                              </label>
                              <input
                                type="text"
                                value={profileForm.rollNumber}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, rollNumber: e.target.value })
                                }
                                placeholder="e.g., 2024-CSE-0842"
                                className="w-full font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="font-bold text-slate-700 block mb-1">
                                Degree / Course Name
                              </label>
                              <input
                                type="text"
                                value={profileForm.courseName}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, courseName: e.target.value })
                                }
                                placeholder="e.g., B.Tech, BCA, MBBS, etc."
                                className="w-full font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Personal & Contact Details Section (With Auto-fetch City API) */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <User className="w-4 h-4 text-amber-600" />
                            <h4 className="font-black text-slate-900 text-sm">
                              Personal Contact & Residential Location
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Full Legal Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={profileForm.fullName}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, fullName: e.target.value })
                                }
                                placeholder="Your full legal name"
                                className="w-full font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Registered Email Address
                              </label>
                              <div className="w-full font-semibold text-slate-500 bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                <span className="truncate">{user?.email || profileForm.email}</span>
                                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                Email verified & tied to your login credentials
                              </span>
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Primary Mobile Number
                              </label>
                              <input
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, phone: e.target.value })
                                }
                                placeholder="10-digit mobile number"
                                className="w-full font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Alternate / Guardian Phone
                              </label>
                              <input
                                type="tel"
                                value={profileForm.alternatePhone}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, alternatePhone: e.target.value })
                                }
                                placeholder="Parent/Guardian 10-digit number"
                                className="w-full font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              />
                            </div>

                            {/* State Dropdown (Dynamic API) */}
                            <div>
                              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                                <span>State of Residence *</span>
                                {loadingStates && (
                                  <span className="text-[10px] text-amber-600 flex items-center gap-1 font-normal">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Loading states...
                                  </span>
                                )}
                              </label>
                              <select
                                value={profileForm.stateCode}
                                onChange={handleStateChange}
                                className="w-full font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              >
                                <option value="">Select Indian State</option>
                                {states.map((st) => (
                                  <option key={st.isoCode || st.name} value={st.isoCode}>
                                    {st.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* City Dropdown (Auto-fetched via API based on State) */}
                            <div>
                              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                                <span>City (Auto-fetched) *</span>
                                {loadingCities && (
                                  <span className="text-[10px] text-amber-600 flex items-center gap-1 font-normal">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Loading cities...
                                  </span>
                                )}
                              </label>
                              {cities.length > 0 ? (
                                <select
                                  value={profileForm.city}
                                  onChange={(e) =>
                                    setProfileForm({ ...profileForm, city: e.target.value })
                                  }
                                  className="w-full font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                                >
                                  <option value="">Select City</option>
                                  {profileForm.city && !cities.some((ct) => ct.name.toLowerCase() === profileForm.city.toLowerCase()) && (
                                    <option value={profileForm.city}>{profileForm.city}</option>
                                  )}
                                  {cities.map((ct, idx) => (
                                    <option key={`${ct.name}-${idx}`} value={ct.name}>
                                      {ct.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={profileForm.city}
                                  onChange={(e) =>
                                    setProfileForm({ ...profileForm, city: e.target.value })
                                  }
                                  placeholder={
                                    loadingCities
                                      ? 'Fetching cities for selected state...'
                                      : profileForm.stateCode
                                      ? 'Type or select city'
                                      : 'Select state first'
                                  }
                                  disabled={loadingCities}
                                  className="w-full font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                                />
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <label className="font-bold text-slate-700 block mb-1">
                                Full Residential Street Address
                              </label>
                              <input
                                type="text"
                                value={profileForm.residentialAddress}
                                onChange={(e) =>
                                  setProfileForm({
                                    ...profileForm,
                                    residentialAddress: e.target.value,
                                  })
                                }
                                placeholder="House / Flat No., Street, Area, Landmark"
                                className="w-full font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Postal Pincode (6 Digits)
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                value={profileForm.pincode}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, pincode: e.target.value })
                                }
                                placeholder="e.g., 560100"
                                className="w-full font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Student Bio & Personal Statement */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <h4 className="font-black text-slate-900 text-sm">
                              Student Bio & Academic Aspirations
                            </h4>
                          </div>

                          <div>
                            <textarea
                              rows={3}
                              value={profileForm.studentBio}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, studentBio: e.target.value })
                              }
                              placeholder="Describe your background, career vision, and academic achievements..."
                              className="w-full font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Form Submission Bar */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {isSavingProfile ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving Profile...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Save Profile Changes
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* VIEW MODE: Structured Info Cards */
                      <div className="space-y-6">
                        {/* 1. College & Academic Record Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <School className="w-5 h-5 text-amber-600" />
                              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                                College & Academic Credentials
                              </h3>
                            </div>
                            {profileForm.collegeType ? (
                              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                {profileForm.collegeType}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                                Not Specified
                              </span>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                College / University
                              </p>
                              <p className="text-base font-black text-slate-900 mt-0.5">
                                {profileForm.collegeName || 'Not Provided'}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{profileForm.collegeAddress || 'Not Provided'}</span>
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Course / Degree</p>
                                <p className="font-bold text-slate-900 text-xs mt-0.5">{profileForm.courseName || 'Not Provided'}</p>
                              </div>

                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Roll / ID Number</p>
                                <p className="font-bold text-slate-900 text-xs mt-0.5">{profileForm.rollNumber || 'Not Provided'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Personal & Contact Details Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <User className="w-5 h-5 text-amber-600" />
                              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                                Personal & Residential Records
                              </h3>
                            </div>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                              user?.verificationStatus === 'VERIFIED'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-amber-700 bg-amber-50 border-amber-200'
                            }`}>
                              {user?.verificationStatus === 'VERIFIED' ? 'Profile Verified' : 'Verification Pending'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Full Legal Name</p>
                              <p className="font-bold text-slate-900 text-sm mt-0.5">
                                {profileForm.fullName || user?.fullName || 'Not provided'}
                              </p>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Registered Email</p>
                              <p className="font-bold text-slate-900 text-xs mt-0.5 truncate">{user?.email}</p>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Primary Mobile</p>
                              <p className="font-bold text-slate-900 text-xs mt-0.5">
                                {profileForm.phone ? `+91 ${profileForm.phone}` : 'Not provided'}
                              </p>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Alternate / Parent Phone</p>
                              <p className="font-bold text-slate-900 text-xs mt-0.5">
                                {profileForm.alternatePhone ? `+91 ${profileForm.alternatePhone}` : 'Not specified'}
                              </p>
                            </div>

                            <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Residential Address</p>
                              <p className="font-medium text-slate-900 text-xs mt-0.5">
                                {profileForm.residentialAddress || 'Not provided'}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                {profileForm.city && profileForm.state
                                  ? `${profileForm.city}, ${profileForm.state}`
                                  : profileForm.city || profileForm.state || 'Not specified'}
                                {profileForm.pincode && ` - ${profileForm.pincode}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Student Bio / Statement Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <h4 className="font-black text-slate-900 text-sm">
                              Student Bio & Academic Aspirations
                            </h4>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {profileForm.studentBio || (
                              <span className="text-slate-400 italic">No student bio or academic statement added yet. Click &apos;Edit Profile Information&apos; above to introduce yourself.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Span 1): Sidebar Credential Cards */}
                  <div className="space-y-6">
                    {/* Scholar Credentials Status */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Scholar Credentials</h4>
                          <p className="text-xs text-slate-400">Section 80G Certified Aid</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Profile Photo</span>
                          <span className="text-emerald-600 font-bold">
                            {profileForm.profilePhoto || user?.avatarUrl ? 'Uploaded' : 'Default'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Enrollment Status</span>
                          <span className={`font-bold ${profileForm.collegeName ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {profileForm.collegeName ? 'Confirmed' : 'Pending Details'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Institution Record</span>
                          <span className={`font-bold ${profileForm.collegeName ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {profileForm.collegeName ? 'Active' : 'Unlinked'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Member Since</span>
                          <span className="text-slate-800 font-bold">
                            {user?.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '2026'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Student Advisor Desk */}
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-slate-950 space-y-3 shadow-md">
                      <h4 className="font-black text-sm">Student Advisor Desk</h4>
                      <p className="text-xs text-slate-950 leading-relaxed font-medium">
                        Need guidance polishing your academic goals or updating documentation?
                      </p>
                      <div className="pt-1 text-xs font-black space-y-1">
                        <p>📞 +91 98765 43210</p>
                        <p>✉️ students@educarrus.org</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                VIEW 3: SECURITY & ACCESS
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      Security & Credentials Protection
                    </h2>
                    <p className="text-xs text-slate-500">
                      Manage your password, two-factor authentication, active sessions, and live audit trail.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetchSecurity()}
                    disabled={isFetchingSecurity}
                    className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isFetchingSecurity ? 'animate-spin' : ''}`} />
                    <span>{isFetchingSecurity ? 'Syncing...' : 'Refresh Status'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Password Update & Active Device Session */}
                  <div className="space-y-6">
                    {/* Change Password Form */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Update Password</h3>
                          <p className="text-xs text-slate-400">Secure your account with a strong password</p>
                        </div>
                      </div>

                      <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              required
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                              }
                              className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-sm"
                              placeholder="Enter your current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">New Password</label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              required
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                              }
                              className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-sm"
                              placeholder="Minimum 6 characters"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              required
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                              }
                              className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-sm"
                              placeholder="Re-enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                          <p className="font-bold text-slate-700">Password requirements:</p>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className={`w-3.5 h-3.5 ${passwordForm.newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span>At least 6 characters</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className={`w-3.5 h-3.5 ${passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span>Passwords match</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <Link to="/forgot-password" className="text-amber-600 font-bold hover:underline">
                            Forgot password?
                          </Link>
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-slate-900 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {isChangingPassword ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <span>Save New Password</span>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Active Device Session Management Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <Laptop className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Active Device Session</h3>
                            <p className="text-xs text-slate-400">Current device & network status</p>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-xs">
                          Active Now
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Browser / Agent</span>
                            <span className="font-bold text-slate-800">
                              {securityActivity?.currentSession?.userAgent
                                ? (securityActivity.currentSession.userAgent.includes('Edg/')
                                    ? 'Microsoft Edge'
                                    : securityActivity.currentSession.userAgent.includes('Chrome/')
                                    ? 'Google Chrome'
                                    : securityActivity.currentSession.userAgent.includes('Firefox/')
                                    ? 'Mozilla Firefox'
                                    : securityActivity.currentSession.userAgent.includes('Safari/')
                                    ? 'Apple Safari'
                                    : 'Web Browser')
                                : 'Google Chrome (Desktop)'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">IP Address</span>
                            <span className="font-mono font-bold text-slate-800">
                              {securityActivity?.currentSession?.ip || '127.0.0.1'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Last Login Recorded</span>
                            <span className="font-bold text-slate-800">
                              {securityActivity?.lastLoginAt
                                ? new Date(securityActivity.lastLoginAt).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Active session'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <p className="text-[11px] text-slate-400">
                            Lost a device? Invalidate all session tokens immediately.
                          </p>
                          <button
                            type="button"
                            onClick={handleRevokeSessions}
                            disabled={isRevokingSessions}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer text-xs shrink-0 disabled:opacity-50"
                          >
                            {isRevokingSessions ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Terminating...</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign Out Other Sessions</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Security Controls & Live Audit Trail */}
                  <div className="space-y-6">
                    {/* Account Security Controls */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                      <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Account Security Controls
                      </h3>

                      <div className="space-y-3 text-xs">
                        {/* Two-Factor Authentication Toggle */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">Two-Factor Authentication (2FA)</p>
                              {securityActivity?.twoFactorEnabled ? (
                                <span className="font-bold text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Enforced
                                </span>
                              ) : (
                                <span className="font-bold text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Requires a one-time verification code when accessing your account from a new device.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleToggle2FA}
                            disabled={isToggling2FA}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                              securityActivity?.twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                            aria-label="Toggle Two-Factor Authentication"
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                securityActivity?.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Email OTP Verification */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">Email Verification Gateway</p>
                            <p className="text-[11px] text-slate-400">
                              Linked to {authUser?.email || 'your registered address'}
                            </p>
                          </div>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                            Verified
                          </span>
                        </div>

                        {/* HTTP-Only JWT Cookie Encryption */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">HTTP-Only JWT Cookie Encryption</p>
                            <p className="text-[11px] text-slate-400">
                              256-bit cryptographic signature guarding against XSS & hijacking
                            </p>
                          </div>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                            Secured
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Security Audit Trail */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-500" />
                          <h3 className="font-bold text-slate-900 text-sm">Security Audit Trail</h3>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">Live Activity</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {isLoadingSecurity ? (
                          <div className="text-center py-6 text-slate-400 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                            <span>Loading security events...</span>
                          </div>
                        ) : securityActivity?.auditLogs && securityActivity.auditLogs.length > 0 ? (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {securityActivity.auditLogs.map((log) => {
                              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                              let icon = <Activity className="w-3.5 h-3.5 text-slate-500" />;
                              let actionText = log.action.replace('_', ' ');

                              if (log.action === 'PASSWORD_CHANGE') {
                                badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                icon = <Lock className="w-3.5 h-3.5 text-emerald-600" />;
                                actionText = 'Password Updated';
                              } else if (log.action === '2FA_ENABLED') {
                                badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
                                actionText = '2FA Activated';
                              } else if (log.action === '2FA_DISABLED') {
                                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                                icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
                                actionText = '2FA Deactivated';
                              } else if (log.action === 'REVOKE_SESSIONS') {
                                badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                                icon = <LogOut className="w-3.5 h-3.5 text-rose-600" />;
                                actionText = 'Sessions Revoked';
                              }

                              return (
                                <div
                                  key={log.id}
                                  className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0">
                                      {icon}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 text-xs truncate">{actionText}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        IP: {log.ipAddress || '127.0.0.1'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                                      Recorded
                                    </span>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {new Date(log.createdAt).toLocaleString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                            <p className="font-bold text-slate-600 text-xs">No Security Incidents</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Password changes, 2FA status toggles, and session events will be recorded here in real time.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                VIEW 4: HELP & STUDENT SUPPORT
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'support' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Student Support & Helpline Desk</h2>
                  <p className="text-xs text-slate-500">
                    Get help with student profile updates, verification guidance, and academic queries.
                  </p>
                </div>

                {/* Direct Contact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
                    <Phone className="w-6 h-6 text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Direct Phone Helpline</h4>
                    <p className="text-xs text-slate-500">Mon - Sat (9:00 AM - 7:00 PM IST)</p>
                    <p className="text-sm font-black text-slate-900">+91 98765 43210</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
                    <Mail className="w-6 h-6 text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Student Support Email</h4>
                    <p className="text-xs text-slate-500">Average response time: 2 hours</p>
                    <p className="text-sm font-black text-slate-900">students@educarrus.org</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
                    <Building className="w-6 h-6 text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Headquarters</h4>
                    <p className="text-xs text-slate-500">Educarrus Education Foundation</p>
                    <p className="text-xs font-bold text-slate-700">Bangalore, Karnataka, India</p>
                  </div>
                </div>

                {/* FAQs and Support Query Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Frequently Asked Questions */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                        Frequently Asked Questions
                      </h3>
                      <Link to="/faq" className="text-xs font-bold text-[#07166F] hover:underline">
                        View All &rarr;
                      </Link>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <strong className="text-slate-900 block font-bold">
                          How do I update my registered mobile number or email?
                        </strong>
                        <p className="text-slate-500 leading-relaxed">
                          You can edit your mobile number directly in the Student Profile tab. Email changes require administrative verification for security.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <strong className="text-slate-900 block font-bold">
                          How long does profile verification take?
                        </strong>
                        <p className="text-slate-500 leading-relaxed">
                          Initial student academic verification is typically processed within 24 to 48 hours of account registration.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <strong className="text-slate-900 block font-bold">
                          Is my student data confidential?
                        </strong>
                        <p className="text-slate-500 leading-relaxed">
                          Yes, your credentials and personal records are encrypted with SSL and stored in full compliance with academic data protection standards.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Send Query Form */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Send className="w-4 h-4 text-amber-600" />
                      Submit a Support Ticket
                    </h3>

                    <form onSubmit={handleSupportSubmit} className="space-y-3.5 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Issue Category</label>
                        <select
                          value={supportForm.category}
                          onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-xs"
                        >
                          <option value="Academic Profile Inquiry">Academic Profile Inquiry</option>
                          <option value="Documentation Assistance">Documentation Assistance</option>
                          <option value="Account & Security">Account & Security</option>
                          <option value="Technical Support">Technical Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Subject</label>
                        <input
                          type="text"
                          required
                          value={supportForm.subject}
                          onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                          placeholder="e.g., Update college semester registration details"
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Message Details</label>
                        <textarea
                          rows={4}
                          required
                          value={supportForm.message}
                          onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                          placeholder="Describe your inquiry with college name and roll number if relevant..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingSupport}
                        className="w-full py-2.5 rounded-xl font-bold bg-slate-900 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {submittingSupport ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Submitting Request...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Support Request</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* 3. My Submitted Support Tickets & Advisor Replies */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <LifeBuoy className="w-5 h-5 text-amber-600" />
                        My Support Inquiries & Advisor Replies
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track open tickets and review direct responses from the Educarrus support desk (displaying recent 5).
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 w-fit">
                      {Array.isArray(supportTickets) && supportTickets.length > 5 && !showAllTickets
                        ? `Showing Recent 5 of ${supportTickets.length} Tickets`
                        : `${Array.isArray(supportTickets) ? supportTickets.length : 0} Ticket${(Array.isArray(supportTickets) ? supportTickets.length : 0) === 1 ? '' : 's'}`}
                    </span>
                  </div>

                  {loadingTickets ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                      Loading support inquiries...
                    </div>
                  ) : !Array.isArray(supportTickets) || supportTickets.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No support tickets submitted yet</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Have questions regarding verification, scholarships, or academic credentials? Fill out the form above to connect with an advisor.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayedTickets.map((ticket) => {
                        const shortId = ticket?.id ? `#ST-${ticket.id.slice(0, 6).toUpperCase()}` : '#ST-000';
                        const hasReply = Boolean(ticket?.resolutionNotes && ticket.resolutionNotes.trim());

                        let statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Open / Under Review
                          </span>
                        );
                        if (ticket?.status === 'RESOLVED') {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
                            </span>
                          );
                        } else if (ticket?.status === 'IN_PROGRESS') {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Loader2 className="w-3 h-3 text-blue-600 animate-spin" /> In Progress
                            </span>
                          );
                        } else if (ticket?.status === 'CLOSED') {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Closed
                            </span>
                          );
                        }

                        return (
                          <div
                            key={ticket?.id || Math.random()}
                            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3.5 transition-all hover:border-slate-300"
                          >
                            {/* Ticket Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-black text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md">
                                  {shortId}
                                </span>
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                                  {ticket?.category || 'General'}
                                </span>
                                {statusBadge}
                              </div>
                              <span className="text-[11px] font-medium text-slate-400">
                                Submitted {ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : ''}
                              </span>
                            </div>

                            {/* Ticket Subject & Message */}
                            <div>
                              <h4 className="text-sm font-black text-slate-900 leading-snug mb-1">
                                {ticket?.subject || 'Support Ticket'}
                              </h4>
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-slate-100">
                                {ticket?.message || ''}
                              </p>
                            </div>

                            {/* Official Admin Reply Box */}
                            {hasReply ? (
                              <div className="rounded-xl bg-gradient-to-tr from-emerald-500/10 via-emerald-400/5 to-transparent border border-emerald-500/30 p-4 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <span>Educarrus Support Desk Official Reply</span>
                                    {ticket?.assignedAdmin?.fullName && (
                                      <span className="text-[10px] text-emerald-600 font-semibold">
                                        (by {ticket.assignedAdmin.fullName})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-emerald-700">
                                    {ticket?.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }) : ''}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap pl-5 font-medium">
                                  {ticket.resolutionNotes}
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/70 border border-amber-200/50 px-3.5 py-2.5 rounded-xl">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                                <span>Awaiting advisor review. Our support team typically replies within 24 hours.</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {Array.isArray(supportTickets) && supportTickets.length > 5 && (
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">
                        {showAllTickets
                          ? `Showing all ${supportTickets.length} inquiries & advisor replies`
                          : `Showing recent 5 inquiries & advisor replies (out of ${supportTickets.length} total)`}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAllTickets((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                      >
                        {showAllTickets ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Show Recent 5 Only</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>View All {supportTickets.length} Inquiries</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════
                VIEW 5: RATE & REVIEW ADMIN (Problem Resolution Feedback)
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'review' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#07166F] to-[#1E3A8A] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
                    <Star className="w-48 h-48 fill-white" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-[#FFB52E] text-xs font-bold border border-amber-400/30">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Educarrus Scholar Voice</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-white">Rate Admin Problem Resolution</h2>
                      <p className="text-xs md:text-sm text-slate-200 max-w-2xl leading-relaxed">
                        Share how our administrative desk helped you resolve college fee challans, documentation verification, scholarship approvals, or admission guidance. The last 5 verified reviews appear directly on the homepage!
                      </p>
                    </div>
                    <a
                      href="/#testimonials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all self-start md:self-center"
                    >
                      <Sparkles className="w-4 h-4 text-[#FFB52E]" />
                      <span>View Live Reviews on Homepage</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Form */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-amber-600" />
                        <span>{existingScholarReview ? 'Update Your Existing Rating & Experience' : 'Submit Your Rating & Experience'}</span>
                      </h3>
                      {existingScholarReview && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          1 Review Per Scholar (Auto-Replaces)
                        </span>
                      )}
                    </div>

                    {existingScholarReview && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl text-xs leading-relaxed">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Existing Review Detected:</strong> You have previously shared feedback. As per platform policy, each scholar can have one verified review. Submitting the form below will <strong>replace and update</strong> your existing review on the homepage without creating a duplicate.
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleReviewSubmit} className="space-y-5 text-xs">
                      {/* Interactive 5-Star Rating */}
                      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-2">
                        <label className="font-bold text-slate-900 block text-xs">
                          Overall Rating for Admin's Problem Resolution <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  star <= (hoverRating || reviewForm.rating)
                                    ? 'text-[#FFB52E] fill-[#FFB52E]'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 font-black text-amber-900 text-sm">
                            {reviewForm.rating}.0 / 5.0
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-amber-800">
                          {reviewForm.rating === 5 && '★★★★★ Outstanding! The admin went above and beyond to solve my problem.'}
                          {reviewForm.rating === 4 && '★★★★☆ Very Good! Prompt guidance and effective resolution.'}
                          {reviewForm.rating === 3 && '★★★☆☆ Satisfactory. My issue was resolved.'}
                          {reviewForm.rating === 2 && '★★☆☆☆ Needs Improvement. Resolution took more time than expected.'}
                          {reviewForm.rating === 1 && '★☆☆☆☆ Poor. Felt the issue needed better handling.'}
                        </p>
                      </div>

                      {/* Problem Category */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1.5">
                          Problem Solved by Admin <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={reviewForm.problemType}
                          onChange={(e) => setReviewForm({ ...reviewForm, problemType: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-xs font-medium"
                        >
                          <option value="Direct College Fee Payment & Challan Verification">Direct College Fee Payment &amp; Challan Verification</option>
                          <option value="Scholarship Aid & Application Approval">Scholarship Aid &amp; Application Approval</option>
                          <option value="Medical Counseling & Aid Approval">Medical Counseling &amp; Aid Approval</option>
                          <option value="Engineering / B.Tech Fee Reconciliation">Engineering / B.Tech Fee Reconciliation</option>
                          <option value="College Admission Guidance & Course Selection">College Admission Guidance &amp; Course Selection</option>
                          <option value="Document & Identity Verification Assistance">Document &amp; Identity Verification Assistance</option>
                          <option value="Emergency Student Tuition Resolution">Emergency Student Tuition Resolution</option>
                        </select>
                      </div>

                      {/* Scholar Info Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Your Name (Displayed on Review) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={reviewForm.name}
                            onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                            placeholder="e.g., Danial K."
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Scholar Badge / Role <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={reviewForm.role}
                            onChange={(e) => setReviewForm({ ...reviewForm, role: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-xs font-medium"
                          >
                            <option value="Verified Student Scholar">Verified Student Scholar</option>
                            <option value="Verified B.Tech Scholar">Verified B.Tech Scholar</option>
                            <option value="Verified MBBS Scholar">Verified MBBS Scholar</option>
                            <option value="Verified BCA Scholar">Verified BCA Scholar</option>
                            <option value="Verified Engineering Scholar">Verified Engineering Scholar</option>
                            <option value="Verified Postgraduate Scholar">Verified Postgraduate Scholar</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Degree / College / Institution
                        </label>
                        <input
                          type="text"
                          value={reviewForm.institution}
                          onChange={(e) => setReviewForm({ ...reviewForm, institution: e.target.value })}
                          placeholder="e.g., Computer Science & Engineering, NIT Warangal"
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-xs"
                        />
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          How Did The Admin Get You Through The Problem? <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={5}
                          required
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          placeholder="Describe your experience in detail: What was the issue you faced? How did the administrator or mentor reach out and guide you? What was the outcome for your college fees or admission?"
                          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Tip: Authentic feedback helps thousands of aspiring students trust Educarrus.
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full py-3.5 px-6 rounded-xl font-black text-sm bg-[#FFB52E] hover:bg-amber-400 text-[#172033] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{existingScholarReview ? 'Replacing & Updating Review...' : 'Publishing Your Review...'}</span>
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 fill-current" />
                            <span>{existingScholarReview ? 'Update & Replace Existing Review' : 'Submit Review for Admin Resolution'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Live Card Preview & Guarantees */}
                  <div className="lg:col-span-5 space-y-5">
                    {/* Realtime Live Preview Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-[11px] font-black uppercase text-[#07166F] tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#FFB52E]" /> Live Homepage Preview
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Real-time layout</span>
                      </div>

                      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[#FFB52E]">
                            {[...Array(reviewForm.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {reviewForm.role || 'Verified Student Scholar'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 italic leading-relaxed">
                          “{reviewForm.comment || 'The administrator guided me step-by-step through the fee reconciliation and resolved the deadline crisis without any deduction...'}”
                        </p>
                        <div className="pt-2 flex items-center gap-2.5 border-t border-slate-50">
                          <div className="w-8 h-8 rounded-full bg-[#07166F] text-[#FFB52E] font-black text-xs flex items-center justify-center shrink-0">
                            {(reviewForm.name || authUser?.fullName || 'S').trim().substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-[#172033] truncate">
                              {reviewForm.name || authUser?.fullName || 'Verified Scholar'}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">
                              {reviewForm.institution || 'College & Degree'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trust Card */}
                    <div className="bg-amber-50/70 rounded-2xl border border-amber-200/80 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <ThumbsUp className="w-4 h-4 text-amber-600" />
                        <span>Why Your Review Matters</span>
                      </div>
                      <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>100% Genuine Scholars:</strong> Reviews are submitted by actual beneficiaries who received fee transfers or admission help.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Direct Homepage Feed:</strong> The last 5 submitted reviews are dynamically updated on the Educarrus national landing page.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Zero Commissions:</strong> We maintain complete transparency and direct college challan reconciliation across India.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      {/* Realtime Floating Support Cluster (AI Chatbot & WhatsApp Colliding Bound Orbs) at Bottom-Right */}
      <EduChatbot />
    </div>
  );
};

export default UserDashboardPage;
