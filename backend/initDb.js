const pool = require('./db');

// SQL to create tables
const createTables = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
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
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Bookings table
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    coach_id INTEGER REFERENCES coaches(id),
    booking_date DATE,
    booking_time TIME,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Seed data
const seedData = async () => {
  // Check if data already exists
  const usersCheck = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(usersCheck.rows[0].count) > 0) {
    console.log('📦 Data already exists, skipping seed');
    return;
  }

  // Insert admin user
  await pool.query(`
    INSERT INTO users (username, password, name) 
    VALUES ('admin', 'password', 'Administrator')
  `);
  console.log('👤 Admin user created');

  // Insert courses
  const courses = [
    ['Managing Anxiety', 'Learn practical techniques to understand and manage anxiety in your daily life.', 'Mental Health', 49.99, '4 weeks', 12, '🧘', '#E8D5E0'],
    ['Productivity Mastery', 'Boost your productivity with proven methods and build lasting habits.', 'Productivity', 59.99, '3 weeks', 10, '🚀', '#D5E8D4'],
    ['Time Management', 'Take control of your time and achieve more while feeling less stressed.', 'Productivity', 39.99, '2 weeks', 8, '⏰', '#FFE5D9'],
    ['Deep Focus', 'Train your mind to achieve deep focus and eliminate distractions.', 'Mental Skills', 44.99, '3 weeks', 9, '🎯', '#FFF3CD'],
    ['Embracing Change', 'Develop resilience and learn to thrive during life transitions.', 'Personal Growth', 54.99, '4 weeks', 11, '🦋', '#D4E5F7'],
    ['Motivation & Drive', 'Discover your inner motivation and maintain momentum toward your goals.', 'Personal Growth', 49.99, '3 weeks', 10, '🔥', '#F7E4D4']
  ];

  for (const course of courses) {
    await pool.query(
      'INSERT INTO courses (title, description, category, price, duration, lessons, image, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      course
    );
  }
  console.log('📚 Courses created');

  // Insert coaches
  const coaches = [
    ['Sarah Mitchell', 'Life Coach', 'Personal Growth & Transitions', 'With 10 years of experience, Sarah helps clients navigate life changes and discover their true potential.', '👩‍💼', 4.9, 500, 80, '#E8D5E0'],
    ['David Chen', 'Mindfulness Coach', 'Stress & Anxiety Management', 'David combines Eastern wisdom with modern psychology to help you find inner peace.', '👨‍💼', 4.8, 350, 75, '#D5E8D4'],
    ['Emma Rodriguez', 'Career Coach', 'Productivity & Work-Life Balance', 'Emma empowers professionals to achieve career success without sacrificing wellbeing.', '👩‍🏫', 4.9, 420, 90, '#FFE5D9'],
    ['Michael Brooks', 'Wellness Coach', 'Holistic Wellbeing', 'Michael takes a whole-person approach to help you thrive in all areas of life.', '👨‍🏫', 4.7, 280, 70, '#FFF3CD']
  ];

  for (const coach of coaches) {
    await pool.query(
      'INSERT INTO coaches (name, title, specialty, bio, image, rating, sessions, price, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      coach
    );
  }
  console.log('👥 Coaches created');
};

// Run initialization
const initDatabase = async () => {
  try {
    console.log('🔧 Creating tables...');
    await pool.query(createTables);
    console.log('✅ Tables created successfully');

    console.log('🌱 Seeding data...');
    await seedData();
    console.log('✅ Database initialization complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initDatabase();

