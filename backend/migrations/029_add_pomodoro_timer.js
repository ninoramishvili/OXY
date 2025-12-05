/**
 * Migration: Add Pomodoro Timer
 * Creates pomodoro_sessions table and adds pomodoro settings
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 029_add_pomodoro_timer');
  
  // Create pomodoro_sessions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      task_id INT REFERENCES tasks(id) ON DELETE SET NULL,
      session_type VARCHAR(20) DEFAULT 'work',
      duration_minutes INT DEFAULT 25,
      started_at TIMESTAMP NOT NULL,
      completed_at TIMESTAMP,
      was_interrupted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✓ Created pomodoro_sessions table');

  // Add indexes for performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_pomodoro_user_date 
    ON pomodoro_sessions(user_id, DATE(started_at));
  `);
  console.log('  ✓ Added indexes');

  console.log('✅ Migration 029 completed');
}

async function down() {
  await pool.query('DROP TABLE IF EXISTS pomodoro_sessions CASCADE');
  console.log('✅ Migration 029 rolled back');
}

module.exports = { up, down };

if (require.main === module) {
  up().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

