/**
 * Migration: Add Private Notes to Coach Comments
 * Allows coaches to keep private notes that users cannot see
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 016_add_private_notes');
  
  await pool.query(`
    -- Add private_notes column to coach_comments if not exists
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='coach_comments' AND column_name='private_notes') THEN
        ALTER TABLE coach_comments ADD COLUMN private_notes TEXT;
      END IF;
    END $$;
  `);
  
  console.log('✅ Migration 016 completed: Added private_notes column');
}

async function down() {
  await pool.query(`
    ALTER TABLE coach_comments DROP COLUMN IF EXISTS private_notes;
  `);
  console.log('✅ Migration 016 rolled back');
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

