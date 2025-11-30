/**
 * Migration: Seed Users
 * Inserts initial user data from hardcoded values
 */

const pool = require('../db');

// Data from backend/data/users.js
const users = [
  {
    username: 'admin',
    password: 'password',
    name: 'Administrator',
    email: 'admin@oxy.com'
  }
];

const up = async () => {
  console.log('👤 Seeding users...');

  for (const user of users) {
    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [user.username]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, password, name, email) VALUES ($1, $2, $3, $4)',
        [user.username, user.password, user.name, user.email]
      );
      console.log(`  ✓ Created user: ${user.username}`);
    } else {
      console.log(`  ⊘ User already exists: ${user.username}`);
    }
  }

  console.log('✅ Users seeded successfully');
};

const down = async () => {
  console.log('🗑️ Removing seeded users...');
  
  for (const user of users) {
    await pool.query('DELETE FROM users WHERE username = $1', [user.username]);
  }

  console.log('✅ Users removed');
};

module.exports = { up, down };

