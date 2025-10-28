/**
 * Insights Page
 * Detailed financial analysis with charts, graphs, and AI-powered insights
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Sparkles,
  Target,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Layout & Components
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Store
import useFinancialStore from '../store/financialStore';
import api from '../services/api';

const Insights = () => {
  const { transactions, categories, isLoadingTransactions, fetchTransactions, fetchCategories } =
    useFinancialStore();

  const [timePeriod, setTimePeriod] = useState('30days');
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsCached, setInsightsCached] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchAIInsights();
  }, [fetchTransactions, fetchCategories]);

  // Fetch AI insights from backend
  const fetchAIInsights = async (forceRefresh = false) => {
    setLoadingInsights(true);
    try {
      const url = `/insights/generate?days=30${forceRefresh ? '&forceRefresh=true' : ''}`;
      const response = await api.get(url);
      if (response.data.status === 'success' && response.data.data?.insights) {
        // Map icon names to icon components
        const insights = response.data.data.insights.map(insight => ({
          ...insight,
          icon: getIconComponent(insight.icon)
        }));
        setAiInsights(insights);
        setInsightsCached(response.data.data.cached || false);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      // Fallback to default insights on error
      setAiInsights(getDefaultInsights());
      setInsightsCached(false);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Refresh insights handler
  const handleRefreshInsights = () => {
    fetchAIInsights(true);
  };

  // Map icon names to icon components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'AlertCircle': AlertCircle,
      'CheckCircle2': CheckCircle2,
      'Lightbulb': Lightbulb,
      'AlertTriangle': AlertCircle,
      'Trophy': Target,
    };
    return iconMap[iconName] || Lightbulb;
  };

  // Default insights as fallback
  const getDefaultInsights = () => [
    {
      type: 'tip',
      icon: Lightbulb,
      color: 'text-primary-400',
      title: 'Start Tracking',
      message: 'Add more transactions to get personalized AI insights about your spending habits.',
    },
  ];

  // Time period options
  const timePeriods = [
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
  ];

  // Filter transactions by time period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const days = {
      '7days': 7,
      '30days': 30,
      '3months': 90,
      '6months': 180,
      '1year': 365,
    };

    const cutoffDate = new Date(now.getTime() - days[timePeriod] * 24 * 60 * 60 * 1000);

    return transactions.filter((txn) => new Date(txn.date) >= cutoffDate);
  }, [transactions, timePeriod]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = income - expenses;
    const avgDailySpending = expenses / (timePeriod === '7days' ? 7 : timePeriod === '30days' ? 30 : 90);
    const transactionCount = filteredTransactions.length;

    return {
      income,
      expenses,
      netIncome,
      avgDailySpending,
      transactionCount,
    };
  }, [filteredTransactions, timePeriod]);

  // Prepare spending trend data (daily/weekly grouping)
  const spendingTrendData = useMemo(() => {
    const groupedData = {};

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((txn) => {
        const date = new Date(txn.date);
        const key =
          timePeriod === '7days' || timePeriod === '30days'
            ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!groupedData[key]) {
          groupedData[key] = { date: key, expenses: 0, income: 0 };
        }
        groupedData[key].expenses += txn.amount;
      });

    filteredTransactions
      .filter((t) => t.type === 'income')
      .forEach((txn) => {
        const date = new Date(txn.date);
        const key =
          timePeriod === '7days' || timePeriod === '30days'
            ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!groupedData[key]) {
          groupedData[key] = { date: key, expenses: 0, income: 0 };
        }
        groupedData[key].income += txn.amount;
      });

    return Object.values(groupedData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredTransactions, timePeriod]);

  // Prepare category breakdown data
  const categoryBreakdownData = useMemo(() => {
    const categoryTotals = {};

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((txn) => {
        const categoryName = txn.category?.name || 'Uncategorized';
        const categoryEmoji = txn.category?.emoji || '❓';

        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { name: categoryName, emoji: categoryEmoji, value: 0 };
        }
        categoryTotals[categoryName].value += txn.amount;
      });

    return Object.values(categoryTotals)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [filteredTransactions]);

  // Chart colors (matching purple theme)
  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#06B6D4', '#EF4444'];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoadingTransactions && transactions.length === 0) {
    return (
      <MainLayout>
        <LoadingSpinner fullScreen text="Loading insights..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Financial Insights</h1>
            <p className="text-gray-400 mt-1">
              Detailed analysis with AI-powered recommendations
            </p>
          </div>

          {/* Time Period Selector */}
          <div className="flex gap-2 flex-wrap">
            {timePeriods.map((period) => (
              <button
                key={period.value}
                onClick={() => setTimePeriod(period.value)}
                className={`
                  px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all
                  ${
                    timePeriod === period.value
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-dark-hover text-gray-400 hover:text-white hover:bg-dark-card'
                  }
                `}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            {
              label: 'Total Income',
              value: formatCurrency(stats.income),
              icon: TrendingUp,
              gradient: 'from-green-500/20 to-emerald-500/20',
              iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
              glow: 'shadow-lg shadow-green-500/20',
            },
            {
              label: 'Total Expenses',
              value: formatCurrency(stats.expenses),
              icon: TrendingDown,
              gradient: 'from-red-500/20 to-rose-500/20',
              iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
              glow: 'shadow-lg shadow-red-500/20',
            },
            {
              label: 'Net Income',
              value: formatCurrency(stats.netIncome),
              icon: DollarSign,
              gradient: 'from-primary-500/20 to-secondary-500/20',
              iconBg: 'bg-gradient-to-br from-primary-500 to-secondary-500',
              glow: 'shadow-lg shadow-primary-500/20',
            },
            {
              label: 'Avg Daily Spending',
              value: formatCurrency(stats.avgDailySpending),
              icon: Calendar,
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Spending Trend Chart */}
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Income vs Expenses</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Cash flow over time
                  </p>
                </div>
              </div>

              {spendingTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={spendingTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2436" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
                    <Bar dataKey="income" fill="#10B981" name="Income" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No transaction data available</p>
                </div>
              )}
            </div>
          </Card>

          {/* Category Breakdown Chart */}
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Spending by Category
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400">Top 6 categories</p>
                </div>
              </div>

              {categoryBreakdownData.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie
                        data={categoryBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RePieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex-1 space-y-2 w-full lg:w-auto">
                    {categoryBreakdownData.map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs sm:text-sm text-gray-400 truncate">
                            {category.emoji} {category.name}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-white flex-shrink-0">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No spending data available</p>
                </div>
              )}
            </div>
          </Card>

          {/* Spending Trend Area Chart */}
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Expense Trend</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Spending pattern analysis
                  </p>
                </div>
              </div>

              {spendingTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={spendingTrendData}>
                    <defs>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2436" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#colorExpenses)"
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No data available</p>
                </div>
              )}
            </div>
          </Card>

          {/* AI-Powered Insights */}
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">AI Insights</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      {insightsCached ? 'Cached recommendations' : 'Personalized recommendations'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRefreshInsights}
                  disabled={loadingInsights}
                  className="p-2 rounded-lg bg-dark-hover hover:bg-dark-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh insights"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingInsights ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                {loadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-400">Generating AI insights...</p>
                    </div>
                  </div>
                ) : aiInsights.length > 0 ? (
                  aiInsights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-3 sm:p-4 rounded-xl bg-dark-hover border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="flex gap-3">
                          <Icon className={`w-5 h-5 ${insight.color} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-semibold text-white mb-1">
                              {insight.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                              {insight.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <p className="text-sm">No insights available yet</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 text-center">
                  AI insights are generated based on your spending patterns and financial goals
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        {filteredTransactions.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No transactions found for this period</p>
              <p className="text-sm text-gray-500">
                Add some transactions to see detailed insights
              </p>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Insights;
