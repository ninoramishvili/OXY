/**
 * Migration: Update Coach to Nino Coach
 * Updates the single coach to be "Nino Coach"
 */

const pool = require('../db');

const up = async () => {
  console.log('👤 Updating coach to Nino Coach...');
  
  await pool.query(`
    UPDATE coaches 
    SET name = 'Nino Coach',
        title = 'Life & Mindset Coach',
        specialty = 'Personal Transformation',
        bio = 'Nino is a certified life coach specializing in personal transformation, mindset shifts, and helping individuals unlock their full potential. With a warm and empathetic approach, Nino guides clients through life transitions, career decisions, and personal growth journeys.',
        rating = 4.9,
        sessions = 500,
        price = 75
    WHERE id = (SELECT id FROM coaches LIMIT 1)
  `);
  
  console.log('  ✓ Updated coach to Nino Coach');
  console.log('✅ Coach updated successfully');
};

const down = async () => {
  console.log('↩️ Reverting coach name...');
  
  await pool.query(`
    UPDATE coaches 
    SET name = 'Sarah Mitchell',
        title = 'Life Coach',
        specialty = 'Personal Growth & Transitions',
        bio = 'With 10 years of experience, Sarah helps clients navigate life changes and discover their true potential.',
        rating = 4.9,
        sessions = 500,
        price = 80
    WHERE id = (SELECT id FROM coaches LIMIT 1)
  `);
  
  console.log('✅ Coach reverted');
};

module.exports = { up, down };

