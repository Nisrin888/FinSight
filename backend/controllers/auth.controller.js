/**
 * Authentication Controller
 * Handles user registration, login, logout, password reset
 */

const User = require('../models/User.model');
const Category = require('../models/category.model');
const { AppError } = require('../middleware/errorHandler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      status: 'success',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    // Validate password strength
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return next(new AppError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        400
      ));
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      authProvider: 'email'
    });

    // Create default categories for new user
    try {
      await Category.createDefaultCategories(user._id);
    } catch (error) {
      console.error('Error creating default categories:', error);
      // Don't fail registration if category creation fails
    }

    // Send token response
    sendTokenResponse(user, 201, res);

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Find user (include password for verification)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if account is locked
    if (user.isLocked()) {
      return next(new AppError(
        'Account is locked due to too many failed login attempts. Please try again later.',
        403
      ));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 403));
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      return next(new AppError('Invalid credentials', 401));
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    await user.updateLastLogin();

    // Send token response
    sendTokenResponse(user, 200, res);

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    res
      .status(200)
      .cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
      })
      .json({
        status: 'success',
        message: 'Logged out successfully'
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        profilePicture: user.profilePicture,
        role: user.role,
        authProvider: user.authProvider,
        hasSufficientData: user.hasSufficientData,
        mlModelStatus: user.mlModelStatus,
        notificationPreferences: user.notificationPreferences,
        dateCreated: user.dateCreated,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide an email', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.status(200).json({
        status: 'success',
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, use nodemailer)
    console.log('Password reset URL:', resetUrl);

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to email',
      ...(process.env.NODE_ENV === 'development' && { resetUrl }) // Only in development
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return next(new AppError('Please provide a new password', 400));
    }

    // Validate password strength
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Set new password
    user.passwordHash = password; // Will be hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+passwordHash');

    // Verify current password
    const isValid = await user.matchPassword(currentPassword);
    if (!isValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Validate new password
    if (newPassword.length < 8) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }

    // Set new password
    user.passwordHash = newPassword;
    await user.save();

    // Send new token
    sendTokenResponse(user, 200, res);

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Please provide refresh token', 400));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      status: 'success',
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
};

/**
 * @desc    Google OAuth success callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
exports.googleAuthSuccess = async (req, res, next) => {
  try {
    // User is authenticated via Passport
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error('Google OAuth Success Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

/**
 * @desc    Google OAuth failure callback
 * @route   GET /api/auth/google/failure
 * @access  Public
 */
exports.googleAuthFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, currency } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (currency) user.currency = currency;

    // Don't allow email changes for Google auth users
    if (email && user.authProvider !== 'google') {
      user.email = email;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/auth/notifications
 * @access  Private
 */
exports.updateNotifications = async (req, res, next) => {
  try {
    const { notificationPreferences } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...notificationPreferences,
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update Notifications Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update notification preferences',
    });
  }
};

/**
 * @desc    Export user data
 * @route   GET /api/auth/export-data
 * @access  Private
 */
exports.exportData = async (req, res, next) => {
  try {
    const Transaction = require('../models/transaction.model');
    const Account = require('../models/account.model');
    const Category = require('../models/category.model');
    const Budget = require('../models/budget.model');
    const Goal = require('../models/goal.model');

    // Fetch all user data
    const [user, transactions, accounts, categories, budgets, goals] = await Promise.all([
      User.findById(req.user.id).select('-passwordHash -passwordResetToken -passwordResetExpires'),
      Transaction.find({ user: req.user.id }),
      Account.find({ user: req.user.id }),
      Category.find({ user: req.user.id }),
      Budget.find({ user: req.user.id }),
      Goal.find({ user: req.user.id }),
    ]);

    const exportData = {
      user,
      transactions,
      accounts,
      categories,
      budgets,
      goals,
      exportDate: new Date(),
    };

    res.status(200).json(exportData);
  } catch (error) {
    console.error('Export Data Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export data',
    });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/account
 * @access  Private
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const Transaction = require('../models/transaction.model');
    const Account = require('../models/account.model');
    const Category = require('../models/category.model');
    const Budget = require('../models/budget.model');
    const Goal = require('../models/goal.model');

    // Delete all user data
    await Promise.all([
      Transaction.deleteMany({ user: req.user.id }),
      Account.deleteMany({ user: req.user.id }),
      Category.deleteMany({ user: req.user.id }),
      Budget.deleteMany({ user: req.user.id }),
      Goal.deleteMany({ user: req.user.id }),
      User.findByIdAndDelete(req.user.id),
    ]);

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
 * @desc    Upload profile picture
 * @route   POST /api/auth/profile-picture
 * @access  Private
 */
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const fs = require('fs');
      const path = require('path');
      const oldPath = path.join(__dirname, '../uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new profile picture path (relative URL)
    user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Upload Profile Picture Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload profile picture',
    });
  }
};

/**
 * @desc    Delete profile picture
 * @route   DELETE /api/auth/profile-picture
 * @access  Private
 */
exports.deleteProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Delete profile picture file if exists
    if (user.profilePicture) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile picture deleted successfully',
    });
  } catch (error) {
    console.error('Delete Profile Picture Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete profile picture',
    });
  }
};
