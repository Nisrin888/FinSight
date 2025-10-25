const Budget = require('../models/budget.model');
const Category = require('../models/category.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all budgets for logged-in user
 * @route   GET /api/budgets
 * @access  Private
 */
exports.getBudgets = async (req, res, next) => {
  try {
    const { period, isActive, withProgress } = req.query;

    const filter = { user: req.user.id };
    if (period) filter.period = period;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (withProgress === 'true') {
      // Get budgets with progress
      const budgetsWithProgress = await Budget.getBudgetsWithProgress(req.user.id);
      return res.status(200).json({
        status: 'success',
        results: budgetsWithProgress.length,
        data: budgetsWithProgress,
      });
    }

    const budgets = await Budget.find(filter)
      .populate('category', 'name icon color type')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: budgets.length,
      data: budgets,
    });
  } catch (error) {
    console.error('Get Budgets Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budgets',
    });
  }
};

/**
 * @desc    Get single budget
 * @route   GET /api/budgets/:id
 * @access  Private
 */
exports.getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('category', 'name icon color type');

    if (!budget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: budget,
    });
  } catch (error) {
    console.error('Get Budget Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budget',
    });
  }
};

/**
 * @desc    Create new budget
 * @route   POST /api/budgets
 * @access  Private
 */
exports.createBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, amount, category, period, startDate, endDate, notifications, threshold, rollover } = req.body;

    // Verify category belongs to user and is expense type
    const categoryDoc = await Category.findOne({
      _id: category,
      user: req.user.id,
      type: 'expense',
    });

    if (!categoryDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found or is not an expense category',
      });
    }

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      user: req.user.id,
      category,
      period,
      isActive: true,
    });

    if (existingBudget) {
      return res.status(400).json({
        status: 'error',
        message: `An active ${period} budget already exists for this category`,
      });
    }

    const budget = await Budget.create({
      name: name.trim(),
      amount,
      category,
      period: period || 'monthly',
      startDate: startDate || Date.now(),
      endDate,
      notifications: notifications !== undefined ? notifications : true,
      threshold: threshold || 80,
      rollover: rollover || false,
      user: req.user.id,
    });

    await budget.populate('category', 'name icon color type');

    res.status(201).json({
      status: 'success',
      message: 'Budget created successfully',
      data: budget,
    });
  } catch (error) {
    console.error('Create Budget Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create budget',
    });
  }
};

/**
 * @desc    Update budget
 * @route   PATCH /api/budgets/:id
 * @access  Private
 */
exports.updateBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
    }

    const { name, amount, notifications, threshold, isActive, rollover } = req.body;

    if (name) budget.name = name.trim();
    if (amount !== undefined) budget.amount = amount;
    if (notifications !== undefined) budget.notifications = notifications;
    if (threshold !== undefined) budget.threshold = threshold;
    if (isActive !== undefined) budget.isActive = isActive;
    if (rollover !== undefined) budget.rollover = rollover;

    await budget.save();
    await budget.populate('category', 'name icon color type');

    res.status(200).json({
      status: 'success',
      message: 'Budget updated successfully',
      data: budget,
    });
  } catch (error) {
    console.error('Update Budget Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update budget',
    });
  }
};

/**
 * @desc    Delete budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
exports.deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    console.error('Delete Budget Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete budget',
    });
  }
};

/**
 * @desc    Get budget progress
 * @route   GET /api/budgets/:id/progress
 * @access  Private
 */
exports.getBudgetProgress = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('category', 'name icon color type');

    if (!budget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found',
      });
    }

    const progress = await budget.getProgress();

    res.status(200).json({
      status: 'success',
      data: {
        budget: budget,
        progress: progress,
      },
    });
  } catch (error) {
    console.error('Get Budget Progress Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budget progress',
    });
  }
};

/**
 * @desc    Get budget alerts
 * @route   GET /api/budgets/alerts
 * @access  Private
 */
exports.getBudgetAlerts = async (req, res, next) => {
  try {
    const alerts = await Budget.checkBudgetAlerts(req.user.id);

    res.status(200).json({
      status: 'success',
      results: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error('Get Budget Alerts Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budget alerts',
    });
  }
};
