"""
AI Insights Service
Uses Google Gemini to generate personalized financial insights
"""

import os
import google.generativeai as genai
from typing import Dict, Any, List
from database.data_fetcher import DataFetcher
from services.forecast_service import ForecastService
from services.anomaly_service import AnomalyService
from services.budget_service import BudgetService
from services.goal_service import GoalService
from config.ml_config import INSIGHTS_MIN_DAYS, MIN_TRANSACTIONS


class InsightsService:
    """Generate AI-powered financial insights using Google Gemini"""

    def __init__(self):
        # Configure Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=api_key)
        # Try gemini-pro as fallback
        try:
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        except:
            self.model = genai.GenerativeModel('gemini-pro')

    def generate_comprehensive_insights(self, user_id: str) -> Dict[str, Any]:
        """
        Generate comprehensive financial insights using all ML models

        Args:
            user_id: User ID

        Returns:
            Dictionary with AI-generated insights
        """
        try:
            # Get ALL user transactions
            df = DataFetcher.get_user_transactions(user_id, use_all_data=True)

            # Check data sufficiency based on span, not recency
            sufficiency = DataFetcher.check_data_sufficiency(
                df,
                min_days=INSIGHTS_MIN_DAYS,
                min_transactions=MIN_TRANSACTIONS,
                min_expenses=10
            )

            if not sufficiency["sufficient"]:
                return {
                    "success": False,
                    "error": f"Insufficient data for insights: {sufficiency['reason']}",
                    "insights": [],
                    "data_info": sufficiency
                }

            # Gather all financial data and predictions
            context = self._gather_financial_context(user_id)

            if not context["has_data"]:
                return {
                    "success": False,
                    "error": "Insufficient financial data for insights",
                    "insights": []
                }

            # Try to use Gemini AI
            try:
                # Generate prompt for Gemini
                prompt = self._build_insights_prompt(context)

                # Call Gemini API
                response = self.model.generate_content(prompt)

                # Parse insights from response
                insights_text = response.text

                return {
                    "success": True,
                    "insights": insights_text,
                    "context_used": {
                        "spending_forecast": context.get("forecast_available", False),
                        "anomalies_detected": context.get("anomalies_count", 0),
                        "budgets_analyzed": context.get("budget_available", False),
                        "goals_analyzed": context.get("goals_count", 0)
                    }
                }

            except Exception as gemini_error:
                # Fallback to basic rule-based insights if Gemini fails
                print(f"[WARNING] Gemini AI unavailable ({gemini_error}), using basic insights")
                insights_text = self._generate_basic_insights(context)

                return {
                    "success": True,
                    "insights": insights_text,
                    "ai_unavailable": True,
                    "context_used": {
                        "spending_forecast": context.get("forecast_available", False),
                        "anomalies_detected": context.get("anomalies_count", 0),
                        "budgets_analyzed": context.get("budget_available", False),
                        "goals_analyzed": context.get("goals_count", 0)
                    }
                }

        except Exception as e:
            print(f"[ERROR] Error generating insights: {e}")
            return {
                "success": False,
                "error": str(e),
                "insights": ""
            }

    def generate_specific_insight(self, user_id: str, context_type: str, additional_context: str = "") -> Dict[str, Any]:
        """
        Generate insights for a specific financial aspect

        Args:
            user_id: User ID
            context_type: Type of insight (spending, saving, budgeting, goals)
            additional_context: Additional user-provided context

        Returns:
            Dictionary with targeted insights
        """
        try:
            # Gather relevant data based on context type
            if context_type == "spending":
                data = self._get_spending_context(user_id)
                focus = "spending patterns and recommendations for reducing expenses"
            elif context_type == "saving":
                data = self._get_saving_context(user_id)
                focus = "savings potential and strategies for increasing savings"
            elif context_type == "budgeting":
                data = self._get_budgeting_context(user_id)
                focus = "budget optimization and category-wise recommendations"
            elif context_type == "goals":
                data = self._get_goals_context(user_id)
                focus = "financial goals and strategies for achieving them"
            else:
                return {
                    "success": False,
                    "error": f"Unknown context type: {context_type}",
                    "insight": ""
                }

            # Build specific prompt
            prompt = f"""You are a professional financial advisor. Analyze the following financial data and provide actionable insights focused on {focus}.

Financial Data:
{data}

Additional Context: {additional_context if additional_context else "None provided"}

Provide:
1. Key observations (2-3 bullet points)
2. Specific recommendations (3-4 actionable items)
3. Potential risks or concerns to watch for

Keep the response concise, professional, and actionable."""

            # Call Gemini API
            response = self.model.generate_content(prompt)

            return {
                "success": True,
                "context_type": context_type,
                "insight": response.text
            }

        except Exception as e:
            print(f"[ERROR] Error generating specific insight: {e}")
            return {
                "success": False,
                "error": str(e),
                "insight": ""
            }

    def generate_quick_insight(self, user_id: str, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate quick insights from provided prompt and context

        Args:
            user_id: User ID
            prompt: Custom prompt for Gemini
            context: Financial context data

        Returns:
            Dictionary with AI-generated insight
        """
        try:
            # Call Gemini API with the provided prompt
            response = self.model.generate_content(prompt)

            return {
                "success": True,
                "insight": response.text,
                "context_used": context
            }

        except Exception as e:
            print(f"[ERROR] Error generating quick insight: {e}")
            return {
                "success": False,
                "error": str(e),
                "insight": ""
            }

    def _gather_financial_context(self, user_id: str) -> Dict[str, Any]:
        """Gather all relevant financial data for insight generation"""
        context = {"has_data": False}

        try:
            # Get financial summary
            summary = DataFetcher.get_financial_summary(user_id, days=30)
            if summary:
                context["financial_summary"] = summary
                context["has_data"] = True

            # Get spending forecast
            try:
                forecast = ForecastService.train_and_predict(user_id, forecast_days=30)
                if forecast["success"]:
                    context["forecast"] = forecast["statistics"]
                    context["forecast_available"] = True
            except Exception:
                context["forecast_available"] = False

            # Get anomalies
            try:
                anomalies = AnomalyService.detect_anomalies(user_id, days=90)
                if anomalies["success"]:
                    context["anomalies"] = anomalies["statistics"]
                    context["anomalies_count"] = anomalies["statistics"]["anomalies_detected"]
            except Exception:
                context["anomalies_count"] = 0

            # Get budget recommendations
            try:
                budgets = BudgetService.recommend_budgets(user_id, approach="balanced")
                if budgets["success"]:
                    context["budget_recommendations"] = budgets
                    context["budget_available"] = True
            except Exception:
                context["budget_available"] = False

            # Get goals analysis
            try:
                goals = GoalService.analyze_all_goals(user_id)
                if goals["success"]:
                    context["goals_analysis"] = goals
                    context["goals_count"] = goals["total_goals"]
            except Exception:
                context["goals_count"] = 0

            return context

        except Exception as e:
            print(f"[ERROR] Error gathering context: {e}")
            return {"has_data": False}

    def _build_insights_prompt(self, context: Dict[str, Any]) -> str:
        """Build comprehensive prompt for Gemini"""
        prompt_parts = [
            "You are a professional financial advisor analyzing a user's financial data. ",
            "Provide personalized, actionable insights based on the following information:\n\n"
        ]

        # Add financial summary
        if "financial_summary" in context:
            summary = context["financial_summary"]
            prompt_parts.append(f"**Last 30 Days Summary:**\n")
            prompt_parts.append(f"- Total Income: ${summary.get('total_income', 0):.2f}\n")
            prompt_parts.append(f"- Total Expenses: ${summary.get('total_expenses', 0):.2f}\n")
            prompt_parts.append(f"- Net Balance: ${summary.get('net_balance', 0):.2f}\n")
            prompt_parts.append(f"- Average Daily Spending: ${summary.get('avg_daily_spending', 0):.2f}\n\n")

        # Add forecast data
        if context.get("forecast_available"):
            forecast = context["forecast"]
            prompt_parts.append(f"**Spending Forecast (Next 30 Days):**\n")
            prompt_parts.append(f"- Predicted Average Daily: ${forecast.get('forecast_avg_daily', 0):.2f}\n")
            prompt_parts.append(f"- Trend: {forecast.get('trend_percentage', 0):+.1f}%\n\n")

        # Add anomaly data
        if context.get("anomalies_count", 0) > 0:
            anomalies = context["anomalies"]
            prompt_parts.append(f"**Anomalies Detected:**\n")
            prompt_parts.append(f"- Unusual transactions: {anomalies.get('anomalies_detected', 0)}\n")
            prompt_parts.append(f"- Total anomalous spending: ${anomalies.get('total_anomalous_spending', 0):.2f}\n\n")

        # Add budget recommendations
        if context.get("budget_available"):
            budgets = context["budget_recommendations"]
            prompt_parts.append(f"**Budget Analysis:**\n")
            prompt_parts.append(f"- Recommended Total Budget: ${budgets.get('total_recommended_budget', 0):.2f}\n")
            prompt_parts.append(f"- Number of categories: {len(budgets.get('recommendations', []))}\n\n")

        # Add goals analysis
        if context.get("goals_count", 0) > 0:
            goals = context["goals_analysis"]
            prompt_parts.append(f"**Financial Goals:**\n")
            prompt_parts.append(f"- Active goals: {goals.get('total_goals', 0)}\n")
            prompt_parts.append(f"- Total monthly commitment: ${goals.get('total_monthly_commitment', 0):.2f}\n")
            prompt_parts.append(f"- Assessment: {goals.get('overall_assessment', 'N/A')}\n\n")

        # Add instruction for response
        prompt_parts.append("\n**Please provide:**\n")
        prompt_parts.append("1. Overall Financial Health Assessment (1-2 sentences)\n")
        prompt_parts.append("2. Top 3 Insights (key observations about their finances)\n")
        prompt_parts.append("3. Top 3 Recommendations (specific, actionable advice)\n")
        prompt_parts.append("4. One Caution (potential risk or area to watch)\n\n")
        prompt_parts.append("Keep the tone professional yet friendly, and be specific with numbers where relevant.")

        return "".join(prompt_parts)

    def _get_spending_context(self, user_id: str) -> str:
        """Get spending-focused context"""
        summary = DataFetcher.get_financial_summary(user_id, days=30)
        category_spending = DataFetcher.get_spending_by_category(user_id, days=30)

        context = f"Total Expenses: ${summary.get('total_expenses', 0):.2f}\n"
        context += f"Average Daily Spending: ${summary.get('avg_daily_spending', 0):.2f}\n"
        context += f"\nSpending by Category:\n"
        for category, amount in sorted(category_spending.items(), key=lambda x: x[1], reverse=True):
            context += f"- {category}: ${amount:.2f}\n"

        return context

    def _get_saving_context(self, user_id: str) -> str:
        """Get savings-focused context"""
        savings = GoalService.calculate_savings_rate(user_id, months=6)

        context = f"Average Monthly Income: ${savings.get('avg_monthly_income', 0):.2f}\n"
        context += f"Average Monthly Expenses: ${savings.get('avg_monthly_expenses', 0):.2f}\n"
        context += f"Average Monthly Savings: ${savings.get('avg_monthly_savings', 0):.2f}\n"
        context += f"Savings Rate: {savings.get('savings_rate_percentage', 0):.1f}%\n"
        context += f"Consistency Score: {savings.get('consistency_score', 0):.1f}/100\n"

        return context

    def _get_budgeting_context(self, user_id: str) -> str:
        """Get budgeting-focused context"""
        budgets = BudgetService.recommend_budgets(user_id, approach="balanced")

        if not budgets["success"]:
            return "Insufficient data for budget analysis"

        context = f"Recommended Total Budget: ${budgets.get('total_recommended_budget', 0):.2f}\n"
        context += f"\nCategory Recommendations:\n"

        for rec in budgets.get("recommendations", [])[:10]:  # Top 10
            context += f"- {rec['category']}: ${rec['recommended_amount']:.2f} "
            context += f"(Current avg: ${rec['current_monthly_avg']:.2f}, Trend: {rec['trend']})\n"

        return context

    def _get_goals_context(self, user_id: str) -> str:
        """Get goals-focused context"""
        goals = GoalService.analyze_all_goals(user_id)

        if not goals["success"]:
            return "No active financial goals"

        context = f"Total Active Goals: {goals.get('total_goals', 0)}\n"
        context += f"Total Monthly Commitment: ${goals.get('total_monthly_commitment', 0):.2f}\n"
        context += f"Average Monthly Savings: ${goals.get('avg_monthly_savings', 0):.2f}\n"
        context += f"Overall Assessment: {goals.get('overall_assessment', 'N/A')}\n"
        context += f"\nGoals Summary:\n"

        for goal in goals.get("goals", []):
            pred = goal["prediction"]
            context += f"- {goal['goal_name']}: ${goal['current_amount']:.2f}/${goal['target_amount']:.2f} "
            context += f"({pred.get('achievement_probability', 0):.0f}% likely, {pred.get('status', 'unknown')})\n"

        return context

    def _generate_basic_insights(self, context: Dict[str, Any]) -> str:
        """Generate basic rule-based insights when Gemini is unavailable"""
        insights = []

        # Overall Financial Health
        insights.append("**Overall Financial Health Assessment:**")

        # Financial summary insights
        if "financial_summary" in context:
            summary = context["financial_summary"]
            net_balance = summary.get('net_balance', 0)
            total_income = summary.get('total_income', 0)
            total_expenses = summary.get('total_expenses', 0)

            if net_balance > 0:
                savings_rate = (net_balance / total_income * 100) if total_income > 0 else 0
                insights.append(f"You have a positive net balance of ${net_balance:.2f} over the last 30 days, with a savings rate of {savings_rate:.1f}%.")
            else:
                insights.append(f"Your expenses exceeded income by ${abs(net_balance):.2f} in the last 30 days. Consider reviewing your spending patterns.")

        insights.append("\n**Top 3 Insights:**")

        # Forecast insights
        if context.get("forecast_available"):
            forecast = context["forecast"]
            trend = forecast.get('trend_percentage', 0)
            forecast_avg = forecast.get('forecast_avg_daily', 0)
            historical_avg = forecast.get('historical_avg_daily', 0)

            if trend > 10:
                insights.append(f"1. Your spending is trending upward by {trend:.1f}%. Daily spending is projected to increase from ${historical_avg:.2f} to ${forecast_avg:.2f}.")
            elif trend < -10:
                insights.append(f"1. Great news! Your spending is trending downward by {abs(trend):.1f}%. You're reducing daily spending from ${historical_avg:.2f} to ${forecast_avg:.2f}.")
            else:
                insights.append(f"1. Your spending patterns are stable with minimal change ({trend:+.1f}%).")

        # Anomaly insights
        if context.get("anomalies_count", 0) > 0:
            anomalies = context["anomalies"]
            anomaly_count = anomalies.get('anomalies_detected', 0)
            anomalous_spending = anomalies.get('total_anomalous_spending', 0)
            insights.append(f"2. Detected {anomaly_count} unusual transactions totaling ${anomalous_spending:.2f}. Review these for unexpected charges or one-time expenses.")
        else:
            insights.append("2. No unusual spending patterns detected. Your transactions appear consistent with your typical behavior.")

        # Goals insights
        if context.get("goals_count", 0) > 0:
            goals = context["goals_analysis"]
            total_goals = goals.get("total_goals", 0)
            monthly_commitment = goals.get("total_monthly_commitment", 0)
            assessment = goals.get("overall_assessment", "")

            if assessment == "on_track":
                insights.append(f"3. Your {total_goals} financial goal(s) are on track with ${monthly_commitment:.2f}/month in commitments.")
            elif assessment == "overcommitted":
                insights.append(f"3. Your {total_goals} goals require ${monthly_commitment:.2f}/month, which may exceed your savings capacity. Consider adjusting timelines or contributions.")
            else:
                insights.append(f"3. You have {total_goals} active financial goal(s) that may need adjustment to improve achievability.")
        else:
            insights.append("3. Consider setting financial goals to track progress toward savings targets, vacations, or major purchases.")

        insights.append("\n**Top 3 Recommendations:**")

        # Budget recommendations
        if context.get("budget_available"):
            budgets = context["budget_recommendations"]
            total_budget = budgets.get("total_recommended_budget", 0)
            insights.append(f"1. Based on your spending patterns, a monthly budget of ${total_budget:.2f} is recommended. Review category-specific budgets to optimize spending.")
        else:
            insights.append("1. Start tracking expenses by category to receive personalized budget recommendations.")

        # Spending reduction recommendation
        if "financial_summary" in context:
            summary = context["financial_summary"]
            avg_daily = summary.get('avg_daily_spending', 0)
            if avg_daily > 0:
                potential_savings = avg_daily * 0.15 * 30  # 15% reduction potential
                insights.append(f"2. Reducing daily spending by 15% (${avg_daily * 0.15:.2f}/day) could save ${potential_savings:.2f}/month.")
            else:
                insights.append("2. Continue tracking transactions to identify spending reduction opportunities.")
        else:
            insights.append("2. Track your daily expenses consistently to identify areas where you can reduce spending.")

        # Goal or emergency fund recommendation
        if context.get("goals_count", 0) == 0:
            insights.append("3. Set up an emergency fund goal of 3-6 months of expenses as a financial safety net.")
        else:
            insights.append("3. Automate your savings by setting up automatic transfers on payday to stay consistent with your goals.")

        insights.append("\n**One Caution:**")

        # Warning about overcommitment or negative balance
        if context.get("goals_count", 0) > 0:
            goals = context["goals_analysis"]
            if goals.get("overall_assessment") == "overcommitted":
                insights.append("You're committed to more in monthly savings than your typical capacity. This may lead to missed goals or financial stress. Consider prioritizing your most important goals.")
        elif "financial_summary" in context and context["financial_summary"].get('net_balance', 0) < 0:
            deficit = abs(context["financial_summary"].get('net_balance', 0))
            insights.append(f"Your spending exceeded income by ${deficit:.2f} last month. If this continues, it could impact your financial stability. Focus on reducing discretionary expenses.")
        else:
            insights.append("Continue monitoring your spending patterns to catch any emerging issues early. Consistency is key to financial health.")

        return "\n".join(insights)


# Create singleton instance
insights_service = InsightsService()
