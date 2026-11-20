import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export const PublicLayout = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/userdashboard');
  const hideFooterRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const hideFooter = isDashboard || hideFooterRoutes.includes(location.pathname);

  return (
    <div
      className={`flex flex-col ${
        isDashboard ? 'h-screen overflow-hidden' : 'min-h-screen'
      } w-full bg-slate-50 overflow-x-hidden ${isDashboard ? 'pb-0' : 'pb-16 md:pb-0'}`}
    >
      <Navbar />
      <main className={`flex-1 w-full flex flex-col ${isDashboard ? 'overflow-hidden min-h-0' : ''}`}>
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default PublicLayout;
