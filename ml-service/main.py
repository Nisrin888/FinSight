"""
FinSight ML Service
FastAPI microservice for AI/ML predictions and insights
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import numpy as np
from bson import ObjectId
from dotenv import load_dotenv
from database.data_fetcher import DataFetcher
from services.forecast_service import ForecastService
from services.anomaly_service import AnomalyService
from services.budget_service import BudgetService
from services.goal_service import GoalService
from services.insights_service import insights_service

# Load environment variables
load_dotenv()

# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000,http://localhost:3000").split(",")

# Log configuration on startup
print(f"[CONFIG] Allowed CORS origins: {ALLOWED_ORIGINS}")
print(f"[CONFIG] MongoDB URI configured: {'Yes' if os.getenv('MONGODB_URI') else 'No'}")
print(f"[CONFIG] Gemini API Key configured: {'Yes' if os.getenv('GEMINI_API_KEY') else 'No'}")

# Custom JSON encoder for MongoDB ObjectId and NumPy types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64)):
            return int(obj)
        if isinstance(obj, (np.uint8, np.uint16, np.uint32, np.uint64)):
            return int(obj)
        if isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)
        return super().default(obj)

# Helper function to convert response data
def clean_response(data):
    """Recursively convert MongoDB and NumPy types to JSON-serializable types"""
    if isinstance(data, dict):
        return {key: clean_response(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_response(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, np.bool_):
        return bool(data)
    elif isinstance(data, (np.integer, np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64, np.uint8, np.uint16, np.uint32, np.uint64)):
        return int(data)
    elif isinstance(data, (np.floating, np.float_, np.float16, np.float32, np.float64)):
        return float(data)
    elif isinstance(data, np.ndarray):
        return data.tolist()
    else:
        return data

# Initialize FastAPI app
app = FastAPI(
    title="FinSight ML Service",
    description="AI/ML predictions and insights for personal finance",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "FinSight ML Service is running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    from database.connection import db
    db_connected = db is not None
    return {
        "status": "healthy" if db_connected else "degraded",
        "service": "ml-service",
        "database_connected": db_connected,
        "features": [
            "spending_forecast",
            "anomaly_detection",
            "budget_recommendations",
            "goal_prediction",
            "ai_insights"
        ]
    }

# Pydantic models for request/response
class TransactionData(BaseModel):
    user_id: str
    transactions: List[Dict[str, Any]]

class ForecastRequest(BaseModel):
    user_id: str
    days: int = 30

class AnomalyDetectionRequest(BaseModel):
    user_id: str

class BudgetRecommendationRequest(BaseModel):
    user_id: str
    approach: Optional[str] = "balanced"  # conservative, balanced, or flexible

class BudgetOptimizationRequest(BaseModel):
    user_id: str
    total_budget: float

class GoalPredictionRequest(BaseModel):
    user_id: str
    target_amount: float
    current_amount: float
    monthly_contribution: float
    deadline: Optional[str] = None  # YYYY-MM-DD format

class AllGoalsAnalysisRequest(BaseModel):
    user_id: str

class InsightRequest(BaseModel):
    user_id: str

class SpecificInsightRequest(BaseModel):
    user_id: str
    context_type: str  # spending, saving, budgeting, or goals
    additional_context: Optional[str] = ""

class QuickInsightRequest(BaseModel):
    user_id: str
    prompt: str
    context: Dict[str, Any]

# ML Endpoints
@app.post("/api/ml/forecast")
async def predict_spending(request: ForecastRequest):
    """Predict future spending using Prophet"""
    try:
        result = ForecastService.train_and_predict(
            user_id=request.user_id,
            forecast_days=request.days
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Forecast failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

@app.post("/api/ml/forecast/category")
async def predict_spending_by_category(request: ForecastRequest):
    """Predict future spending by category"""
    try:
        result = ForecastService.get_category_forecast(
            user_id=request.user_id,
            forecast_days=request.days
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Category forecast failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category forecast error: {str(e)}")

@app.post("/api/ml/anomaly-detection")
async def detect_anomalies(request: AnomalyDetectionRequest):
    """Detect unusual spending patterns using Isolation Forest"""
    try:
        result = AnomalyService.detect_anomalies(
            user_id=request.user_id,
            days=90,  # Analyze last 90 days
            contamination=0.1  # Expect 10% anomalies
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Anomaly detection failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection error: {str(e)}")

@app.post("/api/ml/anomaly-detection/category")
async def detect_category_anomalies(request: AnomalyDetectionRequest):
    """Detect anomalies by spending category"""
    try:
        result = AnomalyService.get_category_anomalies(
            user_id=request.user_id,
            days=90
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Category anomaly detection failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category anomaly detection error: {str(e)}")

@app.post("/api/ml/budget-recommendations")
async def recommend_budgets(request: BudgetRecommendationRequest):
    """Generate intelligent budget recommendations based on spending analysis"""
    try:
        result = BudgetService.recommend_budgets(
            user_id=request.user_id,
            approach=request.approach
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Budget recommendation failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget recommendation error: {str(e)}")

@app.post("/api/ml/budget-optimization")
async def optimize_budget(request: BudgetOptimizationRequest):
    """Optimize budget allocation for a fixed total budget"""
    try:
        result = BudgetService.optimize_budget_allocation(
            user_id=request.user_id,
            total_budget=request.total_budget
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Budget optimization failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget optimization error: {str(e)}")

@app.post("/api/ml/goal-prediction")
async def predict_goal_achievement(request: GoalPredictionRequest):
    """Predict goal achievement probability and timeline"""
    try:
        result = GoalService.predict_goal_achievement(
            user_id=request.user_id,
            target_amount=request.target_amount,
            current_amount=request.current_amount,
            monthly_contribution=request.monthly_contribution,
            deadline=request.deadline
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Goal prediction failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Goal prediction error: {str(e)}")

@app.post("/api/ml/goals/analyze-all")
async def analyze_all_goals(request: AllGoalsAnalysisRequest):
    """Analyze all user goals comprehensively"""
    try:
        result = GoalService.analyze_all_goals(user_id=request.user_id)

        # Return the result even if success is False (e.g., insufficient data but user has goals)
        # This allows frontend to show appropriate message based on total_goals count
        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Goals analysis error: {str(e)}")

@app.post("/api/ml/insights")
async def generate_insights(request: InsightRequest):
    """Generate comprehensive AI-powered financial insights using Gemini"""
    try:
        result = insights_service.generate_comprehensive_insights(user_id=request.user_id)

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Insights generation failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights generation error: {str(e)}")

@app.post("/api/ml/insights/specific")
async def generate_specific_insights(request: SpecificInsightRequest):
    """Generate targeted insights for specific financial aspects"""
    try:
        result = insights_service.generate_specific_insight(
            user_id=request.user_id,
            context_type=request.context_type,
            additional_context=request.additional_context
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Specific insight generation failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Specific insight generation error: {str(e)}")

@app.post("/api/ml/insights/quick")
async def generate_quick_insights(request: QuickInsightRequest):
    """Generate quick AI insights from provided context and prompt"""
    try:
        result = insights_service.generate_quick_insight(
            user_id=request.user_id,
            prompt=request.prompt,
            context=request.context
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Quick insight generation failed"))

        return {
            "status": "success",
            "user_id": request.user_id,
            "data": clean_response(result)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick insight generation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
