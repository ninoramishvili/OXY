/**
 * Migration: Update Icons & Colors
 * Updates courses and coaches with modern icons and vibrant colors
 */

const pool = require('../db');

// Modern course icons and colors
const courseUpdates = [
  { title: 'Managing Anxiety', image: '🧠', color: '#FADCD7' },
  { title: 'Productivity Mastery', image: '⚡', color: '#D4EFEF' },
  { title: 'Time Management', image: '📅', color: '#FADCD7' },
  { title: 'Deep Focus', image: '🎯', color: '#D4EFEF' },
  { title: 'Embracing Change', image: '✨', color: '#FADCD7' },
  { title: 'Motivation & Drive', image: '💪', color: '#D4EFEF' }
];

// Modern coach icons and colors
const coachUpdates = [
  { name: 'Sarah Mitchell', image: '👤', color: '#FADCD7' },
  { name: 'David Chen', image: '👤', color: '#D4EFEF' },
  { name: 'Emma Rodriguez', image: '👤', color: '#FADCD7' },
  { name: 'Michael Brooks', image: '👤', color: '#D4EFEF' }
];

const up = async () => {
  console.log('🎨 Updating icons and colors...');

  // Update courses
  for (const course of courseUpdates) {
    await pool.query(
      'UPDATE courses SET image = $1, color = $2 WHERE title = $3',
      [course.image, course.color, course.title]
    );
    console.log(`  ✓ Updated course: ${course.title}`);
  }

  // Update coaches
  for (const coach of coachUpdates) {
    await pool.query(
      'UPDATE coaches SET image = $1, color = $2 WHERE name = $3',
      [coach.image, coach.color, coach.name]
    );
    console.log(`  ✓ Updated coach: ${coach.name}`);
  }

  console.log('✅ Icons and colors updated successfully');
};

const down = async () => {
  console.log('↩️ Reverting icons and colors...');

  // Revert courses to old icons
  const oldCourses = [
    { title: 'Managing Anxiety', image: '🧘', color: '#E8D5E0' },
    { title: 'Productivity Mastery', image: '🚀', color: '#D5E8D4' },
    { title: 'Time Management', image: '⏰', color: '#FFE5D9' },
    { title: 'Deep Focus', image: '🎯', color: '#FFF3CD' },
    { title: 'Embracing Change', image: '🦋', color: '#D4E5F7' },
    { title: 'Motivation & Drive', image: '🔥', color: '#F7E4D4' }
  ];

  for (const course of oldCourses) {
    await pool.query(
      'UPDATE courses SET image = $1, color = $2 WHERE title = $3',
      [course.image, course.color, course.title]
    );
  }

  // Revert coaches to old icons
  const oldCoaches = [
    { name: 'Sarah Mitchell', image: '👩‍💼', color: '#E8D5E0' },
    { name: 'David Chen', image: '👨‍💼', color: '#D5E8D4' },
    { name: 'Emma Rodriguez', image: '👩‍🏫', color: '#FFE5D9' },
    { name: 'Michael Brooks', image: '👨‍🏫', color: '#FFF3CD' }
  ];

  for (const coach of oldCoaches) {
    await pool.query(
      'UPDATE coaches SET image = $1, color = $2 WHERE name = $3',
      [coach.image, coach.color, coach.name]
    );
  }

  console.log('✅ Icons and colors reverted');
};

module.exports = { up, down };

