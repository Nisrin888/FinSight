"""
ML Model Configuration
Defines minimum data requirements for accurate ML predictions
"""

# Minimum data requirements for ML models
MIN_DAYS_OF_DATA = 30  # Minimum 30 days of transaction history
MIN_TRANSACTIONS = 30  # Minimum 30 transactions total
MIN_EXPENSES = 20  # Minimum 20 expense transactions for spending analysis
MIN_CATEGORY_TRANSACTIONS = 5  # Minimum transactions per category for analysis

# Model-specific requirements
FORECAST_MIN_DAYS = 30  # Need at least 30 days to predict trends
ANOMALY_MIN_TRANSACTIONS = 30  # Need substantial data to identify patterns
BUDGET_MIN_DAYS = 30  # Need full month to recommend budgets
INSIGHTS_MIN_DAYS = 30  # Need comprehensive data for insights
GOALS_MIN_MONTHS = 1  # Need at least 1 month of savings data

# Analysis parameters
SAVINGS_ANALYSIS_MONTHS = 6  # Analyze 6 months for savings capacity
FORECAST_PERIOD_DAYS = 30  # Forecast next 30 days
