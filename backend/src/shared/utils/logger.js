// src/shared/utils/logger.js
// Winston structured logger — outputs JSON in production, colorized in dev

const winston = require('winston');

// We require env inline to avoid circular dependency
// (logger is used by db/redis config which are imported by env)
const { combine, timestamp, json, colorize, simple, errors } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',

  format: combine(
    errors({ stack: true }), // capture full stack traces on errors
    timestamp(),
    json()
  ),

  transports: [
    new winston.transports.Console({
      format: isProduction
        ? combine(timestamp(), json())
        : combine(colorize(), simple()), // human-readable in dev
    }),
  ],

  exitOnError: false,
});

module.exports = logger;
