require('dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../src/shared/config/database');
const bcrypt = require('bcryptjs');

async function seedRoles() {
  try {
    console.log('Seeding Multi-Vendor Roles...');

    // Promote john.doe@example.com to admin
    await pool.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE email = 'john.doe@example.com'
    `);
    console.log('✅ Promoted john.doe@example.com to admin');

    // Create a new Seller user (jane.smith@example.com)
    const sellerPassword = await bcrypt.hash('Password123!', 12);
    
    // Check if seller already exists
    const existingSeller = await pool.query('SELECT * FROM users WHERE email = $1', ['jane.smith@example.com']);
    
    if (existingSeller.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (first_name, last_name, email, password_hash, role, is_verified)
        VALUES ('Jane', 'Smith', 'jane.smith@example.com', $1, 'seller', true)
      `, [sellerPassword]);
      console.log('✅ Created seller jane.smith@example.com');
    } else {
      console.log('✅ Seller jane.smith@example.com already exists');
    }
    
    // Update existing products to belong to the new seller so we have demo data
    const seller = await pool.query('SELECT id FROM users WHERE email = $1', ['jane.smith@example.com']);
    const sellerId = seller.rows[0].id;
    
    await pool.query('UPDATE products SET seller_id = $1', [sellerId]);
    console.log('✅ Transferred existing demo products to Jane Smith (Seller)');

    console.log('Done!');
  } catch (error) {
    console.error('❌ Failed to seed roles', error);
  } finally {
    pool.end();
  }
}

seedRoles();
