const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_9JOfglFxNHd1@ep-little-river-agg6slu1-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to Neon PostgreSQL database');
    release();
  }
});

module.exports = pool;

