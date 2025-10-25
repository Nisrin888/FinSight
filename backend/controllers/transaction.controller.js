const Transaction = require('../models/transaction.model');
const Account = require('../models/account.model');
const Category = require('../models/category.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all transactions for logged-in user
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      account,
      startDate,
      endDate,
      status,
      limit = 20,
      page = 1,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    // Build filter
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (account) filter.account = account;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(filter)
      .populate('category', 'name icon color type')
      .populate('account', 'name type color icon')
      .populate('toAccount', 'name type color icon')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions',
    });
  }
};

/**
 * @desc    Get single transaction
 * @route   GET /api/transactions/:id
 * @access  Private
 */
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate('category', 'name icon color type')
      .populate('account', 'name type color icon')
      .populate('toAccount', 'name type color icon');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: transaction,
    });
  } catch (error) {
    console.error('Get Transaction Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transaction',
    });
  }
};

/**
 * @desc    Create new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { type, amount, category, account, toAccount, description, date, tags, notes, isRecurring, recurringFrequency, recurringEndDate } = req.body;

    // Verify account belongs to user
    const accountDoc = await Account.findOne({ _id: account, user: req.user.id });
    if (!accountDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    // Credit limit validation for credit card accounts
    if (accountDoc.type === 'credit' && accountDoc.creditLimit) {
      // For expenses and transfers from credit cards, check if credit limit would be exceeded
      if (type === 'expense' || type === 'transfer') {
        const newBalance = accountDoc.balance - amount;
        const availableCredit = accountDoc.creditLimit + newBalance; // balance is negative for credit cards

        if (availableCredit < 0) {
          const currentUsed = Math.abs(accountDoc.balance);
          const available = accountDoc.creditLimit - currentUsed;
          return res.status(400).json({
            status: 'error',
            message: `Transaction would exceed credit limit. Available credit: $${available.toFixed(2)} of $${accountDoc.creditLimit.toFixed(2)}`,
          });
        }
      }
    }

    // For transfers, verify destination account
    if (type === 'transfer') {
      const toAccountDoc = await Account.findOne({ _id: toAccount, user: req.user.id });
      if (!toAccountDoc) {
        return res.status(404).json({
          status: 'error',
          message: 'Destination account not found',
        });
      }
    } else {
      // Verify category belongs to user and matches type
      const categoryDoc = await Category.findOne({ _id: category, user: req.user.id });
      if (!categoryDoc) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
      }
      if (categoryDoc.type !== type) {
        return res.status(400).json({
          status: 'error',
          message: `Category type (${categoryDoc.type}) does not match transaction type (${type})`,
        });
      }
    }

    const transaction = await Transaction.create({
      type,
      amount,
      category: type !== 'transfer' ? category : undefined,
      account,
      toAccount: type === 'transfer' ? toAccount : undefined,
      description: description?.trim() || '',
      date: date || Date.now(),
      tags: tags || [],
      notes: notes?.trim(),
      isRecurring: isRecurring || false,
      recurringFrequency,
      recurringEndDate,
      user: req.user.id,
      status: 'completed',
    });

    // Populate before sending response
    await transaction.populate([
      { path: 'category', select: 'name icon color type' },
      { path: 'account', select: 'name type color icon' },
      { path: 'toAccount', select: 'name type color icon' },
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create transaction',
    });
  }
};

/**
 * @desc    Update transaction
 * @route   PATCH /api/transactions/:id
 * @access  Private
 */
exports.updateTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    // Note: Updating transactions that affect account balances requires
    // reversing the old transaction and applying the new one
    // For simplicity, we'll restrict certain updates

    const { description, date, tags, notes } = req.body;

    if (description) transaction.description = description.trim();
    if (date) transaction.date = date;
    if (tags !== undefined) transaction.tags = tags;
    if (notes !== undefined) transaction.notes = notes?.trim();

    await transaction.save();

    await transaction.populate([
      { path: 'category', select: 'name icon color type' },
      { path: 'account', select: 'name type color icon' },
      { path: 'toAccount', select: 'name type color icon' },
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Update Transaction Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update transaction',
    });
  }
};

/**
 * @desc    Delete transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    // Use deleteOne() on document instance to trigger pre-deleteOne middleware
    await transaction.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Delete Transaction Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete transaction',
    });
  }
};

/**
 * @desc    Get transaction statistics
 * @route   GET /api/transactions/stats
 * @access  Private
 */
exports.getTransactionStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter = { user: req.user.id, status: 'completed' };
    if (startDate || endDate) {
      matchFilter.date = {};
      if (startDate) matchFilter.date.$gte = new Date(startDate);
      if (endDate) matchFilter.date.$lte = new Date(endDate);
    }

    // Get income and expense totals
    const totals = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      income: 0,
      expense: 0,
      incomeCount: 0,
      expenseCount: 0,
    };

    totals.forEach((item) => {
      if (item._id === 'income') {
        stats.income = item.total;
        stats.incomeCount = item.count;
      } else if (item._id === 'expense') {
        stats.expense = item.total;
        stats.expenseCount = item.count;
      }
    });

    stats.netIncome = stats.income - stats.expense;
    stats.totalTransactions = stats.incomeCount + stats.expenseCount;

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    console.error('Get Transaction Stats Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transaction statistics',
    });
  }
};
