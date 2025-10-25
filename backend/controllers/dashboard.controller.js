const Transaction = require('../models/transaction.model');
const Account = require('../models/account.model');
const Budget = require('../models/budget.model');
const Category = require('../models/category.model');
const Goal = require('../models/goal.model');
const mongoose = require('mongoose');

/**
 * @desc    Get dashboard summary
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get total balance across all accounts
    const totalBalance = await Account.getTotalBalance(userId);

    // Get monthly income and expense
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: { $in: ['income', 'expense'] },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const summary = {
      totalBalance,
      monthlyIncome: 0,
      monthlyExpense: 0,
      monthlySavings: 0,
      savingsRate: 0,
    };

    monthlyStats.forEach((stat) => {
      if (stat._id === 'income') {
        summary.monthlyIncome = stat.total;
      } else if (stat._id === 'expense') {
        summary.monthlyExpense = stat.total;
      }
    });

    summary.monthlySavings = summary.monthlyIncome - summary.monthlyExpense;
    summary.savingsRate =
      summary.monthlyIncome > 0 ? ((summary.monthlySavings / summary.monthlyIncome) * 100).toFixed(2) : 0;

    res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    console.error('Get Dashboard Summary Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard summary',
    });
  }
};

/**
 * @desc    Get spending by category (for pie chart)
 * @route   GET /api/dashboard/spending-by-category
 * @access  Private
 */
exports.getSpendingByCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 10 } = req.query;

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const spendingData = await Transaction.getSpendingByCategory(userId, start, end);

    // Limit results
    const limitedData = spendingData.slice(0, parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: limitedData.length,
      data: limitedData,
    });
  } catch (error) {
    console.error('Get Spending By Category Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch spending by category',
    });
  }
};

/**
 * @desc    Get income vs expense trend (for line chart)
 * @route   GET /api/dashboard/income-expense-trend
 * @access  Private
 */
exports.getIncomeExpenseTrend = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { groupBy = 'day', days = 30 } = req.query;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - parseInt(days));
    const endDate = now;

    const trendData = await Transaction.getIncomeExpenseTrend(userId, startDate, endDate, groupBy);

    // Format data for frontend
    const formattedData = trendData.map((item) => {
      const entry = {
        period: item._id,
        income: 0,
        expense: 0,
      };

      item.data.forEach((d) => {
        if (d.type === 'income') entry.income = d.total;
        if (d.type === 'expense') entry.expense = d.total;
      });

      entry.net = entry.income - entry.expense;

      return entry;
    });

    res.status(200).json({
      status: 'success',
      results: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error('Get Income Expense Trend Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch income expense trend',
    });
  }
};

/**
 * @desc    Get recent transactions
 * @route   GET /api/dashboard/recent-transactions
 * @access  Private
 */
exports.getRecentTransactions = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const transactions = await Transaction.find({ user: req.user.id })
      .populate('category', 'name icon color type')
      .populate('account', 'name type')
      .populate('toAccount', 'name type')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get Recent Transactions Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recent transactions',
    });
  }
};

/**
 * @desc    Get budget overview
 * @route   GET /api/dashboard/budgets-overview
 * @access  Private
 */
exports.getBudgetsOverview = async (req, res, next) => {
  try {
    const budgetsWithProgress = await Budget.getBudgetsWithProgress(req.user.id);

    // Calculate overall stats
    const stats = {
      totalBudgets: budgetsWithProgress.length,
      totalBudgeted: 0,
      totalSpent: 0,
      overBudgetCount: 0,
      nearThresholdCount: 0,
    };

    budgetsWithProgress.forEach((budget) => {
      stats.totalBudgeted += budget.amount;
      stats.totalSpent += budget.progress.spent;
      if (budget.progress.isOverBudget) stats.overBudgetCount++;
      if (budget.progress.isNearThreshold && !budget.progress.isOverBudget) stats.nearThresholdCount++;
    });

    stats.percentageUsed =
      stats.totalBudgeted > 0 ? ((stats.totalSpent / stats.totalBudgeted) * 100).toFixed(2) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        budgets: budgetsWithProgress.slice(0, 5), // Top 5 budgets
      },
    });
  } catch (error) {
    console.error('Get Budgets Overview Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budgets overview',
    });
  }
};

/**
 * @desc    Get account balances
 * @route   GET /api/dashboard/account-balances
 * @access  Private
 */
exports.getAccountBalances = async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user.id, isActive: true }).select('name type balance color icon');

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    res.status(200).json({
      status: 'success',
      data: {
        totalBalance,
        accounts,
      },
    });
  } catch (error) {
    console.error('Get Account Balances Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch account balances',
    });
  }
};

/**
 * @desc    Get complete dashboard data (all in one)
 * @route   GET /api/dashboard
 * @access  Private
 */
exports.getCompleteDashboard = async (req, res, next) => {
  try {
    // Run all queries in parallel for better performance
    const [summary, spendingByCategory, recentTransactions, budgetsOverview, accountBalances, alerts, goals, incomeTrend] =
      await Promise.all([
        // Summary
        (async () => {
          const userId = req.user.id;
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

          const totalBalance = await Account.getTotalBalance(userId);
          const monthlyStats = await Transaction.aggregate([
            {
              $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startOfMonth, $lte: endOfMonth },
                type: { $in: ['income', 'expense'] },
                status: 'completed',
              },
            },
            {
              $group: {
                _id: '$type',
                total: { $sum: '$amount' },
              },
            },
          ]);

          const stats = { totalBalance, monthlyIncome: 0, monthlyExpense: 0 };
          monthlyStats.forEach((stat) => {
            if (stat._id === 'income') stats.monthlyIncome = stat.total;
            if (stat._id === 'expense') stats.monthlyExpense = stat.total;
          });
          stats.monthlySavings = stats.monthlyIncome - stats.monthlyExpense;
          stats.savingsRate = stats.monthlyIncome > 0 ? ((stats.monthlySavings / stats.monthlyIncome) * 100).toFixed(2) : 0;
          return stats;
        })(),

        // Spending by category
        (async () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          return await Transaction.getSpendingByCategory(req.user.id, start, end);
        })(),

        // Recent transactions
        Transaction.find({ user: req.user.id })
          .populate('category', 'name icon color type')
          .populate('account', 'name type')
          .sort({ date: -1 })
          .limit(5),

        // Budgets overview
        Budget.getBudgetsWithProgress(req.user.id),

        // Account balances
        Account.find({ user: req.user.id, isActive: true }).select('name type balance color icon'),

        // Budget alerts
        Budget.checkBudgetAlerts(req.user.id),

        // Goals (top 4 by deadline)
        Goal.find({ user: req.user.id }).sort({ deadline: 1 }).limit(4),

        // Income vs Expense Trend (last 6 months)
        (async () => {
          const now = new Date();
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return await Transaction.getIncomeExpenseTrend(req.user.id, sixMonthsAgo, now, 'month');
        })(),
      ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary,
        spendingByCategory: spendingByCategory.slice(0, 6),
        recentTransactions,
        budgets: budgetsOverview.slice(0, 4),
        accounts: accountBalances,
        alerts,
        goals,
        incomeTrend,
      },
    });
  } catch (error) {
    console.error('Get Complete Dashboard Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
    });
  }
};
