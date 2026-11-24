import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch authenticated user profile on initial mount
  const checkAuth = async () => {
    // Only attempt to verify authentication if a session token or cookie exists
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const hasAuthCookie = typeof document !== 'undefined' && document.cookie.includes('token=');

    if (!token && !hasAuthCookie) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.data) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.success && response.data?.data?.user) {
      const authUser = response.data.data.user;
      setUser(authUser);
      if (response.data?.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(authUser));
        if (authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN') {
          localStorage.setItem('adminToken', response.data.data.token);
          localStorage.setItem('adminUser', JSON.stringify(authUser));
        }
      }
    }
    return response.data;
  };

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    if (response.data?.success && response.data?.data?.user) {
      const authUser = response.data.data.user;
      setUser(authUser);
      if (response.data?.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(authUser));
        if (authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN') {
          localStorage.setItem('adminToken', response.data.data.token);
          localStorage.setItem('adminUser', JSON.stringify(authUser));
        }
      }
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user');
      localStorage.removeItem('adminUser');
      sessionStorage.clear();
    }
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...(updatedUserData || {}) };
      try {
        localStorage.setItem('user', JSON.stringify(merged));
        if (merged.role === 'ADMIN' || merged.role === 'SUPER_ADMIN') {
          localStorage.setItem('adminUser', JSON.stringify(merged));
        }
      } catch (err) {
        console.error('Failed to update user in localStorage:', err);
      }
      return merged;
    });
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isBeneficiary = user?.role === 'BENEFICIARY';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkAuth,
        updateUser,
        isAdmin,
        isSuperAdmin,
        isBeneficiary,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
