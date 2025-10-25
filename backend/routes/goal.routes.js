const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const goalController = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth');

// Validation rules
const goalValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Goal title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('targetAmount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be greater than 0'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount cannot be negative'),
  body('deadline')
    .notEmpty()
    .withMessage('Deadline is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('icon')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

const goalUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('targetAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be greater than 0'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount cannot be negative'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('icon')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

// All routes require authentication
router.use(protect);

// Routes
router
  .route('/')
  .get(goalController.getGoals)
  .post(goalValidation, goalController.createGoal);

router
  .route('/:id')
  .get(goalController.getGoal)
  .patch(goalUpdateValidation, goalController.updateGoal)
  .delete(goalController.deleteGoal);

// Contribute to goal
router.post('/:id/contribute', goalController.contributeToGoal);

module.exports = router;
