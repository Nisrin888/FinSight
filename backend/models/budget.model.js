const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Budget name is required'],
      trim: true,
      maxlength: [100, 'Budget name cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget amount must be positive'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    period: {
      type: String,
      required: [true, 'Period is required'],
      enum: {
        values: ['weekly', 'monthly', 'yearly'],
        message: 'Period must be weekly, monthly, or yearly',
      },
      default: 'monthly',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    threshold: {
      type: Number,
      default: 80,
      min: [0, 'Threshold must be between 0 and 100'],
      max: [100, 'Threshold must be between 0 and 100'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rollover: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
budgetSchema.index({ user: 1, isActive: 1 });
budgetSchema.index({ user: 1, category: 1 });
budgetSchema.index({ user: 1, period: 1 });

// Virtual for current period dates
budgetSchema.virtual('currentPeriod').get(function () {
  const now = new Date();
  let periodStart, periodEnd;

  if (this.period === 'weekly') {
    // Get start of current week (Monday)
    periodStart = new Date(now);
    const day = periodStart.getDay();
    const diff = periodStart.getDate() - day + (day === 0 ? -6 : 1);
    periodStart.setDate(diff);
    periodStart.setHours(0, 0, 0, 0);

    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
  } else if (this.period === 'monthly') {
    // Get start of current month
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (this.period === 'yearly') {
    // Get start of current year
    periodStart = new Date(now.getFullYear(), 0, 1);
    periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  return { start: periodStart, end: periodEnd };
});

// Instance method to get current spending
budgetSchema.methods.getCurrentSpending = async function () {
  const Transaction = mongoose.model('Transaction');
  const period = this.currentPeriod;

  const result = await Transaction.aggregate([
    {
      $match: {
        user: this.user,
        category: this.category,
        type: 'expense',
        date: { $gte: period.start, $lte: period.end },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { totalSpent: 0, transactionCount: 0 };
};

// Instance method to get budget progress
budgetSchema.methods.getProgress = async function () {
  const spending = await this.getCurrentSpending();
  const percentage = (spending.totalSpent / this.amount) * 100;
  const remaining = this.amount - spending.totalSpent;
  const isOverBudget = spending.totalSpent > this.amount;
  const isNearThreshold = percentage >= this.threshold;

  return {
    budgetAmount: this.amount,
    spent: spending.totalSpent,
    remaining: remaining,
    percentage: Math.min(percentage, 100),
    isOverBudget: isOverBudget,
    isNearThreshold: isNearThreshold,
    transactionCount: spending.transactionCount,
    period: this.currentPeriod,
  };
};

// Static method to get all budgets with progress
budgetSchema.statics.getBudgetsWithProgress = async function (userId) {
  const budgets = await this.find({ user: userId, isActive: true })
    .populate('category', 'name icon color type')
    .sort({ createdAt: -1 });

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (budget) => {
      const progress = await budget.getProgress();
      return {
        ...budget.toObject(),
        progress,
      };
    })
  );

  return budgetsWithProgress;
};

// Static method to check for budget alerts
budgetSchema.statics.checkBudgetAlerts = async function (userId) {
  const budgets = await this.find({
    user: userId,
    isActive: true,
    notifications: true,
  }).populate('category', 'name');

  const alerts = [];

  for (const budget of budgets) {
    const progress = await budget.getProgress();

    if (progress.isOverBudget) {
      alerts.push({
        budgetId: budget._id,
        budgetName: budget.name,
        categoryName: budget.category.name,
        type: 'over_budget',
        message: `You've exceeded your ${budget.name} budget by $${Math.abs(progress.remaining).toFixed(2)}`,
        severity: 'high',
        progress,
      });
    } else if (progress.isNearThreshold) {
      alerts.push({
        budgetId: budget._id,
        budgetName: budget.name,
        categoryName: budget.category.name,
        type: 'near_threshold',
        message: `You've used ${progress.percentage.toFixed(0)}% of your ${budget.name} budget`,
        severity: 'medium',
        progress,
      });
    }
  }

  return alerts;
};

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
