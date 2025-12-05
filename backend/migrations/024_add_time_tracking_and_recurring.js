// Migration: Add time tracking and recurring tasks support

exports.up = async (pool) => {
  // Create time_entries table for tracking actual time spent
  await pool.query(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE,
      duration_minutes INTEGER,
      entry_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add recurring task columns to tasks table
  await pool.query(`
    ALTER TABLE tasks 
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS recurrence_rule VARCHAR(50),
    ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
    ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS actual_minutes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
  `);

  // Create index for faster queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
  `);

  console.log('✅ Migration 024: Time tracking and recurring tasks tables created');
};

exports.down = async (pool) => {
  await pool.query(`
    DROP INDEX IF EXISTS idx_time_entries_user_date;
    DROP INDEX IF EXISTS idx_time_entries_task;
  `);

  await pool.query(`
    ALTER TABLE tasks 
    DROP COLUMN IF EXISTS is_recurring,
    DROP COLUMN IF EXISTS recurrence_rule,
    DROP COLUMN IF EXISTS recurrence_end_date,
    DROP COLUMN IF EXISTS parent_task_id,
    DROP COLUMN IF EXISTS actual_minutes,
    DROP COLUMN IF EXISTS started_at,
    DROP COLUMN IF EXISTS is_active;
  `);

  await pool.query(`DROP TABLE IF EXISTS time_entries;`);
  
  console.log('✅ Migration 024 rolled back');
};
