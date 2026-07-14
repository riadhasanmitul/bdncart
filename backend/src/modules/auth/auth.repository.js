const { query } = require('../../shared/config/database');

/**
 * ─────────────────────────────────────────────────────────────────
 * LAYER: REPOSITORY
 * ─────────────────────────────────────────────────────────────────
 * WHY: The repository pattern separates database queries from business logic.
 * If we ever switch to MongoDB, we only rewrite this file. The Service layer 
 * stays exactly the same.
 */

async function createUser(userData) {
  const { firstName, lastName, email, passwordHash, role = 'customer' } = userData;
  
  // Notice the $1, $2 params? This is parameterized SQL.
  // It completely prevents SQL Injection attacks.
  const sql = `
    INSERT INTO users (first_name, last_name, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, first_name AS "firstName", last_name AS "lastName", email, role, is_verified, created_at
  `;
  
  const result = await query(sql, [firstName, lastName, email, passwordHash, role]);
  return result.rows[0];
}

async function findUserByEmail(email) {
  const sql = `SELECT * FROM users WHERE email = $1`;
  const result = await query(sql, [email]);
  return result.rows[0];
}

async function findUserById(id) {
  const sql = `
    SELECT id, first_name AS "firstName", last_name AS "lastName", email, role, is_verified, created_at 
    FROM users WHERE id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
