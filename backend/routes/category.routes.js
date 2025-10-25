const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const { protect } = require('../middleware/auth');

// Validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
  body('type')
    .notEmpty()
    .withMessage('Category type is required')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('icon').optional({ values: 'falsy' }).trim(),
  body('emoji')
    .optional({ values: 'falsy' })
    .trim()
    .custom((value) => !value || value.length <= 10)
    .withMessage('Emoji cannot exceed 10 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
];

const categoryUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
  body('icon').optional({ values: 'falsy' }).trim(),
  body('emoji')
    .optional({ values: 'falsy' })
    .trim()
    .custom((value) => !value || value.length <= 10)
    .withMessage('Emoji cannot exceed 10 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
];

// All routes require authentication
router.use(protect);

// Routes
router
  .route('/')
  .get(categoryController.getCategories)
  .post(categoryValidation, categoryController.createCategory);

router
  .route('/:id')
  .get(categoryController.getCategory)
  .patch(categoryUpdateValidation, categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

module.exports = router;
