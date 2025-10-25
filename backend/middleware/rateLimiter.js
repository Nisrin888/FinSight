/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');

// General API rate limiter
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in development mode for easier testing
    return process.env.NODE_ENV === 'development';
  }
});

// Strict rate limiter for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});

// Rate limiter for ML/AI endpoints (more lenient)
const mlRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    status: 'error',
    message: 'Too many ML requests, please wait a moment.'
  }
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  mlRateLimiter
};
