const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Spending Forecast
exports.getSpendingForecast = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/forecast`, {
            user_id: userId,
            days: parseInt(days)
        });

        res.json(response.data);
    } catch (error) {
        console.error('Spending forecast error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate spending forecast',
            error: error.response?.data || error.message
        });
    }
};

// Category-wise Forecast
exports.getCategoryForecast = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/forecast/category`, {
            user_id: userId,
            days: parseInt(days)
        });

        res.json(response.data);
    } catch (error) {
        console.error('Category forecast error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate category forecast',
            error: error.response?.data || error.message
        });
    }
};

// Anomaly Detection
exports.detectAnomalies = async (req, res) => {
    try {
        const userId = req.user.id;

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/anomaly-detection`, {
            user_id: userId
        });

        res.json(response.data);
    } catch (error) {
        console.error('Anomaly detection error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to detect anomalies',
            error: error.response?.data || error.message
        });
    }
};

// Category Anomalies
exports.getCategoryAnomalies = async (req, res) => {
    try {
        const userId = req.user.id;

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/anomaly-detection/category`, {
            user_id: userId
        });

        res.json(response.data);
    } catch (error) {
        console.error('Category anomaly detection error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to detect category anomalies',
            error: error.response?.data || error.message
        });
    }
};

// Budget Recommendations
exports.getBudgetRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { approach = 'balanced' } = req.query;

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/budget-recommendations`, {
            user_id: userId,
            approach
        });

        res.json(response.data);
    } catch (error) {
        console.error('Budget recommendations error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate budget recommendations',
            error: error.response?.data || error.message
        });
    }
};

// Budget Optimization
exports.optimizeBudget = async (req, res) => {
    try {
        const userId = req.user.id;
        const { total_budget } = req.body;

        if (!total_budget || total_budget <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid total_budget is required'
            });
        }

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/budget-optimization`, {
            user_id: userId,
            total_budget: parseFloat(total_budget)
        });

        res.json(response.data);
    } catch (error) {
        console.error('Budget optimization error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to optimize budget',
            error: error.response?.data || error.message
        });
    }
};

// Goal Prediction
exports.predictGoalAchievement = async (req, res) => {
    try {
        const userId = req.user.id;
        const { target_amount, current_amount, monthly_contribution, deadline } = req.body;

        if (!target_amount || !current_amount || !monthly_contribution) {
            return res.status(400).json({
                status: 'error',
                message: 'target_amount, current_amount, and monthly_contribution are required'
            });
        }

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/goal-prediction`, {
            user_id: userId,
            target_amount: parseFloat(target_amount),
            current_amount: parseFloat(current_amount),
            monthly_contribution: parseFloat(monthly_contribution),
            deadline: deadline || null
        });

        res.json(response.data);
    } catch (error) {
        console.error('Goal prediction error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to predict goal achievement',
            error: error.response?.data || error.message
        });
    }
};

// Analyze All Goals
exports.analyzeAllGoals = async (req, res) => {
    try {
        const userId = req.user.id;

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/goals/analyze-all`, {
            user_id: userId
        });

        res.json(response.data);
    } catch (error) {
        console.error('Goals analysis error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to analyze goals',
            error: error.response?.data || error.message
        });
    }
};

// AI Insights - Comprehensive
exports.getComprehensiveInsights = async (req, res) => {
    try {
        const userId = req.user.id;

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/insights`, {
            user_id: userId
        });

        res.json(response.data);
    } catch (error) {
        console.error('Comprehensive insights error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate comprehensive insights',
            error: error.response?.data || error.message
        });
    }
};

// AI Insights - Specific
exports.getSpecificInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        const { context_type, additional_context } = req.body;

        if (!context_type || !['spending', 'saving', 'budgeting', 'goals'].includes(context_type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid context_type is required (spending, saving, budgeting, or goals)'
            });
        }

        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/insights/specific`, {
            user_id: userId,
            context_type,
            additional_context: additional_context || ''
        });

        res.json(response.data);
    } catch (error) {
        console.error('Specific insights error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate specific insights',
            error: error.response?.data || error.message
        });
    }
};

// ML Service Health Check
exports.healthCheck = async (req, res) => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`);
        res.json({
            status: 'success',
            ml_service: response.data
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'ML service is unavailable',
            error: error.message
        });
    }
};
