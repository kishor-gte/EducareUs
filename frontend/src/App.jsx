import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Code-split / Lazy-loaded Public Pages for Optimized Performance
const HomePage = lazy(() => import('./pages/public/HomePage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/public/ResetPasswordPage'));
const UserDashboardPage = lazy(() => import('./pages/public/UserDashboardPage'));
const BlogsPage = lazy(() => import('./pages/public/BlogsPage'));
const BlogDetailPage = lazy(() => import('./pages/public/BlogDetailPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const FaqPage = lazy(() => import('./pages/public/FaqPage'));
const CourseDetailPage = lazy(() => import('./pages/public/CourseDetailPage'));

// Code-split / Lazy-loaded Admin Suite Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminDonations = lazy(() => import('./pages/admin/AdminDonations'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminVerifications = lazy(() => import('./pages/admin/AdminVerifications'));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminSystemHealth = lazy(() => import('./pages/admin/AdminSystemHealth'));
const AdminEnquiries = lazy(() => import('./pages/admin/AdminEnquiries'));

// Helper redirect to ensure /admin opens /admin.html
function AdminRedirectToHtml() {
  React.useEffect(() => {
    window.location.replace('/admin.html');
  }, []);
  return null;
}

function RedirectToHtml({ target }) {
  React.useEffect(() => {
    window.location.replace(target);
  }, [target]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0F172A',
                color: '#fff',
                fontSize: '13px',
                borderRadius: '0.75rem',
                border: '1px solid #1E293B',
              },
            }}
          />

          <Suspense fallback={<LoadingSpinner size="lg" text="Loading Educarrus..." />}>
            <Routes>
              {/* Public Layout Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/blogs" element={<BlogsPage />} />
                <Route path="/blogs/:slug" element={<BlogDetailPage />} />
                <Route path="/terms-and-conditions" element={<TermsPage />} />
                <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
                <Route path="/privacy-policy" element={<PrivacyPage />} />
                <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/faqs" element={<Navigate to="/faq" replace />} />
                <Route path="/courses/:slug" element={<CourseDetailPage />} />
                <Route path="/courses" element={<Navigate to="/#courses" replace />} />
                <Route path="/about-us" element={<Navigate to="/#about-us" replace />} />
                <Route path="/about" element={<Navigate to="/#about-us" replace />} />
                <Route path="/why-choose-us" element={<Navigate to="/#why-choose-us" replace />} />
                <Route path="/enquiry" element={<Navigate to="/userdashboard?tab=enquiry" replace />} />
                <Route
                  path="/userdashboard"
                  element={
                    <ProtectedRoute allowedRoles={['BENEFICIARY', 'ADMIN', 'SUPER_ADMIN']}>
                      <UserDashboardPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Protected Admin Suite Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminRedirectToHtml />} />
                <Route path="enquiries" element={<AdminEnquiries />} />
                <Route path="donations" element={<AdminDonations />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="verifications" element={<AdminVerifications />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="system-health" element={<AdminSystemHealth />} />
                <Route path="blogs" element={<RedirectToHtml target="/admin-blogs.html" />} />
                <Route path="terms" element={<RedirectToHtml target="/admin-terms.html" />} />
                <Route path="privacy" element={<RedirectToHtml target="/admin-privacy.html" />} />
                <Route path="faqs" element={<RedirectToHtml target="/admin-faqs.html" />} />
                <Route path="about" element={<RedirectToHtml target="/admin-about.html" />} />
                <Route path="about-us" element={<RedirectToHtml target="/admin-about.html" />} />
                <Route path="why-choose-us" element={<RedirectToHtml target="/admin-why-choose-us.html" />} />
                <Route path="courses" element={<RedirectToHtml target="/admin-courses.html" />} />
                <Route path="colleges" element={<RedirectToHtml target="/admin-colleges.html" />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
