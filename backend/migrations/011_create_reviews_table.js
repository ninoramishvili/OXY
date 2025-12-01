/**
 * Migration: Create Course Reviews Table
 * Allows users to rate and review courses they purchased
 */

const pool = require('../db');

const up = async () => {
  console.log('⭐ Creating course_reviews table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id)
    )
  `);
  
  console.log('  ✓ Created course_reviews table');
  
  // Create indexes for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON course_reviews(course_id)
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON course_reviews(user_id)
  `);
  
  console.log('  ✓ Created indexes');
  console.log('✅ Course reviews table created successfully');
};

const down = async () => {
  console.log('🗑️ Dropping course_reviews table...');
  
  await pool.query('DROP INDEX IF EXISTS idx_reviews_course_id');
  await pool.query('DROP INDEX IF EXISTS idx_reviews_user_id');
  await pool.query('DROP TABLE IF EXISTS course_reviews');
  
  console.log('✅ Course reviews table dropped');
};

module.exports = { up, down };

