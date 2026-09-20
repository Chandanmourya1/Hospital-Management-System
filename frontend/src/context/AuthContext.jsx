import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hms_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user on initialization if token exists
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('hms_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('hms_token');
          localStorage.removeItem('hms_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login handler
  const login = async (email, password, expectedRole = null) => {
    try {
      const res = await api.post('/auth/login', { email, password, expectedRole });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('hms_token', receivedToken);
      localStorage.setItem('hms_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      toast.success(res.data.message || `Welcome back, ${receivedUser.name}!`);
      return { success: true, user: receivedUser };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Register handler (Patient)
  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { token: receivedToken, user: receivedUser } = res.data;

      if (receivedToken) {
        localStorage.setItem('hms_token', receivedToken);
        localStorage.setItem('hms_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
      }

      toast.success(res.data.message || 'Registration successful!');
      return {
        success: true,
        user: receivedUser,
        verificationToken: res.data.verificationToken,
        emailPreviewUrl: res.data.emailPreviewUrl,
      };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Verify Email handler
  const verifyEmail = async (verificationToken) => {
    try {
      const res = await api.get(`/auth/verify-email/${verificationToken}`);
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('hms_user', JSON.stringify(res.data.user));
      }
      toast.success(res.data.message || 'Email verified successfully!');
      return { success: true, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Email verification failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'Password reset email dispatched.');
      return {
        success: true,
        message: res.data.message,
        resetToken: res.data.resetToken,
        resetUrl: res.data.resetUrl,
      };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send reset email.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Reset password
  const resetPassword = async (resetToken, password) => {
    try {
      const res = await api.put(`/auth/reset-password/${resetToken}`, { password });
      const { token: receivedToken, user: receivedUser } = res.data;

      if (receivedToken) {
        localStorage.setItem('hms_token', receivedToken);
        localStorage.setItem('hms_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
      }

      toast.success(res.data.message || 'Password reset successful!');
      return { success: true, user: receivedUser };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully.');
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isVerified: !!user?.isVerified,
    loading,
    login,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
