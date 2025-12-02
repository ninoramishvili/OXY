/**
 * Migration: Create Admin User
 * Adds a default admin user with full permissions
 */

const pool = require('../db');

async function up() {
  console.log('Running migration: 019_create_admin_user');
  
  // Check if admin user already exists
  const existing = await pool.query("SELECT id FROM users WHERE username = 'admin'");
  
  if (existing.rows.length === 0) {
    await pool.query(`
      INSERT INTO users (username, password, name, email, role)
      VALUES ('admin', 'admin123', 'Administrator', 'admin@oxy.com', 'admin')
    `);
    console.log('✅ Created admin user (username: admin, password: admin123)');
  } else {
    // Update existing admin to have admin role
    await pool.query("UPDATE users SET role = 'admin' WHERE username = 'admin'");
    console.log('✅ Updated existing admin user with admin role');
  }
  
  console.log('✅ Migration 019 completed');
}

async function down() {
  await pool.query("DELETE FROM users WHERE username = 'admin' AND role = 'admin'");
  console.log('✅ Migration 019 rolled back');
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

