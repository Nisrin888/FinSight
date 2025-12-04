"""
Budget Recommendation Service
Analyzes spending patterns and recommends optimal budgets
"""

from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from database.data_fetcher import DataFetcher
from config.ml_config import BUDGET_MIN_DAYS, MIN_EXPENSES


class BudgetService:
    """Generate intelligent budget recommendations based on spending analysis"""

    @staticmethod
    def analyze_spending_patterns(user_id: str, months: int = 6) -> Dict[str, Any]:
        """
        Analyze spending patterns over time

        Args:
            user_id: User ID
            months: Number of months to analyze (default: 6)

        Returns:
            Dictionary with spending analysis by category
        """
        try:
            days = months * 30
            df = DataFetcher.get_user_transactions(user_id, days=days)

            if df.empty:
                return {}

            # Filter expenses only
            expenses = df[df['type'] == 'expense'].copy()

            if expenses.empty:
                return {}

            # Group by category and calculate statistics
            category_stats = {}

            for category in expenses['category'].unique():
                cat_data = expenses[expenses['category'] == category]

                # Monthly breakdown
                cat_data['month'] = cat_data['date'].dt.to_period('M')
                monthly_spending = cat_data.groupby('month')['amount'].sum()

                category_stats[category] = {
                    "total": float(cat_data['amount'].sum()),
                    "mean": float(cat_data['amount'].mean()),
                    "median": float(cat_data['amount'].median()),
                    "std": float(cat_data['amount'].std()),
                    "min": float(cat_data['amount'].min()),
                    "max": float(cat_data['amount'].max()),
                    "count": int(len(cat_data)),
                    "monthly_avg": float(monthly_spending.mean()) if len(monthly_spending) > 0 else 0,
                    "monthly_std": float(monthly_spending.std()) if len(monthly_spending) > 1 else 0,
                    "trend": BudgetService._calculate_trend(monthly_spending)
                }

            return category_stats

        except Exception as e:
            print(f"[ERROR] Error analyzing spending patterns: {e}")
            return {}

    @staticmethod
    def _calculate_trend(monthly_data: pd.Series) -> str:
        """
        Calculate spending trend (increasing, decreasing, stable)

        Args:
            monthly_data: Series of monthly spending

        Returns:
            Trend description
        """
        if len(monthly_data) < 2:
            return "stable"

        # Calculate percentage change
        values = monthly_data.values
        first_half_avg = np.mean(values[:len(values)//2])
        second_half_avg = np.mean(values[len(values)//2:])

        if first_half_avg == 0:
            return "increasing" if second_half_avg > 0 else "stable"

        change_pct = ((second_half_avg - first_half_avg) / first_half_avg) * 100

        if change_pct > 15:
            return "increasing"
        elif change_pct < -15:
            return "decreasing"
        else:
            return "stable"

    @staticmethod
    def recommend_budgets(user_id: str, approach: str = "balanced") -> Dict[str, Any]:
        """
        Generate budget recommendations based on spending analysis

        Args:
            user_id: User ID
            approach: Budget approach - "conservative", "balanced", or "flexible"

        Returns:
            Dictionary with budget recommendations
        """
        try:
            # Fetch ALL user transactions (not just last N days)
            df = DataFetcher.get_user_transactions(user_id, use_all_data=True)

            # Check if data spans enough days and has enough transactions
            sufficiency = DataFetcher.check_data_sufficiency(
                df,
                min_days=BUDGET_MIN_DAYS,
                min_transactions=BUDGET_MIN_DAYS,
                min_expenses=MIN_EXPENSES
            )

            if not sufficiency["sufficient"]:
                return {
                    "success": False,
                    "error": f"Insufficient data for budget recommendations: {sufficiency['reason']}",
                    "recommendations": [],
                    "total_recommended_budget": 0,
                    "data_info": sufficiency
                }

            # Analyze spending patterns
            patterns = BudgetService.analyze_spending_patterns(user_id, months=6)

            if not patterns:
                return {
                    "success": False,
                    "error": "Insufficient spending data for budget recommendations",
                    "recommendations": [],
                    "total_recommended_budget": 0
                }

            # Define multipliers based on approach
            multipliers = {
                "conservative": {
                    "stable": 1.0,      # Current average
                    "increasing": 1.15,  # 15% above average
                    "decreasing": 0.90   # 10% below average
                },
                "balanced": {
                    "stable": 1.10,      # 10% above average
                    "increasing": 1.25,  # 25% above average
                    "decreasing": 1.0    # Current average
                },
                "flexible": {
                    "stable": 1.20,      # 20% above average
                    "increasing": 1.35,  # 35% above average
                    "decreasing": 1.10   # 10% above average
                }
            }

            selected_multipliers = multipliers.get(approach, multipliers["balanced"])

            recommendations = []
            total_budget = 0

            for category, stats in patterns.items():
                # Base budget on monthly average
                base_amount = stats["monthly_avg"]
                trend = stats["trend"]

                # Apply multiplier based on trend
                multiplier = selected_multipliers[trend]
                recommended_amount = base_amount * multiplier

                # Add safety buffer based on standard deviation
                if stats["monthly_std"] > 0:
                    safety_buffer = stats["monthly_std"] * 0.5
                    recommended_amount += safety_buffer

                # Round to nearest dollar
                recommended_amount = round(recommended_amount, 2)
                total_budget += recommended_amount

                # Generate justification
                justification = BudgetService._generate_justification(
                    stats, recommended_amount, approach, trend
                )

                recommendations.append({
                    "category": category,
                    "recommended_amount": recommended_amount,
                    "current_monthly_avg": round(stats["monthly_avg"], 2),
                    "trend": trend,
                    "transaction_count": stats["count"],
                    "variability": "high" if stats["monthly_std"] > stats["monthly_avg"] * 0.3 else "low",
                    "justification": justification,
                    "priority": BudgetService._calculate_priority(stats)
                })

            # Sort by recommended amount (highest first)
            recommendations.sort(key=lambda x: x["recommended_amount"], reverse=True)

            # Get current budgets for comparison
            current_budgets = DataFetcher.get_user_budgets(user_id)
            comparison = BudgetService._compare_with_current(recommendations, current_budgets)

            return {
                "success": True,
                "approach": approach,
                "recommendations": recommendations,
                "total_recommended_budget": round(total_budget, 2),
                "comparison": comparison,
                "analysis_period_months": 6
            }

        except Exception as e:
            print(f"[ERROR] Error generating budget recommendations: {e}")
            return {
                "success": False,
                "error": str(e),
                "recommendations": [],
                "total_recommended_budget": 0
            }

    @staticmethod
    def _generate_justification(stats: Dict, recommended: float, approach: str, trend: str) -> str:
        """Generate human-readable justification for budget recommendation"""
        base = stats["monthly_avg"]
        increase_pct = ((recommended - base) / base * 100) if base > 0 else 0

        justifications = []

        # Trend-based justification
        if trend == "increasing":
            justifications.append(f"Spending in this category is increasing")
        elif trend == "decreasing":
            justifications.append(f"Spending in this category is decreasing")
        else:
            justifications.append(f"Spending in this category is stable")

        # Variability justification
        if stats["monthly_std"] > stats["monthly_avg"] * 0.3:
            justifications.append("includes buffer for high variability")

        # Approach justification
        if approach == "conservative":
            justifications.append("conservative approach applied")
        elif approach == "flexible":
            justifications.append("flexible approach for comfort")

        # Amount justification
        if increase_pct > 5:
            justifications.append(f"{round(increase_pct)}% above current average")
        elif increase_pct < -5:
            justifications.append(f"{round(abs(increase_pct))}% below current average")

        return "; ".join(justifications).capitalize()

    @staticmethod
    def _calculate_priority(stats: Dict) -> str:
        """Calculate budget priority based on spending patterns"""
        monthly_avg = stats["monthly_avg"]
        variability = stats["monthly_std"] / stats["monthly_avg"] if stats["monthly_avg"] > 0 else 0

        # High amount or high variability = high priority
        if monthly_avg > 500 or variability > 0.5:
            return "high"
        elif monthly_avg > 200 or variability > 0.3:
            return "medium"
        else:
            return "low"

    @staticmethod
    def _compare_with_current(recommendations: List[Dict], current_budgets: List[Dict]) -> Dict[str, Any]:
        """Compare recommendations with current budgets"""
        try:
            # Create mapping of current budgets by category
            current_map = {}
            for budget in current_budgets:
                if 'category' in budget and budget['category']:
                    # Category is an ObjectId string, need to match by category name
                    # For now, we'll use the amount field
                    current_map[budget.get('name', 'Unknown')] = budget.get('amount', 0)

            total_current = sum(current_map.values())
            total_recommended = sum(rec["recommended_amount"] for rec in recommendations)

            changes = []
            for rec in recommendations:
                category = rec["category"]
                recommended = rec["recommended_amount"]

                if category in current_map:
                    current = current_map[category]
                    difference = recommended - current
                    change_pct = (difference / current * 100) if current > 0 else 0

                    changes.append({
                        "category": category,
                        "current": current,
                        "recommended": recommended,
                        "difference": round(difference, 2),
                        "change_percentage": round(change_pct, 2)
                    })

            return {
                "total_current_budget": round(total_current, 2),
                "total_recommended_budget": round(total_recommended, 2),
                "overall_difference": round(total_recommended - total_current, 2),
                "changes": changes
            }

        except Exception as e:
            print(f"[ERROR] Error comparing budgets: {e}")
            return {
                "total_current_budget": 0,
                "total_recommended_budget": 0,
                "overall_difference": 0,
                "changes": []
            }

    @staticmethod
    def optimize_budget_allocation(user_id: str, total_budget: float) -> Dict[str, Any]:
        """
        Optimize budget allocation across categories for a fixed total budget

        Args:
            user_id: User ID
            total_budget: Total budget to allocate

        Returns:
            Dictionary with optimized allocation
        """
        try:
            # Analyze spending patterns
            patterns = BudgetService.analyze_spending_patterns(user_id, months=6)

            if not patterns:
                return {
                    "success": False,
                    "error": "Insufficient spending data",
                    "allocation": []
                }

            # Calculate total current spending
            total_spending = sum(p["monthly_avg"] for p in patterns.values())

            # Allocate proportionally with adjustments
            allocations = []

            for category, stats in patterns.items():
                # Base allocation proportional to current spending
                proportion = stats["monthly_avg"] / total_spending if total_spending > 0 else 0
                allocated = total_budget * proportion

                # Adjust based on priority
                priority = BudgetService._calculate_priority(stats)
                if priority == "high":
                    allocated *= 1.1  # 10% boost for high priority
                elif priority == "low":
                    allocated *= 0.9  # 10% reduction for low priority

                allocations.append({
                    "category": category,
                    "allocated_amount": round(allocated, 2),
                    "percentage_of_total": round(proportion * 100, 2),
                    "priority": priority
                })

            # Normalize to ensure total equals target budget
            current_total = sum(a["allocated_amount"] for a in allocations)
            if current_total > 0:
                adjustment_factor = total_budget / current_total
                for allocation in allocations:
                    allocation["allocated_amount"] = round(
                        allocation["allocated_amount"] * adjustment_factor, 2
                    )

            # Sort by allocation amount
            allocations.sort(key=lambda x: x["allocated_amount"], reverse=True)

            return {
                "success": True,
                "total_budget": total_budget,
                "allocation": allocations,
                "categories_covered": len(allocations)
            }

        except Exception as e:
            print(f"[ERROR] Error optimizing budget: {e}")
            return {
                "success": False,
                "error": str(e),
                "allocation": []
            }
