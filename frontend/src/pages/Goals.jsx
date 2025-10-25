/**
 * Goals Page
 * Set and track financial goals with mobile-responsive design
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  Smile,
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

const Goals = () => {
  const {
    goals,
    accounts,
    isLoadingGoals,
    fetchGoals,
    fetchAccounts,
    createGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
  } = useFinancialStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    icon: '',
  });
  const [contributeData, setContributeData] = useState({
    amount: '',
    accountId: '',
  });
  // Load data on mount
  useEffect(() => {
    fetchGoals();
    fetchAccounts();
  }, [fetchGoals, fetchAccounts]);

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

  // Calculate progress percentage
  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  // Calculate days remaining
  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    try {
      const goalData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount || 0),
      };

      // Only include icon if provided
      if (!formData.icon) {
        delete goalData.icon;
      }

      if (editingGoal) {
        await updateGoal(editingGoal._id, goalData);
      } else {
        await createGoal(goalData);
      }

      setIsModalOpen(false);
      setEditingGoal(null);
      setFormData({
        title: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        icon: '',
      });
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle edit goal
  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: new Date(goal.deadline).toISOString().split('T')[0],
      icon: goal.icon || '',
    });
    setIsModalOpen(true);
  };

  // Delete goal - open confirmation modal
  const handleDelete = (goal) => {
    setGoalToDelete(goal);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete goal
  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    try {
      await deleteGoal(goalToDelete._id);
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Handle contribute
  const handleContribute = (goal) => {
    setSelectedGoal(goal);
    setContributeData({ amount: '', accountId: '' });
    setIsContributeModalOpen(true);
  };

  // Submit contribution
  const handleContributeSubmit = async (e) => {
    e.preventDefault();
    try {
      await contributeToGoal(selectedGoal._id, {
        amount: parseFloat(contributeData.amount),
        accountId: contributeData.accountId || undefined,
      });
      setIsContributeModalOpen(false);
      setSelectedGoal(null);
      setContributeData({ amount: '', accountId: '' });
    } catch (error) {
      console.error('Error contributing to goal:', error);
    }
  };

  // Color configurations
  const colorConfig = {
    blue: {
      bg: 'from-blue-500/20 to-cyan-500/20',
      progress: 'from-blue-500 to-cyan-500',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20',
    },
    purple: {
      bg: 'from-primary-500/20 to-secondary-500/20',
      progress: 'from-primary-500 to-secondary-500',
      text: 'text-primary-400',
      glow: 'shadow-primary-500/20',
    },
    green: {
      bg: 'from-green-500/20 to-emerald-500/20',
      progress: 'from-green-500 to-emerald-500',
      text: 'text-green-400',
      glow: 'shadow-green-500/20',
    },
  };

  // Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(
    (g) => g.currentAmount >= g.targetAmount
  ).length;
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  if (isLoadingGoals && goals.length === 0) {
    return (
      <MainLayout>
        <LoadingSpinner fullScreen text="Loading goals..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Financial Goals</h1>
            <p className="text-gray-400 mt-1">
              Set targets and track your progress
            </p>
          </div>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Goal
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            {
              label: 'Total Goals',
              value: totalGoals,
              icon: Target,
              color: 'primary',
            },
            {
              label: 'Completed',
              value: completedGoals,
              icon: CheckCircle2,
              color: 'green',
            },
            {
              label: 'Total Target',
              value: formatCurrency(totalTarget),
              icon: TrendingUp,
              color: 'blue',
            },
            {
              label: 'Total Saved',
              value: formatCurrency(totalSaved),
              icon: DollarSign,
              color: 'purple',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6 bg-gradient-to-br from-dark-card/80 to-dark-card/40 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white truncate">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No goals yet</p>
              <Button
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                Add Your First Goal
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {goals.map((goal, index) => {
              const progress = calculateProgress(
                goal.currentAmount,
                goal.targetAmount
              );
              const daysRemaining = getDaysRemaining(goal.deadline);
              const isCompleted = progress >= 100;
              const colors = colorConfig[goal.color] || colorConfig.blue;

              return (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div
                    className={`
                      relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6
                      bg-gradient-to-br ${colors.bg}
                      backdrop-blur-xl border border-white/10
                      hover:border-white/20 transition-all duration-300
                      shadow-lg ${colors.glow} hover:shadow-xl
                      group
                    `}
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-3xl sm:text-4xl flex-shrink-0">
                            {goal.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-white truncate">
                              {goal.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400">
                              {formatCurrency(goal.currentAmount)} of{' '}
                              {formatCurrency(goal.targetAmount)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => handleEdit(goal)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(goal)}
                            className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-400">
                            Progress
                          </span>
                          <span className={`text-xs sm:text-sm font-bold ${colors.text}`}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 sm:h-3 bg-dark-hover rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className={`h-full bg-gradient-to-r ${colors.progress} rounded-full relative`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          </motion.div>
                        </div>
                      </div>

                      {/* Contribute Button */}
                      {!isCompleted && (
                        <div className="mb-3">
                          <Button
                            onClick={() => handleContribute(goal)}
                            variant="outline"
                            size="sm"
                            fullWidth
                            icon={<DollarSign className="w-4 h-4" />}
                          >
                            Add Contribution
                          </Button>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">
                            {formatDate(goal.deadline)}
                          </span>
                          <span className="sm:hidden">
                            {new Date(goal.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        {!isCompleted && (
                          <div
                            className={`font-medium ${
                              daysRemaining < 30 ? 'text-amber-400' : colors.text
                            }`}
                          >
                            {daysRemaining > 0
                              ? `${daysRemaining} days left`
                              : 'Overdue'}
                          </div>
                        )}
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-green-400 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Completed!</span>
                            <span className="sm:hidden">Done!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Goal Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGoal(null);
            setFormData({
              title: '',
              targetAmount: '',
              currentAmount: '',
              deadline: '',
              icon: '',
            });
          }}
          title={editingGoal ? 'Edit Goal' : 'Add Financial Goal'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Goal Title */}
            <Input
              label="Goal Name"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Emergency Fund"
              required
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
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="Click the button to choose emoji"
                    maxLength={10}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('input[name="icon"]');
                    if (input) {
                      input.focus();
                      if (input.showPicker) {
                        input.showPicker();
                      }
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-dark-hover border border-white/10 hover:border-primary-500 transition-all"
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

            {/* Target Amount */}
            <Input
              label="Target Amount"
              type="number"
              name="targetAmount"
              value={formData.targetAmount}
              onChange={handleChange}
              placeholder="0.00"
              required
              step="0.01"
            />

            {/* Current Amount */}
            <Input
              label="Current Amount (Optional)"
              type="number"
              name="currentAmount"
              value={formData.currentAmount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
            />

            {/* Deadline */}
            <Input
              label="Target Date"
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingGoal(null);
                  setFormData({
                    title: '',
                    targetAmount: '',
                    currentAmount: '',
                    deadline: '',
                    icon: '',
                  });
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Add Goal'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Contribute to Goal Modal */}
        <Modal
          isOpen={isContributeModalOpen}
          onClose={() => {
            setIsContributeModalOpen(false);
            setSelectedGoal(null);
            setContributeData({ amount: '', accountId: '' });
          }}
          title={`Contribute to ${selectedGoal?.title || 'Goal'}`}
        >
          <form onSubmit={handleContributeSubmit} className="space-y-4">
            {/* Amount */}
            <Input
              label="Contribution Amount"
              type="number"
              name="amount"
              value={contributeData.amount}
              onChange={(e) => setContributeData((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
              step="0.01"
              min="0.01"
            />

            {/* Account Selection (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Transfer From Account (Optional)
              </label>
              <Select
                name="accountId"
                value={contributeData.accountId}
                onChange={(e) => setContributeData((prev) => ({ ...prev, accountId: e.target.value }))}
                options={[
                  { value: '', label: 'No account (manual tracking only)' },
                  ...accounts.map((acc) => ({
                    value: acc._id,
                    label: `${acc.icon} ${acc.name} (${formatCurrency(acc.balance, acc.currency)})`,
                  })),
                ]}
              />
              <p className="text-xs text-gray-500 mt-2">
                If you select an account, the contribution amount will be deducted from that account's balance.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsContributeModalOpen(false);
                  setSelectedGoal(null);
                  setContributeData({ amount: '', accountId: '' });
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" fullWidth>
                Add Contribution
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Goal Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setGoalToDelete(null);
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
              Delete Goal?
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
                  {goalToDelete?.icon} {goalToDelete?.title}
                </span>
                ?
              </p>
              <p className="text-gray-500 text-sm">
                This action cannot be undone. The goal and all its contribution history will be permanently removed.
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
                  setGoalToDelete(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteGoal}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                fullWidth
              >
                Delete Goal
              </Button>
            </motion.div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Goals;
