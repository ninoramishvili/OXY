/**
 * Migration: Remove Extra Coaches
 * Keep only one coach (Sarah Mitchell)
 */

const pool = require('../db');

const up = async () => {
  console.log('🗑️ Removing extra coaches (keeping only Sarah Mitchell)...');
  
  // Delete bookings for coaches being removed
  await pool.query(`
    DELETE FROM bookings 
    WHERE coach_id IN (SELECT id FROM coaches WHERE name != 'Sarah Mitchell')
  `);
  
  // Delete availability for coaches being removed
  await pool.query(`
    DELETE FROM coach_availability 
    WHERE coach_id IN (SELECT id FROM coaches WHERE name != 'Sarah Mitchell')
  `);
  
  // Delete all coaches except Sarah Mitchell
  const result = await pool.query(`
    DELETE FROM coaches WHERE name != 'Sarah Mitchell'
  `);
  
  console.log(`  ✓ Removed ${result.rowCount} coaches`);
  console.log('✅ Extra coaches removed successfully');
};

const down = async () => {
  console.log('↩️ Re-adding coaches...');
  
  const coaches = [
    {
      name: 'David Chen',
      title: 'Mindfulness Coach',
      specialty: 'Stress & Anxiety Management',
      bio: 'David combines Eastern wisdom with modern psychology to help you find inner peace.',
      image: '👤',
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
      image: '👤',
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
      image: '👤',
      rating: 4.7,
      sessions: 280,
      price: 70,
      color: '#FFF3CD'
    }
  ];

  for (const coach of coaches) {
    await pool.query(
      `INSERT INTO coaches (name, title, specialty, bio, image, rating, sessions, price, color) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [coach.name, coach.title, coach.specialty, coach.bio, coach.image,
       coach.rating, coach.sessions, coach.price, coach.color]
    );
  }
  
  console.log('✅ Coaches re-added');
};

module.exports = { up, down };

