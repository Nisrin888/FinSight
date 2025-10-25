/**
 * Budget Service
 * Handles all API calls related to budgets
 */

import api from './api';

const budgetService = {
  /**
   * Get all budgets (with optional progress)
   */
  getBudgets: async (withProgress = false) => {
    const params = withProgress ? { withProgress: true } : {};
    const { data } = await api.get('/budgets', { params });
    return data;
  },

  /**
   * Get single budget
   */
  getBudget: async (id) => {
    const { data } = await api.get(`/budgets/${id}`);
    return data;
  },

  /**
   * Create new budget
   */
  createBudget: async (budgetData) => {
    const { data } = await api.post('/budgets', budgetData);
    return data;
  },

  /**
   * Update budget
   */
  updateBudget: async (id, budgetData) => {
    const { data } = await api.patch(`/budgets/${id}`, budgetData);
    return data;
  },

  /**
   * Delete budget
   */
  deleteBudget: async (id) => {
    const { data } = await api.delete(`/budgets/${id}`);
    return data;
  },

  /**
   * Get budget progress
   */
  getBudgetProgress: async (id) => {
    const { data } = await api.get(`/budgets/${id}/progress`);
    return data;
  },

  /**
   * Get budget alerts
   */
  getBudgetAlerts: async () => {
    const { data } = await api.get('/budgets/alerts');
    return data;
  },
};

export default budgetService;
