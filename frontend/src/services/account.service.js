/**
 * Account Service
 * Handles all API calls related to accounts
 */

import api from './api';

const accountService = {
  /**
   * Get all accounts
   */
  getAccounts: async () => {
    const { data } = await api.get('/accounts');
    return data;
  },

  /**
   * Get single account
   */
  getAccount: async (id) => {
    const { data } = await api.get(`/accounts/${id}`);
    return data;
  },

  /**
   * Create new account
   */
  createAccount: async (accountData) => {
    const { data } = await api.post('/accounts', accountData);
    return data;
  },

  /**
   * Update account
   */
  updateAccount: async (id, accountData) => {
    const { data } = await api.patch(`/accounts/${id}`, accountData);
    return data;
  },

  /**
   * Delete account
   */
  deleteAccount: async (id) => {
    const { data } = await api.delete(`/accounts/${id}`);
    return data;
  },

  /**
   * Get account transactions
   */
  getAccountTransactions: async (id, params = {}) => {
    const { data } = await api.get(`/accounts/${id}/transactions`, { params });
    return data;
  },
};

export default accountService;
