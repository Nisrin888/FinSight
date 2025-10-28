"""
Test script for all ML models
Run this to verify all ML endpoints are working
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
ML_SERVICE_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:5000"

# You'll need a valid user ID from your database
# Get this by logging into your app and checking the MongoDB users collection
TEST_USER_ID = "YOUR_USER_ID_HERE"  # Replace with actual user ID

def print_section(title):
    """Print a section header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def test_ml_health():
    """Test ML service health"""
    print_section("1. ML Service Health Check")
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_spending_forecast():
    """Test spending forecast"""
    print_section("2. Spending Forecast (Prophet Model)")
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/forecast",
            json={"user_id": TEST_USER_ID, "days": 30}
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()

        if data.get("status") == "success" and data.get("data", {}).get("success"):
            stats = data["data"]["statistics"]
            forecast_count = len(data["data"]["forecast"])
            print(f"✓ SUCCESS!")
            print(f"  - Historical avg: ${stats['historical_avg_daily']:.2f}/day")
            print(f"  - Forecast avg: ${stats['forecast_avg_daily']:.2f}/day")
            print(f"  - Trend: {stats['trend_percentage']:+.1f}%")
            print(f"  - Forecast data points: {forecast_count}")
            return True
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_category_forecast():
    """Test category forecast"""
    print_section("3. Category Forecast")
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/forecast/category",
            json={"user_id": TEST_USER_ID, "days": 30}
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()

        if data.get("status") == "success" and data.get("data", {}).get("success"):
            forecasts = data["data"]["forecasts"]
            print(f"✓ SUCCESS!")
            print(f"  - Categories analyzed: {len(forecasts)}")
            for category, forecast_data in list(forecasts.items())[:5]:
                print(f"  - {category}: ${forecast_data['predicted_total']:.2f} predicted")
            return True
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_anomaly_detection():
    """Test anomaly detection"""
    print_section("4. Anomaly Detection (Isolation Forest)")
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/anomaly-detection",
            json={"user_id": TEST_USER_ID}
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()

        if data.get("status") == "success" and data.get("data", {}).get("success"):
            stats = data["data"]["statistics"]
            anomalies = data["data"]["anomalies"]
            print(f"✓ SUCCESS!")
            print(f"  - Total transactions: {stats['total_transactions']}")
            print(f"  - Anomalies detected: {stats['anomalies_detected']}")
            print(f"  - Anomaly rate: {stats['anomaly_percentage']:.1f}%")
            if anomalies:
                print(f"  - First anomaly: ${anomalies[0]['amount']:.2f} ({anomalies[0]['severity']})")
            return True
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_budget_recommendations():
    """Test budget recommendations"""
    print_section("5. Budget Recommendations")
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/budget-recommendations",
            json={"user_id": TEST_USER_ID, "approach": "balanced"}
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()

        if data.get("status") == "success" and data.get("data", {}).get("success"):
            total = data["data"]["total_recommended_budget"]
            recs = data["data"]["recommendations"]
            print(f"✓ SUCCESS!")
            print(f"  - Recommended total budget: ${total:.2f}/month")
            print(f"  - Categories: {len(recs)}")
            for rec in recs[:5]:
                print(f"  - {rec['category']}: ${rec['recommended_amount']:.2f} ({rec['priority']} priority)")
            return True
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_goal_prediction():
    """Test goal prediction"""
    print_section("6. Goal Achievement Prediction")
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/goal-prediction",
            json={
                "user_id": TEST_USER_ID,
                "target_amount": 10000,
                "current_amount": 2000,
                "monthly_contribution": 500,
                "deadline": (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
            }
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()

        if data.get("status") == "success" and data.get("data", {}).get("success"):
            pred = data["data"]
            print(f"✓ SUCCESS!")
            print(f"  - Achievement probability: {pred['achievement_probability']:.1f}%")
            print(f"  - Status: {pred['status']}")
            print(f"  - Months required: {pred['months_required']:.1f}")
            print(f"  - Est. completion: {pred['estimated_completion_date']}")
            return True
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_goals_analysis():
    """Test all goals analysis"""
    print_section("7. All Goals Analysis")
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/goals/analyze-all",
            json={"user_id": TEST_USER_ID}
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()

        if data.get("status") == "success" and data.get("data", {}).get("success"):
            analysis = data["data"]
            print(f"✓ SUCCESS!")
            print(f"  - Total goals: {analysis['total_goals']}")
            print(f"  - Monthly commitment: ${analysis.get('total_monthly_commitment', 0):.2f}")
            print(f"  - Assessment: {analysis.get('overall_assessment', 'N/A')}")
            return True
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_ai_insights():
    """Test AI insights (Gemini)"""
    print_section("8. AI Insights (Google Gemini)")
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/insights",
            json={"user_id": TEST_USER_ID},
            timeout=30  # Gemini can take longer
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()

        if data.get("status") == "success" and data.get("data", {}).get("success"):
            insights = data["data"]["insights"]
            context = data["data"]["context_used"]
            print(f"✓ SUCCESS!")
            print(f"  - Context used:")
            print(f"    - Forecast: {context.get('spending_forecast', False)}")
            print(f"    - Anomalies: {context.get('anomalies_detected', 0)}")
            print(f"    - Budgets: {context.get('budgets_analyzed', False)}")
            print(f"    - Goals: {context.get('goals_analyzed', 0)}")
            print(f"\n  AI Insights Preview:")
            print(f"  {insights[:200]}...")
            return True
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "🤖 FinSight ML Models Test Suite".center(60))
    print(f"ML Service: {ML_SERVICE_URL}")
    print(f"Test User ID: {TEST_USER_ID}")

    if TEST_USER_ID == "YOUR_USER_ID_HERE":
        print("\n⚠️  WARNING: Please update TEST_USER_ID with a real user ID from your database!")
        print("   You can find this in MongoDB users collection or by logging into the app.\n")
        return

    results = {
        "Health Check": test_ml_health(),
        "Spending Forecast": test_spending_forecast(),
        "Category Forecast": test_category_forecast(),
        "Anomaly Detection": test_anomaly_detection(),
        "Budget Recommendations": test_budget_recommendations(),
        "Goal Prediction": test_goal_prediction(),
        "Goals Analysis": test_goals_analysis(),
        "AI Insights": test_ai_insights(),
    }

    # Summary
    print_section("TEST SUMMARY")
    passed = sum(results.values())
    total = len(results)

    for test, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {test}")

    print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.1f}%)")

    if passed == total:
        print("\n🎉 All ML models are working correctly!")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")

if __name__ == "__main__":
    run_all_tests()
