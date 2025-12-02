/**
 * Migration: Add Experience Column to Coaches
 * Adds experience column for admin panel
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 021_add_coach_experience');
  
  // Add experience column
  await pool.query(`
    ALTER TABLE coaches ADD COLUMN IF NOT EXISTS experience VARCHAR(100);
  `);
  console.log('  ✓ Added experience column');
  
  // Update existing coaches with default values
  await pool.query(`
    UPDATE coaches SET experience = '5+ years' WHERE experience IS NULL;
  `);
  console.log('  ✓ Set default experience');
  
  console.log('✅ Migration 021 completed');
}

async function down() {
  await pool.query(`
    ALTER TABLE coaches DROP COLUMN IF EXISTS experience;
  `);
  console.log('✅ Migration 021 rolled back');
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

