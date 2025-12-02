/**
 * Migration: Add Missing Course Columns
 * Adds instructor and level columns to courses table
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 020_add_course_columns');
  
  // Add instructor column
  await pool.query(`
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor VARCHAR(255);
  `);
  console.log('  ✓ Added instructor column');
  
  // Add level column
  await pool.query(`
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'beginner';
  `);
  console.log('  ✓ Added level column');
  
  // Update existing courses with default values
  await pool.query(`
    UPDATE courses SET instructor = 'OXY Expert' WHERE instructor IS NULL;
  `);
  console.log('  ✓ Set default instructor');
  
  console.log('✅ Migration 020 completed');
}

async function down() {
  await pool.query(`
    ALTER TABLE courses DROP COLUMN IF EXISTS instructor;
    ALTER TABLE courses DROP COLUMN IF EXISTS level;
  `);
  console.log('✅ Migration 020 rolled back');
}

module.exports = { up, down };

// Run if called directly
if (require.main === module) {
  up()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

