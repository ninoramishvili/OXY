// Migration: Add Eat The Frog and Daily Highlight features

exports.up = async (pool) => {
  // Add is_frog and is_highlight columns to tasks
  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS is_frog BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS frog_completed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS highlight_completed_at TIMESTAMP WITH TIME ZONE;
  `);
  
  // Create frog_history table to track daily frogs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS frog_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
      frog_date DATE NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, frog_date)
    );
  `);
  
  // Create highlight_history table to track daily highlights
  await pool.query(`
    CREATE TABLE IF NOT EXISTS highlight_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
      highlight_date DATE NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, highlight_date)
    );
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_frog_history_user_date ON frog_history(user_id, frog_date);
    CREATE INDEX IF NOT EXISTS idx_highlight_history_user_date ON highlight_history(user_id, highlight_date);
  `);
  
  console.log('✅ Migration 026: Eat The Frog & Daily Highlight tables created');
};

exports.down = async (pool) => {
  await pool.query('DROP TABLE IF EXISTS highlight_history;');
  await pool.query('DROP TABLE IF EXISTS frog_history;');
  await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS is_frog;');
  await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS frog_completed_at;');
  await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS is_highlight;');
  await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS highlight_completed_at;');
  console.log('✅ Migration 026 rolled back');
};

