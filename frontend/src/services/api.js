import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired or invalid (401), clean up if not on login page
    if (error.response && error.response.status === 401) {
      const isAuthPath = window.location.pathname.startsWith('/login') ||
                         window.location.pathname.startsWith('/register');
      if (!isAuthPath) {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
