"""
Data Fetcher - Retrieve user financial data from MongoDB
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd
from bson import ObjectId
from database.connection import db

class DataFetcher:
    """Fetch user financial data for ML models"""

    @staticmethod
    def check_data_sufficiency(df: pd.DataFrame, min_days: int = 30, min_transactions: int = 30, min_expenses: int = 20) -> dict:
        """
        Check if user has sufficient data for ML analysis.
        This checks if the DATA SPANS enough days, not if it's from the last N days.

        Args:
            df: DataFrame of transactions
            min_days: Minimum days the data should span (default: 30)
            min_transactions: Minimum total transactions (default: 30)
            min_expenses: Minimum expense transactions (default: 20)

        Returns:
            Dictionary with sufficiency status and details
        """
        if df.empty:
            return {
                "sufficient": False,
                "reason": "No transaction data found",
                "days_of_data": 0,
                "total_transactions": 0,
                "expense_transactions": 0
            }

        # Calculate the span of data (difference between oldest and newest transaction)
        date_range = (df['date'].max() - df['date'].min()).days + 1
        total_transactions = len(df)
        expense_transactions = len(df[df['type'] == 'expense'])

        # Check all conditions
        has_enough_days = date_range >= min_days
        has_enough_transactions = total_transactions >= min_transactions
        has_enough_expenses = expense_transactions >= min_expenses

        sufficient = has_enough_days and has_enough_transactions and has_enough_expenses

        reasons = []
        if not has_enough_days:
            reasons.append(f"Data spans only {date_range} days (need {min_days}+)")
        if not has_enough_transactions:
            reasons.append(f"Only {total_transactions} transactions (need {min_transactions}+)")
        if not has_enough_expenses:
            reasons.append(f"Only {expense_transactions} expense transactions (need {min_expenses}+)")

        return {
            "sufficient": sufficient,
            "reason": "; ".join(reasons) if reasons else "Data is sufficient",
            "days_of_data": date_range,
            "total_transactions": total_transactions,
            "expense_transactions": expense_transactions,
            "oldest_transaction": df['date'].min().strftime('%Y-%m-%d') if not df.empty else None,
            "newest_transaction": df['date'].max().strftime('%Y-%m-%d') if not df.empty else None
        }

    @staticmethod
    def get_user_transactions(user_id: str, days: int = 365, use_all_data: bool = True) -> pd.DataFrame:
        """
        Get user transactions for the specified number of days

        Args:
            user_id: User ID
            days: Number of days to fetch (default: 365) - only used if use_all_data is False
            use_all_data: If True, fetch ALL transactions regardless of date (default: True)

        Returns:
            DataFrame with columns: date, amount, type, category, description
        """
        try:
            # Build match query
            match_query = {"user": ObjectId(user_id)}

            # Only apply date filter if not using all data
            if not use_all_data:
                end_date = datetime.now()
                start_date = end_date - timedelta(days=days)
                match_query["date"] = {"$gte": start_date, "$lte": end_date}

            # Use aggregation pipeline to join with categories collection
            pipeline = [
                {
                    "$match": match_query
                },
                {
                    "$lookup": {
                        "from": "categories",
                        "localField": "category",
                        "foreignField": "_id",
                        "as": "categoryInfo"
                    }
                },
                {
                    "$project": {
                        "date": 1,
                        "amount": 1,
                        "type": 1,
                        "description": 1,
                        "category": {
                            "$cond": {
                                "if": {"$gt": [{"$size": "$categoryInfo"}, 0]},
                                "then": {"$arrayElemAt": ["$categoryInfo.name", 0]},
                                "else": "Uncategorized"
                            }
                        }
                    }
                }
            ]

            transactions = list(db.transactions.aggregate(pipeline))

            if not transactions:
                print(f"No transactions found for user {user_id}")
                return pd.DataFrame()

            # Convert to DataFrame
            df = pd.DataFrame(transactions)

            # Process data
            df['date'] = pd.to_datetime(df['date'])
            df['amount'] = df['amount'].astype(float)

            # Ensure description is a string
            if 'description' in df.columns:
                df['description'] = df['description'].fillna('No description')
            else:
                df['description'] = 'No description'

            # Keep only necessary columns
            columns = ['date', 'amount', 'type', 'category', 'description']
            df = df[columns]

            # Sort by date
            df = df.sort_values('date')

            print(f"[OK] Fetched {len(df)} transactions for user {user_id}")
            return df

        except Exception as e:
            print(f"[ERROR] Error fetching transactions: {e}")
            return pd.DataFrame()

    @staticmethod
    def get_user_budgets(user_id: str) -> List[Dict[str, Any]]:
        """Get user's active budgets"""
        try:
            budgets = list(db.budgets.find({
                "user": ObjectId(user_id),
                "isActive": True
            }))

            # Convert ObjectId to string for JSON serialization
            for budget in budgets:
                budget['_id'] = str(budget['_id'])
                budget['user'] = str(budget['user'])
                if 'category' in budget and budget['category']:
                    budget['category'] = str(budget['category'])

            print(f"[OK] Fetched {len(budgets)} budgets for user {user_id}")
            return budgets

        except Exception as e:
            print(f"[ERROR] Error fetching budgets: {e}")
            return []

    @staticmethod
    def get_user_goals(user_id: str) -> List[Dict[str, Any]]:
        """Get user's active goals"""
        try:
            goals = list(db.goals.find({
                "user": ObjectId(user_id),
                "isCompleted": False
            }))

            # Convert ObjectId to string
            for goal in goals:
                goal['_id'] = str(goal['_id'])
                goal['user'] = str(goal['user'])

            print(f"[OK] Fetched {len(goals)} goals for user {user_id}")
            return goals

        except Exception as e:
            print(f"[ERROR] Error fetching goals: {e}")
            return []

    @staticmethod
    def get_user_accounts(user_id: str) -> List[Dict[str, Any]]:
        """Get user's accounts"""
        try:
            accounts = list(db.accounts.find({
                "user": ObjectId(user_id)
            }))

            # Convert ObjectId to string
            for account in accounts:
                account['_id'] = str(account['_id'])
                account['user'] = str(account['user'])

            print(f"[OK] Fetched {len(accounts)} accounts for user {user_id}")
            return accounts

        except Exception as e:
            print(f"[ERROR] Error fetching accounts: {e}")
            return []

    @staticmethod
    def get_spending_by_category(user_id: str, days: int = 30) -> Dict[str, float]:
        """
        Get total spending by category for the last N days

        Args:
            user_id: User ID
            days: Number of days (default: 30)

        Returns:
            Dictionary of {category_name: total_amount}
        """
        try:
            # Get transactions
            df = DataFetcher.get_user_transactions(user_id, days)

            if df.empty:
                return {}

            # Filter only expenses
            expenses = df[df['type'] == 'expense']

            # Group by category
            category_spending = expenses.groupby('category')['amount'].sum().to_dict()

            return category_spending

        except Exception as e:
            print(f"[ERROR] Error calculating category spending: {e}")
            return {}

    @staticmethod
    def get_financial_summary(user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get comprehensive financial summary

        Args:
            user_id: User ID
            days: Number of days (default: 30)

        Returns:
            Dictionary with income, expenses, balance, trends
        """
        try:
            df = DataFetcher.get_user_transactions(user_id, days)

            if df.empty:
                return {
                    "total_income": 0,
                    "total_expenses": 0,
                    "net_balance": 0,
                    "transaction_count": 0,
                    "avg_daily_spending": 0
                }

            # Calculate metrics
            income = df[df['type'] == 'income']['amount'].sum()
            expenses = df[df['type'] == 'expense']['amount'].sum()

            summary = {
                "total_income": float(income),
                "total_expenses": float(expenses),
                "net_balance": float(income - expenses),
                "transaction_count": len(df),
                "avg_daily_spending": float(expenses / days) if days > 0 else 0,
                "spending_by_category": DataFetcher.get_spending_by_category(user_id, days)
            }

            return summary

        except Exception as e:
            print(f"[ERROR] Error generating financial summary: {e}")
            return {}
