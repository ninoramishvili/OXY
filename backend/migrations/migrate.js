/**
 * Migration Runner
 * Executes all migrations in order, tracks which have been run
 * 
 * Usage:
 *   node migrations/migrate.js up      - Run all pending migrations
 *   node migrations/migrate.js down    - Rollback last migration
 *   node migrations/migrate.js reset   - Drop all tables and re-run migrations
 *   node migrations/migrate.js status  - Show migration status
 */

const pool = require('../db');
const fs = require('fs');
const path = require('path');

// Get all migration files in order
const getMigrationFiles = () => {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^\d{3}_.*\.js$/) && f !== 'migrate.js')
    .sort();
  return files;
};

// Check if migrations table exists
const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Get list of executed migrations
const getExecutedMigrations = async () => {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(r => r.name);
};

// Record migration as executed
const recordMigration = async (name) => {
  await pool.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
};

// Remove migration record
const removeMigrationRecord = async (name) => {
  await pool.query('DELETE FROM migrations WHERE name = $1', [name]);
};

// Run all pending migrations
const runUp = async () => {
  console.log('\n🚀 Running migrations...\n');
  
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  
  let ranCount = 0;
  
  for (const file of files) {
    if (!executed.includes(file)) {
      console.log(`\n📄 Running: ${file}`);
      console.log('─'.repeat(40));
      
      const migration = require(path.join(__dirname, file));
      await migration.up();
      await recordMigration(file);
      
      ranCount++;
    }
  }
  
  if (ranCount === 0) {
    console.log('✅ All migrations are up to date!\n');
  } else {
    console.log(`\n✅ Ran ${ranCount} migration(s)\n`);
  }
};

// Rollback last migration
const runDown = async () => {
  console.log('\n⏪ Rolling back last migration...\n');
  
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();
  
  if (executed.length === 0) {
    console.log('⚠️ No migrations to rollback\n');
    return;
  }
  
  const lastMigration = executed[executed.length - 1];
  console.log(`📄 Rolling back: ${lastMigration}`);
  console.log('─'.repeat(40));
  
  const migration = require(path.join(__dirname, lastMigration));
  await migration.down();
  await removeMigrationRecord(lastMigration);
  
  console.log(`\n✅ Rolled back: ${lastMigration}\n`);
};

// Reset database (drop all and re-run)
const runReset = async () => {
  console.log('\n🔄 Resetting database...\n');
  
  // Drop all tables
  await pool.query(`
    DROP TABLE IF EXISTS bookings CASCADE;
    DROP TABLE IF EXISTS purchases CASCADE;
    DROP TABLE IF EXISTS coaches CASCADE;
    DROP TABLE IF EXISTS courses CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS migrations CASCADE;
  `);
  
  console.log('🗑️ All tables dropped\n');
  
  // Run all migrations
  await runUp();
};

// Show migration status
const showStatus = async () => {
  console.log('\n📊 Migration Status\n');
  console.log('─'.repeat(50));
  
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  
  for (const file of files) {
    const status = executed.includes(file) ? '✅ Executed' : '⏳ Pending';
    console.log(`${status}  ${file}`);
  }
  
  console.log('─'.repeat(50));
  console.log(`Total: ${files.length} | Executed: ${executed.length} | Pending: ${files.length - executed.length}\n`);
};

// Main execution
const command = process.argv[2] || 'up';

const run = async () => {
  try {
    switch (command) {
      case 'up':
        await runUp();
        break;
      case 'down':
        await runDown();
        break;
      case 'reset':
        await runReset();
        break;
      case 'status':
        await showStatus();
        break;
      default:
        console.log(`
Usage: node migrations/migrate.js <command>

Commands:
  up      Run all pending migrations
  down    Rollback last migration
  reset   Drop all tables and re-run migrations
  status  Show migration status
        `);
    }
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    process.exit(1);
  }
};

run();

