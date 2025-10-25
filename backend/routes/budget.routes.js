const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const budgetController = require('../controllers/budget.controller');
const { protect } = require('../middleware/auth');

// Validation rules
const budgetValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Budget name is required')
    .isLength({ max: 100 })
    .withMessage('Budget name cannot exceed 100 characters'),
  body('amount')
    .notEmpty()
    .withMessage('Budget amount is required')
    .isFloat({ min: 0 })
    .withMessage('Budget amount must be positive'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Period must be weekly, monthly, or yearly'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  body('threshold')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Threshold must be between 0 and 100'),
  body('rollover')
    .optional()
    .isBoolean()
    .withMessage('Rollover must be a boolean'),
];

const budgetUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Budget name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Budget name cannot exceed 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget amount must be positive'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  body('threshold')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Threshold must be between 0 and 100'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('rollover')
    .optional()
    .isBoolean()
    .withMessage('Rollover must be a boolean'),
];

// All routes require authentication
router.use(protect);

// Routes
router.get('/alerts', budgetController.getBudgetAlerts);

router
  .route('/')
  .get(budgetController.getBudgets)
  .post(budgetValidation, budgetController.createBudget);

router
  .route('/:id')
  .get(budgetController.getBudget)
  .patch(budgetUpdateValidation, budgetController.updateBudget)
  .delete(budgetController.deleteBudget);

router.get('/:id/progress', budgetController.getBudgetProgress);

module.exports = router;
