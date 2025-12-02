/**
 * Migration: Create Productivity Tables (MVP)
 * Basic task management and scheduling
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 022_create_productivity_tables');
  
  // Task categories
  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_categories (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(10) DEFAULT '📋',
      color VARCHAR(7) DEFAULT '#6B7280',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✓ Created task_categories table');

  // Tasks
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category_id INT REFERENCES task_categories(id) ON DELETE SET NULL,
      priority VARCHAR(10) DEFAULT 'medium',
      estimated_minutes INT DEFAULT 30,
      status VARCHAR(20) DEFAULT 'backlog',
      scheduled_date DATE,
      scheduled_time TIME,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✓ Created tasks table');

  // Insert default categories for existing users
  await pool.query(`
    INSERT INTO task_categories (user_id, name, icon, color)
    SELECT id, 'Work', '💼', '#3B82F6' FROM users
    ON CONFLICT DO NOTHING;
  `);
  await pool.query(`
    INSERT INTO task_categories (user_id, name, icon, color)
    SELECT id, 'Personal', '👤', '#8B5CF6' FROM users
    ON CONFLICT DO NOTHING;
  `);
  await pool.query(`
    INSERT INTO task_categories (user_id, name, icon, color)
    SELECT id, 'Health', '🏃', '#10B981' FROM users
    ON CONFLICT DO NOTHING;
  `);
  await pool.query(`
    INSERT INTO task_categories (user_id, name, icon, color)
    SELECT id, 'Learning', '📚', '#F59E0B' FROM users
    ON CONFLICT DO NOTHING;
  `);
  console.log('  ✓ Added default categories');

  console.log('✅ Migration 022 completed');
}

async function down() {
  await pool.query('DROP TABLE IF EXISTS tasks CASCADE');
  await pool.query('DROP TABLE IF EXISTS task_categories CASCADE');
  console.log('✅ Migration 022 rolled back');
}

module.exports = { up, down };

if (require.main === module) {
  up().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

