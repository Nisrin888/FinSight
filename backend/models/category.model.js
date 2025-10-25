const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      required: [true, 'Category type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
    },
    icon: {
      type: String,
      default: '🏷️',
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
    isDefault: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to map icon to emoji for frontend compatibility
categorySchema.virtual('emoji').get(function () {
  return this.icon;
});

// Index for faster queries
categorySchema.index({ user: 1, type: 1 });
categorySchema.index({ user: 1, name: 1 }, { unique: true });

// Static method to create default categories for a new user
categorySchema.statics.createDefaultCategories = async function (userId) {
  const defaultCategories = [
    // Income Categories
    { name: 'Salary', type: 'income', icon: '💼', color: '#10B981' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#059669' },
    { name: 'Business', type: 'income', icon: '📈', color: '#34D399' },
    { name: 'Investments', type: 'income', icon: '📊', color: '#6EE7B7' },
    { name: 'Other Income', type: 'income', icon: '💵', color: '#A7F3D0' },

    // Expense Categories
    { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#EF4444' },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#F97316' },
    { name: 'Housing', type: 'expense', icon: '🏠', color: '#F59E0B' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#EC4899' },
    { name: 'Healthcare', type: 'expense', icon: '⚕️', color: '#14B8A6' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#3B82F6' },
    { name: 'Bills & Utilities', type: 'expense', icon: '📄', color: '#6366F1' },
    { name: 'Personal Care', type: 'expense', icon: '💅', color: '#A855F7' },
    { name: 'Other Expenses', type: 'expense', icon: '🏷️', color: '#94A3B8' },
  ];

  const categories = defaultCategories.map((cat) => ({
    ...cat,
    user: userId,
    isDefault: true,
  }));

  return await this.insertMany(categories);
};

// Instance method to check if category can be deleted
categorySchema.methods.canDelete = async function () {
  // Check if category has associated transactions
  const Transaction = mongoose.model('Transaction');
  const transactionCount = await Transaction.countDocuments({ category: this._id });

  return transactionCount === 0;
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
