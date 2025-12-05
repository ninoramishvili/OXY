/**
 * Migration: Add end date/time to tasks
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 023_add_task_end_time');
  
  // Add end_date and end_time columns
  await pool.query(`
    ALTER TABLE tasks 
    ADD COLUMN IF NOT EXISTS scheduled_end_date DATE,
    ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;
  `);
  console.log('  ✓ Added scheduled_end_date and scheduled_end_time columns');

  // Set default end times for existing tasks (start time + estimated minutes)
  await pool.query(`
    UPDATE tasks 
    SET scheduled_end_date = scheduled_date,
        scheduled_end_time = (scheduled_time + (COALESCE(estimated_minutes, 30)) * INTERVAL '1 minute')::TIME
    WHERE scheduled_date IS NOT NULL AND scheduled_end_time IS NULL;
  `);
  console.log('  ✓ Updated existing tasks with end times');

  console.log('✅ Migration 023 completed');
}

async function down() {
  await pool.query(`
    ALTER TABLE tasks 
    DROP COLUMN IF EXISTS scheduled_end_date,
    DROP COLUMN IF EXISTS scheduled_end_time;
  `);
  console.log('✅ Migration 023 rolled back');
}

module.exports = { up, down };

if (require.main === module) {
  up().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

