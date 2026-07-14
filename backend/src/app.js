// src/app.js
// Express app configuration — imported by server.js and test files

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const { validateEnv, env } = require('./shared/config/env');
const { errorHandler, notFoundHandler } = require('./shared/middleware/errorHandler');
const { apiLimiter } = require('./shared/middleware/rateLimiter');
const logger = require('./shared/utils/logger');

// Crash immediately if any required env var is missing
validateEnv();

const app = express();

// ─────────────────────────────────────────────────────────────────
// SECURITY MIDDLEWARE
// helmet() sets 14+ HTTP headers automatically:
//   X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security...
// ─────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true, // allow cookies cross-origin (needed for refresh token cookie)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────────────────────────
// BODY & COOKIE PARSING
// limit: '10kb' prevents payload-based attacks (uploading huge JSON to crash server)
// ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────
// REQUEST ID
// Every request gets a unique ID — makes logs traceable.
// If a user reports "my order failed at 3pm", you can find it instantly.
// ─────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);

  logger.info('→ Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  next();
});

// ─────────────────────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────

/**
 * Health Check — GET /api/health
 *
 * Used by Docker, Kubernetes, load balancers to verify this instance is alive.
 * Checks both database and Redis connectivity.
 * Returns 200 if healthy, 503 if any service is down.
 */
app.get('/api/health', async (req, res) => {
  const { pool } = require('./shared/config/database');
  const { redisClient } = require('./shared/config/redis');

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: env.nodeEnv,
    version: '1.0.0',
    services: {
      database: 'unknown',
      cache: 'unknown',
    },
  };

  try {
    await pool.query('SELECT 1');
    health.services.database = 'healthy';
  } catch {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    await redisClient.ping();
    health.services.cache = 'healthy';
  } catch {
    health.services.cache = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * API Version Info — GET /api/version
 */
app.get('/api/version', (req, res) => {
  res.json({
    status: 'ok',
    name: 'BDNCart API',
    version: '1.0.0',
    buildDate: new Date().toISOString().split('T')[0],
    node: process.version,
    environment: env.nodeEnv,
  });
});

// ─────────────────────────────────────────────────────────────────
// Future module routes (added progressively each phase)
// ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',     require('./modules/auth/auth.router'));
app.use('/api/v1/users',    require('./modules/users/users.router'));
app.use('/api/v1/products', require('./modules/products/products.router'));
app.use('/api/v1/cart',     require('./modules/cart/cart.router'));
app.use('/api/v1/orders',   require('./modules/orders/orders.router'));

// ─────────────────────────────────────────────────────────────────
// ERROR HANDLING — must be LAST
// ─────────────────────────────────────────────────────────────────
app.use(notFoundHandler); // catches routes that didn't match anything above
app.use(errorHandler);    // handles all errors thrown/passed via next(err)

module.exports = app;
