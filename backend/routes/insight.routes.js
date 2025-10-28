const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { mlRateLimiter } = require('../middleware/rateLimiter');
const insightsController = require('../controllers/insights.controller');

router.get('/', protect, (req, res) => {
  res.status(501).json({ status: 'info', message: 'Get insights - Phase 4' });
});

// Generate AI insights from user's financial data
router.get('/generate', protect, mlRateLimiter, insightsController.generateAIInsights);

router.post('/train-model', protect, mlRateLimiter, (req, res) => {
  res.status(501).json({ status: 'info', message: 'Train ML model - Phase 5' });
});

module.exports = router;
