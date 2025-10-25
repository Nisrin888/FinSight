/**
 * Authentication Routes
 * Handles user registration, login, logout, password reset
 */

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { protect } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/auth.controller');
const upload = require('../middleware/upload');

// Public routes (with rate limiting)
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authRateLimiter, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Protected routes (require authentication)
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.put('/update-password', protect, authController.updatePassword);
router.put('/profile', protect, authController.updateProfile);
router.put('/notifications', protect, authController.updateNotifications);
router.get('/export-data', protect, authController.exportData);
router.delete('/account', protect, authController.deleteAccount);
router.post('/profile-picture', protect, upload.single('profilePicture'), authController.uploadProfilePicture);
router.delete('/profile-picture', protect, authController.deleteProfilePicture);

// OAuth routes - Google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/google/failure',
    session: false
  }),
  authController.googleAuthSuccess
);

router.get('/google/failure', authController.googleAuthFailure);

module.exports = router;
