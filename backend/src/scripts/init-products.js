require('dotenv').config();
const { pool } = require('../shared/config/database');
const logger = require('../shared/utils/logger');

async function initProductsSchema() {
  try {
    logger.info('Creating products schema (Categories, Products, Variants, Images)...');

    await pool.query('BEGIN');

    // 1. Categories Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(150) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Products Table (Base Product Information)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(300) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        brand VARCHAR(100),
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
    `);

    // 3. Product Variants Table (Pricing, Stock, SKU, Attributes)
    // E.g., Size M, Color Red
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(100) UNIQUE NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        attributes JSONB, -- Flexible JSON for { "color": "red", "size": "M" }
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
    `);

    // 4. Product Images Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE, -- Optional: Image for specific color
        image_url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
    `);

    await pool.query('COMMIT');
    logger.info('✅ Products schema created successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('❌ Failed to create products schema', { error: error.message });
  } finally {
    await pool.end();
  }
}

initProductsSchema();
