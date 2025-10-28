import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Target,
  DollarSign,
  Brain,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useInsights } from '../context/InsightsContext';
import MainLayout from '../components/layout/MainLayout';
import '../styles/AIInsights.css';

const AIInsights = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Get insights from context
  const {
    insights,
    forecast,
    anomalies,
    budgetRec,
    goalsAnalysis,
    loading,
    lastFetched,
    fetchAllInsights,
    refreshInsights
  } = useInsights();

  // Fetch insights on mount if not already loaded
  useEffect(() => {
    fetchAllInsights();
  }, [fetchAllInsights]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshInsights();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="ai-insights-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing your financial data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="ai-insights-container">
      <div className="insights-header">
        <div className="header-content">
          <Brain className="header-icon" />
          <div>
            <h1>AI Financial Insights</h1>
            <p>Powered by machine learning and AI analysis</p>
          </div>
        </div>
        <button
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="insights-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Brain size={18} />
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          <TrendingUp size={18} />
          Forecast
        </button>
        <button
          className={`tab ${activeTab === 'anomalies' ? 'active' : ''}`}
          onClick={() => setActiveTab('anomalies')}
        >
          <AlertTriangle size={18} />
          Anomalies
        </button>
        <button
          className={`tab ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <DollarSign size={18} />
          Budget
        </button>
        <button
          className={`tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <Target size={18} />
          Goals
        </button>
      </div>

      <div className="insights-content">
        {activeTab === 'overview' && <OverviewTab insights={insights} />}
        {activeTab === 'forecast' && <ForecastTab forecast={forecast} />}
        {activeTab === 'anomalies' && <AnomaliesTab anomalies={anomalies} />}
        {activeTab === 'budget' && <BudgetTab budgetRec={budgetRec} />}
        {activeTab === 'goals' && <GoalsTab goalsAnalysis={goalsAnalysis} />}
      </div>
    </div>
    </MainLayout>
  );
};

