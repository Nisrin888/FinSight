const Category = require('../models/category.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all categories for logged-in user
 * @route   GET /api/categories
 * @access  Private
 */
exports.getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;

    const filter = { user: req.user.id };
    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories',
    });
  }
};

/**
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Private
 */
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    console.error('Get Category Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch category',
    });
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private
 */
exports.createCategory = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, type, icon, emoji, color, description } = req.body;

    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({
      user: req.user.id,
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: 'Category with this name already exists',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      type,
      icon: emoji || icon || '🏷️',
      color: color || '#6366F1',
      description: description?.trim(),
      user: req.user.id,
      isDefault: false,
    });

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create category',
    });
  }
};

/**
 * @desc    Update category
 * @route   PATCH /api/categories/:id
 * @access  Private
 */
exports.updateCategory = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
    }

    const { name, icon, emoji, color, description } = req.body;

    // If updating name, check for duplicates
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        user: req.user.id,
        name: name.trim(),
        _id: { $ne: category._id },
      });

      if (existingCategory) {
        return res.status(400).json({
          status: 'error',
          message: 'Category with this name already exists',
        });
      }
      category.name = name.trim();
    }

    if (emoji || icon) category.icon = emoji || icon;
    if (color) category.color = color;
    if (description !== undefined) category.description = description?.trim();

    await category.save();

    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update category',
    });
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
    }

    // Check if category has associated transactions
    const Transaction = require('../models/transaction.model');
    const transactionCount = await Transaction.countDocuments({
      category: category._id,
    });

    // If category has associated transactions, delete them as well
    if (transactionCount > 0) {
      // Note: This will trigger the pre-deleteOne middleware for each transaction
      // which will revert account balances
      const transactions = await Transaction.find({ category: category._id });
      for (const transaction of transactions) {
        await transaction.deleteOne();
      }
    }

    await category.deleteOne();

    res.status(200).json({
      status: 'success',
      message: transactionCount > 0
        ? `Category deleted successfully. ${transactionCount} transaction(s) have been deleted and account balances updated.`
        : 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete category',
    });
  }
};
