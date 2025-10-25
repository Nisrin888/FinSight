const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const accountController = require('../controllers/account.controller');
const { protect } = require('../middleware/auth');

// Validation rules
const accountValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Account name is required')
    .isLength({ max: 50 })
    .withMessage('Account name cannot exceed 50 characters'),
  body('type')
    .notEmpty()
    .withMessage('Account type is required')
    .isIn(['checking', 'savings', 'credit', 'cash', 'investment'])
    .withMessage('Invalid account type'),
  body('balance')
    .optional()
    .isNumeric()
    .withMessage('Balance must be a number'),
  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency code must be 3 characters'),
  body('icon').optional().trim(),
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
  body('creditLimit')
    .optional()
    .isNumeric()
    .withMessage('Credit limit must be a number'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Institution name cannot exceed 100 characters'),
];

const accountUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Account name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Account name cannot exceed 50 characters'),
  body('icon').optional().trim(),
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
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('creditLimit')
    .optional()
    .isNumeric()
    .withMessage('Credit limit must be a number'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Institution name cannot exceed 100 characters'),
];

// All routes require authentication
router.use(protect);

// Routes
router
  .route('/')
  .get(accountController.getAccounts)
  .post(accountValidation, accountController.createAccount);

router
  .route('/:id')
  .get(accountController.getAccount)
  .patch(accountUpdateValidation, accountController.updateAccount)
  .delete(accountController.deleteAccount);

router.route('/:id/transactions').get(accountController.getAccountTransactions);

module.exports = router;
