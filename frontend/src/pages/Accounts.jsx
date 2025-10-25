/**
 * Accounts Page
 * Manage financial accounts with full CRUD operations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Wallet,
  CreditCard,
  Banknote,
  TrendingUp,
  Building2,
  Edit2,
  Trash2,
  ChevronRight,
  DollarSign,
  PiggyBank,
  AlertCircle,
} from 'lucide-react';

// Layout & Components
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Store
import useFinancialStore from '../store/financialStore';

const Accounts = () => {
  const navigate = useNavigate();
  const {
    accounts,
    isLoadingAccounts,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useFinancialStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: '',
    currency: 'USD',
    icon: '🏦',
    color: '#3B82F6',
    description: '',
    institution: '',
    creditLimit: '',
  });

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Account type configurations (simplified to 3 types)
  const accountTypes = [
    {
      value: 'checking',
      label: 'Checking Account',
      icon: Wallet,
      color: '#3B82F6', // Blue
      emoji: '🏦',
    },
    {
      value: 'savings',
      label: 'Savings Account',
      icon: PiggyBank,
      color: '#10B981', // Green
      emoji: '🐷',
    },
    {
      value: 'credit',
      label: 'Credit Card',
      icon: CreditCard,
      color: '#8B5CF6', // Purple
      emoji: '💳',
    },
  ];

  // Icon options (only 3 - one for each account type)
  const iconOptions = [
    '🏦', // Checking
    '🐷', // Savings
    '💳', // Credit
  ];

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
    { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
    { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
    { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
    { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
    { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
    { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'Fr' },
    { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
    { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
    { value: 'MXN', label: 'MXN - Mexican Peso', symbol: 'Mex$' },
    { value: 'BRL', label: 'BRL - Brazilian Real', symbol: 'R$' },
    { value: 'ZAR', label: 'ZAR - South African Rand', symbol: 'R' },
  ];

  // Format currency with custom currency code
  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount || 0);
  };

  // Calculate summary stats
  const totalAssets = accounts
    .filter((acc) => acc.type !== 'credit')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalLiabilities = Math.abs(
    accounts
      .filter((acc) => acc.type === 'credit')
      .reduce((sum, acc) => sum + acc.balance, 0)
  );

  const netWorth = totalAssets - totalLiabilities;
  const accountCount = accounts.length;

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const accountData = {
      name: formData.name,
      type: formData.type,
      balance: parseFloat(formData.balance),
      currency: formData.currency,
      icon: formData.icon,
      color: formData.color,
      description: formData.description,
      institution: formData.institution,
    };

    // Add credit limit for credit cards
    if (formData.type === 'credit' && formData.creditLimit) {
      accountData.creditLimit = parseFloat(formData.creditLimit);
    }

    try {
      if (editingAccount) {
        await updateAccount(editingAccount._id, accountData);
      } else {
        await createAccount(accountData);
      }

      // Reset form
      setIsModalOpen(false);
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'checking',
        balance: '',
        currency: 'USD',
        icon: '🏦',
        color: '#3B82F6',
        description: '',
        institution: '',
        creditLimit: '',
      });
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-select emoji and color when type changes
    if (name === 'type') {
      const typeConfig = accountTypes.find((t) => t.value === value);
      if (typeConfig) {
        setFormData((prev) => ({
          ...prev,
          icon: typeConfig.emoji,
          color: typeConfig.color
        }));
      }
    }
  };

  // Handle edit
  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      currency: account.currency || 'USD',
      icon: account.icon || '🏦',
      color: account.color || '#3B82F6',
      description: account.description || '',
      institution: account.institution || '',
      creditLimit: account.creditLimit?.toString() || '',
    });
    setIsModalOpen(true);
  };

  // Handle delete - open confirmation modal
  const handleDelete = (account) => {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete account
  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      await deleteAccount(accountToDelete._id);
      setIsDeleteModalOpen(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  // Get account type config
  const getAccountTypeConfig = (type) => {
    return accountTypes.find((t) => t.value === type) || accountTypes[0];
  };

  if (isLoadingAccounts && accounts.length === 0) {
    return (
      <MainLayout>
        <LoadingSpinner fullScreen text="Loading accounts..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Accounts</h1>
            <p className="text-gray-400 mt-1">
              Manage your bank accounts and wallets
            </p>
          </div>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingAccount(null);
              setFormData({
                name: '',
                type: 'checking',
                balance: '',
                currency: 'USD',
                icon: '🏦',
                color: '#3B82F6',
                description: '',
                institution: '',
                creditLimit: '',
              });
              setIsModalOpen(true);
            }}
          >
            Add Account
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            {
              label: 'Total Assets',
              value: formatCurrency(totalAssets),
              icon: TrendingUp,
              gradient: 'from-green-500/20 to-emerald-500/20',
              iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
              glow: 'shadow-lg shadow-green-500/20',
            },
            {
              label: 'Liabilities',
              value: formatCurrency(totalLiabilities),
              icon: CreditCard,
              gradient: 'from-red-500/20 to-rose-500/20',
              iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
              glow: 'shadow-lg shadow-red-500/20',
            },
            {
              label: 'Net Worth',
              value: formatCurrency(netWorth),
              icon: DollarSign,
              gradient: 'from-primary-500/20 to-secondary-500/20',
              iconBg: 'bg-gradient-to-br from-primary-500 to-secondary-500',
              glow: 'shadow-lg shadow-primary-500/20',
            },
            {
              label: 'Accounts',
              value: accountCount,
              icon: Wallet,
              gradient: 'from-blue-500/20 to-cyan-500/20',
              iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
              glow: 'shadow-lg shadow-blue-500/20',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`
                relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6
                bg-gradient-to-br ${stat.gradient}
                backdrop-blur-xl border border-white/10
                hover:border-white/20 transition-all duration-300
                ${stat.glow} hover:shadow-xl
                group cursor-pointer
              `}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white truncate">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg flex-shrink-0 ml-2`}
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No accounts yet</p>
              <Button
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                Add Your First Account
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-fr">
            {accounts.map((account, index) => {
              const typeConfig = getAccountTypeConfig(account.type);
              const TypeIcon = typeConfig.icon;
              const isCredit = account.type === 'credit';
              const balanceColor = isCredit
                ? account.balance < 0
                  ? 'text-red-400'
                  : 'text-green-400'
                : account.balance >= 0
                ? 'text-green-400'
                : 'text-red-400';

              return (
                <motion.div
                  key={account._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="h-full"
                >
                  <div
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-dark-card/80 to-dark-card/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl group h-full flex flex-col"
                    style={{
                      boxShadow: `0 10px 40px ${account.color}20`,
                    }}
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Icon */}
                          <div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0"
                            style={{ backgroundColor: `${account.color}30` }}
                          >
                            {account.icon}
                          </div>

                          {/* Account Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-white truncate">
                              {account.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                              <TypeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{typeConfig.label}</span>
                            </div>
                            {account.institution && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate">
                                  {account.institution}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                          <button
                            onClick={() => handleEdit(account)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(account)}
                            className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="mb-4">
                        <p className="text-xs sm:text-sm text-gray-400 mb-1">
                          {isCredit ? 'Current Balance' : 'Available Balance'}
                        </p>
                        <p
                          className={`text-2xl sm:text-3xl font-bold ${balanceColor}`}
                        >
                          {formatCurrency(account.balance, account.currency)}
                        </p>
                        {isCredit && account.creditLimit && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Credit Limit: {formatCurrency(account.creditLimit, account.currency)}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div className="flex-1">
                        {account.description && (
                          <p className="text-xs sm:text-sm text-gray-500 mb-4 line-clamp-2">
                            {account.description}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                        <span className="text-xs text-gray-500">
                          {account.currency}
                        </span>
                        <button
                          className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors group/btn"
                          onClick={() => navigate(`/transactions?account=${account._id}`)}
                        >
                          <span className="hidden sm:inline">
                            View Transactions
                          </span>
                          <span className="sm:hidden">Transactions</span>
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Account Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAccount(null);
          }}
          title={editingAccount ? 'Edit Account' : 'Add Account'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Icon Picker (Account Type Selection) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Account Type
              </label>
              <div className="flex gap-4 justify-center mb-6">
                {iconOptions.map((emoji, index) => {
                  const type = ['checking', 'savings', 'credit'][index];
                  const typeLabel = ['Checking', 'Savings', 'Credit'][index];
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        const typeConfig = accountTypes[index];
                        setFormData((prev) => ({
                          ...prev,
                          icon: emoji,
                          type: type,
                          color: typeConfig.color
                        }));
                      }}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                        ${
                          formData.icon === emoji
                            ? 'bg-primary-500/20 border-2 border-primary-500 scale-105'
                            : 'bg-dark-hover border-2 border-white/10 hover:border-white/20'
                        }
                      `}
                    >
                      <span className="text-4xl">{emoji}</span>
                      <span className="text-xs text-gray-400 font-medium">{typeLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Name */}
            <Input
              label="Account Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Chase Checking"
              required
              maxLength={50}
            />

            {/* Institution */}
            <Input
              label="Bank/Institution (Optional)"
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="e.g., Chase Bank"
              maxLength={100}
            />

            {/* Initial Balance */}
            <Input
              label={editingAccount ? 'Current Balance' : 'Initial Balance'}
              type="number"
              name="balance"
              value={formData.balance}
              onChange={handleChange}
              placeholder="0.00"
              required
              step="0.01"
            />

            {/* Currency Selection */}
            <Select
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              options={currencyOptions}
              required
            />

            {/* Credit Limit (only for credit cards) */}
            {formData.type === 'credit' && (
              <Input
                label="Credit Limit"
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
              />
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes about this account..."
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
                  setIsModalOpen(false);
                  setEditingAccount(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" fullWidth>
                {editingAccount ? 'Update' : 'Add'} Account
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Account Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setAccountToDelete(null);
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
              Delete Account?
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
                  {accountToDelete?.icon} {accountToDelete?.name}
                </span>
                ?
              </p>
              <p className="text-gray-500 text-sm">
                This action cannot be undone. All transaction history associated with this account will remain, but the account itself will be permanently removed.
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
                  setAccountToDelete(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteAccount}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                fullWidth
              >
                Delete Account
              </Button>
            </motion.div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Accounts;
