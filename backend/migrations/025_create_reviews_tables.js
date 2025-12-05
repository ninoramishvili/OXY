// Migration: Create daily and weekly reviews tables for analytics

exports.up = async (pool) => {
  // Daily reviews table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      review_date DATE NOT NULL,
      productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
      notes TEXT,
      total_planned_minutes INTEGER DEFAULT 0,
      total_actual_minutes INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      tasks_planned INTEGER DEFAULT 0,
      is_finalized BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, review_date)
    );
  `);

  // Weekly reviews table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS weekly_reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start DATE NOT NULL,
      productivity_score DECIMAL(3,1),
      total_hours DECIMAL(5,1) DEFAULT 0,
      goals_achieved INTEGER DEFAULT 0,
      goals_total INTEGER DEFAULT 0,
      notes TEXT,
      is_finalized BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, week_start)
    );
  `);

  // Weekly goals table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS weekly_goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start DATE NOT NULL,
      goal_text VARCHAR(255) NOT NULL,
      is_achieved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_daily_reviews_user_date ON daily_reviews(user_id, review_date);
    CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_week ON weekly_reviews(user_id, week_start);
    CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_week ON weekly_goals(user_id, week_start);
  `);

  console.log('✅ Migration 025: Reviews tables created');
};

exports.down = async (pool) => {
  await pool.query(`DROP TABLE IF EXISTS weekly_goals;`);
  await pool.query(`DROP TABLE IF EXISTS weekly_reviews;`);
  await pool.query(`DROP TABLE IF EXISTS daily_reviews;`);
  console.log('✅ Migration 025 rolled back');
};


