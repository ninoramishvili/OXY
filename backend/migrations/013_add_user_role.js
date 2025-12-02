const pool = require('../db');

const up = async () => {
  console.log('👤 Adding role column to users table...');
  
  // Add role column with default 'user'
  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
  `);
  
  console.log('  ✓ Added role column');
  
  // Create a coach user (linked to the existing coach)
  // First check if coach user exists
  const existingCoach = await pool.query(
    "SELECT id FROM users WHERE role = 'coach'"
  );
  
  if (existingCoach.rows.length === 0) {
    // Create coach user account
    await pool.query(`
      INSERT INTO users (name, email, username, password, role)
      VALUES ('Nino Ramishvili', 'nino@oxy.com', 'coach', 'coach123', 'coach')
      ON CONFLICT (username) DO UPDATE SET role = 'coach';
    `);
    console.log('  ✓ Created coach user account (username: coach, password: coach123)');
  }
  
  console.log('✅ User roles setup complete');
};

const down = async () => {
  console.log('🗑️ Removing role column...');
  await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS role;');
  console.log('  ✓ Removed role column');
  console.log('⏪ User roles reverted');
};

module.exports = { up, down };

