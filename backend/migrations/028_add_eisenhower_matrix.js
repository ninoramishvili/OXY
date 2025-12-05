// Migration: Add Eisenhower Matrix (replace priority with is_urgent + is_important)

exports.up = async (pool) => {
  // Remove old priority column
  await pool.query(`
    ALTER TABLE tasks
    DROP COLUMN IF EXISTS priority;
  `);
  console.log('  ✓ Removed old priority column');
  
  // Add Eisenhower Matrix fields
  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;
  `);
  console.log('  ✓ Added is_urgent and is_important columns');
  
  console.log('✅ Migration 028: Eisenhower Matrix added');
};

exports.down = async (pool) => {
  await pool.query(`
    ALTER TABLE tasks
    DROP COLUMN IF EXISTS is_urgent,
    DROP COLUMN IF EXISTS is_important,
    ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium';
  `);
  console.log('✅ Migration 028 rolled back');
};


