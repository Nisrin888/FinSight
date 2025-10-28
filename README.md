# FinSight - AI-Powered Personal Finance Tracker

> Track smarter. Spend better.

FinSight is a modern, full-stack personal finance tracking application that combines intelligent expense tracking, real-time analytics, and goal-driven budgeting in a sleek, professional interface.

## Overview

FinSight provides users with comprehensive financial management tools including transaction tracking, budget management, financial goal setting, and detailed analytics. Built with modern web technologies and designed with user experience in mind, FinSight helps users take control of their financial future.

## Features

### Authentication & Security
- Secure user registration and login with JWT authentication
- OAuth 2.0 integration with Google Sign-In
- Password reset functionality with email verification
- Protected routes and session management
- Account security with rate limiting and encryption

### Financial Management
- **Transaction Tracking**: Create, edit, and delete income/expense transactions
- **Account Management**: Multiple account support (Bank, Cash, Credit Card, Investment)
- **Category Organization**: Customizable transaction categories with icons
- **Budget Planning**: Set and monitor budgets by category with progress tracking
- **Goal Setting**: Create financial goals with milestone tracking

### Analytics & Insights
- **Dashboard Overview**: Real-time financial summary and key metrics
- **Spending Analysis**: Category-wise spending breakdowns and trends
- **Income vs Expense Charts**: Visual representation of financial flow
- **Budget Performance**: Track budget utilization and overspending alerts
- **Goal Progress**: Monitor progress towards financial objectives

### AI & Machine Learning (NEW)
- **AI Financial Insights**: Powered by Google Gemini AI for personalized financial advice
- **Spending Forecasts**: Predict future spending patterns using Prophet time series models
- **Anomaly Detection**: Automatically detect unusual transactions and spending patterns
- **Smart Budget Recommendations**: AI-generated budget suggestions based on spending history
- **Goal Achievement Predictions**: Calculate probability of reaching financial goals
- **Comprehensive Analysis**: Multi-tab AI insights dashboard with real-time predictions
- **Intelligent Caching**: Smart caching system for faster ML predictions

### User Experience
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Dark Mode Interface**: Modern dark theme with professional aesthetics
- **Multi-Currency Support**: Support for major global currencies (USD, EUR, GBP, INR, etc.)
- **Profile Management**: Customizable user profiles with profile picture upload
- **Data Export**: Export financial data in JSON format
- **Notification Preferences**: Customizable alert settings

## Technology Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **Vite** - Next-generation build tool for faster development
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing
- **Recharts** - Composable charting library
- **Framer Motion** - Production-ready animation library
- **Axios** - Promise-based HTTP client
- **React Hot Toast** - Beautiful notifications

### Backend
- **Node.js + Express** - Server-side JavaScript runtime and framework
- **MongoDB + Mongoose** - NoSQL database with ODM
- **JWT** - JSON Web Tokens for secure authentication
- **Bcrypt** - Password hashing and security
- **Passport.js** - Authentication middleware for OAuth
- **Multer** - File upload handling for profile pictures
- **Helmet** - Security headers middleware
- **Express Rate Limit** - API rate limiting protection
- **Morgan** - HTTP request logging
- **Compression** - Response compression middleware

### ML Service (NEW)
- **Python + FastAPI** - High-performance ML microservice
- **Prophet** - Facebook's time series forecasting library
- **Scikit-learn** - Machine learning algorithms (Isolation Forest for anomaly detection)
- **Pandas & NumPy** - Data processing and numerical computations
- **Google Gemini AI** - Free LLM for generating personalized financial insights
- **Uvicorn** - Lightning-fast ASGI server

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Python >= 3.9.0 (for ML service)
- MongoDB Atlas account or local MongoDB instance
- Google Gemini API Key (free from Google AI Studio)
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Configure environment variables in .env
# Required: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET

# Start development server
npm run dev
```

The backend API will be running at `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (optional)
# VITE_API_URL=http://localhost:5000

# Start development server
npm run dev
```

The frontend application will be running at `http://localhost:3000`

### ML Service Setup (NEW)

```bash
# Navigate to ML service directory
cd ml-service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Add: GEMINI_API_KEY=your-gemini-api-key
# Add: MONGODB_URI=your-mongodb-connection-string

# Start ML service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The ML service API will be running at `http://localhost:8000`

**Note**: The backend expects the ML service to be running on port 8000. Make sure all three services (backend, frontend, ML) are running for full functionality.

## Project Structure

