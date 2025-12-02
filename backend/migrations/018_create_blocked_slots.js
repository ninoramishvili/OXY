/**
 * Migration: Create Blocked Slots Table
 * Allows coaches to block specific time slots
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 018_create_blocked_slots');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocked_slots (
      id SERIAL PRIMARY KEY,
      coach_id INT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      blocked_date DATE NOT NULL,
      blocked_time TIME NOT NULL,
      reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(coach_id, blocked_date, blocked_time)
    );
    
    CREATE INDEX IF NOT EXISTS idx_blocked_slots_coach_date ON blocked_slots(coach_id, blocked_date);
  `);
  
  console.log('✅ Migration 018 completed: Created blocked_slots table');
}

async function down() {
  await pool.query(`
    DROP TABLE IF EXISTS blocked_slots;
  `);
  console.log('✅ Migration 018 rolled back');
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

