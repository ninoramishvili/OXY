const pool = require('../db');

const up = async () => {
  console.log('⭐ Creating session_feedback table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS session_feedback (
      id SERIAL PRIMARY KEY,
      booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      coach_id INT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (booking_id)
    );
  `);
  
  console.log('  ✓ Created session_feedback table');
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_session_feedback_user_id ON session_feedback(user_id);
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_session_feedback_coach_id ON session_feedback(coach_id);
  `);
  
  console.log('  ✓ Created indexes');
  console.log('✅ Session feedback table created successfully');
};

const down = async () => {
  console.log('🗑️ Dropping session_feedback table...');
  await pool.query('DROP TABLE IF EXISTS session_feedback;');
  console.log('  ✓ Dropped session_feedback table');
  console.log('⏪ Session feedback table reverted');
};

module.exports = { up, down };

