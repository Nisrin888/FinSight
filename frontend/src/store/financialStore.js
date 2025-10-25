/**
 * Financial Store (Zustand)
 * Global state management for categories, accounts, transactions, and budgets
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';

// Services
import categoryService from '../services/category.service';
import accountService from '../services/account.service';
import transactionService from '../services/transaction.service';
import budgetService from '../services/budget.service';
import goalService from '../services/goal.service';
import dashboardService from '../services/dashboard.service';

const useFinancialStore = create((set, get) => ({
  // State
  categories: [],
  accounts: [],
  transactions: [],
  budgets: [],
  goals: [],
  dashboardData: null,

  // Loading states
  isLoadingCategories: false,
  isLoadingAccounts: false,
  isLoadingTransactions: false,
  isLoadingBudgets: false,
  isLoadingGoals: false,
  isLoadingDashboard: false,

  // Pagination
  transactionsPagination: {
    page: 1,
    pages: 1,
    total: 0,
    results: 0,
  },

  // Error state
  error: null,

  // ========== CATEGORY ACTIONS ==========

  /**
   * Fetch all categories
   */
  fetchCategories: async (type = null) => {
    set({ isLoadingCategories: true, error: null });
    try {
      const response = await categoryService.getCategories(type);
      set({
        categories: response.data,
        isLoadingCategories: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch categories';
      set({ error: errorMessage, isLoadingCategories: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Create category
   */
  createCategory: async (categoryData) => {
    set({ isLoadingCategories: true, error: null });
    try {
      const response = await categoryService.createCategory(categoryData);
      set((state) => ({
        categories: [...state.categories, response.data],
        isLoadingCategories: false,
      }));
      toast.success('Category created successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create category';
      set({ error: errorMessage, isLoadingCategories: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update category
   */
  updateCategory: async (id, categoryData) => {
    set({ isLoadingCategories: true, error: null });
    try {
      const response = await categoryService.updateCategory(id, categoryData);
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat._id === id ? response.data : cat
        ),
        isLoadingCategories: false,
      }));
      toast.success('Category updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update category';
      set({ error: errorMessage, isLoadingCategories: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete category
   */
  deleteCategory: async (id) => {
    set({ isLoadingCategories: true, error: null });
    try {
      await categoryService.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((cat) => cat._id !== id),
        isLoadingCategories: false,
      }));
      toast.success('Category deleted successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete category';
      set({ error: errorMessage, isLoadingCategories: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // ========== ACCOUNT ACTIONS ==========

  /**
   * Fetch all accounts
   */
  fetchAccounts: async () => {
    set({ isLoadingAccounts: true, error: null });
    try {
      const response = await accountService.getAccounts();
      set({
        accounts: response.data,
        isLoadingAccounts: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch accounts';
      set({ error: errorMessage, isLoadingAccounts: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Create account
   */
  createAccount: async (accountData) => {
    set({ isLoadingAccounts: true, error: null });
    try {
      const response = await accountService.createAccount(accountData);
      set((state) => ({
        accounts: [...state.accounts, response.data],
        isLoadingAccounts: false,
      }));
      toast.success('Account created successfully!');

      // Refresh dashboard data
      get().fetchDashboard();

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create account';
      set({ error: errorMessage, isLoadingAccounts: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update account
   */
  updateAccount: async (id, accountData) => {
    set({ isLoadingAccounts: true, error: null });
    try {
      const response = await accountService.updateAccount(id, accountData);
      set((state) => ({
        accounts: state.accounts.map((acc) =>
          acc._id === id ? response.data : acc
        ),
        isLoadingAccounts: false,
      }));
      toast.success('Account updated successfully!');

      // Refresh dashboard data
      get().fetchDashboard();

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update account';
      set({ error: errorMessage, isLoadingAccounts: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete account
   */
  deleteAccount: async (id) => {
    set({ isLoadingAccounts: true, error: null });
    try {
      await accountService.deleteAccount(id);
      set((state) => ({
        accounts: state.accounts.filter((acc) => acc._id !== id),
        isLoadingAccounts: false,
      }));
      toast.success('Account deleted successfully!');

      // Refresh dashboard data
      get().fetchDashboard();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete account';
      set({ error: errorMessage, isLoadingAccounts: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // ========== TRANSACTION ACTIONS ==========

  /**
   * Fetch transactions with filters
   */
  fetchTransactions: async (filters = {}) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      const response = await transactionService.getTransactions(filters);
      set({
        transactions: response.data,
        transactionsPagination: {
          page: response.page,
          pages: response.pages,
          total: response.total,
          results: response.results,
        },
        isLoadingTransactions: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch transactions';
      set({ error: errorMessage, isLoadingTransactions: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Create transaction
   */
  createTransaction: async (transactionData) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      const response = await transactionService.createTransaction(transactionData);
      set((state) => ({
        transactions: [response.data, ...state.transactions],
        isLoadingTransactions: false,
      }));
      toast.success('Transaction created successfully!');

      // Refresh accounts and dashboard
      get().fetchAccounts();
      get().fetchDashboard();

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create transaction';
      set({ error: errorMessage, isLoadingTransactions: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update transaction
   */
  updateTransaction: async (id, transactionData) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      const response = await transactionService.updateTransaction(id, transactionData);
      set((state) => ({
        transactions: state.transactions.map((txn) =>
          txn._id === id ? response.data : txn
        ),
        isLoadingTransactions: false,
      }));
      toast.success('Transaction updated successfully!');

      // Refresh dashboard
      get().fetchDashboard();

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update transaction';
      set({ error: errorMessage, isLoadingTransactions: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete transaction
   */
  deleteTransaction: async (id) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      await transactionService.deleteTransaction(id);
      set((state) => ({
        transactions: state.transactions.filter((txn) => txn._id !== id),
        isLoadingTransactions: false,
      }));
      toast.success('Transaction deleted successfully!');

      // Refresh accounts and dashboard
      get().fetchAccounts();
      get().fetchDashboard();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete transaction';
      set({ error: errorMessage, isLoadingTransactions: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // ========== BUDGET ACTIONS ==========

  /**
   * Fetch budgets
   */
  fetchBudgets: async (withProgress = true) => {
    set({ isLoadingBudgets: true, error: null });
    try {
      const response = await budgetService.getBudgets(withProgress);
      set({
        budgets: response.data,
        isLoadingBudgets: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch budgets';
      set({ error: errorMessage, isLoadingBudgets: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Create budget
   */
  createBudget: async (budgetData) => {
    set({ isLoadingBudgets: true, error: null });
    try {
      const response = await budgetService.createBudget(budgetData);
      set((state) => ({
        budgets: [...state.budgets, response.data],
        isLoadingBudgets: false,
      }));
      toast.success('Budget created successfully!');

      // Refresh dashboard
      get().fetchDashboard();

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create budget';
      set({ error: errorMessage, isLoadingBudgets: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update budget
   */
  updateBudget: async (id, budgetData) => {
    set({ isLoadingBudgets: true, error: null });
    try {
      const response = await budgetService.updateBudget(id, budgetData);
      set((state) => ({
        budgets: state.budgets.map((budget) =>
          budget._id === id ? response.data : budget
        ),
        isLoadingBudgets: false,
      }));
      toast.success('Budget updated successfully!');

      // Refresh dashboard
      get().fetchDashboard();

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update budget';
      set({ error: errorMessage, isLoadingBudgets: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete budget
   */
  deleteBudget: async (id) => {
    set({ isLoadingBudgets: true, error: null });
    try {
      await budgetService.deleteBudget(id);
      set((state) => ({
        budgets: state.budgets.filter((budget) => budget._id !== id),
        isLoadingBudgets: false,
      }));
      toast.success('Budget deleted successfully!');

      // Refresh dashboard
      get().fetchDashboard();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete budget';
      set({ error: errorMessage, isLoadingBudgets: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // ========== GOAL ACTIONS ==========

  /**
   * Fetch goals
   */
  fetchGoals: async () => {
    set({ isLoadingGoals: true, error: null });
    try {
      const response = await goalService.getGoals();
      set({
        goals: response.data,
        isLoadingGoals: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch goals';
      set({ error: errorMessage, isLoadingGoals: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Create goal
   */
  createGoal: async (goalData) => {
    set({ isLoadingGoals: true, error: null });
    try {
      const response = await goalService.createGoal(goalData);
      set((state) => ({
        goals: [...state.goals, response.data],
        isLoadingGoals: false,
      }));
      toast.success('Goal created successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create goal';
      set({ error: errorMessage, isLoadingGoals: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update goal
   */
  updateGoal: async (id, goalData) => {
    set({ isLoadingGoals: true, error: null });
    try {
      const response = await goalService.updateGoal(id, goalData);
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal._id === id ? response.data : goal
        ),
        isLoadingGoals: false,
      }));
      toast.success('Goal updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update goal';
      set({ error: errorMessage, isLoadingGoals: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete goal
   */
  deleteGoal: async (id) => {
    set({ isLoadingGoals: true, error: null });
    try {
      await goalService.deleteGoal(id);
      set((state) => ({
        goals: state.goals.filter((goal) => goal._id !== id),
        isLoadingGoals: false,
      }));
      toast.success('Goal deleted successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete goal';
      set({ error: errorMessage, isLoadingGoals: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Contribute to goal
   */
  contributeToGoal: async (goalId, contributionData) => {
    set({ isLoadingGoals: true, error: null });
    try {
      const response = await goalService.contributeToGoal(goalId, contributionData);
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal._id === goalId ? response.data : goal
        ),
        isLoadingGoals: false,
      }));
      toast.success('Contribution added successfully!');

      // Refresh accounts and dashboard if account was used
      if (contributionData.accountId) {
        get().fetchAccounts();
        get().fetchDashboard();
      }

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add contribution';
      set({ error: errorMessage, isLoadingGoals: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // ========== DASHBOARD ACTIONS ==========

  /**
   * Fetch complete dashboard data
   */
  fetchDashboard: async () => {
    set({ isLoadingDashboard: true, error: null });
    try {
      const response = await dashboardService.getCompleteDashboard();
      set({
        dashboardData: response.data,
        isLoadingDashboard: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch dashboard data';
      set({ error: errorMessage, isLoadingDashboard: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // ========== UTILITY ACTIONS ==========

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset all financial data
   */
  resetFinancialData: () => {
    set({
      categories: [],
      accounts: [],
      transactions: [],
      budgets: [],
      goals: [],
      dashboardData: null,
      transactionsPagination: {
        page: 1,
        pages: 1,
        total: 0,
        results: 0,
      },
      error: null,
    });
  },
}));

export default useFinancialStore;
