/**
 * Auth Store (Zustand)
 * Global authentication state management
 */

import { create } from 'zustand';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  // State
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: !!localStorage.getItem('token'), // Set to true if token exists (even without user object)
  error: null,

  // Actions

  /**
   * Register new user
   */
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Account created successfully!');
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Login user
   */
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Welcome back!');
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();

      // Clear AI insights cache
      localStorage.removeItem('aiInsights');

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      toast.success('Logged out successfully');
    } catch (error) {
      set({ isLoading: false });
      toast.error('Logout failed');
    }
  },

  /**
   * Load current user
   */
  loadUser: async () => {
    const hasToken = !!localStorage.getItem('token');

    // Only skip if we don't have a token at all
    if (!hasToken) {
      return;
    }

    set({ isLoading: true });
    try {
      const data = await authService.getCurrentUser();
      set({
        user: data.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.forgotPassword(email);
      set({ isLoading: false });
      toast.success(data.message || 'Password reset email sent');
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Request failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.resetPassword(token, password);
      set({ isLoading: false });
      toast.success('Password reset successful!');
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Reset failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update password
   */
  updatePassword: async (passwords) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.updatePassword(passwords);
      set({ isLoading: false });
      toast.success('Password updated successfully!');
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Update failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Set user (helper for OAuth)
   */
  setUser: (user) => {
    set({ user });
  },

  /**
   * Set authenticated status (helper for OAuth)
   */
  setAuthenticated: (isAuthenticated) => {
    set({ isAuthenticated });
  },
}));

export default useAuthStore;
