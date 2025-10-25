const Goal = require('../models/goal.model');
const Account = require('../models/account.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all goals for logged-in user
 * @route   GET /api/goals
 * @access  Private
 */
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ deadline: 1 });

    res.status(200).json({
      status: 'success',
      results: goals.length,
      data: goals,
    });
  } catch (error) {
    console.error('Get Goals Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch goals',
    });
  }
};

/**
 * @desc    Get single goal
 * @route   GET /api/goals/:id
 * @access  Private
 */
exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        status: 'error',
        message: 'Goal not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: goal,
    });
  } catch (error) {
    console.error('Get Goal Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch goal',
    });
  }
};

/**
 * @desc    Create new goal
 * @route   POST /api/goals
 * @access  Private
 */
exports.createGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { title, targetAmount, currentAmount, deadline, icon, description } = req.body;

    const goal = await Goal.create({
      title: title.trim(),
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      icon: icon || '🎯',
      description: description?.trim(),
      user: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Goal created successfully',
      data: goal,
    });
  } catch (error) {
    console.error('Create Goal Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create goal',
    });
  }
};

/**
 * @desc    Update goal
 * @route   PATCH /api/goals/:id
 * @access  Private
 */
exports.updateGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        status: 'error',
        message: 'Goal not found',
      });
    }

    const { title, targetAmount, currentAmount, deadline, icon, description } = req.body;

    if (title) goal.title = title.trim();
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (deadline) goal.deadline = deadline;
    if (icon) goal.icon = icon;
    if (description !== undefined) goal.description = description?.trim();

    await goal.save();

    res.status(200).json({
      status: 'success',
      message: 'Goal updated successfully',
      data: goal,
    });
  } catch (error) {
    console.error('Update Goal Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update goal',
    });
  }
};

/**
 * @desc    Delete goal
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        status: 'error',
        message: 'Goal not found',
      });
    }

    await goal.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('Delete Goal Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete goal',
    });
  }
};

/**
 * @desc    Add contribution to goal (optionally deduct from account)
 * @route   POST /api/goals/:id/contribute
 * @access  Private
 */
exports.contributeToGoal = async (req, res) => {
  try {
    const { amount, accountId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid contribution amount',
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        status: 'error',
        message: 'Goal not found',
      });
    }

    // If accountId provided, check if account exists and has sufficient balance
    if (accountId) {
      const account = await Account.findOne({
        _id: accountId,
        user: req.user.id,
      });

      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Account not found',
        });
      }

      // Check balance/credit limit based on account type
      if (account.type === 'credit') {
        // For credit cards, check if there's enough available credit
        if (account.creditLimit) {
          const newBalance = account.balance - amount;
          const availableCredit = account.creditLimit + newBalance; // balance is negative for credit cards

          if (availableCredit < 0) {
            const currentUsed = Math.abs(account.balance);
            const available = account.creditLimit - currentUsed;
            return res.status(400).json({
              status: 'error',
              message: `Contribution would exceed credit limit. Available credit: $${available.toFixed(2)}`,
            });
          }
        }
      } else {
        // For non-credit accounts, check if there's sufficient balance
        if (account.balance < amount) {
          return res.status(400).json({
            status: 'error',
            message: 'Insufficient account balance',
          });
        }
      }

      // Deduct from account balance
      account.balance -= amount;
      await account.save();
    }

    // Add to goal
    await goal.addContribution(amount);

    res.status(200).json({
      status: 'success',
      message: 'Contribution added successfully',
      data: goal,
    });
  } catch (error) {
    console.error('Contribute to Goal Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add contribution',
    });
  }
};
