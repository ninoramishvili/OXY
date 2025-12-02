/**
 * Migration: Create Coach Notifications Table
 * Stores notifications for coaches about bookings and other events
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 017_create_coach_notifications');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coach_notifications (
      id SERIAL PRIMARY KEY,
      coach_id INT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_coach_notifications_coach_id ON coach_notifications(coach_id);
    CREATE INDEX IF NOT EXISTS idx_coach_notifications_is_read ON coach_notifications(is_read);
  `);
  
  console.log('✅ Migration 017 completed: Created coach_notifications table');
}

async function down() {
  await pool.query(`
    DROP TABLE IF EXISTS coach_notifications;
  `);
  console.log('✅ Migration 017 rolled back');
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

