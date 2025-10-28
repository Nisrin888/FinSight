import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const InsightsContext = createContext();

export const useInsights = () => {
  const context = useContext(InsightsContext);
  if (!context) {
    throw new Error('useInsights must be used within InsightsProvider');
  }
  return context;
};

export const InsightsProvider = ({ children }) => {
  const [insights, setInsights] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [budgetRec, setBudgetRec] = useState(null);
  const [goalsAnalysis, setGoalsAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('aiInsights');
      if (cached) {
        const parsed = JSON.parse(cached);
        setInsights(parsed.insights);
        setForecast(parsed.forecast);
        setAnomalies(parsed.anomalies);
        setBudgetRec(parsed.budgetRec);
        setGoalsAnalysis(parsed.goalsAnalysis);
        setLastFetched(parsed.lastFetched ? new Date(parsed.lastFetched) : null);
      }
    } catch (error) {
      console.error('Error loading cached insights:', error);
    }
  }, []);

  // Save to localStorage whenever insights change
  useEffect(() => {
    if (insights || forecast || anomalies || budgetRec || goalsAnalysis) {
      const data = {
        insights,
        forecast,
        anomalies,
        budgetRec,
        goalsAnalysis,
        lastFetched: lastFetched ? lastFetched.toISOString() : null,
      };
      localStorage.setItem('aiInsights', JSON.stringify(data));
    }
  }, [insights, forecast, anomalies, budgetRec, goalsAnalysis, lastFetched]);

  const fetchAllInsights = useCallback(async (force = false) => {
    // If we have cached data and not forcing refresh, skip
    if (!force && insights && forecast && anomalies && budgetRec && goalsAnalysis) {
      return;
    }

    setLoading(true);
    try {
      // Load all ML insights in parallel
      const [
        insightsRes,
        forecastRes,
        anomaliesRes,
        budgetRes,
        goalsRes
      ] = await Promise.allSettled([
        api.get('/ml/insights'),
        api.get('/ml/forecast'),
        api.get('/ml/anomalies'),
        api.get('/ml/budget/recommendations'),
        api.get('/ml/goals/analyze')
      ]);

      // Handle each response with proper fallback
      if (insightsRes.status === 'fulfilled') {
        setInsights(insightsRes.value.data.data);
      } else {
        console.warn('Failed to load insights:', insightsRes.reason);
        setInsights({ success: false, message: insightsRes.reason?.response?.data?.message || 'Not enough data' });
      }

      if (forecastRes.status === 'fulfilled') {
        setForecast(forecastRes.value.data.data);
      } else {
        console.warn('Failed to load forecast:', forecastRes.reason);
        setForecast({ success: false, message: forecastRes.reason?.response?.data?.message || 'Not enough data' });
      }

      if (anomaliesRes.status === 'fulfilled') {
        setAnomalies(anomaliesRes.value.data.data);
      } else {
        console.warn('Failed to load anomalies:', anomaliesRes.reason);
        setAnomalies({ success: false, message: anomaliesRes.reason?.response?.data?.message || 'Not enough data' });
      }

      if (budgetRes.status === 'fulfilled') {
        setBudgetRec(budgetRes.value.data.data);
      } else {
        console.warn('Failed to load budget recommendations:', budgetRes.reason);
        setBudgetRec({ success: false, message: budgetRes.reason?.response?.data?.message || 'Not enough data' });
      }

      if (goalsRes.status === 'fulfilled') {
        // ML service now returns data even when success: false
        setGoalsAnalysis(goalsRes.value.data.data);
      } else {
        console.warn('Failed to load goals analysis:', goalsRes.reason);
        setGoalsAnalysis({ success: false, message: goalsRes.reason?.response?.data?.message || 'Not enough data' });
      }

      setLastFetched(new Date());
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  }, [insights, forecast, anomalies, budgetRec, goalsAnalysis]);

  const refreshInsights = useCallback(async () => {
    // Clear cache before refreshing
    localStorage.removeItem('aiInsights');
    setInsights(null);
    setForecast(null);
    setAnomalies(null);
    setBudgetRec(null);
    setGoalsAnalysis(null);
    setLastFetched(null);

    // Fetch fresh data
    return await fetchAllInsights(true);
  }, [fetchAllInsights]);

  const clearInsights = useCallback(() => {
    setInsights(null);
    setForecast(null);
    setAnomalies(null);
    setBudgetRec(null);
    setGoalsAnalysis(null);
    setLastFetched(null);
    localStorage.removeItem('aiInsights');
  }, []);

  const value = {
    insights,
    forecast,
    anomalies,
    budgetRec,
    goalsAnalysis,
    loading,
    lastFetched,
    fetchAllInsights,
    refreshInsights,
    clearInsights,
  };

  return (
    <InsightsContext.Provider value={value}>
      {children}
    </InsightsContext.Provider>
  );
};
