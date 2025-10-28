const axios = require('axios');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');
const AIInsight = require('../models/aiInsight.model');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Generate AI insights from user's financial data
 * Uses Google Gemini via ML service
 * Implements caching to avoid unnecessary API calls
 */
exports.generateAIInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30, forceRefresh = false } = req.query;

        // Check for cached insights (unless force refresh)
        if (!forceRefresh) {
            const cachedInsight = await AIInsight.findOne({
                user: userId,
                validUntil: { $gt: new Date() }
            }).sort({ createdAt: -1 });

            if (cachedInsight) {
                console.log(`[CACHE HIT] Returning cached insights for user ${userId}`);
                return res.json({
                    status: 'success',
                    data: {
                        insights: cachedInsight.insights,
                        generated_at: cachedInsight.generatedAt,
                        period: `Last ${days} days`,
                        context: cachedInsight.context,
                        cached: true,
                        validUntil: cachedInsight.validUntil
                    }
                });
            }
        }

        console.log(`[CACHE MISS] Generating new insights for user ${userId}`);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Fetch user's financial data
        const transactions = await Transaction.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        }).populate('category').sort({ date: -1 });

        const budgets = await Budget.find({ user: userId });
        const goals = await Goal.find({ user: userId, status: 'active' });

        // Calculate basic statistics
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Category breakdown
        const categorySpending = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const catName = t.category?.name || 'Uncategorized';
                if (!categorySpending[catName]) {
                    categorySpending[catName] = 0;
                }
                categorySpending[catName] += t.amount;
            });

        // Sort categories by spending
        const topCategories = Object.entries(categorySpending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }));

        // Budget utilization
        const budgetInfo = budgets.map(b => ({
            category: b.category?.name || 'General',
            limit: b.amount,
            spent: categorySpending[b.category?.name] || 0,
            percentage: ((categorySpending[b.category?.name] || 0) / b.amount * 100).toFixed(1)
        }));

        // Prepare context for AI
        const financialContext = {
            period_days: parseInt(days),
            total_income: income.toFixed(2),
            total_expenses: expenses.toFixed(2),
            net_income: (income - expenses).toFixed(2),
            savings_rate: income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0,
            transaction_count: transactions.length,
            top_spending_categories: topCategories,
            budget_utilization: budgetInfo,
            active_goals_count: goals.length,
            avg_transaction_size: (expenses / transactions.filter(t => t.type === 'expense').length || 1).toFixed(2)
        };

        // Build prompt for Gemini
        const prompt = buildInsightsPrompt(financialContext);

        // Call ML service to get Gemini insights
        try {
            const mlResponse = await axios.post(
                `${ML_SERVICE_URL}/api/ml/insights/quick`,
                {
                    user_id: userId,
                    prompt: prompt,
                    context: financialContext
                },
                { timeout: 15000 }
            );

            if (mlResponse.data && mlResponse.data.status === 'success') {
                // Parse AI response into structured insights
                const insights = parseAIInsights(mlResponse.data.data.insight || mlResponse.data.data.insights);

                // Save insights to cache
                const cachedInsight = new AIInsight({
                    user: userId,
                    insights: insights,
                    context: financialContext,
                    isFallback: false
                });
                await cachedInsight.save();
                console.log(`[CACHE SAVED] Insights cached for user ${userId}`);

                return res.json({
                    status: 'success',
                    data: {
                        insights: insights,
                        generated_at: cachedInsight.generatedAt,
                        period: `Last ${days} days`,
                        context: financialContext,
                        cached: false
                    }
                });
            }
        } catch (mlError) {
            console.error('ML service error:', mlError.message);
            // Fallback to basic insights if ML service fails
            const fallbackInsights = generateFallbackInsights(financialContext);

            // Save fallback insights to cache (shorter validity - 6 hours)
            const cachedInsight = new AIInsight({
                user: userId,
                insights: fallbackInsights,
                context: financialContext,
                isFallback: true,
                validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
            });
            await cachedInsight.save();
            console.log(`[CACHE SAVED] Fallback insights cached for user ${userId}`);

            return res.json({
                status: 'success',
                data: {
                    insights: fallbackInsights,
                    generated_at: cachedInsight.generatedAt,
                    period: `Last ${days} days`,
                    fallback: true,
                    cached: false
                }
            });
        }

    } catch (error) {
        console.error('Error generating AI insights:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate AI insights',
            error: error.message
        });
    }
};

/**
 * Build prompt for Gemini
 */
function buildInsightsPrompt(context) {
    return `You are a professional financial advisor. Analyze the following financial data and provide 3 personalized insights.

Financial Data (Last ${context.period_days} days):
- Total Income: $${context.total_income}
- Total Expenses: $${context.total_expenses}
- Net Income: $${context.net_income}
- Savings Rate: ${context.savings_rate}%
- Transactions: ${context.transaction_count}

Top Spending Categories:
${context.top_spending_categories.map((c, i) => `${i + 1}. ${c.name}: $${c.amount.toFixed(2)}`).join('\n')}

${context.budget_utilization.length > 0 ? `
Budget Status:
${context.budget_utilization.map(b => `- ${b.category}: ${b.percentage}% used ($${b.spent.toFixed(2)} / $${b.limit})`).join('\n')}
` : ''}

Active Financial Goals: ${context.active_goals_count}

Generate EXACTLY 3 insights in this format:
1. [TYPE: warning/success/tip] | [TITLE: short title] | [MESSAGE: actionable advice]
2. [TYPE: warning/success/tip] | [TITLE: short title] | [MESSAGE: actionable advice]
3. [TYPE: warning/success/tip] | [TITLE: short title] | [MESSAGE: actionable advice]

Focus on:
- Specific spending patterns (mention actual categories and amounts)
- Budget adherence
- Savings opportunities
- Be encouraging but realistic
- Provide actionable advice

Keep each insight under 150 characters in the message.`;
}

