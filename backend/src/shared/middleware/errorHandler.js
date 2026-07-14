// src/shared/middleware/errorHandler.js
// Centralized error handler — ALL errors from every module flow here

const { AppError } = require('../errors/AppError');
const logger = require('../utils/logger');

/**
 * Global error handler middleware.
 * Must have 4 parameters (err, req, res, next) for Express to treat it as an error handler.
 */
function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log server errors fully (5xx) — these are bugs
  if (err.statusCode >= 500) {
    logger.error('Server error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId: req.id,
    });
  } else {
    // Client errors (4xx) are expected — warn level is enough
    logger.warn('Client error', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
  }

  // Development: full error details for debugging
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errorCode: err.errorCode,
      stack: err.stack,
    });
  }

  // Production: only expose operational (expected) errors to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errorCode: err.errorCode,
    });
  }

  // Unknown/unexpected error — never expose internals to user
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.',
  });
}

/**
 * 404 handler — catches any route that didn't match
 */
function notFoundHandler(req, res, next) {
  const { AppError } = require('../errors/AppError');
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
}

module.exports = { errorHandler, notFoundHandler };
