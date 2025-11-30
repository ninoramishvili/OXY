/**
 * Migration: Create Tables
 * Creates all database tables for OXY platform
 */

const pool = require('../db');

const up = async () => {
  console.log('📦 Creating tables...');

  await pool.query(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Courses table
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      price DECIMAL(10, 2),
      duration VARCHAR(50),
      lessons INTEGER,
      image VARCHAR(10),
      color VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Coaches table
    CREATE TABLE IF NOT EXISTS coaches (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      title VARCHAR(100),
      specialty VARCHAR(200),
      bio TEXT,
      image VARCHAR(10),
      rating DECIMAL(3, 2),
      sessions INTEGER DEFAULT 0,
      price DECIMAL(10, 2),
      color VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Purchases table
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2),
      purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Bookings table
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
      booking_date DATE,
      booking_time TIME,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Migrations tracking table
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Tables created successfully');
};

const down = async () => {
  console.log('🗑️ Dropping tables...');
  
  await pool.query(`
    DROP TABLE IF EXISTS bookings CASCADE;
    DROP TABLE IF EXISTS purchases CASCADE;
    DROP TABLE IF EXISTS coaches CASCADE;
    DROP TABLE IF EXISTS courses CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS migrations CASCADE;
  `);

  console.log('✅ Tables dropped successfully');
};

module.exports = { up, down };