```
Finsight/
├── backend/                  # Node.js + Express API
│   ├── config/              # Configuration files (database, passport)
│   ├── controllers/         # Route controllers
│   │   ├── insights.controller.js  # Financial insights
│   │   └── ml.controller.js        # ML service proxy (NEW)
│   ├── middleware/          # Custom middleware (auth, upload, rate limiting)
│   ├── models/              # Mongoose data models
│   │   └── aiInsight.model.js      # AI insights cache (NEW)
│   ├── routes/              # API route definitions
│   │   ├── insight.routes.js       # Insights endpoints
│   │   └── ml.routes.js            # ML endpoints (NEW)
│   ├── scripts/             # Utility scripts (NEW)
│   │   └── seedDemoData.js         # Seed demo financial data
│   ├── uploads/             # User uploaded files (profile pictures)
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   └── server.js            # Application entry point
│
├── frontend/                # React application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── charts/    # Chart components
│   │   │   ├── layout/    # Layout components
│   │   │   └── ui/        # UI primitives
│   │   ├── context/        # React Context (NEW)
│   │   │   └── InsightsContext.jsx # AI insights state management
│   │   ├── pages/         # Page components
│   │   │   ├── AIInsights.jsx      # AI insights dashboard (NEW)
│   │   │   └── Insights.jsx        # Basic insights page
│   │   ├── styles/         # Component-specific styles (NEW)
│   │   │   └── AIInsights.css      # AI insights styling
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── store/         # Zustand state management
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Root component
│   │   ├── main.jsx       # Application entry point
│   │   └── index.css      # Global styles and theme
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js  # TailwindCSS configuration
│   └── vite.config.js      # Vite build configuration
│
├── ml-service/              # Python ML Microservice (NEW)
│   ├── config/              # ML configuration
│   │   ├── __init__.py
│   │   └── ml_config.py    # Model parameters and thresholds
│   ├── database/            # Database utilities
│   │   ├── __init__.py
│   │   └── data_fetcher.py # MongoDB data fetching
│   ├── services/            # ML services
│   │   ├── __init__.py
│   │   ├── forecast_service.py    # Prophet time series forecasting
│   │   ├── anomaly_service.py     # Isolation Forest anomaly detection
│   │   ├── budget_service.py      # Budget recommendations
│   │   ├── goal_service.py        # Goal achievement predictions
│   │   └── insights_service.py    # Gemini AI insights generation
│   ├── venv/                # Python virtual environment
│   ├── .env                 # Environment variables (not in git)
│   ├── main.py              # FastAPI application entry point
│   ├── requirements.txt     # Python dependencies
│   └── README.md            # ML service documentation
│
├── test-ml.html             # ML service testing tool (NEW)
├── .gitignore
└── README.md
```

## Environment Variables

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=your-mongodb-connection-string

# JWT Authentication
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# ML Service URL (NEW)
ML_SERVICE_URL=http://localhost:8000
```

### ML Service (.env)

```env
# MongoDB Connection (same as backend)
MONGODB_URI=your-mongodb-connection-string

# Google Gemini API (Free from Google AI Studio)
GEMINI_API_KEY=your-gemini-api-key

# Service Configuration
PORT=8000
```

Refer to `backend/.env.example` for complete configuration options.

## API Documentation




### Authentication Endpoints

```http
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # User login
POST   /api/auth/logout                # User logout
GET    /api/auth/me                    # Get current user
POST   /api/auth/forgot-password       # Request password reset
POST   /api/auth/reset-password/:token # Reset password
PUT    /api/auth/update-password       # Update password
PUT    /api/auth/profile               # Update user profile
PUT    /api/auth/notifications         # Update notification preferences
GET    /api/auth/export-data           # Export user data
DELETE /api/auth/account               # Delete account
POST   /api/auth/profile-picture       # Upload profile picture
DELETE /api/auth/profile-picture       # Delete profile picture
GET    /api/auth/google                # Google OAuth login
GET    /api/auth/google/callback       # Google OAuth callback
```

### Category Endpoints

```http
GET    /api/categories                 # Get all categories
POST   /api/categories                 # Create category
PUT    /api/categories/:id             # Update category
DELETE /api/categories/:id             # Delete category
```

### Account Endpoints

```http
GET    /api/accounts                   # Get all accounts
POST   /api/accounts                   # Create account
GET    /api/accounts/:id               # Get single account
PUT    /api/accounts/:id               # Update account
DELETE /api/accounts/:id               # Delete account
```

### Transaction Endpoints

```http
GET    /api/transactions               # Get all transactions (with filters)
POST   /api/transactions               # Create transaction
GET    /api/transactions/:id           # Get single transaction
PUT    /api/transactions/:id           # Update transaction
DELETE /api/transactions/:id           # Delete transaction
```

### Budget Endpoints

```http
GET    /api/budgets                    # Get all budgets
POST   /api/budgets                    # Create budget
GET    /api/budgets/:id                # Get single budget
PUT    /api/budgets/:id                # Update budget
DELETE /api/budgets/:id                # Delete budget
GET    /api/budgets/overview           # Get budget overview
```

### Goal Endpoints

```http
GET    /api/goals                      # Get all goals
POST   /api/goals                      # Create goal
GET    /api/goals/:id                  # Get single goal
PUT    /api/goals/:id                  # Update goal
DELETE /api/goals/:id                  # Delete goal
POST   /api/goals/:id/contribute       # Add contribution
```

### Dashboard Endpoints

```http
GET    /api/dashboard                  # Get dashboard data
GET    /api/insights                   # Get financial insights
```

### ML & AI Endpoints (NEW)

```http
# Forecasting
POST   /api/ml/forecast                # Get spending forecast (30 days)
POST   /api/ml/forecast/category       # Category-wise spending forecast