// Overview Tab Component
const OverviewTab = ({ insights }) => {
  if (!insights || !insights.success || !insights.insights) {
    return (
      <div className="empty-state">
        <Brain size={48} />
        <p>Not enough data to generate insights yet</p>
        <p className="hint">Start tracking transactions to unlock AI insights</p>
        {insights?.message && <p className="hint">{insights.message}</p>}
      </div>
    );
  }

  // Parse insights into sections
  const parseInsights = (text) => {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Check if it's a header (contains **text** or ends with :)
      if (trimmedLine.includes('**') || trimmedLine.endsWith(':')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: trimmedLine.replace(/\*\*/g, '').replace(/:$/, ''),
          points: [],
          type: 'section'
        };
      } else if (currentSection) {
        // It's a point under the current section
        currentSection.points.push(trimmedLine);
      } else {
        // It's a standalone line
        sections.push({ type: 'text', content: trimmedLine });
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  };

  const sections = parseInsights(insights.insights);

  // Icon mapping for different section titles
  const getSectionIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('health') || lowerTitle.includes('overall')) return <CheckCircle size={20} />;
    if (lowerTitle.includes('spend') || lowerTitle.includes('expense')) return <DollarSign size={20} />;
    if (lowerTitle.includes('forecast') || lowerTitle.includes('prediction')) return <TrendingUp size={20} />;
    if (lowerTitle.includes('anomal') || lowerTitle.includes('unusual')) return <AlertTriangle size={20} />;
    if (lowerTitle.includes('budget')) return <Target size={20} />;
    if (lowerTitle.includes('goal')) return <Target size={20} />;
    if (lowerTitle.includes('recommend') || lowerTitle.includes('suggest')) return <Brain size={20} />;
    return <CheckCircle size={20} />;
  };

  return (
    <div className="overview-tab">
      <div className="ai-advisor-header">
        <div className="advisor-icon-wrapper">
          <Brain size={32} />
        </div>
        <div>
          <h2>AI Financial Advisor</h2>
          <p className="advisor-subtitle">Personalized insights powered by machine learning</p>
        </div>
      </div>

      <div className="insights-sections">
        {sections.map((section, index) => (
          section.type === 'section' ? (
            <div key={index} className="insight-section-card">
              <div className="section-header">
                {getSectionIcon(section.title)}
                <h4>{section.title}</h4>
              </div>
              <div className="section-points">
                {section.points.map((point, pIndex) => (
                  <div key={pIndex} className="insight-point">
                    <span className="point-dot"></span>
                    <p>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key={index} className="insight-text-block">
              <p>{section.content}</p>
            </div>
          )
        ))}
      </div>

      <div className="insights-meta-enhanced">
        <div className="meta-header">
          <Brain size={16} />
          <span>Analysis Based On</span>
        </div>
        <div className="meta-badges">
          {insights.context_used.spending_forecast && (
            <div className="meta-badge">
              <TrendingUp size={14} />
              <span>Spending Forecast</span>
            </div>
          )}
          {insights.context_used.anomalies_detected > 0 && (
            <div className="meta-badge alert">
              <AlertTriangle size={14} />
              <span>{insights.context_used.anomalies_detected} Anomalies</span>
            </div>
          )}
          {insights.context_used.budgets_analyzed && (
            <div className="meta-badge">
              <DollarSign size={14} />
              <span>Budget Analysis</span>
            </div>
          )}
          {insights.context_used.goals_analyzed > 0 && (
            <div className="meta-badge success">
              <Target size={14} />
              <span>{insights.context_used.goals_analyzed} Active Goals</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Forecast Tab Component
const ForecastTab = ({ forecast }) => {
  if (!forecast || !forecast.success || !forecast.statistics || !forecast.forecast) {
    return (
      <div className="empty-state">
        <TrendingUp size={48} />
        <p>Not enough transaction history for forecasting</p>
        <p className="hint">Minimum 30 days of transaction data required for accurate predictions</p>
        {forecast?.message && <p className="hint">{forecast.message}</p>}
      </div>
    );
  }

  const stats = forecast.statistics;
  const trendIcon = stats.trend_percentage > 0 ? <TrendingUp /> : <TrendingDown />;
  const trendClass = stats.trend_percentage > 0 ? 'trend-up' : 'trend-down';

  return (
    <div className="forecast-tab">
      <div className="forecast-stats">
        <div className="stat-card">
          <h4>Historical Average</h4>
          <p className="stat-value">${stats.historical_avg_daily.toFixed(2)}/day</p>
          <span className="stat-label">Last {stats.data_points_used} days</span>
        </div>
        <div className="stat-card">
          <h4>Forecast Average</h4>
          <p className="stat-value">${stats.forecast_avg_daily.toFixed(2)}/day</p>
          <span className="stat-label">Next {stats.forecast_period_days} days</span>
        </div>
        <div className={`stat-card ${trendClass}`}>
          <h4>Trend</h4>
          <p className="stat-value">
            {trendIcon}
            {Math.abs(stats.trend_percentage).toFixed(1)}%
          </p>
          <span className="stat-label">
            {stats.trend_percentage > 0 ? 'Increasing' : 'Decreasing'}
          </span>
        </div>
        <div className="stat-card">
          <h4>Predicted Total</h4>
          <p className="stat-value">${stats.total_predicted_spending.toFixed(2)}</p>
          <span className="stat-label">Next {stats.forecast_period_days} days</span>
        </div>
      </div>

      <div className="forecast-chart-card">
        <h3>Daily Spending Forecast</h3>
        <div className="forecast-list">
          {forecast.forecast.slice(0, 10).map((day, index) => (
            <div key={index} className="forecast-item">
              <span className="forecast-date">{new Date(day.date).toLocaleDateString()}</span>
              <div className="forecast-bar">
                <div
                  className="forecast-bar-fill"
                  style={{ width: `${(day.predicted_spending / stats.forecast_avg_daily) * 50}%` }}
                ></div>
              </div>
              <span className="forecast-amount">${day.predicted_spending.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Anomalies Tab Component
const AnomaliesTab = ({ anomalies }) => {
  if (!anomalies || !anomalies.success || !anomalies.statistics || !anomalies.anomalies) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} />
        <p>Not enough data for anomaly detection</p>
        <p className="hint">Minimum 30 days of transaction data and 30 transactions required</p>
        {anomalies?.message && <p className="hint">{anomalies.message}</p>}
      </div>
    );
  }

  const stats = anomalies.statistics;

  return (
    <div className="anomalies-tab">
      <div className="anomalies-stats">
        <div className="stat-card">
          <h4>Total Transactions</h4>
          <p className="stat-value">{stats.total_transactions}</p>
        </div>
        <div className="stat-card alert">
          <h4>Anomalies Detected</h4>
          <p className="stat-value">{stats.anomalies_detected}</p>
          <span className="stat-label">{stats.anomaly_percentage.toFixed(1)}% of total</span>
        </div>
        <div className="stat-card">
          <h4>Total Anomalous Spending</h4>
          <p className="stat-value">${stats.total_anomalous_spending.toFixed(2)}</p>
        </div>
      </div>

      <div className="anomalies-list-card">
        <h3>Unusual Transactions</h3>
        {anomalies.anomalies.length === 0 ? (
          <p className="no-anomalies">
            <CheckCircle /> No unusual transactions detected!
          </p>
        ) : (
          <div className="anomalies-list">
            {anomalies.anomalies.map((anomaly, index) => (
              <div key={index} className={`anomaly-item severity-${anomaly.severity}`}>
                <div className="anomaly-header">
                  <span className="anomaly-date">{new Date(anomaly.date).toLocaleDateString()}</span>
                  <span className={`severity-badge ${anomaly.severity}`}>{anomaly.severity}</span>
                </div>
                <div className="anomaly-details">
                  <p className="anomaly-amount">${anomaly.amount.toFixed(2)}</p>
                  <p className="anomaly-category">{anomaly.category}</p>
                  <p className="anomaly-description">{anomaly.description}</p>
                </div>
                <p className="anomaly-reason">{anomaly.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Budget Tab Component
const BudgetTab = ({ budgetRec }) => {
  if (!budgetRec || !budgetRec.success || !budgetRec.recommendations) {
    return (
      <div className="empty-state">
        <DollarSign size={48} />
        <p>Not enough spending data for budget recommendations</p>
        <p className="hint">Minimum 30 days of transaction data and 20 expense transactions required</p>
        {budgetRec?.message && <p className="hint">{budgetRec.message}</p>}
      </div>
    );
  }

  return (
    <div className="budget-tab">
      <div className="budget-header">
        <h3>Recommended Budget: ${budgetRec.total_recommended_budget.toFixed(2)}/month</h3>
        <p className="budget-approach">Using {budgetRec.approach} approach</p>
      </div>

      <div className="budget-recommendations">
        {budgetRec.recommendations.map((rec, index) => (
          <div key={index} className={`budget-rec-card priority-${rec.priority}`}>
            <div className="budget-rec-header">
              <h4>{rec.category}</h4>
              <span className={`priority-badge ${rec.priority}`}>{rec.priority} priority</span>
            </div>
            <div className="budget-rec-amount">
              <span className="recommended">${rec.recommended_amount.toFixed(2)}</span>
              <span className="current">Current avg: ${rec.current_monthly_avg.toFixed(2)}</span>
            </div>
            <div className="budget-rec-meta">
              <span className="trend">{rec.trend} trend</span>
              <span className="variability">{rec.variability} variability</span>
            </div>
            <p className="budget-justification">{rec.justification}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Goals Tab Component
const GoalsTab = ({ goalsAnalysis }) => {
  // Check if user has goals but insufficient data
  const hasGoalsButNoData = goalsAnalysis?.total_goals > 0 && !goalsAnalysis.success;

  if (!goalsAnalysis || !goalsAnalysis.success || !goalsAnalysis.goals) {
    return (
      <div className="empty-state">
        <Target size={48} />
        {hasGoalsButNoData ? (
          <>
            <p>Insufficient data to predict goal achievement</p>
            <p className="hint">We need at least 1 month of transaction history to analyze how likely you are to achieve your goals</p>
            {goalsAnalysis?.message && <p className="hint">{goalsAnalysis.message}</p>}
          </>
        ) : (
          <>
            <p>No active financial goals</p>
            <p className="hint">Create goals to track your savings and financial targets</p>
            {goalsAnalysis?.message && <p className="hint">{goalsAnalysis.message}</p>}
            <button onClick={() => window.location.href = '/goals'} className="cta-btn">
              Create Your First Goal
            </button>
          </>
        )}
      </div>
    );
  }

  // If we reach here, user has goals AND sufficient data, but check if goals array is empty
  if (goalsAnalysis.total_goals === 0) {
    return (
      <div className="empty-state">
        <Target size={48} />
        <p>No active financial goals</p>
        <p className="hint">Create goals to track your savings and financial targets</p>
        <button onClick={() => window.location.href = '/goals'} className="cta-btn">
          Create Your First Goal
        </button>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'highly_likely':
        return <CheckCircle className="status-icon success" />;
      case 'possible':
        return <Clock className="status-icon warning" />;
      default:
        return <XCircle className="status-icon danger" />;
    }
  };

  return (
    <div className="goals-tab">
      <div className="goals-overview">
        <div className="stat-card">
          <h4>Active Goals</h4>
          <p className="stat-value">{goalsAnalysis.total_goals}</p>
        </div>
        <div className="stat-card">
          <h4>Monthly Commitment</h4>
          <p className="stat-value">${goalsAnalysis.total_monthly_commitment.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h4>Avg Monthly Savings</h4>
          <p className="stat-value">${goalsAnalysis.avg_monthly_savings.toFixed(2)}</p>
        </div>
        <div className={`stat-card assessment-${goalsAnalysis.overall_assessment}`}>
          <h4>Assessment</h4>
          <p className="stat-value">{goalsAnalysis.overall_assessment.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="goals-analysis-message">
        <p>{goalsAnalysis.message}</p>
      </div>

      <div className="goals-list">
        {goalsAnalysis.goals.map((goal, index) => {
          const pred = goal.prediction;
          return (
            <div key={index} className={`goal-card status-${pred.status}`}>
              <div className="goal-header">
                <h4>{goal.goal_name}</h4>
                {getStatusIcon(pred.status)}
              </div>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${pred.current_progress_percentage}%` }}
                  ></div>
                </div>
                <span className="progress-text">{pred.current_progress_percentage.toFixed(1)}% Complete</span>
              </div>
              <div className="goal-amounts">
                <span>${goal.current_amount.toFixed(2)}</span>
                <span className="separator">/</span>
                <span>${goal.target_amount.toFixed(2)}</span>
              </div>
              <div className="goal-prediction">
                <p className="probability">
                  {pred.achievement_probability.toFixed(0)}% Achievement Probability
                </p>
                <p className="timeline">
                  {pred.months_required !== null ? `${pred.months_required.toFixed(1)} months required` : 'Goal already achieved or needs contribution adjustment'}
                </p>
                {pred.estimated_completion_date && (
                  <p className="completion-date">
                    Est. completion: {new Date(pred.estimated_completion_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              {pred.recommendations && pred.recommendations.length > 0 && (
                <div className="goal-recommendations">
                  <h5>Recommendations:</h5>
                  <ul>
                    {pred.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIInsights;
