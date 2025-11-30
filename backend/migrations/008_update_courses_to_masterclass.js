/**
 * Migration: Update Courses to Masterclass Format
 * Changes all courses to single 2-hour masterclass sessions
 */

const pool = require('../db');

const up = async () => {
  console.log('🎓 Updating courses to masterclass format...');
  
  // Update all courses to be 2-hour single session masterclasses
  await pool.query(`
    UPDATE courses 
    SET lessons = 1, 
        duration = '2 hours'
  `);
  
  console.log('  ✓ Updated all courses to single 2-hour masterclass format');
  console.log('✅ Courses updated successfully');
};

const down = async () => {
  console.log('↩️ Reverting courses to multi-session format...');
  
  // Revert to original values
  const originalData = [
    { title: 'Managing Anxiety', lessons: 12, duration: '4 weeks' },
    { title: 'Productivity Mastery', lessons: 10, duration: '3 weeks' },
    { title: 'Time Management', lessons: 8, duration: '2 weeks' },
    { title: 'Deep Focus', lessons: 9, duration: '3 weeks' },
    { title: 'Embracing Change', lessons: 11, duration: '4 weeks' },
    { title: 'Motivation & Drive', lessons: 10, duration: '3 weeks' }
  ];
  
  for (const course of originalData) {
    await pool.query(
      'UPDATE courses SET lessons = $1, duration = $2 WHERE title = $3',
      [course.lessons, course.duration, course.title]
    );
  }
  
  console.log('✅ Courses reverted');
};

module.exports = { up, down };

