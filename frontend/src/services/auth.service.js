/**
 * Authentication Service
 * Handles all API calls related to authentication
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const authService = {
  /**
   * Register a new user
   */
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Login user
   */
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me');
    if (data.data) {
      localStorage.setItem('user', JSON.stringify(data.data));
    }
    return data;
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  /**
   * Reset password
   */
  resetPassword: async (token, password) => {
    const { data } = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    return data;
  },

  /**
   * Update password
   */
  updatePassword: async (passwords) => {
    const { data } = await api.put('/auth/update-password', passwords);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * Get stored user
   */
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    const { data } = await api.put('/auth/profile', profileData);
    if (data.data) {
      localStorage.setItem('user', JSON.stringify(data.data));
    }
    return data;
  },

  /**
   * Update notification preferences
   */
  updateNotifications: async (notifications) => {
    const { data } = await api.put('/auth/notifications', { notificationPreferences: notifications });
    if (data.data) {
      localStorage.setItem('user', JSON.stringify(data.data));
    }
    return data;
  },

  /**
   * Export user data
   */
  exportData: async () => {
    const response = await api.get('/auth/export-data', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Delete user account
   */
  deleteAccount: async () => {
    await api.delete('/auth/account');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  /**
   * Upload profile picture
   */
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const { data } = await api.post('/auth/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Update user in localStorage with new profile picture
    if (data.data?.profilePicture) {
      const user = authService.getStoredUser();
      if (user) {
        user.profilePicture = data.data.profilePicture;
        localStorage.setItem('user', JSON.stringify(user));
      }
    }

    return data;
  },

  /**
   * Delete profile picture
   */
  deleteProfilePicture: async () => {
    const { data } = await api.delete('/auth/profile-picture');

    // Update user in localStorage to remove profile picture
    const user = authService.getStoredUser();
    if (user) {
      user.profilePicture = null;
      localStorage.setItem('user', JSON.stringify(user));
    }

    return data;
  },
};

export default authService;
