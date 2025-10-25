/**
 * Goal Service
 * Handles all API calls related to financial goals
 */

import api from './api';

const goalService = {
  /**
   * Get all goals
   */
  getGoals: async () => {
    const { data } = await api.get('/goals');
    return data;
  },

  /**
   * Get single goal
   */
  getGoal: async (id) => {
    const { data } = await api.get(`/goals/${id}`);
    return data;
  },

  /**
   * Create new goal
   */
  createGoal: async (goalData) => {
    const { data } = await api.post('/goals', goalData);
    return data;
  },

  /**
   * Update goal
   */
  updateGoal: async (id, goalData) => {
    const { data } = await api.patch(`/goals/${id}`, goalData);
    return data;
  },

  /**
   * Delete goal
   */
  deleteGoal: async (id) => {
    const { data } = await api.delete(`/goals/${id}`);
    return data;
  },

  /**
   * Contribute to goal (optionally from account)
   */
  contributeToGoal: async (id, contributionData) => {
    const { data } = await api.post(`/goals/${id}/contribute`, contributionData);
    return data;
  },
};

export default goalService;
