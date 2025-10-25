const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['income', 'expense', 'transfer'],
        message: 'Type must be income, expense, or transfer',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: function () {
        return this.type !== 'transfer';
      },
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account is required'],
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: function () {
        return this.type === 'transfer';
      },
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', null],
      default: null,
    },
    recurringEndDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, account: 1 });
transactionSchema.index({ date: -1 });

// Pre-save middleware to update account balances
transactionSchema.pre('save', async function (next) {
  if (this.isNew && this.status === 'completed') {
    const Account = mongoose.model('Account');

    if (this.type === 'income') {
      // Add to account balance
      await Account.findByIdAndUpdate(this.account, {
        $inc: { balance: this.amount },
      });
    } else if (this.type === 'expense') {
      // Subtract from account balance
      await Account.findByIdAndUpdate(this.account, {
        $inc: { balance: -this.amount },
      });
    } else if (this.type === 'transfer') {
      // Subtract from source account and add to destination account
      await Account.findByIdAndUpdate(this.account, {
        $inc: { balance: -this.amount },
      });
      await Account.findByIdAndUpdate(this.toAccount, {
        $inc: { balance: this.amount },
      });
    }
  }

  next();
});

// Pre-deleteOne middleware to revert account balances (replaces deprecated pre-remove)
transactionSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  if (this.status === 'completed') {
    const Account = mongoose.model('Account');

    if (this.type === 'income') {
      // Subtract from account balance
      await Account.findByIdAndUpdate(this.account, {
        $inc: { balance: -this.amount },
      });
    } else if (this.type === 'expense') {
      // Add back to account balance
      await Account.findByIdAndUpdate(this.account, {
        $inc: { balance: this.amount },
      });
    } else if (this.type === 'transfer') {
      // Revert transfer
      await Account.findByIdAndUpdate(this.account, {
        $inc: { balance: this.amount },
      });
      await Account.findByIdAndUpdate(this.toAccount, {
        $inc: { balance: -this.amount },
      });
    }
  }

  next();
});

// Static method to get spending by category
transactionSchema.statics.getSpendingByCategory = async function (userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: startDate, $lte: endDate },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    },
    {
      $unwind: '$categoryInfo',
    },
    {
      $project: {
        _id: 1,
        total: 1,
        count: 1,
        name: '$categoryInfo.name',
        color: '$categoryInfo.color',
        icon: '$categoryInfo.icon',
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);
};

// Static method to get income vs expense trend
transactionSchema.statics.getIncomeExpenseTrend = async function (userId, startDate, endDate, groupBy = 'day') {
  const groupFormat = {
    day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
    week: { $week: '$date' },
    month: { $dateToString: { format: '%Y-%m', date: '$date' } },
    year: { $year: '$date' },
  };

  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        type: { $in: ['income', 'expense'] },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: {
          period: groupFormat[groupBy],
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.period',
        data: {
          $push: {
            type: '$_id.type',
            total: '$total',
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
