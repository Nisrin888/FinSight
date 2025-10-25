/**
 * User Model
 * Represents registered users in the FinSight platform
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  passwordHash: {
    type: String,
    select: false // Don't return password by default
  },

  // Authentication
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  googleId: {
    type: String,
    sparse: true,
    index: true
  },

  // Profile
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'CAD', 'EUR', 'GBP', 'INR', 'AUD', 'JPY', 'CNY', 'CHF', 'MXN', 'BRL', 'ZAR']
  },
  profilePicture: {
    type: String,
    default: null
  },

  // Role & Status
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // ML Model Status
  hasSufficientData: {
    type: Boolean,
    default: false
  },
  mlModelStatus: {
    type: String,
    enum: ['untrained', 'training', 'trained', 'failed'],
    default: 'untrained'
  },
  lastMLTrainDate: {
    type: Date
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  dataDaysCovered: {
    type: Number,
    default: 0
  },

  // Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Notification Preferences
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    },
    overspending: {
      type: Boolean,
      default: true
    },
    goalMilestones: {
      type: Boolean,
      default: true
    },
    dailyReminder: {
      type: Boolean,
      default: false
    },
    weeklyReport: {
      type: Boolean,
      default: true
    }
  },

  // Timestamps
  dateCreated: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Additional indexes (email and googleId already indexed above)
userSchema.index({ createdAt: -1 });

// Virtual for full display
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Clean up profilePicture before saving
userSchema.pre('save', function(next) {
  // Convert empty string to null for profilePicture
  if (this.profilePicture === '' || this.profilePicture === undefined) {
    this.profilePicture = null;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('passwordHash')) {
    return next();
  }

  // Don't hash if using OAuth
  if (this.authProvider !== 'email' || !this.passwordHash) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.passwordHash) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockoutUntil && this.lockoutUntil > Date.now());
};

// Method to increment failed login attempts
userSchema.methods.incLoginAttempts = async function() {
  // Reset if lock expired
  if (this.lockoutUntil && this.lockoutUntil < Date.now()) {
    return await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockoutUntil: 1 }
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // Lock account after 5 failed attempts (2 hours)
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockoutUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }

  return await this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockoutUntil: 1 }
  });
};

// Update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  return await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
