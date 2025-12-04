"""
Goal Achievement Prediction Service
Predicts probability and timeline for achieving financial goals
"""

from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from database.data_fetcher import DataFetcher
from config.ml_config import GOALS_MIN_MONTHS, MIN_TRANSACTIONS


class GoalService:
    """Predict financial goal achievement using historical financial data"""

    @staticmethod
    def calculate_savings_rate(user_id: str, months: int = 6) -> Dict[str, float]:
        """
        Calculate user's average savings rate

        Args:
            user_id: User ID
            months: Number of months to analyze

        Returns:
            Dictionary with savings statistics
        """
        try:
            days = months * 30
            df = DataFetcher.get_user_transactions(user_id, days=days)

            if df.empty:
                return {
                    "avg_monthly_income": 0,
                    "avg_monthly_expenses": 0,
                    "avg_monthly_savings": 0,
                    "savings_rate_percentage": 0,
                    "consistency_score": 0
                }

            # Calculate monthly income and expenses
            df['month'] = df['date'].dt.to_period('M')

            monthly_stats = []
            for month in df['month'].unique():
                month_data = df[df['month'] == month]

                income = month_data[month_data['type'] == 'income']['amount'].sum()
                expenses = month_data[month_data['type'] == 'expense']['amount'].sum()
                savings = income - expenses

                monthly_stats.append({
                    'month': month,
                    'income': income,
                    'expenses': expenses,
                    'savings': savings,
                    'savings_rate': (savings / income * 100) if income > 0 else 0
                })

            stats_df = pd.DataFrame(monthly_stats)

            # Calculate averages
            avg_income = stats_df['income'].mean()
            avg_expenses = stats_df['expenses'].mean()
            avg_savings = stats_df['savings'].mean()
            avg_savings_rate = (avg_savings / avg_income * 100) if avg_income > 0 else 0

            # Calculate consistency (lower std = more consistent)
            std_savings = stats_df['savings'].std()
            consistency = 100 - min((std_savings / avg_savings * 100) if avg_savings > 0 else 100, 100)

            return {
                "avg_monthly_income": round(avg_income, 2),
                "avg_monthly_expenses": round(avg_expenses, 2),
                "avg_monthly_savings": round(avg_savings, 2),
                "savings_rate_percentage": round(avg_savings_rate, 2),
                "consistency_score": round(max(consistency, 0), 2),
                "months_analyzed": len(monthly_stats)
            }

        except Exception as e:
            print(f"[ERROR] Error calculating savings rate: {e}")
            return {
                "avg_monthly_income": 0,
                "avg_monthly_expenses": 0,
                "avg_monthly_savings": 0,
                "savings_rate_percentage": 0,
                "consistency_score": 0
            }

    @staticmethod
    def predict_goal_achievement(
        user_id: str,
        target_amount: float,
        current_amount: float,
        monthly_contribution: float,
        deadline: str = None
    ) -> Dict[str, Any]:
        """
        Predict goal achievement probability and timeline

        Args:
            user_id: User ID
            target_amount: Goal target amount
            current_amount: Current amount saved
            monthly_contribution: Planned monthly contribution
            deadline: Optional deadline (YYYY-MM-DD format)

        Returns:
            Dictionary with prediction results
        """
        try:
            # Get user's savings statistics
            savings_stats = GoalService.calculate_savings_rate(user_id, months=6)

            # Calculate remaining amount
            remaining = target_amount - current_amount

            if remaining <= 0:
                return {
                    "success": True,
                    "achievement_probability": 100.0,
                    "status": "achieved",
                    "months_required": 0,
                    "estimated_completion_date": datetime.now().strftime('%Y-%m-%d'),
                    "message": "Goal already achieved!"
                }

            # Calculate months required with current contribution
            if monthly_contribution <= 0:
                months_required = float('inf')
                estimated_date = None  # Cannot estimate without contribution
            else:
                months_required = remaining / monthly_contribution
                # Cap months_required to avoid infinity issues
                if months_required > 9999:  # Cap at ~833 years
                    months_required = 9999
                    estimated_date = None
                else:
                    # Calculate estimated completion date
                    estimated_date = datetime.now() + relativedelta(months=int(months_required))

            # Calculate achievement probability
            probability = GoalService._calculate_achievement_probability(
                monthly_contribution=monthly_contribution,
                avg_savings=savings_stats["avg_monthly_savings"],
                consistency=savings_stats["consistency_score"],
                months_required=months_required,
                deadline=deadline
            )

            # Check if realistic based on historical savings
            is_realistic = monthly_contribution <= (savings_stats["avg_monthly_savings"] * 1.2)

            # Generate recommendations
            recommendations = GoalService._generate_recommendations(
                monthly_contribution=monthly_contribution,
                avg_savings=savings_stats["avg_monthly_savings"],
                remaining=remaining,
                months_required=months_required,
                deadline=deadline
            )

            # Status determination
            if probability >= 80:
                status = "highly_likely"
            elif probability >= 50:
                status = "possible"
            elif probability >= 30:
                status = "challenging"
            else:
                status = "unlikely"

            return {
                "success": True,
                "achievement_probability": round(probability, 2),
                "status": status,
                "months_required": round(months_required, 1) if months_required != float('inf') else None,
                "estimated_completion_date": estimated_date.strftime('%Y-%m-%d') if estimated_date else None,
                "is_realistic": is_realistic,
                "current_progress_percentage": round((current_amount / target_amount) * 100, 2),
                "savings_statistics": savings_stats,
                "recommendations": recommendations
            }

        except Exception as e:
            print(f"[ERROR] Error predicting goal achievement: {e}")
            return {
                "success": False,
                "error": str(e),
                "achievement_probability": 0,
                "status": "error"
            }

    @staticmethod
    def _calculate_achievement_probability(
        monthly_contribution: float,
        avg_savings: float,
        consistency: float,
        months_required: float,
        deadline: str = None
    ) -> float:
        """Calculate probability of achieving the goal"""

        # Base probability on contribution vs average savings
        if avg_savings <= 0:
            contribution_ratio = 0.5  # Neutral if no history
        else:
            contribution_ratio = min(monthly_contribution / avg_savings, 2.0)

        # Base probability (50% to 100% based on contribution ratio)
        base_probability = 50 + (contribution_ratio * 25)

        # Adjust for consistency
        consistency_factor = consistency / 100
        probability = base_probability * (0.7 + 0.3 * consistency_factor)

        # Adjust for timeline realism
        if deadline:
            try:
                deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
                months_to_deadline = (deadline_date.year - datetime.now().year) * 12 + \
                                   (deadline_date.month - datetime.now().month)

                if months_to_deadline <= 0:
                    probability *= 0.1  # Already past deadline
                elif months_required > months_to_deadline:
                    # Adjust based on how much we're missing the deadline
                    overage_ratio = months_required / months_to_deadline
                    probability *= (1 / overage_ratio)
                else:
                    # Under deadline - boost probability
                    probability *= 1.1

            except Exception:
                pass  # Invalid deadline format, ignore adjustment

        # Time penalty for very long goals (harder to maintain)
        if months_required > 60:  # 5 years
            probability *= 0.7
        elif months_required > 36:  # 3 years
            probability *= 0.85

        # Cap between 5% and 95%
        return max(5, min(95, probability))

    @staticmethod
    def _generate_recommendations(
        monthly_contribution: float,
        avg_savings: float,
        remaining: float,
        months_required: float,
        deadline: str = None
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        # Contribution recommendations
        if monthly_contribution < avg_savings * 0.5:
            increase_to = avg_savings * 0.7
            recommendations.append(
                f"Consider increasing monthly contribution to ${round(increase_to, 2)} "
                f"based on your average savings capacity"
            )

        if monthly_contribution > avg_savings * 1.5:
            recommendations.append(
                "Current contribution may be too aggressive - ensure it doesn't impact essential expenses"
            )

        # Timeline recommendations
        if deadline:
            try:
                deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
                months_to_deadline = (deadline_date.year - datetime.now().year) * 12 + \
                                   (deadline_date.month - datetime.now().month)

                if months_required > months_to_deadline:
                    needed_contribution = remaining / months_to_deadline
                    recommendations.append(
                        f"To meet deadline, increase contribution to ${round(needed_contribution, 2)}/month"
                    )
            except Exception:
                pass

        # General recommendations
        if months_required > 24:
            recommendations.append(
                "Consider setting intermediate milestones to track progress on this long-term goal"
            )

        if avg_savings > 0 and monthly_contribution < avg_savings:
            potential_savings = avg_savings - monthly_contribution
            recommendations.append(
                f"You have ${round(potential_savings, 2)}/month in unused savings capacity"
            )

        return recommendations

    @staticmethod
    def analyze_all_goals(user_id: str) -> Dict[str, Any]:
        """
        Analyze all user goals and provide comprehensive insights

        Args:
            user_id: User ID

        Returns:
            Dictionary with analysis of all goals
        """
        try:
            # Get user goals
            goals = DataFetcher.get_user_goals(user_id)

            if not goals:
                return {
                    "success": True,
                    "total_goals": 0,
                    "goals": [],
                    "overall_assessment": "No active goals"
                }

            # Fetch ALL user transactions (not just last N days)
            df = DataFetcher.get_user_transactions(user_id, use_all_data=True)

            # Check if data spans enough days and has enough transactions
            min_days = GOALS_MIN_MONTHS * 30
            sufficiency = DataFetcher.check_data_sufficiency(
                df,
                min_days=min_days,
                min_transactions=MIN_TRANSACTIONS,
                min_expenses=10  # Lower requirement for goals
            )

            if not sufficiency["sufficient"]:
                return {
                    "success": False,
                    "error": f"Insufficient transaction data for goals analysis: {sufficiency['reason']}",
                    "total_goals": len(goals),
                    "goals": [],
                    "data_info": sufficiency
                }

            # Get savings statistics once
            savings_stats = GoalService.calculate_savings_rate(user_id, months=6)

            analyzed_goals = []
            total_monthly_required = 0

            for goal in goals:
                target = float(goal.get('targetAmount', 0))
                current = float(goal.get('currentAmount', 0))

                # Calculate monthly contribution from target and deadline
                deadline = goal.get('deadline', None)
                monthly = 0
                if deadline:
                    try:
                        if isinstance(deadline, str):
                            deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
                        else:
                            deadline_date = deadline

                        months_to_deadline = (deadline_date.year - datetime.now().year) * 12 + \
                                           (deadline_date.month - datetime.now().month)

                        if months_to_deadline > 0:
                            remaining = target - current
                            monthly = remaining / months_to_deadline if remaining > 0 else 0
                    except Exception as e:
                        print(f"[WARNING] Error calculating monthly contribution: {e}")
                        monthly = 0

                # Predict achievement for this goal
                prediction = GoalService.predict_goal_achievement(
                    user_id=user_id,
                    target_amount=target,
                    current_amount=current,
                    monthly_contribution=monthly,
                    deadline=deadline if isinstance(deadline, str) else (deadline.strftime('%Y-%m-%d') if deadline else None)
                )

                analyzed_goals.append({
                    "goal_id": goal.get('_id'),
                    "goal_name": goal.get('title', 'Unnamed Goal'),
                    "target_amount": target,
                    "current_amount": current,
                    "monthly_contribution": monthly,
                    "deadline": deadline if isinstance(deadline, str) else (deadline.strftime('%Y-%m-%d') if deadline else None),
                    "prediction": prediction
                })

                total_monthly_required += monthly

            # Overall assessment
            avg_probability = np.mean([g["prediction"].get("achievement_probability", 0)
                                      for g in analyzed_goals])

            if total_monthly_required > savings_stats["avg_monthly_savings"]:
                overall = "overcommitted"
                message = "Total goal contributions exceed average savings capacity"
            elif avg_probability >= 70:
                overall = "on_track"
                message = "Goals are achievable with current trajectory"
            elif avg_probability >= 40:
                overall = "needs_adjustment"
                message = "Some goals may need timeline or contribution adjustments"
            else:
                overall = "challenging"
                message = "Current goals may be too ambitious - consider revising"

            return {
                "success": True,
                "total_goals": len(goals),
                "goals": analyzed_goals,
                "total_monthly_commitment": round(total_monthly_required, 2),
                "avg_monthly_savings": savings_stats["avg_monthly_savings"],
                "commitment_ratio": round(total_monthly_required / savings_stats["avg_monthly_savings"], 2)
                                   if savings_stats["avg_monthly_savings"] > 0 else 0,
                "overall_assessment": overall,
                "message": message
            }

        except Exception as e:
            print(f"[ERROR] Error analyzing goals: {e}")
            return {
                "success": False,
                "error": str(e),
                "total_goals": 0,
                "goals": []
            }
