/**
 * Migration: Seed Courses
 * Inserts initial course data from hardcoded values
 */

const pool = require('../db');

// Data from backend/data/courses.js
const courses = [
  {
    title: 'Managing Anxiety',
    description: 'Learn practical techniques to understand and manage anxiety in your daily life.',
    category: 'Mental Health',
    price: 49.99,
    duration: '4 weeks',
    lessons: 12,
    image: '🧘',
    color: '#E8D5E0'
  },
  {
    title: 'Productivity Mastery',
    description: 'Boost your productivity with proven methods and build lasting habits.',
    category: 'Productivity',
    price: 59.99,
    duration: '3 weeks',
    lessons: 10,
    image: '🚀',
    color: '#D5E8D4'
  },
  {
    title: 'Time Management',
    description: 'Take control of your time and achieve more while feeling less stressed.',
    category: 'Productivity',
    price: 39.99,
    duration: '2 weeks',
    lessons: 8,
    image: '⏰',
    color: '#FFE5D9'
  },
  {
    title: 'Deep Focus',
    description: 'Train your mind to achieve deep focus and eliminate distractions.',
    category: 'Mental Skills',
    price: 44.99,
    duration: '3 weeks',
    lessons: 9,
    image: '🎯',
    color: '#FFF3CD'
  },
  {
    title: 'Embracing Change',
    description: 'Develop resilience and learn to thrive during life transitions.',
    category: 'Personal Growth',
    price: 54.99,
    duration: '4 weeks',
    lessons: 11,
    image: '🦋',
    color: '#D4E5F7'
  },
  {
    title: 'Motivation & Drive',
    description: 'Discover your inner motivation and maintain momentum toward your goals.',
    category: 'Personal Growth',
    price: 49.99,
    duration: '3 weeks',
    lessons: 10,
    image: '🔥',
    color: '#F7E4D4'
  }
];

const up = async () => {
  console.log('📚 Seeding courses...');

  for (const course of courses) {
    // Check if course already exists
    const existing = await pool.query(
      'SELECT id FROM courses WHERE title = $1',
      [course.title]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO courses (title, description, category, price, duration, lessons, image, color) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [course.title, course.description, course.category, course.price, 
         course.duration, course.lessons, course.image, course.color]
      );
      console.log(`  ✓ Created course: ${course.title}`);
    } else {
      console.log(`  ⊘ Course already exists: ${course.title}`);
    }
  }

  console.log('✅ Courses seeded successfully');
};

const down = async () => {
  console.log('🗑️ Removing seeded courses...');
  
  for (const course of courses) {
    await pool.query('DELETE FROM courses WHERE title = $1', [course.title]);
  }

  console.log('✅ Courses removed');
};

module.exports = { up, down };

