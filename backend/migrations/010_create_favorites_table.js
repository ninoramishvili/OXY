/**
 * Migration: Create User Favorites Table
 * Allows users to save courses to a favorites list
 */

const pool = require('../db');

const up = async () => {
  console.log('📋 Creating user_favorites table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id)
    )
  `);
  
  console.log('  ✓ Created user_favorites table');
  
  // Create index for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON user_favorites(user_id)
  `);
  
  console.log('  ✓ Created index on user_id');
  console.log('✅ User favorites table created successfully');
};

const down = async () => {
  console.log('🗑️ Dropping user_favorites table...');
  
  await pool.query('DROP INDEX IF EXISTS idx_favorites_user_id');
  await pool.query('DROP TABLE IF EXISTS user_favorites');
  
  console.log('✅ User favorites table dropped');
};

module.exports = { up, down };

