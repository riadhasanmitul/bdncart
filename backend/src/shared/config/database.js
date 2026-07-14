// src/shared/config/database.js
// PostgreSQL connection pool — reusable across all modules

const { Pool } = require('pg');
const { env } = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: env.db.poolMax,
  idleTimeoutMillis: env.db.poolIdleTimeout,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
  process.exit(1);
});

/**
 * Test DB connection — called once at startup
 */
async function connectDatabase() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as current_time');
    logger.info('✅ PostgreSQL connected', {
      time: result.rows[0].current_time,
      host: env.db.host,
      database: env.db.name,
    });
  } finally {
    // finally runs whether query succeeded or threw an error
    // Without this, the client would never return to the pool — memory leak!
    client.release();
  }
}

/**
 * Execute a simple query.
 * ALWAYS use parameterized queries ($1, $2...) — prevents SQL injection.
 *
 * ❌ DANGEROUS: `SELECT * FROM users WHERE id = ${userId}`
 * ✅ SAFE:      query('SELECT * FROM users WHERE id = $1', [userId])
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (env.nodeEnv === 'development' && duration > 100) {
    logger.warn('Slow query detected', { text, duration, rows: result.rowCount });
  }

  return result;
}

/**
 * Get a raw client from pool for multi-step transactions.
 * IMPORTANT: Always call client.release() when done.
 */
async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, connectDatabase, pool };
