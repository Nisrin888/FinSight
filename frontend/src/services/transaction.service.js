/**
 * Transaction Service
 * Handles all API calls related to transactions
 */

import api from './api';

const transactionService = {
  /**
   * Get all transactions with optional filters
   */
  getTransactions: async (filters = {}) => {
    const { data } = await api.get('/transactions', { params: filters });
    return data;
  },

  /**
   * Get single transaction
   */
  getTransaction: async (id) => {
    const { data } = await api.get(`/transactions/${id}`);
    return data;
  },

  /**
   * Create new transaction
   */
  createTransaction: async (transactionData) => {
    const { data } = await api.post('/transactions', transactionData);
    return data;
  },

  /**
   * Update transaction
   */
  updateTransaction: async (id, transactionData) => {
    const { data } = await api.patch(`/transactions/${id}`, transactionData);
    return data;
  },

  /**
   * Delete transaction
   */
  deleteTransaction: async (id) => {
    const { data } = await api.delete(`/transactions/${id}`);
    return data;
  },

  /**
   * Get transaction statistics
   */
  getTransactionStats: async (params = {}) => {
    const { data } = await api.get('/transactions/stats', { params });
    return data;
  },
};

export default transactionService;
