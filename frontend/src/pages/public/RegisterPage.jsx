import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Building,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  CircleAlert,
  Loader2,
  KeyRound,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';

export const RegisterPage = () => {
  const { register, logout } = useAuth();
  const navigate = useNavigate();

  // Registration Success Popup State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Form State
  const role = 'BENEFICIARY';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email OTP Verification State
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpStatus, setOtpStatus] = useState(null); // null | 'verified' | 'invalid'
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [emailError, setEmailError] = useState('');
  const MAX_RESENDS = 3;

  // Dynamic Location API State (Zero hardcoding)
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Resend OTP Cooldown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Registration Success Countdown & Redirection to /login
  useEffect(() => {
    let timer;
    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showSuccessModal && countdown === 0) {
      handleRedirectToLogin();
    }
    return () => clearTimeout(timer);
  }, [showSuccessModal, countdown]);

  const handleRedirectToLogin = () => {
    navigate('/login', {
      state: {
        registeredEmail: email.trim().toLowerCase(),
        registeredMessage: 'Registration successful! Please sign in with your email and password.',
      },
    });
  };

  // 1. Fetch real States of India via API
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
        toast.error('Unable to load states. Please check your connection.');
      } finally {
        if (isMounted) setLoadingStates(false);
      }
    };

    fetchStates();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch real Cities for the selected State via API
  useEffect(() => {
    let isMounted = true;
    if (!selectedState) {
      setCities([]);
      setSelectedCity('');
      return;
    }

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await api.get(`/public/locations/cities?stateCode=${selectedState}`);
        if (isMounted && res.data?.success && Array.isArray(res.data?.data)) {
          setCities(res.data.data);
        }
      } catch (err) {
        console.error(`Failed to load cities for state ${selectedState}:`, err);
        toast.error('Unable to load cities for selected state.');
      } finally {
        if (isMounted) setLoadingCities(false);
      }
    };

    fetchCities();
    return () => {
      isMounted = false;
    };
  }, [selectedState]);

  // Handle Send & Resend OTP (Max 3 Resends)
  const handleSendOtp = async (isResend = false) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error("No Email Exist");
      setEmailError("No Email Exist");
      return;
    }

    if (isResend && resendCount >= MAX_RESENDS) {
      toast.error('You can resend OTP only 3 times. Please check your inbox or spam.');
      return;
    }

    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before requesting another OTP.`);
      return;
    }

    setSendingOtp(true);
    setOtpStatus(null);
    setEmailError('');
    setOtp(''); // Reset previous OTP input on resend
    try {
      const res = await api.post('/auth/send-otp', { email: cleanEmail });
      const nextResendCount = isResend ? resendCount + 1 : resendCount;
      const remaining = Math.max(0, MAX_RESENDS - nextResendCount);

      toast.success(
        isResend
          ? `A new OTP has been sent! (${remaining} resend${remaining === 1 ? '' : 's'} remaining)`
          : (res.data?.message || 'OTP sent successfully to your email!')
      );
      setOtpSent(true);
      if (isResend) {
        setResendCount((prev) => prev + 1);
      }
      setResendCooldown(60); // 60 seconds mandatory wait timer
    } catch (err) {
      let errorMsg = err.friendlyMessage || 'Failed to send OTP.';
      if (
        errorMsg.toLowerCase().includes('not exist') ||
        errorMsg.toLowerCase().includes("doesn't exist") ||
        errorMsg.toLowerCase().includes("dosen't exist") ||
        errorMsg.toLowerCase().includes("no email exist") ||
        errorMsg.toLowerCase().includes('invalid email')
      ) {
        errorMsg = "No Email Exist";
      }
      setEmailError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      toast.error('Please enter the OTP sent to your email.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        email: cleanEmail,
        otp: cleanOtp,
      });

      if (res.data?.success) {
        setOtpStatus('verified');
        setEmailVerified(true);
        toast.success('Email verified successfully!');
      } else {
        setOtpStatus('invalid');
        setEmailVerified(false);
        toast.error('Invalid OTP');
      }
    } catch (err) {
      setOtpStatus('invalid');
      setEmailVerified(false);
      toast.error(err.friendlyMessage || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle phone input: strictly numbers only, exactly max 10 digits
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    // Email OTP Verification Requirement
    if (!emailVerified) {
      toast.error('Please verify your email with the OTP before completing registration.');
      return;
    }

    // Strict 10-digit phone number check
    if (phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }

    if (!selectedState) {
      toast.error('Please select your State.');
      return;
    }

    if (!selectedCity) {
      toast.error('Please select your City.');
      return;
    }

    // Strict Password & Confirm Password format requirements:
    // Mix of alphabets (lowercase & uppercase), at least one caps letter, at least one number, min 6 characters
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase (capital) letter.');
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

    // Strict Password Matching check
    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify your password.');
      return;
    }

    const stateObj = states.find((s) => s.isoCode === selectedState);
    const stateName = stateObj ? stateObj.name : selectedState;
    const locationString = `${selectedCity}, ${stateName}`;

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        location: locationString,
        city: selectedCity,
        state: stateName,
        password,
        role,
      });

      // Clear any auto-login session so user explicitly logs in on /login
      if (logout) {
        await logout().catch(() => {});
      }

      setShowSuccessModal(true);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Live password validation and matching indicators
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

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden bg-mesh-light">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-10 border border-slate-200/90 shadow-2xl space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-amber-400 flex items-center justify-center mx-auto shadow-lg border border-white/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-8 h-8" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
            Create Student Account
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Join thousands of verified Indian scholars accessing transparent tuition crowdfunding.
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Email Address with beside "Send OTP" Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Email Address <span className="text-rose-500">*</span>
              </label>
              {emailVerified && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> Email Verified
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={emailVerified}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (emailVerified || otpSent) {
                      setEmailVerified(false);
                      setOtpSent(false);
                      setOtpStatus(null);
                      setOtp('');
                      setResendCount(0);
                      setResendCooldown(0);
                    }
                  }}
                  placeholder="aarav.sharma@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-colors ${
                    emailError
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400/20 focus:border-rose-500'
                      : emailVerified
                      ? 'border-emerald-500 bg-emerald-50/30 text-slate-800'
                      : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Send OTP Button (Beside Email field) */}
              <button
                type="button"
                disabled={
                  sendingOtp ||
                  emailVerified ||
                  !email.includes('@') ||
                  resendCooldown > 0 ||
                  (otpSent && resendCount >= MAX_RESENDS)
                }
                onClick={() => handleSendOtp(otpSent)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  emailVerified
                    ? 'bg-slate-100 text-slate-400 border border-slate-200'
                    : 'bg-slate-900 text-amber-400 hover:bg-amber-500 hover:text-slate-950'
                }`}
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending...
                  </>
                ) : emailVerified ? (
                  'Verified'
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : otpSent && resendCount >= MAX_RESENDS ? (
                  'Limit Reached'
                ) : otpSent ? (
                  `Resend OTP (${MAX_RESENDS - resendCount} left)`
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>

            {/* Email Error Message (if email doesn't exist) */}
            {emailError && (
              <p className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold mt-1.5">
                <CircleAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {/* Verify OTP field (Below Email field) */}
          {otpSent && (
            <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-4 space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Verify OTP <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Code sent to <strong className="text-slate-800">{email}</strong>
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    disabled={emailVerified}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (otpStatus === 'invalid') setOtpStatus(null);
                    }}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={verifyingOtp || emailVerified || otp.length < 4}
                  onClick={handleVerifyOtp}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    emailVerified
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                  }`}
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : emailVerified ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Verified
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>

              {/* Status & Dedicated Resend Option */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div>
                  {otpStatus === 'verified' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <Check className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                  )}
                  {otpStatus === 'invalid' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                      <CircleAlert className="w-4 h-4" />
                      <span>Invalid OTP</span>
                    </div>
                  )}
                  {!otpStatus && !emailVerified && (
                    <span className="text-[11px] text-slate-400">
                      Check your inbox or spam for the 6-digit code
                    </span>
                  )}
                </div>

                {/* Resend OTP with 60-second cooldown & max 3 limit */}
                {!emailVerified && (
                  <div className="text-right">
                    {resendCooldown > 0 ? (
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 justify-end">
                        <span>Resend OTP in</span>
                        <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          00:{resendCooldown.toString().padStart(2, '0')}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({MAX_RESENDS - resendCount} left)
                        </span>
                      </span>
                    ) : resendCount >= MAX_RESENDS ? (
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 justify-end">
                        <CircleAlert className="w-3.5 h-3.5" />
                        Max 3 resends reached
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={sendingOtp}
                        onClick={() => handleSendOtp(true)}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1.5 cursor-pointer transition-colors ml-auto"
                      >
                        <RotateCw className={`w-3 h-3 ${sendingOtp ? 'animate-spin' : ''}`} />
                        Resend OTP ({MAX_RESENDS - resendCount} remaining)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phone Number (Strictly 10 digits - without '(10 Digits)' text) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-bold ${
                  phone.length === 10
                    ? 'text-emerald-600'
                    : phone.length > 0
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {phone.length}/10
              </span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-slate-500 text-xs font-bold border-r border-slate-300 pr-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                placeholder="9876543210"
                className={`w-full pl-20 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm tracking-wide font-medium transition-colors focus:outline-hidden focus:ring-2 ${
                  phone.length === 10
                    ? 'border-emerald-500 focus:ring-emerald-500/20'
                    : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                }`}
              />
              {phone.length === 10 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Dynamic State & City (Fetched from Real API - Zero hardcoded cities) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* State Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                State / UT <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  required
                  value={selectedState}
                  onChange={handleStateChange}
                  disabled={loadingStates}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors disabled:opacity-60 cursor-pointer appearance-none"
                >
                  <option value="">
                    {loadingStates ? 'Loading States...' : 'Select State / UT'}
                  </option>
                  {states.map((st) => (
                    <option key={st.isoCode} value={st.isoCode}>
                      {st.name}
                    </option>
                  ))}
                </select>
                {loadingStates && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
              </div>
            </div>

            {/* City Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  required
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedState || loadingCities}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors disabled:opacity-60 cursor-pointer appearance-none"
                >
                  <option value="">
                    {!selectedState
                      ? 'Select state first'
                      : loadingCities
                      ? 'Loading Cities...'
                      : cities.length === 0
                      ? 'No cities found'
                      : 'Select City'}
                  </option>
                  {cities.map((ct) => (
                    <option key={ct.name} value={ct.name}>
                      {ct.name}
                    </option>
                  ))}
                </select>
                {loadingCities && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm transition-colors focus:outline-hidden focus:ring-2 ${
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm transition-colors focus:outline-hidden focus:ring-2 ${
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Password Format Requirements & Match Status Helper */}
          {password.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
              <p className="font-semibold text-slate-600 mb-1">Password must include:</p>
              <div className="grid grid-cols-2 gap-1.5">
                <span className={`flex items-center gap-1.5 ${passwordHasLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordHasLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  At least 6 characters
                </span>
                <span className={`flex items-center gap-1.5 ${passwordHasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordHasUpper ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  At least 1 Caps letter (A-Z)
                </span>
                <span className={`flex items-center gap-1.5 ${passwordHasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordHasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  At least 1 Number (0-9)
                </span>
                <span className={`flex items-center gap-1.5 ${passwordHasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordHasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  Mix of alphabets (a-z)
                </span>
              </div>
            </div>
          )}

          {/* Confirm Password Status Helpers */}
          {confirmPassword.length > 0 && (
            <div>
              {passwordsMismatch ? (
                <p className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                  <CircleAlert className="w-3.5 h-3.5 shrink-0" />
                  Passwords do not match
                </p>
              ) : !confirmIsValid ? (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <CircleAlert className="w-3.5 h-3.5 shrink-0" />
                  Confirm password must also contain letters, numbers, and a caps letter
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Passwords match
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !emailVerified}
            className={`w-full py-4 rounded-2xl font-black transition-all shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm mt-3 cursor-pointer ${
              !emailVerified
                ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed opacity-80'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-amber-500/20'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : !emailVerified ? (
              <>
                <KeyRound className="w-4 h-4" />
                Verify Email with OTP to Register
              </>
            ) : (
              <>
                Complete Registration
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-amber-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>

      {/* Registration Success Popup Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            {/* Celebration Icon */}
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Registration Success
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Your Educarrus account has been created successfully! Please sign in with your registered email and password.
              </p>
            </div>

            {/* Account Details Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Registered Name</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Email</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Account Role</span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                  Student Beneficiary
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleRedirectToLogin}
                className="w-full py-3.5 rounded-xl font-bold bg-slate-900 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                Proceed to Sign In
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-slate-400">
                Redirecting to login in <span className="font-bold text-amber-600 font-mono text-xs">{countdown}s</span>...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
