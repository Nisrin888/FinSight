/**
 * Currency Utility Functions
 * Format currency based on user preferences
 */

/**
 * Format amount as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (e.g., 'USD', 'CAD', 'EUR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch (error) {
    // Fallback to USD if currency code is invalid
    console.warn(`Invalid currency code: ${currency}, falling back to USD`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  }
};

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = 'USD') => {
  const symbols = {
    USD: '$',
    CAD: 'C$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹',
    MXN: 'Mex$',
    BRL: 'R$',
    ZAR: 'R',
  };

  return symbols[currency] || '$';
};

/**
 * List of supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'Fr' },
  { value: 'MXN', label: 'MXN - Mexican Peso', symbol: 'Mex$' },
  { value: 'BRL', label: 'BRL - Brazilian Real', symbol: 'R$' },
  { value: 'ZAR', label: 'ZAR - South African Rand', symbol: 'R' },
];