/**
 * Parse AI response into structured insights
 */
function parseAIInsights(aiText) {
    const insights = [];
    const lines = aiText.split('\n').filter(line => line.trim());

    for (const line of lines) {
        // Match format: TYPE | TITLE | MESSAGE
        const match = line.match(/\[TYPE:\s*(\w+)\]\s*\|\s*\[TITLE:\s*([^\]]+)\]\s*\|\s*\[MESSAGE:\s*([^\]]+)\]/i);

        if (match) {
            const [, type, title, message] = match;
            insights.push({
                type: type.toLowerCase(),
                title: title.trim(),
                message: message.trim(),
                icon: getIconForType(type.toLowerCase()),
                color: getColorForType(type.toLowerCase())
            });
        }
    }

    // If parsing failed, try simpler parsing
    if (insights.length === 0) {
        const numbered = aiText.match(/\d+\.\s*(.+?)(?=\d+\.|$)/gs);
        if (numbered && numbered.length > 0) {
            numbered.slice(0, 3).forEach((item, index) => {
                const text = item.replace(/^\d+\.\s*/, '').trim();
                const type = text.toLowerCase().includes('warning') || text.toLowerCase().includes('alert') ? 'warning' :
                           text.toLowerCase().includes('success') || text.toLowerCase().includes('great') ? 'success' : 'tip';

                insights.push({
                    type,
                    title: `Insight ${index + 1}`,
                    message: text.substring(0, 150),
                    icon: getIconForType(type),
                    color: getColorForType(type)
                });
            });
        }
    }

    // If still no insights, use fallback
    if (insights.length === 0) {
        return [{
            type: 'tip',
            title: 'AI Analysis',
            message: aiText.substring(0, 150) + '...',
            icon: 'Lightbulb',
            color: 'text-primary-400'
        }];
    }

    return insights.slice(0, 3); // Return max 3 insights
}

/**
 * Get icon name for insight type
 */
function getIconForType(type) {
    const icons = {
        'warning': 'AlertCircle',
        'success': 'CheckCircle2',
        'tip': 'Lightbulb',
        'alert': 'AlertTriangle',
        'achievement': 'Trophy'
    };
    return icons[type] || 'Lightbulb';
}

/**
 * Get color class for insight type
 */
function getColorForType(type) {
    const colors = {
        'warning': 'text-amber-400',
        'success': 'text-green-400',
        'tip': 'text-primary-400',
        'alert': 'text-red-400',
        'achievement': 'text-yellow-400'
    };
    return colors[type] || 'text-gray-400';
}

/**
 * Generate fallback insights if ML service is unavailable
 */
function generateFallbackInsights(context) {
    const insights = [];

    // Savings rate insight
    if (context.savings_rate < 10) {
        insights.push({
            type: 'warning',
            title: 'Low Savings Rate',
            message: `Your savings rate is ${context.savings_rate}%. Try to save at least 20% of your income.`,
            icon: 'AlertCircle',
            color: 'text-amber-400'
        });
    } else if (context.savings_rate > 20) {
        insights.push({
            type: 'success',
            title: 'Excellent Savings!',
            message: `You're saving ${context.savings_rate}% of your income. Keep up the great work!`,
            icon: 'CheckCircle2',
            color: 'text-green-400'
        });
    }

    // Top spending category insight
    if (context.top_spending_categories.length > 0) {
        const topCategory = context.top_spending_categories[0];
        const percentage = (topCategory.amount / parseFloat(context.total_expenses) * 100).toFixed(0);
        insights.push({
            type: 'tip',
            title: `${topCategory.name} Spending`,
            message: `${topCategory.name} is your top expense at $${topCategory.amount.toFixed(2)} (${percentage}% of total spending).`,
            icon: 'Lightbulb',
            color: 'text-primary-400'
        });
    }

    // Budget utilization insight
    const overBudget = context.budget_utilization.filter(b => parseFloat(b.percentage) > 100);
    if (overBudget.length > 0) {
        insights.push({
            type: 'warning',
            title: 'Budget Alert',
            message: `You've exceeded the budget for ${overBudget[0].category} by ${(parseFloat(overBudget[0].percentage) - 100).toFixed(0)}%.`,
            icon: 'AlertCircle',
            color: 'text-amber-400'
        });
    } else if (context.budget_utilization.length > 0) {
        insights.push({
            type: 'success',
            title: 'On Budget',
            message: `You're staying within your budgets. Great job managing your spending!`,
            icon: 'CheckCircle2',
            color: 'text-green-400'
        });
    }

    return insights.slice(0, 3);
}
