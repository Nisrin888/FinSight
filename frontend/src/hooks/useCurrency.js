/**
 * Currency Hook
 * Provides currency formatting based on user preferences
 */

import { useMemo } from 'react';
import useAuthStore from '../store/authStore';

const useCurrency = () => {
  const { user } = useAuthStore();

  // Get user's preferred currency, default to USD
  const userCurrency = user?.currency || 'USD';

  // Format currency function
  const formatCurrency = useMemo(() => {
    return (amount, currencyOverride = null) => {
      const currency = currencyOverride || userCurrency;

      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount || 0);
      } catch (error) {
        // Fallback if currency code is invalid
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount || 0);
      }
    };
  }, [userCurrency]);

  return {
    formatCurrency,
    userCurrency,
  };
};

export default useCurrency;