# Anomaly Detection
POST   /api/ml/anomalies               # Detect unusual transactions
POST   /api/ml/anomalies/category      # Category-wise anomaly detection

# Budget Recommendations
POST   /api/ml/budget/recommendations  # Get AI budget recommendations
POST   /api/ml/budget/optimize         # Optimize budget allocation

# Goal Analysis
POST   /api/ml/goals/predict           # Predict single goal achievement
POST   /api/ml/goals/analyze           # Analyze all user goals

# AI Insights
POST   /api/ml/insights                # Get comprehensive AI insights
POST   /api/ml/insights/specific       # Get context-specific insights

# Service Health
GET    /api/ml/health                  # Check ML service status
```

## Development Roadmap

### Phase 1: Project Setup & Foundation - COMPLETE
- [x] Backend initialization (Node.js + Express + MongoDB)
- [x] Frontend initialization (React + Vite + TailwindCSS)
- [x] Base API routes configured
- [x] Middleware setup (auth, error handling, rate limiting)
- [x] Design system implementation

### Phase 2: Authentication & User Management - COMPLETE
- [x] User registration and login
- [x] JWT token management
- [x] Password reset flow
- [x] OAuth 2.0 Google integration
- [x] User profile management
- [x] Protected routes
- [x] Profile picture upload

### Phase 3: Core Financial Features - COMPLETE
- [x] Category management with icons
- [x] Account management (multiple account types)
- [x] Transaction CRUD operations
- [x] Budget tracking and management
- [x] Data validation and error handling
- [x] Search and filtering

### Phase 4: Dashboard & Analytics - COMPLETE
- [x] Dashboard with real-time metrics
- [x] Income vs expense charts
- [x] Category spending breakdown
- [x] Budget progress visualization
- [x] Financial goal tracking
- [x] Insights and alerts
- [x] Data export functionality

### Phase 5: ML/AI Integration - COMPLETE ✅
- [x] ML microservice setup (Python + FastAPI)
- [x] Time series forecasting (Prophet)
- [x] Spending prediction models with 30-day forecasts
- [x] Anomaly detection (Isolation Forest algorithm)
- [x] AI-powered insights generation (Google Gemini)
- [x] Smart budget recommendations
- [x] Goal achievement predictions
- [x] Centralized ML configuration with minimum data requirements
- [x] Comprehensive AI Insights dashboard with 5 tabs
- [x] Intelligent caching system for ML predictions
- [x] Demo data seeding script for testing
- [x] Mobile-responsive AI insights interface

### Phase 6: Enhanced Features - PLANNED
- [ ] Email notifications
- [ ] Recurring transaction support
- [ ] Receipt image upload
- [ ] Multi-user household support
- [ ] Investment portfolio tracking
- [ ] Tax reporting tools

### Phase 7: Testing & Deployment - PLANNED
- [ ] Unit testing (Jest)
- [ ] Integration testing
- [ ] E2E testing (Cypress)
- [ ] Performance optimization
- [ ] Security audit
- [ ] CI/CD pipeline setup
- [ ] Production deployment

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (10 salt rounds)
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Protected file uploads with type and size restrictions
- Secure session management
- Account lockout after failed login attempts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

This project is currently in active development. Contributions, issues, and feature requests are welcome.

## Team

Built and maintained by the FinSight Team.

## License

Copyright (c) 2025 FinSight™. All rights reserved.

This project is proprietary software. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit permission from FinSight™.

## Key Features Implemented

### AI Insights Dashboard
The AI Insights page provides comprehensive machine learning-powered analysis across 5 key areas:

1. **Overview Tab**: Personalized financial health assessment with AI-generated recommendations
2. **Forecast Tab**: 30-day spending predictions using Prophet time series models
3. **Anomalies Tab**: Automatic detection of unusual transactions and spending patterns
4. **Budget Tab**: AI-recommended budgets based on historical spending patterns
5. **Goals Tab**: Achievement probability predictions and timeline analysis for financial goals

### Minimum Data Requirements
To ensure accurate predictions, the ML models require:
- **30 days** of transaction history
- **30 transactions** minimum (20 for budget recommendations)
- Users with insufficient data receive helpful guidance messages

### Demo Data
Use the seeding script to generate realistic demo data for testing:
```bash
cd backend
node scripts/seedDemoData.js <your-user-id>
```
Generates 60 days of transactions across 10+ categories with realistic patterns.

---

**Current Status**: Phase 5 Complete ✅ | Phase 6 (Enhanced Features) In Planning

**Last Updated**: October 2025
