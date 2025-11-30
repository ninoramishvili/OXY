/**
 * Migration: Seed Coaches
 * Inserts initial coach data from hardcoded values
 */

const pool = require('../db');

// Data from backend/data/coaches.js
const coaches = [
  {
    name: 'Sarah Mitchell',
    title: 'Life Coach',
    specialty: 'Personal Growth & Transitions',
    bio: 'With 10 years of experience, Sarah helps clients navigate life changes and discover their true potential.',
    image: '👩‍💼',
    rating: 4.9,
    sessions: 500,
    price: 80,
    color: '#E8D5E0'
  },
  {
    name: 'David Chen',
    title: 'Mindfulness Coach',
    specialty: 'Stress & Anxiety Management',
    bio: 'David combines Eastern wisdom with modern psychology to help you find inner peace.',
    image: '👨‍💼',
    rating: 4.8,
    sessions: 350,
    price: 75,
    color: '#D5E8D4'
  },
  {
    name: 'Emma Rodriguez',
    title: 'Career Coach',
    specialty: 'Productivity & Work-Life Balance',
    bio: 'Emma empowers professionals to achieve career success without sacrificing wellbeing.',
    image: '👩‍🏫',
    rating: 4.9,
    sessions: 420,
    price: 90,
    color: '#FFE5D9'
  },
  {
    name: 'Michael Brooks',
    title: 'Wellness Coach',
    specialty: 'Holistic Wellbeing',
    bio: 'Michael takes a whole-person approach to help you thrive in all areas of life.',
    image: '👨‍🏫',
    rating: 4.7,
    sessions: 280,
    price: 70,
    color: '#FFF3CD'
  }
];

const up = async () => {
  console.log('👥 Seeding coaches...');

  for (const coach of coaches) {
    // Check if coach already exists
    const existing = await pool.query(
      'SELECT id FROM coaches WHERE name = $1',
      [coach.name]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO coaches (name, title, specialty, bio, image, rating, sessions, price, color) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [coach.name, coach.title, coach.specialty, coach.bio, coach.image,
         coach.rating, coach.sessions, coach.price, coach.color]
      );
      console.log(`  ✓ Created coach: ${coach.name}`);
    } else {
      console.log(`  ⊘ Coach already exists: ${coach.name}`);
    }
  }

  console.log('✅ Coaches seeded successfully');
};

const down = async () => {
  console.log('🗑️ Removing seeded coaches...');
  
  for (const coach of coaches) {
    await pool.query('DELETE FROM coaches WHERE name = $1', [coach.name]);
  }

  console.log('✅ Coaches removed');
};

module.exports = { up, down };

