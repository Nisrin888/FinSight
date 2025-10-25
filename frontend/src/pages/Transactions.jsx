/**
 * Transactions Page - Enhanced
 * View, filter, edit, and manage all transactions with advanced features
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
  Edit2,
  ChevronDown,
  Download,
  AlertCircle,
  Wallet,
  Smile,
  Tag,
  Trash2,
} from 'lucide-react';

// Layout & Components
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

// Store
import useFinancialStore from '../store/financialStore';

const Transactions = () => {
  const {
    transactions,
    categories,
    accounts,
    isLoadingTransactions,
    fetchTransactions,
    fetchCategories,
    fetchAccounts,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useFinancialStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNoAccountsModal, setShowNoAccountsModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'expense',
    emoji: '',
    description: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    account: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // New category form state
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    type: 'expense',
    emoji: '',
    description: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchAccounts();
  }, []);

  // Check for account filter from URL params
  useEffect(() => {
    const accountParam = searchParams.get('account');
    if (accountParam && accounts.length > 0) {
      setSelectedAccount(accountParam);
      setShowFilters(true); // Show filters section when coming from account view
    }
  }, [searchParams, accounts]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType =
      filterType === 'all' || transaction.type === filterType;
    const matchesSearch =
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || transaction.category?._id === selectedCategory;
    const matchesAccount =
      !selectedAccount || transaction.account?._id === selectedAccount;
    return matchesType && matchesSearch && matchesCategory && matchesAccount;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction._id, transactionData);
      } else {
        await createTransaction(transactionData);
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        category: '',
        account: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle add transaction - check if accounts exist first
  const handleAddTransaction = () => {
    if (accounts.length === 0) {
      setShowNoAccountsModal(true);
    } else {
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        category: '',
        account: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setIsModalOpen(true);
    }
  };

  // Handle create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      // Prepare data, omitting empty emoji
      const categoryData = {
        name: newCategoryData.name,
        type: newCategoryData.type,
        ...(newCategoryData.emoji && { emoji: newCategoryData.emoji }),
        ...(newCategoryData.description && { description: newCategoryData.description }),
      };

      const newCategory = await createCategory(categoryData);

      // Auto-select the newly created category
      setFormData((prev) => ({ ...prev, category: newCategory._id }));

      // Reset and close modal
      setShowCreateCategoryModal(false);
      setNewCategoryData({
        name: '',
        type: formData.type, // Keep same type as transaction
        emoji: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating category:', error);
      // Error toast is already shown by the store
    }
  };

  // Handle new category form change
  const handleNewCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategoryData((prev) => ({ ...prev, [name]: value }));
  };

  // Category Management Handlers
  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      type: category.type,
      emoji: category.emoji || category.icon || '',
      description: category.description || '',
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      // Prepare data, omitting empty emoji and description
      const categoryData = {
        name: categoryFormData.name,
        type: categoryFormData.type,
        ...(categoryFormData.emoji && { emoji: categoryFormData.emoji }),
        ...(categoryFormData.description && { description: categoryFormData.description }),
      };

      if (editingCategory) {
        await updateCategory(editingCategory._id, categoryData);
      } else {
        await createCategory(categoryData);
      }
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        type: 'expense',
        emoji: '',
        description: '',
      });
    } catch (error) {
      console.error('Error saving category:', error);
      // Error toast is already shown by the store
    }
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete._id);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Handle delete transaction - open confirmation modal
  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete transaction
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete._id);
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Open edit modal
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category?._id || '',
      account: transaction.account?._id || '',
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      date: new Date(transaction.date).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterType('all');
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAccount('');
  };

  // Get category icon
  const getCategoryIcon = (categoryName) => {
    return categoryName?.charAt(0).toUpperCase() || '💰';
  };

  if (isLoadingTransactions && transactions.length === 0) {
    return (
      <MainLayout>
        <LoadingSpinner size="lg" text="Loading transactions..." fullScreen />
      </MainLayout>
    );
  }

  const hasActiveFilters = selectedCategory || selectedAccount || filterType !== 'all' || searchQuery;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Transactions</h1>
              {selectedAccount && (
                <span className="px-3 py-1 text-xs font-medium bg-primary-500/20 text-primary-300 rounded-full border border-primary-500/30">
                  {accounts.find(acc => acc._id === selectedAccount)?.name || 'Filtered'}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-400 mt-1">
              {selectedAccount
                ? `Viewing transactions for ${accounts.find(acc => acc._id === selectedAccount)?.name || 'selected account'}`
                : 'Track and manage all your financial transactions'
              }
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={<Tag className="w-4 h-4" />}
              onClick={() => setShowCategoriesModal(true)}
            >
              Categories
            </Button>
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={handleAddTransaction}
            >
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-white/10"
          >
            <div className="relative">
              <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Total Income</p>
              <p className="text-lg sm:text-2xl font-bold text-green-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6 bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-xl border border-white/10"
          >
            <div className="relative">
              <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Total Expense</p>
              <p className="text-lg sm:text-2xl font-bold text-red-400">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            {/* Type Tabs & Filter Button */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterType(tab.value)}
                    className={`
                      px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 text-sm
                      ${
                        filterType === tab.value
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30'
                          : 'bg-dark-hover text-gray-400 hover:text-white'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium
                  ${
                    showFilters || hasActiveFilters
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-hover text-gray-400 hover:text-white'
                  }
                `}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white" />}
              </button>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <Select
                      label="Category"
                      name="filterCategory"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      options={categories.map((category) => ({
                        value: category._id,
                        label: `${category.emoji} ${category.name}`,
                      }))}
                      placeholder="All Categories"
                    />

                    <Select
                      label="Account"
                      name="filterAccount"
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      options={accounts.map((account) => ({
                        value: account._id,
                        label: `${account.icon} ${account.name}`,
                      }))}
                      placeholder="All Accounts"
                    />
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-dark-hover border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm sm:text-base"
              />
            </div>
          </div>
        </Card>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card>
            <EmptyState
              title="No transactions found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Start adding transactions to track your finances'
              }
              action={
                !hasActiveFilters && (
                  <Button
                    icon={<Plus className="w-4 h-4" />}
                    onClick={handleAddTransaction}
                  >
                    Add Transaction
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <Card key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-3 border-b border-white/10">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-400">
                    {date}
                  </h3>
                </div>

                {/* Transactions */}
                <div className="space-y-2">
                  {dateTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-dark-hover hover:bg-dark-hover/70 transition-all group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Category Icon */}
                        <div
                          className={`
                            w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0
                            ${
                              transaction.type === 'income'
                                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                                : 'bg-gradient-to-br from-red-500/20 to-rose-500/20'
                            }
                          `}
                        >
                          {transaction.category?.emoji || getCategoryIcon(transaction.category?.name)}
                        </div>

                        {/* Transaction Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base text-white font-medium truncate">
                            {transaction.description || transaction.category?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                            <span className="text-xs sm:text-sm text-gray-500 truncate">
                              {transaction.category?.name}
                            </span>
                            {transaction.account && (
                              <>
                                <span className="text-gray-600 hidden sm:inline">•</span>
                                <span className="text-xs sm:text-sm text-gray-500 truncate hidden sm:inline">
                                  {transaction.account.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p
                            className={`text-base sm:text-lg font-bold ${
                              transaction.type === 'income'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-1.5 sm:p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Transaction Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'expense' }))}
                className={`
                  p-3 sm:p-4 rounded-xl border-2 transition-all
                  ${
                    formData.type === 'expense'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-white/10 bg-dark-hover'
                  }
                `}
              >
                <TrendingDown
                  className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${
                    formData.type === 'expense' ? 'text-red-400' : 'text-gray-500'
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    formData.type === 'expense' ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  Expense
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'income' }))}
                className={`
                  p-3 sm:p-4 rounded-xl border-2 transition-all
                  ${
                    formData.type === 'income'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/10 bg-dark-hover'
                  }
                `}
              >
                <TrendingUp
                  className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${
                    formData.type === 'income' ? 'text-green-400' : 'text-gray-500'
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    formData.type === 'income' ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  Income
                </span>
              </button>
            </div>

            {/* Amount */}
            <Input
              label="Amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
              step="0.01"
              min="0.01"
            />

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Category
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNewCategoryData({
                      name: '',
                      type: formData.type,
                      emoji: '',
                      description: '',
                    });
                    setShowCreateCategoryModal(true);
                  }}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Create New
                </button>
              </div>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={categories
                  .filter((cat) => cat.type === formData.type)
                  .map((category) => ({
                    value: category._id,
                    label: `${category.emoji} ${category.name}`,
                  }))}
                placeholder="Select a category"
                required
              />
            </div>

            {/* Account */}
            <Select
              label="Account"
              name="account"
              value={formData.account}
              onChange={handleChange}
              options={accounts.map((account) => ({
                value: account._id,
                label: `${account.icon} ${account.name}`,
              }))}
              placeholder="Select an account"
              required
            />

            {/* Description */}
            <Input
              label="Description (Optional)"
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Grocery shopping"
              maxLength={100}
            />

            {/* Date */}
            <Input
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
            />

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} fullWidth>
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </Button>
            </div>
          </form>
        </Modal>

        {/* No Accounts Warning Modal */}
        <Modal
          isOpen={showNoAccountsModal}
          onClose={() => setShowNoAccountsModal(false)}
          title=""
        >
          <div className="text-center py-4">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/50"
            >
              <AlertCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              No Accounts Found
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 mb-6 text-sm sm:text-base leading-relaxed"
            >
              Before you can add transactions, you need to create at least one
              account. Accounts represent your bank accounts, credit cards, cash
              wallets, or any other place where you keep money.
            </motion.p>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-dark-hover rounded-xl p-4 sm:p-6 mb-6 text-left"
            >
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    Why do I need an account?
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Every transaction must be linked to an account so you can track
                    where your money is coming from and going to. This helps you
                    maintain accurate financial records and insights.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                onClick={() => {
                  setShowNoAccountsModal(false);
                  navigate('/accounts');
                }}
                icon={<Plus className="w-4 h-4" />}
                fullWidth
              >
                Create Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowNoAccountsModal(false)}
                fullWidth
              >
                Cancel
              </Button>
            </motion.div>
          </div>
        </Modal>

        {/* Create Category Modal */}
        <Modal
          isOpen={showCreateCategoryModal}
          onClose={() => {
            setShowCreateCategoryModal(false);
            setNewCategoryData({
              name: '',
              type: 'expense',
              emoji: '',
              description: '',
            });
          }}
          title="Create New Category"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4">
            {/* Category Type */}
            <Select
              label="Category Type"
              name="type"
              value={newCategoryData.type}
              onChange={handleNewCategoryChange}
              options={[
                { value: 'income', label: '💰 Income' },
                { value: 'expense', label: '💸 Expense' },
              ]}
              required
            />

            {/* Category Name */}
            <Input
              label="Category Name"
              type="text"
              name="name"
              value={newCategoryData.name}
              onChange={handleNewCategoryChange}
              placeholder="e.g., Groceries, Salary, Rent"
              required
              maxLength={50}
            />

            {/* Emoji Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose an Emoji Icon
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    name="emoji"
                    value={newCategoryData.emoji}
                    onChange={handleNewCategoryChange}
                    placeholder="Click to choose emoji"
                    maxLength={10}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      'input[name="emoji"]'
                    );
                    if (input) {
                      input.focus();
                      if (input.showPicker) {
                        input.showPicker();
                      }
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-dark-hover border border-white/10 hover:border-primary-500 transition-all text-2xl"
                  title="Choose emoji"
                >
                  <Smile className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: On most devices, you can type an emoji directly or use
                your system's emoji picker (Windows: Win + . | Mac: Cmd + Ctrl +
                Space)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={newCategoryData.description}
                onChange={handleNewCategoryChange}
                placeholder="Add notes about this category..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl bg-dark-hover border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateCategoryModal(false);
                  setNewCategoryData({
                    name: '',
                    type: 'expense',
                    emoji: '',
                    description: '',
                  });
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" fullWidth>
                Create Category
              </Button>
            </div>
          </form>
        </Modal>

        {/* Categories Management Modal */}
        <Modal
          isOpen={showCategoriesModal}
          onClose={() => {
            setShowCategoriesModal(false);
            setEditingCategory(null);
            setCategoryFormData({
              name: '',
              type: 'expense',
              emoji: '',
              description: '',
            });
          }}
          title="Manage Categories"
          size="xl"
        >
          <div className="space-y-6">
            {/* Add/Edit Category Form */}
            <form onSubmit={handleSaveCategory} className="space-y-4 p-4 rounded-xl bg-dark-hover border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Type */}
                <Select
                  label="Type"
                  name="type"
                  value={categoryFormData.type}
                  onChange={handleCategoryFormChange}
                  options={[
                    { value: 'income', label: '💰 Income' },
                    { value: 'expense', label: '💸 Expense' },
                  ]}
                  required
                />

                {/* Category Name */}
                <Input
                  label="Name"
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryFormChange}
                  placeholder="e.g., Groceries, Salary"
                  required
                  maxLength={50}
                />
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emoji Icon
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      name="emoji"
                      value={categoryFormData.emoji}
                      onChange={handleCategoryFormChange}
                      placeholder="Choose an emoji"
                      maxLength={10}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[name="emoji"]');
                      if (input) {
                        input.focus();
                        if (input.showPicker) {
                          input.showPicker();
                        }
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-dark-card border border-white/10 hover:border-primary-500 transition-all"
                    title="Choose emoji"
                  >
                    <Smile className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryFormChange}
                  placeholder="Add notes..."
                  rows={2}
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl bg-dark-card border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {editingCategory && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryFormData({
                        name: '',
                        type: 'expense',
                        emoji: '',
                        description: '',
                      });
                    }}
                    fullWidth
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" fullWidth>
                  {editingCategory ? 'Update' : 'Add'} Category
                </Button>
              </div>
            </form>

            {/* Categories List */}
            <div className="space-y-4">
              {/* Income Categories */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Income Categories ({categories.filter((c) => c.type === 'income').length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories
                    .filter((c) => c.type === 'income')
                    .map((category) => (
                      <div
                        key={category._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-white/10 hover:border-green-500/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">
                            {category.emoji || category.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {categories.filter((c) => c.type === 'income').length === 0 && (
                    <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                      No income categories yet
                    </p>
                  )}
                </div>
              </div>

              {/* Expense Categories */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Expense Categories ({categories.filter((c) => c.type === 'expense').length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories
                    .filter((c) => c.type === 'expense')
                    .map((category) => (
                      <div
                        key={category._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-white/10 hover:border-red-500/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">
                            {category.emoji || category.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {categories.filter((c) => c.type === 'expense').length === 0 && (
                    <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                      No expense categories yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete Category Confirmation Modal */}
        <Modal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          title=""
          size="sm"
        >
          <div className="text-center py-4">
            {/* Warning Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-red-500/50"
            >
              <AlertCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              Delete Category?
            </motion.h2>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <p className="text-gray-400 mb-4 text-sm sm:text-base">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-white">
                  {categoryToDelete?.emoji || categoryToDelete?.icon} {categoryToDelete?.name}
                </span>
                ?
              </p>
              <p className="text-gray-500 text-sm">
                This action cannot be undone. The category will be permanently removed.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                variant="ghost"
                onClick={() => setCategoryToDelete(null)}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteCategory}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                fullWidth
              >
                Delete Category
              </Button>
            </motion.div>
          </div>
        </Modal>

        {/* Delete Transaction Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
          }}
          title=""
          size="sm"
        >
          <div className="text-center py-4">
            {/* Warning Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-red-500/50"
            >
              <AlertCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              Delete Transaction?
            </motion.h2>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <p className="text-gray-400 mb-4 text-sm sm:text-base">
                Are you sure you want to delete this transaction?
              </p>
              {transactionToDelete && (
                <div className="bg-dark-hover rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-card flex items-center justify-center text-xl">
                        {transactionToDelete.category?.icon || '💰'}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white text-sm">
                          {transactionToDelete.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {transactionToDelete.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${
                      transactionToDelete.type === 'income'
                        ? 'text-green-400'
                        : transactionToDelete.type === 'expense'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}>
                      {transactionToDelete.type === 'expense' ? '-' : '+'}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(transactionToDelete.amount)}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-gray-500 text-sm">
                This action cannot be undone. The transaction will be permanently removed and account balances will be updated.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTransactionToDelete(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteTransaction}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                fullWidth
              >
                Delete Transaction
              </Button>
            </motion.div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Transactions;
