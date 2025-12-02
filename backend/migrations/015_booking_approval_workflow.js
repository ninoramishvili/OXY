/**
 * Migration: Booking Approval Workflow
 * Adds decline_reason column and updates booking flow for coach approval
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 015_booking_approval_workflow');
  
  await pool.query(`
    -- Add decline_reason column to bookings if not exists
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='bookings' AND column_name='decline_reason') THEN
        ALTER TABLE bookings ADD COLUMN decline_reason TEXT;
      END IF;
    END $$;
    
    -- Add updated_at column if not exists
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='bookings' AND column_name='updated_at') THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      END IF;
    END $$;
  `);
  
  console.log('✅ Migration 015 completed: Booking approval workflow ready');
}

async function down() {
  await pool.query(`
    ALTER TABLE bookings DROP COLUMN IF EXISTS decline_reason;
    ALTER TABLE bookings DROP COLUMN IF EXISTS updated_at;
  `);
  console.log('✅ Migration 015 rolled back');
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

