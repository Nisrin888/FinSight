/**
 * Dashboard Service
 * Handles all API calls related to dashboard analytics
 */

import api from './api';

const dashboardService = {
  /**
   * Get complete dashboard data (all in one request)
   */
  getCompleteDashboard: async () => {
    const { data } = await api.get('/dashboard');
    return data;
  },

  /**
   * Get dashboard summary
   */
  getDashboardSummary: async () => {
    const { data } = await api.get('/dashboard/summary');
    return data;
  },

  /**
   * Get spending by category
   */
  getSpendingByCategory: async (params = {}) => {
    const { data } = await api.get('/dashboard/spending-by-category', { params });
    return data;
  },

  /**
   * Get income vs expense trend
   */
  getIncomeTrend: async (params = {}) => {
    const { data } = await api.get('/dashboard/income-expense-trend', { params });
    return data;
  },

  /**
   * Get recent transactions
   */
  getRecentTransactions: async (limit = 5) => {
    const { data } = await api.get('/dashboard/recent-transactions', {
      params: { limit },
    });
    return data;
  },

  /**
   * Get budgets overview
   */
  getBudgetsOverview: async () => {
    const { data } = await api.get('/dashboard/budgets');
    return data;
  },

  /**
   * Get account balances
   */
  getAccountBalances: async () => {
    const { data } = await api.get('/dashboard/accounts');
    return data;
  },
};

export default dashboardService;
