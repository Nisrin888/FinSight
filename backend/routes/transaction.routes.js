const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');

// Validation rules
const transactionValidation = [
  body('type')
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['income', 'expense', 'transfer'])
    .withMessage('Type must be income, expense, or transfer'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .if(body('type').not().equals('transfer'))
    .notEmpty()
    .withMessage('Category is required for income/expense transactions'),
  body('account')
    .notEmpty()
    .withMessage('Account is required'),
  body('toAccount')
    .if(body('type').equals('transfer'))
    .notEmpty()
    .withMessage('Destination account is required for transfers'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurring frequency'),
];

const transactionUpdateValidation = [
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

// All routes require authentication
router.use(protect);

// Routes
router.get('/stats', transactionController.getTransactionStats);

router
  .route('/')
  .get(transactionController.getTransactions)
  .post(transactionValidation, transactionController.createTransaction);

router
  .route('/:id')
  .get(transactionController.getTransaction)
  .patch(transactionUpdateValidation, transactionController.updateTransaction)
  .delete(transactionController.deleteTransaction);

module.exports = router;
