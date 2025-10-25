const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Individual dashboard endpoints
router.get('/summary', dashboardController.getDashboardSummary);
router.get('/spending-by-category', dashboardController.getSpendingByCategory);
router.get('/income-expense-trend', dashboardController.getIncomeExpenseTrend);
router.get('/recent-transactions', dashboardController.getRecentTransactions);
router.get('/budgets-overview', dashboardController.getBudgetsOverview);
router.get('/account-balances', dashboardController.getAccountBalances);

// Complete dashboard (all data in one request)
router.get('/', dashboardController.getCompleteDashboard);

module.exports = router;
