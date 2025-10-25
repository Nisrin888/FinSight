/**
 * User Routes
 * Handles user profile and account management
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/user.controller');

// User profile routes (protected)
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.delete('/account', protect, userController.deleteAccount);

// Admin routes (protected + admin only)
router.get('/', protect, authorize('admin'), userController.getAllUsers);
router.get('/:id', protect, authorize('admin'), userController.getUserById);
router.put('/:id', protect, authorize('admin'), userController.updateUser);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router;
