/**
 * Migration: Add Coach Availability
 * Creates table for coach working hours and updates bookings
 */

const pool = require('../db');

const up = async () => {
  console.log('📅 Creating coach availability tables...');

  await pool.query(`
    -- Coach working hours (which days/times they're available)
    CREATE TABLE IF NOT EXISTS coach_availability (
      id SERIAL PRIMARY KEY,
      coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
      start_time TIME NOT NULL DEFAULT '09:00',
      end_time TIME NOT NULL DEFAULT '17:00',
      is_available BOOLEAN DEFAULT true,
      UNIQUE(coach_id, day_of_week)
    );

    -- Add status to bookings if not exists
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='bookings' AND column_name='status') THEN
        ALTER TABLE bookings ADD COLUMN status VARCHAR(20) DEFAULT 'confirmed';
      END IF;
    END $$;
  `);

  // Seed default availability for all coaches (Mon-Fri, 9am-5pm)
  const coaches = await pool.query('SELECT id FROM coaches');
  
  for (const coach of coaches.rows) {
    // Monday to Friday (1-5)
    for (let day = 1; day <= 5; day++) {
      const existing = await pool.query(
        'SELECT id FROM coach_availability WHERE coach_id = $1 AND day_of_week = $2',
        [coach.id, day]
      );
      
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)',
          [coach.id, day, '09:00', '17:00']
        );
      }
    }
    console.log(`  ✓ Set availability for coach ${coach.id}`);
  }

  console.log('✅ Coach availability created successfully');
};

const down = async () => {
  console.log('🗑️ Removing coach availability...');
  
  await pool.query('DROP TABLE IF EXISTS coach_availability CASCADE');

  console.log('✅ Coach availability removed');
};

module.exports = { up, down };

