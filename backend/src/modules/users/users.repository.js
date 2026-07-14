const { query } = require('../../shared/config/database');

async function getProfile(userId) {
  const sql = `
    SELECT id, first_name AS "firstName", last_name AS "lastName", email, role, is_verified, created_at 
    FROM users WHERE id = $1
  `;
  const result = await query(sql, [userId]);
  return result.rows[0];
}

async function updateProfile(userId, updateData) {
  // We use COALESCE so if a field is not provided, it keeps the old value
  const sql = `
    UPDATE users 
    SET 
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING id, first_name AS "firstName", last_name AS "lastName", email, role, is_verified, updated_at
  `;
  const result = await query(sql, [updateData.firstName, updateData.lastName, userId]);
  return result.rows[0];
}

// ─────────────────────────────────────────────────────────────────
// ADDRESS MANAGEMENT
// ─────────────────────────────────────────────────────────────────

async function getAddressesByUserId(userId) {
  const sql = `
    SELECT * FROM addresses 
    WHERE user_id = $1 
    ORDER BY is_default DESC, created_at DESC
  `;
  const result = await query(sql, [userId]);
  return result.rows;
}

async function createAddress(userId, addressData) {
  const { title, streetAddress, city, state, postalCode, country, isDefault } = addressData;
  
  // If this is set to default, we must unset any existing defaults for this user
  // We do this in the service layer using a transaction or multiple queries.
  
  const sql = `
    INSERT INTO addresses (user_id, title, street_address, city, state, postal_code, country, is_default)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    userId, title, streetAddress, city, state, postalCode, country || 'Bangladesh', isDefault || false
  ]);
  return result.rows[0];
}

async function removeDefaultStatus(userId) {
  const sql = `UPDATE addresses SET is_default = false WHERE user_id = $1`;
  await query(sql, [userId]);
}

async function getAllUsers() {
  const sql = `
    SELECT id, first_name AS "firstName", last_name AS "lastName", email, role, is_verified, created_at 
    FROM users 
    ORDER BY created_at DESC
  `;
  const result = await query(sql);
  return result.rows;
}

module.exports = {
  getProfile,
  updateProfile,
  getAddressesByUserId,
  createAddress,
  removeDefaultStatus,
  getAllUsers
};
