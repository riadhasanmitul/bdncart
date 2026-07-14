require('dotenv').config();
const { pool } = require('../shared/config/database');
const logger = require('../shared/utils/logger');

async function initDB() {
  try {
    logger.info('Running database initialization...');

    // We use UUIDs instead of auto-incrementing integers for security.
    // An integer ID (like user/5) lets a hacker guess that user 6 exists.
    // UUIDs (like user/f47ac10b-58cc-4372-a567-0e02b2c3d479) are unguessable.
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'admin')),
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Index on email for fast lookups during login
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    logger.info('✅ Database initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize database', { error: error.message });
  } finally {
    await pool.end();
  }
}

initDB();
