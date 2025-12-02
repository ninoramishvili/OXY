const pool = require('../db');

const up = async () => {
  console.log('💬 Creating coach_comments table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coach_comments (
      id SERIAL PRIMARY KEY,
      booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      coach_id INT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (booking_id)
    );
  `);
  
  console.log('  ✓ Created coach_comments table');
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_coach_comments_user_id ON coach_comments(user_id);
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_coach_comments_booking_id ON coach_comments(booking_id);
  `);
  
  console.log('  ✓ Created indexes');
  console.log('✅ Coach comments table created successfully');
};

const down = async () => {
  console.log('🗑️ Dropping coach_comments table...');
  await pool.query('DROP TABLE IF EXISTS coach_comments;');
  console.log('  ✓ Dropped coach_comments table');
  console.log('⏪ Coach comments table reverted');
};

module.exports = { up, down };

