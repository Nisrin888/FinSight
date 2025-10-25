/**
 * Dashboard Page
 * Main financial overview with charts and statistics
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Target,
  Calendar,
} from 'lucide-react';

// Layout
import MainLayout from '../components/layout/MainLayout';

// UI Components
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

// Charts
import SpendingPieChart from '../components/charts/SpendingPieChart';
import IncomeTrendChart from '../components/charts/IncomeTrendChart';

// Store
import useFinancialStore from '../store/financialStore';

const Dashboard = () => {
  const { dashboardData, isLoadingDashboard, fetchDashboard } = useFinancialStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Refetch dashboard data every time we navigate to the dashboard
  useEffect(() => {
    fetchDashboard();
  }, [location.pathname]); // Refetch when route changes

  // Check if user needs onboarding (no accounts created yet)
  useEffect(() => {
    if (!isLoadingDashboard && dashboardData) {
      const accounts = dashboardData?.accounts || [];
      if (accounts.length === 0) {
        setShowOnboardingModal(true);
      }
    }
  }, [dashboardData, isLoadingDashboard]);

  if (isLoadingDashboard && !dashboardData) {
    return (
      <MainLayout>
        <LoadingSpinner size="lg" text="Loading your dashboard..." fullScreen />
      </MainLayout>
    );
  }

  const summary = dashboardData?.summary || {};
  const spendingByCategory = dashboardData?.spendingByCategory || [];
  const recentTransactions = dashboardData?.recentTransactions || [];
  const budgets = dashboardData?.budgets || [];
  const goals = dashboardData?.goals || [];
  const accounts = dashboardData?.accounts || [];
  const alerts = dashboardData?.alerts || [];
  const incomeTrend = dashboardData?.incomeTrend || [];

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

  // Stat cards
  const stats = [
    {
      label: 'Total Balance',
      value: formatCurrency(summary.totalBalance),
      icon: Wallet,
      color: 'primary',
      change: null,
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(summary.monthlyIncome),
      icon: TrendingUp,
      color: 'green',
      change: null,
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(summary.monthlyExpense),
      icon: TrendingDown,
      color: 'red',
      change: null,
    },
    {
      label: 'Monthly Savings',
      value: formatCurrency(summary.monthlySavings),
      icon: PiggyBank,
      color: 'blue',
      change: summary.savingsRate ? `${summary.savingsRate}% rate` : null,
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Your financial overview at a glance
            </p>
          </div>
        </div>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]" />
              <div className="relative flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2 text-lg">
                    Budget Alerts
                  </h3>
                  <div className="space-y-2">
                    {alerts.map((alert, index) => (
                      <p key={index} className="text-sm text-amber-100">
                        {alert.message}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            // Color configurations for each stat type
            const colorConfig = {
              primary: {
                gradient: 'from-primary-500/20 to-secondary-500/20',
                iconBg: 'bg-gradient-to-br from-primary-500 to-secondary-500',
                glow: 'shadow-lg shadow-primary-500/20',
              },
              green: {
                gradient: 'from-green-500/20 to-emerald-500/20',
                iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
                glow: 'shadow-lg shadow-green-500/20',
              },
              red: {
                gradient: 'from-red-500/20 to-rose-500/20',
                iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
                glow: 'shadow-lg shadow-red-500/20',
              },
              blue: {
                gradient: 'from-blue-500/20 to-cyan-500/20',
                iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
                glow: 'shadow-lg shadow-blue-500/20',
              },
            };

            const colors = colorConfig[stat.color];

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className={`
                  relative overflow-hidden rounded-2xl p-6
                  bg-gradient-to-br ${colors.gradient}
                  backdrop-blur-xl border border-white/10
                  hover:border-white/20 transition-all duration-300
                  ${colors.glow} hover:shadow-xl
                  group cursor-pointer
                `}>
                  {/* Background pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm text-gray-400 mb-2 font-medium">{stat.label}</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white mb-1">
                        {stat.value}
                      </p>
                      {/* Always render this element to maintain consistent height */}
                      <div className="h-4">
                        {stat.change && (
                          <p className="text-xs text-gray-500 font-medium">{stat.change}</p>
                        )}
                      </div>
                    </div>
                    <div className={`
                      w-14 h-14 rounded-xl ${colors.iconBg}
                      flex items-center justify-center flex-shrink-0
                      ${colors.glow}
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <stat.icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card
              title="Spending by Category"
              subtitle="Current month breakdown"
            >
              {spendingByCategory && spendingByCategory.length > 0 ? (
                <SpendingPieChart data={spendingByCategory} />
              ) : (
                <EmptyState
                  title="No spending data yet"
                  description="Start adding expenses to see your spending breakdown"
                />
              )}
            </Card>
          </motion.div>

          {/* Income vs Expense Trend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card
              title="Income vs Expense"
              subtitle="Last 6 months trend"
            >
              <IncomeTrendChart data={incomeTrend} />
            </Card>
          </motion.div>
        </div>

        {/* Recent Transactions & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card
              title="Recent Transactions"
              headerAction={
                <Link
                  to="/transactions"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              }
            >
              {recentTransactions && recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((txn) => (
                    <div
                      key={txn._id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                          {txn.category?.icon || '💰'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {txn.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(txn.date)} • {txn.account?.name}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-semibold ${
                          txn.type === 'income'
                            ? 'text-green-600'
                            : txn.type === 'expense'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {txn.type === 'expense' ? '-' : '+'}
                        {formatCurrency(txn.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No transactions yet"
                  description="Add your first transaction to get started"
                  action={
                    <Link to="/transactions">
                      <Button size="sm">Add Transaction</Button>
                    </Link>
                  }
                />
              )}
            </Card>
          </motion.div>

          {/* Goals Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card
              title="Financial Goals"
              headerAction={
                <div className="flex items-center gap-2">
                  <Link to="/goals">
                    <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                      Create Goal
                    </Button>
                  </Link>
                  <Link
                    to="/goals"
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              }
            >
              {goals && goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    const isCompleted = goal.currentAmount >= goal.targetAmount;
                    const daysRemaining = Math.ceil(
                      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div key={goal._id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {goal.icon || '🎯'}
                            </span>
                            <div>
                              <span className="font-semibold text-white block">
                                {goal.title}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-white block">
                              {formatCurrency(goal.currentAmount)}
                            </span>
                            <span className="text-xs text-gray-400">
                              of {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-dark-hover rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-green-500'
                                : daysRemaining < 30
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Goal Completed!</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  {/* Showcase Example Goals */}
                  <div className="mb-6 space-y-3 max-w-md mx-auto">
                    {/* Example Goal 1 */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🏠</span>
                          <div>
                            <p className="font-semibold text-white text-sm">House Down Payment</p>
                            <p className="text-xs text-gray-400">365 days left</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">$15,000</p>
                          <p className="text-xs text-gray-400">of $50,000</p>
                        </div>
                      </div>
                      <div className="w-full bg-dark-hover rounded-full h-2">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>

                    {/* Example Goal 2 */}
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✈️</span>
                          <div>
                            <p className="font-semibold text-white text-sm">Vacation Fund</p>
                            <p className="text-xs text-gray-400">90 days left</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">$2,500</p>
                          <p className="text-xs text-gray-400">of $3,000</p>
                        </div>
                      </div>
                      <div className="w-full bg-dark-hover rounded-full h-2">
                        <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '83%' }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-4">
                    Set financial goals and track your progress toward achieving them
                  </p>
                  <Link to="/goals">
                    <Button icon={<Target className="w-4 h-4" />}>
                      Create Your First Goal
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Accounts Overview */}
        {accounts && accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card title="Accounts" centerTitle={true}>
              <div className="flex flex-wrap justify-center gap-6">
                {accounts.map((account, index) => (
                  <motion.div
                    key={account._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    onClick={() => navigate(`/accounts?account=${account._id}`)}
                    className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-dark-card to-dark-card/80 backdrop-blur-xl border border-white/10 hover:border-primary-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 group cursor-pointer w-72"
                  >
                    {/* Premium Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Animated Gradient Overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-all duration-500"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${account.color}, transparent 70%)`
                      }}
                    />

                    <div className="relative">
                      {/* Icon Container */}
                      <div className="flex justify-center mb-6">
                        <div
                          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                          style={{
                            backgroundColor: `${account.color}40`,
                            boxShadow: `0 10px 30px ${account.color}30, 0 0 0 1px ${account.color}20`
                          }}
                        >
                          {account.icon || '💰'}
                        </div>
                      </div>

                      {/* Account Details - ALL CENTER ALIGNED */}
                      <div className="text-center space-y-3">
                        {/* Account Name */}
                        <h3 className="font-bold text-white text-xl tracking-tight">
                          {account.name}
                        </h3>

                        {/* Account Type */}
                        <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
                          {account.type}
                        </p>

                        {/* Divider */}
                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />

                        {/* Balance Section */}
                        <div className="pt-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Current Balance
                          </p>
                          <p className="text-3xl font-black text-white group-hover:text-primary-400 transition-colors duration-300">
                            {formatCurrency(account.balance)}
                          </p>
                        </div>
                      </div>

                      {/* Hover Arrow Indicator */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                        <ArrowRight className="w-5 h-5 text-primary-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Onboarding Modal */}
        <Modal
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
          title=""
        >
          <div className="text-center py-4">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-2xl shadow-primary-500/50"
            >
              <Sparkles className="w-10 h-10 text-white" strokeWidth={2.5} />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              Welcome to FinSight! 🎉
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 mb-6 text-sm sm:text-base leading-relaxed"
            >
              To get started with tracking your finances, you'll need to create
              your first account. This could be your bank account, credit card,
              cash wallet, or any other financial account.
            </motion.p>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-dark-hover rounded-xl p-4 sm:p-6 mb-6 text-left"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary-400" />
                Quick Setup Steps:
              </h3>
              <ul className="space-y-3 text-sm sm:text-base">
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>
                    Create your first account (bank, card, or wallet)
                  </span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Start adding your income and expenses</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Watch your financial insights come to life!</span>
                </li>
              </ul>
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
                  setShowOnboardingModal(false);
                  navigate('/accounts');
                }}
                icon={<Plus className="w-4 h-4" />}
                fullWidth
              >
                Create Your First Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowOnboardingModal(false)}
                fullWidth
              >
                I'll do this later
              </Button>
            </motion.div>

            {/* Help text */}
            <p className="text-xs text-gray-500 mt-4">
              Don't worry, you can always add more accounts later!
            </p>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
