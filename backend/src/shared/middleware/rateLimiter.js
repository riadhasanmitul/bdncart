// src/shared/middleware/rateLimiter.js
// Rate limiting — protects against brute force and DDoS

const rateLimit = require('express-rate-limit');

// General limiter: 1000 requests per 15 minutes per IP during dev
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again in 15 minutes.',
  },
});

// Strict limiter for auth endpoints: only 10 attempts per 15 minutes
// Prevents password brute-forcing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

module.exports = { apiLimiter, authLimiter };
