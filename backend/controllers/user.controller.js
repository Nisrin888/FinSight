/**
 * User Controller
 * Handles user profile management
 */

const User = require('../models/User.model');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, currency, notificationPreferences } = req.body;

    // Fields allowed to update
    const updates = {};
    if (name) updates.name = name;
    if (currency) updates.currency = currency;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;

    // Don't allow email or password updates here
    if (req.body.email || req.body.password || req.body.passwordHash) {
      return next(new AppError('Use appropriate endpoints to update email or password', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/account
 * @access  Private
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return next(new AppError('Please provide your password to confirm account deletion', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+passwordHash');

    // Verify password
    const isValid = await user.matchPassword(password);
    if (!isValid) {
      return next(new AppError('Incorrect password', 401));
    }

    // Soft delete (set isActive to false) instead of hard delete
    user.isActive = false;
    await user.save();

    // TODO: In future phases, also delete or anonymize:
    // - User's transactions
    // - User's goals
    // - User's categories
    // - User's notifications
    // - ML models

    res.status(200).json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-passwordHash')
      .skip(skip)
      .limit(limit)
      .sort('-dateCreated');

    const total = await User.countDocuments();

    res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user by ID (admin only)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, currency, role, isActive } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (currency !== undefined) updates.currency = currency;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user by ID (admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
