import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract server error message or validation errors
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response?.data) {
      const data = error.response.data;
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMessage = data.errors.map((e) => e.message || (typeof e === 'string' ? e : JSON.stringify(e))).join(', ');
      } else if (data.message) {
        errorMessage = data.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Enhance error object with readable message
    error.friendlyMessage = errorMessage;

    // Handle 401 Unauthorized gracefully without hard refresh loops
    if (error.response?.status === 401) {
      // Allow caller/AuthContext to handle logged-out state cleanly
    }

    return Promise.reject(error);
  }
);

export default api;
