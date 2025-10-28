# FinSight ML Service

AI/ML microservice for intelligent financial predictions and insights.

## Features

- **Spending Forecast**: Predict future expenses using Prophet time series model
- **Anomaly Detection**: Detect unusual spending patterns using Isolation Forest
- **Budget Recommendations**: AI-suggested optimal budget amounts
- **Goal Achievement Prediction**: Calculate probability of reaching financial goals
- **AI Insights**: Natural language financial advice using Google Gemini API (free)

## Setup

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)

### Installation

```bash
# Navigate to ml-service directory
cd ml-service

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your credentials
```

### Configuration

Create a `.env` file with:

```env
MONGODB_URI=your-mongodb-connection-string
GEMINI_API_KEY=your-gemini-api-key
BACKEND_URL=http://localhost:5000
```

#### Get Free Gemini API Key:

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key and paste it in `.env`

### Run the Service

```bash
# Make sure virtual environment is activated
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --port 8000
```

The ML service will be running at: `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```

### Spending Forecast
```
POST /api/ml/forecast
{
  "user_id": "string",
  "days": 30
}
```

### Anomaly Detection
```
POST /api/ml/anomaly-detection
{
  "user_id": "string"
}
```

### Budget Recommendations
```
POST /api/ml/budget-recommendations
{
  "user_id": "string"
}
```

### Goal Prediction
```
POST /api/ml/goal-prediction
{
  "user_id": "string",
  "goal_id": "string",
  "target_amount": 5000,
  "current_amount": 1000,
  "monthly_contribution": 200
}
```

### AI Insights
```
POST /api/ml/insights
{
  "user_id": "string",
  "context": "spending summary"
}
```

## Development

The service is built with:
- **FastAPI** - Modern Python web framework
- **Prophet** - Time series forecasting by Meta
- **Scikit-learn** - Machine learning library
- **Google Gemini** - Free LLM for insights

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`



