const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  insights: [{
    type: {
      type: String,
      enum: ['warning', 'success', 'tip', 'alert', 'achievement'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    }
  }],
  context: {
    period_days: Number,
    total_income: String,
    total_expenses: String,
    net_income: String,
    savings_rate: String,
    transaction_count: Number
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  validUntil: {
    type: Date,
    default: function() {
      // Valid for 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    },
    index: true
  },
  isFallback: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
aiInsightSchema.index({ user: 1, validUntil: -1 });

// Method to check if insights are still valid
aiInsightSchema.methods.isValid = function() {
  return this.validUntil > new Date();
};

module.exports = mongoose.model('AIInsight', aiInsightSchema);
