"""
Anomaly Detection Service
Uses Isolation Forest to detect unusual spending patterns
"""

from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any, List
from database.data_fetcher import DataFetcher
from config.ml_config import ANOMALY_MIN_TRANSACTIONS, MIN_EXPENSES


class AnomalyService:
    """Detect unusual spending patterns using Isolation Forest"""

    @staticmethod
    def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for anomaly detection

        Args:
            df: DataFrame with transaction data

        Returns:
            DataFrame with engineered features
        """
        try:
            # Create a copy to avoid modifying original
            features = df.copy()

            # Extract time-based features
            features['day_of_week'] = features['date'].dt.dayofweek
            features['day_of_month'] = features['date'].dt.day
            features['hour'] = features['date'].dt.hour
            features['month'] = features['date'].dt.month

            # Calculate rolling statistics (if enough data)
            if len(features) > 7:
                features['rolling_mean_7d'] = features['amount'].rolling(window=7, min_periods=1).mean()
                features['rolling_std_7d'] = features['amount'].rolling(window=7, min_periods=1).std()
                features['amount_vs_mean'] = features['amount'] / features['rolling_mean_7d']
            else:
                features['rolling_mean_7d'] = features['amount'].mean()
                features['rolling_std_7d'] = features['amount'].std()
                features['amount_vs_mean'] = 1.0

            # Fill any NaN values
            features = features.fillna(0)

            return features

        except Exception as e:
            print(f"[ERROR] Error preparing features: {e}")
            return df

    @staticmethod
    def detect_anomalies(user_id: str, days: int = 90, contamination: float = 0.1) -> Dict[str, Any]:
        """
        Detect anomalous transactions using Isolation Forest

        Args:
            user_id: User ID
            days: Number of days to analyze (ignored, uses all data and checks span)
            contamination: Expected proportion of anomalies (default: 0.1 = 10%)

        Returns:
            Dictionary with anomalies and statistics
        """
        try:
            # Get ALL transaction data
            df = DataFetcher.get_user_transactions(user_id, use_all_data=True)

            # Check data sufficiency based on span, not recency
            sufficiency = DataFetcher.check_data_sufficiency(
                df,
                min_days=30,
                min_transactions=ANOMALY_MIN_TRANSACTIONS,
                min_expenses=MIN_EXPENSES
            )

            if not sufficiency["sufficient"]:
                return {
                    "success": False,
                    "error": f"Insufficient data for anomaly detection: {sufficiency['reason']}",
                    "anomalies": [],
                    "statistics": {},
                    "data_info": sufficiency
                }

            # Filter only expenses (anomaly detection on spending)
            expenses = df[df['type'] == 'expense'].copy()

            # Prepare features
            features = AnomalyService.prepare_features(expenses)

            # Select feature columns for the model
            feature_cols = ['amount', 'day_of_week', 'day_of_month', 'rolling_mean_7d', 'amount_vs_mean']
            X = features[feature_cols].values

            # Standardize features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            # Train Isolation Forest
            iso_forest = IsolationForest(
                contamination=contamination,
                random_state=42,
                n_estimators=100
            )

            # Predict anomalies (-1 for anomalies, 1 for normal)
            predictions = iso_forest.fit_predict(X_scaled)

            # Get anomaly scores (lower score = more anomalous)
            scores = iso_forest.score_samples(X_scaled)

            # Add predictions and scores to dataframe
            features['is_anomaly'] = predictions == -1
            features['anomaly_score'] = scores

            # Extract anomalous transactions
            anomalies = features[features['is_anomaly']].copy()

            # Sort by anomaly score (most anomalous first)
            anomalies = anomalies.sort_values('anomaly_score')

            # Prepare anomaly data for response
            anomaly_list = []
            for _, row in anomalies.iterrows():
                # Calculate how unusual this transaction is
                mean_amount = features['rolling_mean_7d'].mean()
                std_amount = features['amount'].std()
                z_score = (row['amount'] - mean_amount) / std_amount if std_amount > 0 else 0

                anomaly_list.append({
                    "date": row['date'].strftime('%Y-%m-%d'),
                    "amount": round(row['amount'], 2),
                    "category": row['category'],
                    "description": row['description'],
                    "anomaly_score": round(float(row['anomaly_score']), 4),
                    "severity": "high" if z_score > 3 else "medium" if z_score > 2 else "low",
                    "reason": AnomalyService._generate_anomaly_reason(row, mean_amount, z_score)
                })

            # Calculate statistics
            statistics = {
                "total_transactions": len(expenses),
                "anomalies_detected": len(anomalies),
                "anomaly_percentage": round((len(anomalies) / len(expenses)) * 100, 2),
                "total_anomalous_spending": round(anomalies['amount'].sum(), 2),
                "avg_transaction_amount": round(expenses['amount'].mean(), 2),
                "avg_anomaly_amount": round(anomalies['amount'].mean(), 2) if len(anomalies) > 0 else 0,
                "period_days": days
            }

            return {
                "success": True,
                "anomalies": anomaly_list,
                "statistics": statistics
            }

        except Exception as e:
            print(f"[ERROR] Error detecting anomalies: {e}")
            return {
                "success": False,
                "error": str(e),
                "anomalies": [],
                "statistics": {}
            }

    @staticmethod
    def _generate_anomaly_reason(row: pd.Series, mean_amount: float, z_score: float) -> str:
        """Generate human-readable reason for anomaly"""
        reasons = []

        # Amount-based reasons
        if row['amount'] > mean_amount * 3:
            reasons.append(f"Amount is {round(row['amount'] / mean_amount, 1)}x higher than average")
        elif row['amount'] > mean_amount * 2:
            reasons.append(f"Amount is {round(row['amount'] / mean_amount, 1)}x higher than average")

        # Pattern-based reasons
        if row['amount_vs_mean'] > 3:
            reasons.append("Significant deviation from recent spending pattern")

        # Time-based reasons
        if row['day_of_week'] == 6 or row['day_of_week'] == 0:  # Weekend
            if row['amount'] > mean_amount:
                reasons.append("Unusually high weekend spending")

        if not reasons:
            reasons.append("Statistical anomaly detected in spending pattern")

        return "; ".join(reasons)

    @staticmethod
    def get_category_anomalies(user_id: str, days: int = 90) -> Dict[str, Any]:
        """
        Detect anomalies by category

        Args:
            user_id: User ID
            days: Number of days to analyze (ignored, uses all data)

        Returns:
            Dictionary with category-wise anomaly analysis
        """
        try:
            # Get ALL transaction data
            df = DataFetcher.get_user_transactions(user_id, use_all_data=True)

            if df.empty:
                return {"success": False, "error": "No transaction data", "categories": {}}

            # Filter expenses
            expenses = df[df['type'] == 'expense'].copy()
            categories = expenses['category'].unique()

            category_anomalies = {}

            for category in categories:
                category_data = expenses[expenses['category'] == category].copy()

                if len(category_data) < 5:  # Need minimum data
                    continue

                # Calculate statistics
                mean_amount = category_data['amount'].mean()
                std_amount = category_data['amount'].std()

                # Find outliers using IQR method
                Q1 = category_data['amount'].quantile(0.25)
                Q3 = category_data['amount'].quantile(0.75)
                IQR = Q3 - Q1

                outliers = category_data[
                    (category_data['amount'] < (Q1 - 1.5 * IQR)) |
                    (category_data['amount'] > (Q3 + 1.5 * IQR))
                ]

                category_anomalies[category] = {
                    "total_transactions": len(category_data),
                    "outliers_detected": len(outliers),
                    "avg_amount": round(mean_amount, 2),
                    "std_amount": round(std_amount, 2),
                    "max_amount": round(category_data['amount'].max(), 2),
                    "min_amount": round(category_data['amount'].min(), 2)
                }

            return {
                "success": True,
                "categories": category_anomalies,
                "period_days": days
            }

        except Exception as e:
            print(f"[ERROR] Error detecting category anomalies: {e}")
            return {"success": False, "error": str(e), "categories": {}}
