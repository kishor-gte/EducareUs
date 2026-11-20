import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import UserDashboardPage from './pages/public/UserDashboardPage';
import BlogsPage from './pages/public/BlogsPage';
import BlogDetailPage from './pages/public/BlogDetailPage';
import TermsPage from './pages/public/TermsPage';
import PrivacyPage from './pages/public/PrivacyPage';
import FaqPage from './pages/public/FaqPage';
import CourseDetailPage from './pages/public/CourseDetailPage';

// Admin Suite Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDonations from './pages/admin/AdminDonations';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminSupport from './pages/admin/AdminSupport';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSystemHealth from './pages/admin/AdminSystemHealth';
import AdminEnquiries from './pages/admin/AdminEnquiries';

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
        <BrowserRouter>
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
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
