const Account = require('../models/account.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all accounts for logged-in user
 * @route   GET /api/accounts
 * @access  Private
 */
exports.getAccounts = async (req, res, next) => {
  try {
    const { type, isActive } = req.query;

    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const accounts = await Account.find(filter).sort({ createdAt: -1 });

    // Calculate total balance
    const totalBalance = await Account.getTotalBalance(req.user.id);

    res.status(200).json({
      status: 'success',
      results: accounts.length,
      totalBalance,
      data: accounts,
    });
  } catch (error) {
    console.error('Get Accounts Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch accounts',
    });
  }
};

/**
 * @desc    Get single account
 * @route   GET /api/accounts/:id
 * @access  Private
 */
exports.getAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: account,
    });
  } catch (error) {
    console.error('Get Account Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch account',
    });
  }
};

/**
 * @desc    Create new account
 * @route   POST /api/accounts
 * @access  Private
 */
exports.createAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, type, balance, currency, icon, color, description, creditLimit, institution } = req.body;

    // Validate credit limit for credit card accounts
    if (type === 'credit' && creditLimit) {
      const initialBalance = balance || 0;
      const availableCredit = creditLimit + initialBalance; // balance is negative for credit cards

      if (availableCredit < 0) {
        const currentDebt = Math.abs(initialBalance);
        return res.status(400).json({
          status: 'error',
          message: `Initial balance exceeds credit limit. Credit limit: $${creditLimit.toFixed(2)}, debt: $${currentDebt.toFixed(2)}`,
        });
      }
    }

    const account = await Account.create({
      name: name.trim(),
      type,
      balance: balance || 0,
      currency: currency || 'USD',
      icon: icon || 'wallet',
      color: color || '#6366F1',
      description: description?.trim(),
      creditLimit,
      institution: institution?.trim(),
      user: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: account,
    });
  } catch (error) {
    console.error('Create Account Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create account',
    });
  }
};

/**
 * @desc    Update account
 * @route   PATCH /api/accounts/:id
 * @access  Private
 */
exports.updateAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    const { name, type, balance, currency, icon, color, description, isActive, creditLimit, institution } = req.body;

    if (name) account.name = name.trim();
    if (type) account.type = type;
    if (balance !== undefined) {
      // Validate credit limit for credit card accounts
      if (account.type === 'credit' && account.creditLimit) {
        const newCreditLimit = creditLimit !== undefined ? creditLimit : account.creditLimit;
        const availableCredit = newCreditLimit + balance; // balance is negative for credit cards

        if (availableCredit < 0) {
          const maxDebt = newCreditLimit;
          const currentDebt = Math.abs(balance);
          return res.status(400).json({
            status: 'error',
            message: `Balance would exceed credit limit. Maximum debt allowed: $${maxDebt.toFixed(2)}, attempted: $${currentDebt.toFixed(2)}`,
          });
        }
      }
      account.balance = balance;
    }
    if (currency) account.currency = currency;
    if (icon) account.icon = icon;
    if (color) account.color = color;
    if (description !== undefined) account.description = description?.trim();
    if (isActive !== undefined) account.isActive = isActive;
    if (creditLimit !== undefined) {
      // If updating credit limit, check if current balance would exceed new limit
      if (account.type === 'credit' && creditLimit) {
        const currentBalance = balance !== undefined ? balance : account.balance;
        const availableCredit = creditLimit + currentBalance; // balance is negative for credit cards

        if (availableCredit < 0) {
          const currentDebt = Math.abs(currentBalance);
          return res.status(400).json({
            status: 'error',
            message: `Current balance exceeds new credit limit. Current debt: $${currentDebt.toFixed(2)}, new limit: $${creditLimit.toFixed(2)}`,
          });
        }
      }
      account.creditLimit = creditLimit;
    }
    if (institution !== undefined) account.institution = institution?.trim();

    await account.save();

    res.status(200).json({
      status: 'success',
      message: 'Account updated successfully',
      data: account,
    });
  } catch (error) {
    console.error('Update Account Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update account',
    });
  }
};

/**
 * @desc    Delete account
 * @route   DELETE /api/accounts/:id
 * @access  Private
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    const canDelete = await account.canDelete();

    if (!canDelete) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete account with associated transactions',
      });
    }

    await account.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete account',
    });
  }
};

/**
 * @desc    Get account transactions
 * @route   GET /api/accounts/:id/transactions
 * @access  Private
 */
exports.getAccountTransactions = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found',
      });
    }

    const Transaction = require('../models/transaction.model');

    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
      $or: [{ account: account._id }, { toAccount: account._id }],
    })
      .populate('category', 'name icon color')
      .populate('account', 'name type')
      .populate('toAccount', 'name type')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments({
      $or: [{ account: account._id }, { toAccount: account._id }],
    });

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    console.error('Get Account Transactions Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch account transactions',
    });
  }
};
