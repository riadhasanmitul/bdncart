require('dotenv').config();
const { pool } = require('../shared/config/database');
const logger = require('../shared/utils/logger');

async function initAddressesTable() {
  try {
    logger.info('Creating addresses table...');

    // We use ON DELETE CASCADE so if a user is deleted, all their addresses
    // are automatically deleted too (prevents orphaned data).
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(50) NOT NULL, -- e.g., 'Home', 'Office'
        street_address VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- We query addresses by user_id frequently, so an index speeds it up
      CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
    `);

    logger.info('✅ Addresses table created successfully');
  } catch (error) {
    logger.error('❌ Failed to create addresses table', { error: error.message });
  } finally {
    await pool.end();
  }
}

initAddressesTable();
