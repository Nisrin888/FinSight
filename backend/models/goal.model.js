const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0.01, 'Target amount must be greater than 0'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    icon: {
      type: String,
      default: '🎯',
      trim: true,
      maxlength: [10, 'Icon/emoji cannot exceed 10 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
goalSchema.index({ user: 1, deadline: 1 });
goalSchema.index({ user: 1, isCompleted: 1 });

// Pre-save middleware to check if goal is completed
goalSchema.pre('save', function (next) {
  if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  } else if (this.currentAmount < this.targetAmount && this.isCompleted) {
    this.isCompleted = false;
    this.completedAt = null;
  }
  next();
});

// Instance method to add contribution
goalSchema.methods.addContribution = async function (amount) {
  this.currentAmount += amount;
  return await this.save();
};

// Instance method to calculate progress percentage
goalSchema.methods.getProgress = function () {
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
};

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
