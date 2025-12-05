// Migration: Add Daily Highlight feature

exports.up = async (pool) => {
  // Add is_highlight column to tasks (if not exists)
  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS highlight_completed_at TIMESTAMP WITH TIME ZONE;
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
  
  // Create index
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_highlight_history_user_date ON highlight_history(user_id, highlight_date);
  `);
  
  console.log('✅ Migration 027: Daily Highlight tables created');
};

exports.down = async (pool) => {
  await pool.query('DROP TABLE IF EXISTS highlight_history;');
  await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS is_highlight;');
  await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS highlight_completed_at;');
  console.log('✅ Migration 027 rolled back');
};


