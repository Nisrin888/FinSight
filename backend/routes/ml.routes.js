const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const mlController = require('../controllers/ml.controller');

// ML Service Health Check
router.get('/health', mlController.healthCheck);

// All routes below require authentication
router.use(protect);

// Spending Forecast
router.get('/forecast', mlController.getSpendingForecast);
router.get('/forecast/category', mlController.getCategoryForecast);

// Anomaly Detection
router.get('/anomalies', mlController.detectAnomalies);
router.get('/anomalies/category', mlController.getCategoryAnomalies);

// Budget Recommendations
router.get('/budget/recommendations', mlController.getBudgetRecommendations);
router.post('/budget/optimize', mlController.optimizeBudget);

// Goal Predictions
router.post('/goals/predict', mlController.predictGoalAchievement);
router.get('/goals/analyze', mlController.analyzeAllGoals);

// AI Insights
router.get('/insights', mlController.getComprehensiveInsights);
router.post('/insights/specific', mlController.getSpecificInsights);

module.exports = router;
