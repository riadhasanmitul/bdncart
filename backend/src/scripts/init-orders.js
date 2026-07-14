require('dotenv').config();
const { pool } = require('../shared/config/database');
const logger = require('../shared/utils/logger');

async function initOrdersSchema() {
  try {
    logger.info('Creating orders schema...');

    await pool.query('BEGIN');

    // 1. Create custom ENUM types for statuses if they don't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
          CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
          CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed');
        END IF;
      END
      $$;
    `);

    // 2. Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
        
        -- Snapshot of total calculated at checkout
        total_amount DECIMAL(10, 2) NOT NULL,
        
        status order_status DEFAULT 'pending',
        payment_status payment_status DEFAULT 'unpaid',
        
        -- Usually stores the Stripe/PayPal transaction ID
        payment_transaction_id VARCHAR(255),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    `);

    // 3. Order Items Table (The Historical Snapshot)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
        
        -- Copied exactly as it was at the moment of purchase
        product_name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);

    await pool.query('COMMIT');
    logger.info('✅ Orders schema created successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('❌ Failed to create orders schema', { error: error.message });
  } finally {
    await pool.end();
  }
}

initOrdersSchema();
