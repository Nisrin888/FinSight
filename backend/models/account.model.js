const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: [50, 'Account name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['checking', 'savings', 'credit', 'cash', 'investment'],
        message: 'Type must be checking, savings, credit, cash, or investment',
      },
    },
    balance: {
      type: Number,
      required: [true, 'Initial balance is required'],
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      maxlength: [3, 'Currency code must be 3 characters'],
    },
    icon: {
      type: String,
      default: '💰',
      trim: true,
      maxlength: [10, 'Icon/emoji cannot exceed 10 characters'],
    },
    color: {
      type: String,
      default: '#6366F1',
      trim: true,
      match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    creditLimit: {
      type: Number,
      default: null,
    },
    institution: {
      type: String,
      trim: true,
      maxlength: [100, 'Institution name cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
accountSchema.index({ user: 1, isActive: 1 });
accountSchema.index({ user: 1, type: 1 });

// Virtual for available credit (for credit card accounts)
accountSchema.virtual('availableCredit').get(function () {
  if (this.type === 'credit' && this.creditLimit) {
    return this.creditLimit + this.balance; // Balance is negative for credit cards
  }
  return null;
});

// Static method to get total balance across all accounts
accountSchema.statics.getTotalBalance = async function (userId, accountType = null) {
  const mongoose = require('mongoose');
  const match = { user: new mongoose.Types.ObjectId(userId), isActive: true };
  if (accountType) {
    match.type = accountType;
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        // Credit accounts are debt (negative), other accounts are assets (positive)
        totalBalance: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'credit'] },
              { $multiply: ['$balance', -1] }, // Subtract credit balances (debt)
              '$balance' // Add other account balances (assets)
            ]
          }
        },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalBalance : 0;
};

// Instance method to update balance
accountSchema.methods.updateBalance = async function (amount, operation = 'add') {
  if (operation === 'add') {
    this.balance += amount;
  } else if (operation === 'subtract') {
    this.balance -= amount;
  } else if (operation === 'set') {
    this.balance = amount;
  }

  return await this.save();
};

// Instance method to check if account can be deleted
accountSchema.methods.canDelete = async function () {
  // Check if account has associated transactions
  const Transaction = mongoose.model('Transaction');
  const transactionCount = await Transaction.countDocuments({
    $or: [{ account: this._id }, { toAccount: this._id }],
  });

  return transactionCount === 0;
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
