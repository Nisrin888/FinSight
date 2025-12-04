"""
Spending Forecast Service
Uses Prophet to predict future spending patterns
"""

from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from prophet import Prophet
from typing import Dict, Any, List
from database.data_fetcher import DataFetcher
from config.ml_config import FORECAST_MIN_DAYS, FORECAST_PERIOD_DAYS


class ForecastService:
    """Forecast future spending using Prophet time series model"""

    @staticmethod
    def prepare_data(user_id: str, days_history: int = 365) -> pd.DataFrame:
        """
        Prepare transaction data for Prophet model

        Args:
            user_id: User ID
            days_history: Number of days of historical data to use (ignored, uses all data)

        Returns:
            DataFrame with 'ds' (date) and 'y' (daily spending) columns
        """
        try:
            # Get ALL transaction data (not just last N days)
            df = DataFetcher.get_user_transactions(user_id, use_all_data=True)

            if df.empty:
                print(f"[WARNING] No transaction data for user {user_id}")
                return pd.DataFrame()

            # Filter only expenses
            expenses = df[df['type'] == 'expense'].copy()

            if expenses.empty:
                print(f"[WARNING] No expense data for user {user_id}")
                return pd.DataFrame()

            # Group by date and sum daily spending
            daily_spending = expenses.groupby(expenses['date'].dt.date)['amount'].sum().reset_index()
            daily_spending.columns = ['ds', 'y']

            # Convert date to datetime
            daily_spending['ds'] = pd.to_datetime(daily_spending['ds'])

            # Fill missing dates with 0 spending
            date_range = pd.date_range(
                start=daily_spending['ds'].min(),
                end=daily_spending['ds'].max(),
                freq='D'
            )

            full_range = pd.DataFrame({'ds': date_range})
            daily_spending = full_range.merge(daily_spending, on='ds', how='left')
            daily_spending['y'] = daily_spending['y'].fillna(0)

            print(f"[OK] Prepared {len(daily_spending)} days of spending data")
            return daily_spending

        except Exception as e:
            print(f"[ERROR] Error preparing forecast data: {e}")
            return pd.DataFrame()

    @staticmethod
    def train_and_predict(user_id: str, forecast_days: int = 30) -> Dict[str, Any]:
        """
        Train Prophet model and generate spending forecast

        Args:
            user_id: User ID
            forecast_days: Number of days to forecast

        Returns:
            Dictionary with forecast data and statistics
        """
        try:
            # Prepare data
            df = ForecastService.prepare_data(user_id)

            if df.empty:
                return {
                    "success": False,
                    "error": "No transaction data found",
                    "forecast": [],
                    "statistics": {}
                }

            # Check if data spans enough days
            date_range = (df['ds'].max() - df['ds'].min()).days + 1
            if date_range < FORECAST_MIN_DAYS:
                return {
                    "success": False,
                    "error": f"Insufficient data for forecasting (data spans {date_range} days, need {FORECAST_MIN_DAYS}+ days)",
                    "forecast": [],
                    "statistics": {},
                    "data_info": {
                        "days_of_data": date_range,
                        "total_data_points": len(df)
                    }
                }

            # Try Prophet-based forecast first
            use_simple_forecast = False
            try:
                # Initialize and train Prophet model
                # Suppress Prophet logs
                import logging
                import warnings
                logging.getLogger('prophet').setLevel(logging.ERROR)
                logging.getLogger('cmdstanpy').setLevel(logging.ERROR)

                # Suppress all warnings including Prophet internal warnings
                warnings.filterwarnings('ignore')

                model = Prophet(
                    daily_seasonality=True,
                    weekly_seasonality=True,
                    yearly_seasonality=len(df) > 365,
                    changepoint_prior_scale=0.05,
                    seasonality_prior_scale=10.0,
                )

                # Fit model with comprehensive error suppression
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    model.fit(df)

                # Create future dataframe
                future = model.make_future_dataframe(periods=forecast_days)

                # Generate predictions
                forecast = model.predict(future)

                # Extract forecast for future dates only
                future_forecast = forecast.tail(forecast_days)

            except Exception as prophet_error:
                # If Prophet fails, use simple average-based forecast
                print(f"[WARNING] Prophet failed ({prophet_error}), using simple average forecast")
                use_simple_forecast = True

            if use_simple_forecast:
                # Simple fallback: use historical average with slight trend
                historical_avg = df['y'].mean()
                historical_std = df['y'].std()

                # Calculate simple trend
                if len(df) > 7:
                    recent_avg = df.tail(7)['y'].mean()
                    trend = (recent_avg - historical_avg) / historical_avg if historical_avg > 0 else 0
                else:
                    trend = 0

                # Generate simple forecast
                future_forecast = pd.DataFrame()
                forecast_data = []
                start_date = df['ds'].max() + pd.Timedelta(days=1)

                for i in range(forecast_days):
                    date = start_date + pd.Timedelta(days=i)
                    predicted = historical_avg * (1 + trend * (i / 30))  # Apply trend over month
                    forecast_data.append({
                        'ds': date,
                        'yhat': max(0, predicted),
                        'yhat_lower': max(0, predicted - historical_std),
                        'yhat_upper': predicted + historical_std
                    })

                future_forecast = pd.DataFrame(forecast_data)

            # Prepare response data
            forecast_data = []
            for _, row in future_forecast.iterrows():
                forecast_data.append({
                    "date": row['ds'].strftime('%Y-%m-%d'),
                    "predicted_spending": max(0, round(row['yhat'], 2)),  # Ensure non-negative
                    "lower_bound": max(0, round(row['yhat_lower'], 2)),
                    "upper_bound": max(0, round(row['yhat_upper'], 2))
                })

            # Calculate statistics
            historical_avg = df['y'].mean()
            forecast_avg = future_forecast['yhat'].mean()
            trend = ((forecast_avg - historical_avg) / historical_avg * 100) if historical_avg > 0 else 0

            total_predicted = future_forecast['yhat'].sum()

            statistics = {
                "historical_avg_daily": round(historical_avg, 2),
                "forecast_avg_daily": max(0, round(forecast_avg, 2)),
                "trend_percentage": round(trend, 2),
                "total_predicted_spending": max(0, round(total_predicted, 2)),
                "forecast_period_days": forecast_days,
                "data_points_used": len(df)
            }

            return {
                "success": True,
                "forecast": forecast_data,
                "statistics": statistics
            }

        except Exception as e:
            print(f"[ERROR] Error generating forecast: {e}")
            return {
                "success": False,
                "error": str(e),
                "forecast": [],
                "statistics": {}
            }

    @staticmethod
    def get_category_forecast(user_id: str, forecast_days: int = 30) -> Dict[str, Any]:
        """
        Generate spending forecast by category

        Args:
            user_id: User ID
            forecast_days: Number of days to forecast

        Returns:
            Dictionary with category-wise forecasts
        """
        try:
            # Get ALL transaction data
            df = DataFetcher.get_user_transactions(user_id, use_all_data=True)

            if df.empty:
                return {"success": False, "error": "No transaction data", "forecasts": {}}

            # Filter expenses
            expenses = df[df['type'] == 'expense'].copy()

            # Get unique categories
            categories = expenses['category'].unique()

            category_forecasts = {}

            for category in categories:
                # Filter data for this category
                category_data = expenses[expenses['category'] == category].copy()

                # Group by date
                daily_data = category_data.groupby(
                    category_data['date'].dt.date
                )['amount'].sum().reset_index()
                daily_data.columns = ['ds', 'y']
                daily_data['ds'] = pd.to_datetime(daily_data['ds'])

                # Need at least 7 days of data
                if len(daily_data) < 7:
                    category_forecasts[category] = {
                        "avg_spending": round(category_data['amount'].mean(), 2),
                        "total_historical": round(category_data['amount'].sum(), 2),
                        "predicted_total": round(category_data['amount'].mean() * forecast_days, 2)
                    }
                    continue

                # Train mini model for this category
                import logging
                import warnings
                logging.getLogger('prophet').setLevel(logging.ERROR)
                logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
                warnings.filterwarnings('ignore')

                model = Prophet(daily_seasonality=False, weekly_seasonality=True)

                # Fit model with comprehensive error suppression
                try:
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        model.fit(daily_data)
                except AttributeError as e:
                    print(f"[WARNING] Prophet category fit warning (continuing anyway): {e}")
                    import sys
                    old_stderr = sys.stderr
                    sys.stderr = open('nul' if sys.platform == 'win32' else '/dev/null', 'w')
                    try:
                        model.fit(daily_data)
                    finally:
                        sys.stderr.close()
                        sys.stderr = old_stderr
                future = model.make_future_dataframe(periods=forecast_days)
                forecast = model.predict(future)

                future_forecast = forecast.tail(forecast_days)
                predicted_total = max(0, future_forecast['yhat'].sum())

                category_forecasts[category] = {
                    "avg_spending": round(daily_data['y'].mean(), 2),
                    "total_historical": round(category_data['amount'].sum(), 2),
                    "predicted_total": round(predicted_total, 2)
                }

            return {
                "success": True,
                "forecasts": category_forecasts,
                "forecast_period_days": forecast_days
            }

        except Exception as e:
            print(f"[ERROR] Error generating category forecast: {e}")
            return {"success": False, "error": str(e), "forecasts": {}}
