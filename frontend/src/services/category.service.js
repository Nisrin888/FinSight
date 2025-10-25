/**
 * Category Service
 * Handles all API calls related to categories
 */

import api from './api';

const categoryService = {
  /**
   * Get all categories (optional type filter)
   */
  getCategories: async (type = null) => {
    const params = type ? { type } : {};
    const { data } = await api.get('/categories', { params });
    return data;
  },

  /**
   * Get single category
   */
  getCategory: async (id) => {
    const { data } = await api.get(`/categories/${id}`);
    return data;
  },

  /**
   * Create new category
   */
  createCategory: async (categoryData) => {
    const { data } = await api.post('/categories', categoryData);
    return data;
  },

  /**
   * Update category
   */
  updateCategory: async (id, categoryData) => {
    const { data } = await api.patch(`/categories/${id}`, categoryData);
    return data;
  },

  /**
   * Delete category
   */
  deleteCategory: async (id) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },
};

export default categoryService;
