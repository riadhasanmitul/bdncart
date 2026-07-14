// src/shared/config/redis.js
// Redis client with auto-reconnect and event logging

const { createClient } = require('redis');
const { env } = require('./env');
const logger = require('../utils/logger');

const redisClient = createClient({
  socket: {
    host: env.redis.host,
    port: env.redis.port,
    // Exponential backoff: wait a little longer after each failed reconnect attempt
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: max reconnection attempts reached');
        return new Error('Redis max retries exceeded');
      }
      return Math.min(retries * 100, 3000); // max 3s between retries
    },
  },
});

redisClient.on('error', (err) => {
  logger.error('Redis client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected', { host: env.redis.host, port: env.redis.port });
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

async function connectRedis() {
  await redisClient.connect();
}

module.exports = { redisClient, connectRedis };
