// server.js
// Entry point — connects to services, then starts HTTP server

require('dotenv').config();

const app = require('./src/app');
const { connectDatabase } = require('./src/shared/config/database');
const { connectRedis } = require('./src/shared/config/redis');
const { env } = require('./src/shared/config/env');
const logger = require('./src/shared/utils/logger');

async function startServer() {
  try {
    // Step 1: Connect to PostgreSQL
    await connectDatabase();

    // Step 2: Connect to Redis
    await connectRedis();

    // Step 3: Start HTTP server
    const server = app.listen(env.port, () => {
      logger.info('🚀 BDNCart API is running', {
        port: env.port,
        environment: env.nodeEnv,
        health: `http://localhost:${env.port}/api/health`,
      });
    });

    // ─────────────────────────────────────────────────────────────
    // GRACEFUL SHUTDOWN
    //
    // When Docker/Kubernetes stops this container (SIGTERM),
    // we: stop accepting new requests → finish in-flight requests
    // → close DB connections cleanly.
    //
    // Without this: in-flight requests get killed mid-execution,
    // which can leave orders in a broken state.
    // ─────────────────────────────────────────────────────────────
    async function gracefulShutdown(signal) {
      logger.info(`${signal} received — starting graceful shutdown`);

      server.close(async () => {
        logger.info('HTTP server closed — no new requests accepted');

        try {
          const { pool } = require('./src/shared/config/database');
          const { redisClient } = require('./src/shared/config/redis');

          await pool.end();
          logger.info('PostgreSQL pool closed');

          await redisClient.disconnect();
          logger.info('Redis disconnected');

          logger.info('✅ Graceful shutdown complete');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown', { error: err.message });
          process.exit(1);
        }
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Shutdown timeout — forcing exit');
        process.exit(1);
      }, 30000);
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Catch unhandled promise rejections (bugs that weren't try-caught)
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', { reason: String(reason) });
      gracefulShutdown('unhandledRejection');
    });
  } catch (err) {
    logger.error('❌ Failed to start server', { error: err.message });
    process.exit(1);
  }
}

startServer();
