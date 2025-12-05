const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============ USER ENDPOINTS ============

// POST /api/login - User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query(
      'SELECT id, username, name, email, role FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ 
        success: true, 
        message: 'Login successful!',
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          email: user.email,
          role: user.role || 'user'
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/users - Register new user
app.post('/api/users', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    
    // Validate required fields
    if (!username || !password || !name || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Check if username already exists
    const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    
    // Check if email already exists
    const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    const result = await pool.query(
      'INSERT INTO users (username, password, name, email) VALUES ($1, $2, $3, $4) RETURNING id, username, name, email, created_at',
      [username, password, name, email.toLowerCase()]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, name, email, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id - Get single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, email, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.params.id;
    
    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }
    
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, username, name, email, created_at',
      [name, email, userId]
    );
    
    if (result.rows.length > 0) {
      res.json({ success: true, message: 'Profile updated successfully', user: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change user password
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    
    // Verify current password
    const user = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.rows[0].password !== currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [newPassword, userId]
    );
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ COURSE ENDPOINTS ============

// GET /api/courses - Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:id - Get single course
app.get('/api/courses/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses - Create new course
app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, category, price, duration, lessons, image, color } = req.body;
    
    const result = await pool.query(
      `INSERT INTO courses (title, description, category, price, duration, lessons, image, color) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, category, price, duration, lessons, image || '📚', color || '#E8D5E0']
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Course created successfully!',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ COACH ENDPOINTS ============

// GET /api/coaches - Get all coaches
app.get('/api/coaches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coaches ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/coaches/:id - Get single coach
app.get('/api/coaches/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coaches WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Coach not found' });
    }
  } catch (error) {
    console.error('Error fetching coach:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/coaches - Create new coach
app.post('/api/coaches', async (req, res) => {
  try {
    const { name, title, specialty, bio, image, rating, sessions, price, color } = req.body;
    
    const result = await pool.query(
      `INSERT INTO coaches (name, title, specialty, bio, image, rating, sessions, price, color) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, title, specialty, bio, image || '👤', rating || 5.0, sessions || 0, price, color || '#E8D5E0']
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Coach created successfully!',
      coach: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating coach:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ REVIEW ENDPOINTS ============

// GET /api/reviews/course/:courseId - Get reviews for a course
app.get('/api/reviews/course/:courseId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.user_id, r.course_id, r.rating, r.comment, 
             r.created_at, r.updated_at,
             u.name as user_name, u.username
      FROM course_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.course_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.courseId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reviews/course/:courseId/average - Get average rating for a course
app.get('/api/reviews/course/:courseId/average', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
        COUNT(*) as review_count
      FROM course_reviews
      WHERE course_id = $1
    `, [req.params.courseId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching average rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/reviews - Create a review
app.post('/api/reviews', async (req, res) => {
  try {
    const { userId, courseId, rating, comment } = req.body;
    
    // Check if user has purchased the course
    const purchaseCheck = await pool.query(
      'SELECT id FROM purchases WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    
    if (purchaseCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You must purchase this course before reviewing' 
      });
    }
    
    // Check if user already reviewed this course
    const existingReview = await pool.query(
      'SELECT id FROM course_reviews WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this course' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO course_reviews (user_id, course_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, courseId, rating, comment]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/reviews/:reviewId - Update a review
app.put('/api/reviews/:reviewId', async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;
    const { reviewId } = req.params;
    
    // Check if review belongs to user
    const reviewCheck = await pool.query(
      'SELECT id FROM course_reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own reviews' 
      });
    }
    
    const result = await pool.query(
      'UPDATE course_reviews SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [rating, comment, reviewId]
    );
    
    res.json({ 
      success: true, 
      message: 'Review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/reviews/:reviewId - Delete a review
app.delete('/api/reviews/:reviewId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { reviewId } = req.params;
    
    // Check if review belongs to user
    const reviewCheck = await pool.query(
      'SELECT id FROM course_reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own reviews' 
      });
    }
    
    await pool.query('DELETE FROM course_reviews WHERE id = $1', [reviewId]);
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/reviews/user/:userId/course/:courseId - Check if user has reviewed
app.get('/api/reviews/user/:userId/course/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM course_reviews WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    
    res.json({ 
      hasReviewed: result.rows.length > 0,
      review: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error checking user review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ FAVORITES ENDPOINTS ============

// GET /api/favorites/user/:userId - Get user's favorites
app.get('/api/favorites/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.id, f.course_id, f.created_at,
             c.title as course_title, c.description, c.category, 
             c.price, c.duration, c.image, c.color
      FROM user_favorites f
      JOIN courses c ON f.course_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/favorites - Add to favorites
app.post('/api/favorites', async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    
    // Check if already favorited
    const existing = await pool.query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    
    if (existing.rows.length > 0) {
      return res.json({ success: true, message: 'Already in favorites', favoriteId: existing.rows[0].id });
    }
    
    const result = await pool.query(
      'INSERT INTO user_favorites (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [userId, courseId]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Added to favorites',
      favorite: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/favorites/:courseId/user/:userId - Remove from favorites
app.delete('/api/favorites/:courseId/user/:userId', async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    
    await pool.query(
      'DELETE FROM user_favorites WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );
    
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/favorites/check/:courseId/user/:userId - Check if course is favorited
app.get('/api/favorites/check/:courseId/user/:userId', async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    
    const result = await pool.query(
      'SELECT id FROM user_favorites WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );
    
    res.json({ isFavorite: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ PURCHASE ENDPOINTS ============

// GET /api/purchases - Get all purchases
app.get('/api/purchases', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username, u.name as user_name, c.title as course_title, c.image, c.category 
       FROM purchases p 
       JOIN users u ON p.user_id = u.id
       JOIN courses c ON p.course_id = c.id 
       ORDER BY p.purchased_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/purchases/user/:userId - Get user's purchases
app.get('/api/purchases/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              c.title as course_title, 
              c.image, 
              c.color,
              c.category, 
              c.description,
              c.price,
              c.duration
       FROM purchases p 
       JOIN courses c ON p.course_id = c.id 
       WHERE p.user_id = $1 
       ORDER BY p.purchased_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/purchases - Create new purchase
app.post('/api/purchases', async (req, res) => {
  try {
    const { courseId, userId } = req.body;
    
    // Check if already purchased
    const existing = await pool.query(
      'SELECT id FROM purchases WHERE user_id = $1 AND course_id = $2',
      [userId || 1, courseId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Course already purchased' });
    }
    
    // Get course price
    const course = await pool.query('SELECT price FROM courses WHERE id = $1', [courseId]);
    const amount = course.rows.length > 0 ? course.rows[0].price : 0;
    
    const result = await pool.query(
      'INSERT INTO purchases (course_id, user_id, amount) VALUES ($1, $2, $3) RETURNING *',
      [courseId, userId || 1, amount]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Course purchased successfully!',
      purchase: result.rows[0]
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ COACH AVAILABILITY ENDPOINTS ============

// GET /api/coaches/:id/availability - Get coach's working hours
app.get('/api/coaches/:id/availability', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM coach_availability WHERE coach_id = $1 ORDER BY day_of_week',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/coaches/:id/slots/:date - Get available time slots for a specific date
app.get('/api/coaches/:id/slots/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Get coach availability for this day
    const availability = await pool.query(
      'SELECT * FROM coach_availability WHERE coach_id = $1 AND day_of_week = $2 AND is_available = true',
      [id, dayOfWeek]
    );
    
    if (availability.rows.length === 0) {
      return res.json({ available: false, slots: [], message: 'Coach not available on this day' });
    }
    
    const { start_time, end_time } = availability.rows[0];
    
    // Generate 1-hour time slots
    const slots = [];
    const startHour = parseInt(start_time.split(':')[0]);
    const endHour = parseInt(end_time.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        time: timeSlot,
        display: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        available: true,
        bookedBy: null
      });
    }
    
    // Check which slots are already booked (include user names)
    const bookings = await pool.query(
      `SELECT b.id, b.booking_time, b.user_id, b.status, b.notes, u.name as user_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.coach_id = $1 AND b.booking_date = $2 AND b.status NOT IN ('cancelled', 'declined')`,
      [id, date]
    );
    
    // Mark booked slots
    for (const booking of bookings.rows) {
      // Handle different time formats from PostgreSQL
      const bookingTime = booking.booking_time;
      const bookingHour = typeof bookingTime === 'string' 
        ? bookingTime.substring(0, 5) 
        : `${bookingTime.hours.toString().padStart(2, '0')}:00`;
      
      const slot = slots.find(s => s.time === bookingHour);
      if (slot) {
        slot.available = false;
        slot.bookedBy = booking.user_id;
        slot.bookingId = booking.id;
        slot.userName = booking.user_name || 'Client';
        slot.status = booking.status;
        slot.notes = booking.notes;
      }
    }
    
    // Check for blocked slots
    const blockedSlots = await pool.query(
      'SELECT blocked_time, reason FROM blocked_slots WHERE coach_id = $1 AND blocked_date = $2',
      [id, date]
    );
    
    // Mark blocked slots
    for (const blocked of blockedSlots.rows) {
      const blockedTime = typeof blocked.blocked_time === 'string'
        ? blocked.blocked_time.substring(0, 5)
        : `${blocked.blocked_time.hours.toString().padStart(2, '0')}:00`;
      
      const slot = slots.find(s => s.time === blockedTime);
      if (slot && slot.available) {
        slot.available = false;
        slot.blocked = true;
        slot.blockReason = blocked.reason;
      }
    }
    
    res.json({ available: true, slots, date });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ BLOCKED SLOTS ENDPOINTS ============

// POST /api/coaches/:id/block - Block a time slot
app.post('/api/coaches/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, reason } = req.body;
    
    // Check if already blocked
    const existing = await pool.query(
      'SELECT id FROM blocked_slots WHERE coach_id = $1 AND blocked_date = $2 AND blocked_time = $3',
      [id, date, time]
    );
    
    if (existing.rows.length > 0) {
      return res.json({ success: true, message: 'Slot already blocked' });
    }
    
    await pool.query(
      'INSERT INTO blocked_slots (coach_id, blocked_date, blocked_time, reason) VALUES ($1, $2, $3, $4)',
      [id, date, time, reason || 'Blocked']
    );
    
    res.json({ success: true, message: 'Slot blocked successfully' });
  } catch (error) {
    console.error('Error blocking slot:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/coaches/:id/block - Unblock a time slot
app.delete('/api/coaches/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;
    
    await pool.query(
      'DELETE FROM blocked_slots WHERE coach_id = $1 AND blocked_date = $2 AND blocked_time = $3',
      [id, date, time]
    );
    
    res.json({ success: true, message: 'Slot unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking slot:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/coaches/:id/block-day - Block entire day
app.post('/api/coaches/:id/block-day', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, reason } = req.body;
    
    // Get coach availability for this day to know which slots to block
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    const availability = await pool.query(
      'SELECT start_time, end_time FROM coach_availability WHERE coach_id = $1 AND day_of_week = $2 AND is_available = true',
      [id, dayOfWeek]
    );
    
    if (availability.rows.length === 0) {
      return res.json({ success: true, message: 'No slots to block on this day' });
    }
    
    const { start_time, end_time } = availability.rows[0];
    const startHour = parseInt(start_time.split(':')[0]);
    const endHour = parseInt(end_time.split(':')[0]);
    
    // Block all slots for the day
    for (let hour = startHour; hour < endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      await pool.query(
        'INSERT INTO blocked_slots (coach_id, blocked_date, blocked_time, reason) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [id, date, timeSlot, reason || 'Day blocked']
      );
    }
    
    res.json({ success: true, message: 'Day blocked successfully' });
  } catch (error) {
    console.error('Error blocking day:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/coaches/:id/block-day - Unblock entire day
app.delete('/api/coaches/:id/block-day', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    
    await pool.query(
      'DELETE FROM blocked_slots WHERE coach_id = $1 AND blocked_date = $2',
      [id, date]
    );
    
    res.json({ success: true, message: 'Day unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking day:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ BOOKING ENDPOINTS ============

// GET /api/bookings - Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.username, u.name as user_name, c.name as coach_name, c.title as coach_title, c.image 
       FROM bookings b 
       JOIN users u ON b.user_id = u.id
       JOIN coaches c ON b.coach_id = c.id 
       ORDER BY b.booking_date DESC, b.booking_time DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/user/:userId - Get user's bookings
app.get('/api/bookings/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name as coach_name, c.title as coach_title, c.image, c.specialty
       FROM bookings b 
       JOIN coaches c ON b.coach_id = c.id 
       WHERE b.user_id = $1 
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/coach/:coachId - Get coach's bookings
app.get('/api/bookings/coach/:coachId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.name as user_name, u.email as user_email
       FROM bookings b 
       JOIN users u ON b.user_id = u.id 
       WHERE b.coach_id = $1 
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.params.coachId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings - Create new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { coachId, userId, date, time, notes } = req.body;
    
    // Check if slot is already booked
    const existing = await pool.query(
      `SELECT id FROM bookings 
       WHERE coach_id = $1 AND booking_date = $2 AND booking_time = $3 AND status NOT IN ('cancelled', 'declined')`,
      [coachId, date, time]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This time slot is already booked' 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO bookings (coach_id, user_id, booking_date, booking_time, notes, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [coachId, userId || 1, date, time, notes || null]
    );
    
    // Get user name for notification
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId || 1]);
    const userName = userResult.rows[0]?.name || 'A user';
    
    // Create notification for coach
    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    await pool.query(
      `INSERT INTO coach_notifications (coach_id, type, title, message, booking_id, user_id)
       VALUES ($1, 'new_booking', 'New Booking Request', $2, $3, $4)`,
      [coachId, `${userName} requested a session on ${formattedDate} at ${time.slice(0, 5)}`, result.rows[0].id, userId || 1]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Session booked successfully!',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/bookings/:id - Cancel a booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Check if booking exists and belongs to user
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    
    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const bookingData = booking.rows[0];
    
    // Update status to cancelled (soft delete)
    await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1",
      [id]
    );
    
    // Get user name for notification
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [bookingData.user_id]);
    const userName = userResult.rows[0]?.name || 'A user';
    
    // Create notification for coach
    const formattedDate = new Date(bookingData.booking_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    await pool.query(
      `INSERT INTO coach_notifications (coach_id, type, title, message, booking_id, user_id)
       VALUES ($1, 'booking_cancelled', 'Booking Cancelled', $2, $3, $4)`,
      [bookingData.coach_id, `${userName} cancelled their session on ${formattedDate} at ${bookingData.booking_time.slice(0, 5)}`, id, bookingData.user_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/bookings/:id/confirm - Coach confirms a pending booking
app.put('/api/bookings/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if booking exists and is pending
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    
    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is not pending' });
    }
    
    // Update status to confirmed
    await pool.query(
      "UPDATE bookings SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
    
    // Update coach session count
    await pool.query('UPDATE coaches SET sessions = sessions + 1 WHERE id = $1', [booking.rows[0].coach_id]);
    
    res.json({ 
      success: true, 
      message: 'Booking confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/bookings/:id/decline - Coach declines a pending booking
app.put('/api/bookings/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Check if booking exists and is pending
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    
    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is not pending' });
    }
    
    // Update status to declined with reason
    await pool.query(
      "UPDATE bookings SET status = 'declined', decline_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id, reason || 'No reason provided']
    );
    
    res.json({ 
      success: true, 
      message: 'Booking declined'
    });
  } catch (error) {
    console.error('Decline booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/bookings/:id/coach-cancel - Coach cancels a confirmed booking
app.put('/api/bookings/:id/coach-cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Get booking details
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    
    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const bookingData = booking.rows[0];
    
    if (bookingData.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }
    
    // Update status to cancelled with reason
    await pool.query(
      "UPDATE bookings SET status = 'cancelled', decline_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id, reason || 'Cancelled by coach']
    );
    
    // Decrement coach session count if was confirmed
    if (bookingData.status === 'confirmed') {
      await pool.query('UPDATE coaches SET sessions = GREATEST(0, sessions - 1) WHERE id = $1', [bookingData.coach_id]);
    }
    
    // Get user name for notification (to notify the user)
    const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [bookingData.user_id]);
    const userName = userResult.rows[0]?.name || 'User';
    
    // Note: In a real app, you'd send an email notification to the user here
    
    res.json({ 
      success: true, 
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    console.error('Coach cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/bookings/pending/:coachId - Get pending bookings for a coach
app.get('/api/bookings/pending/:coachId', async (req, res) => {
  try {
    const { coachId } = req.params;
    const result = await pool.query(
      `SELECT b.*, u.name as user_name, u.email as user_email
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.coach_id = $1 AND b.status = 'pending'
       ORDER BY b.booking_date ASC, b.booking_time ASC`,
      [coachId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ SESSION FEEDBACK ============

// POST /api/feedback - Submit session feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { bookingId, userId, coachId, rating, comment } = req.body;
    
    // Check if feedback already exists for this booking
    const existing = await pool.query(
      'SELECT id FROM session_feedback WHERE booking_id = $1',
      [bookingId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this session' });
    }
    
    const result = await pool.query(
      `INSERT INTO session_feedback (booking_id, user_id, coach_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [bookingId, userId, coachId, rating, comment || '']
    );
    
    res.status(201).json({ success: true, feedback: result.rows[0] });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/feedback/booking/:bookingId - Check if feedback exists for a booking
app.get('/api/feedback/booking/:bookingId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM session_feedback WHERE booking_id = $1',
      [req.params.bookingId]
    );
    res.json({ hasFeedback: result.rows.length > 0, feedback: result.rows[0] || null });
  } catch (error) {
    console.error('Error checking feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/feedback/coach/:coachId - Get all feedback for a coach
app.get('/api/feedback/coach/:coachId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sf.*, u.name as user_name, b.booking_date
       FROM session_feedback sf
       JOIN users u ON sf.user_id = u.id
       JOIN bookings b ON sf.booking_id = b.id
       WHERE sf.coach_id = $1
       ORDER BY sf.created_at DESC`,
      [req.params.coachId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coach feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/feedback/coach/:coachId/average - Get average rating for a coach
app.get('/api/feedback/coach/:coachId/average', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_reviews
       FROM session_feedback
       WHERE coach_id = $1`,
      [req.params.coachId]
    );
    res.json({
      averageRating: parseFloat(result.rows[0].average_rating).toFixed(1),
      totalReviews: parseInt(result.rows[0].total_reviews)
    });
  } catch (error) {
    console.error('Error fetching average rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/feedback/user/:userId - Get all feedback submitted by a user
app.get('/api/feedback/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sf.*, c.name as coach_name, b.booking_date
       FROM session_feedback sf
       JOIN coaches c ON sf.coach_id = c.id
       JOIN bookings b ON sf.booking_id = b.id
       WHERE sf.user_id = $1
       ORDER BY sf.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ COACH COMMENTS ============

// POST /api/coach-comments - Coach submits comment for a session
app.post('/api/coach-comments', async (req, res) => {
  try {
    const { bookingId, coachId, userId, comment, privateNotes } = req.body;
    
    // Check if comment already exists for this booking
    const existing = await pool.query(
      'SELECT id FROM coach_comments WHERE booking_id = $1',
      [bookingId]
    );
    
    if (existing.rows.length > 0) {
      // Update existing comment
      const result = await pool.query(
        `UPDATE coach_comments SET comment = $1, private_notes = $2, is_read = FALSE, created_at = CURRENT_TIMESTAMP
         WHERE booking_id = $3 RETURNING *`,
        [comment, privateNotes || null, bookingId]
      );
      return res.json({ success: true, comment: result.rows[0], updated: true });
    }
    
    const result = await pool.query(
      `INSERT INTO coach_comments (booking_id, coach_id, user_id, comment, private_notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [bookingId, coachId, userId, comment, privateNotes || null]
    );
    
    res.status(201).json({ success: true, comment: result.rows[0] });
  } catch (error) {
    console.error('Coach comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/coach-comments/booking/:bookingId - Get comment for a specific booking
app.get('/api/coach-comments/booking/:bookingId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM coach_comments WHERE booking_id = $1',
      [req.params.bookingId]
    );
    res.json({ hasComment: result.rows.length > 0, comment: result.rows[0] || null });
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/coach-comments/user/:userId - Get all comments for a user (excludes private notes)
app.get('/api/coach-comments/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cc.id, cc.booking_id, cc.coach_id, cc.user_id, cc.comment, cc.is_read, cc.created_at, 
              c.name as coach_name, b.booking_date, b.booking_time
       FROM coach_comments cc
       JOIN coaches c ON cc.coach_id = c.id
       JOIN bookings b ON cc.booking_id = b.id
       WHERE cc.user_id = $1
       ORDER BY cc.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/coach-comments/user/:userId/unread - Get unread comment count
app.get('/api/coach-comments/user/:userId/unread', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM coach_comments WHERE user_id = $1 AND is_read = FALSE',
      [req.params.userId]
    );
    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/coach-comments/:commentId/read - Mark comment as read
app.put('/api/coach-comments/:commentId/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE coach_comments SET is_read = TRUE WHERE id = $1',
      [req.params.commentId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking comment as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/coach-comments/user/:userId/read-all - Mark all comments as read
app.put('/api/coach-comments/user/:userId/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE coach_comments SET is_read = TRUE WHERE user_id = $1',
      [req.params.userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ COACH NOTIFICATIONS ============

// GET /api/coach-notifications/:coachId - Get all notifications for a coach
app.get('/api/coach-notifications/:coachId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cn.*, u.name as user_name, u.email as user_email,
              b.booking_date, b.booking_time
       FROM coach_notifications cn
       LEFT JOIN users u ON cn.user_id = u.id
       LEFT JOIN bookings b ON cn.booking_id = b.id
       WHERE cn.coach_id = $1
       ORDER BY cn.created_at DESC
       LIMIT 50`,
      [req.params.coachId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/coach-notifications/:coachId/unread - Get unread notification count
app.get('/api/coach-notifications/:coachId/unread', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM coach_notifications WHERE coach_id = $1 AND is_read = FALSE',
      [req.params.coachId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/coach-notifications/:notificationId/read - Mark notification as read
app.put('/api/coach-notifications/:notificationId/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE coach_notifications SET is_read = TRUE WHERE id = $1',
      [req.params.notificationId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/coach-notifications/:coachId/read-all - Mark all notifications as read
app.put('/api/coach-notifications/:coachId/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE coach_notifications SET is_read = TRUE WHERE coach_id = $1',
      [req.params.coachId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ STATS ENDPOINT ============

// GET /api/stats - Get platform statistics
app.get('/api/stats', async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const courses = await pool.query('SELECT COUNT(*) FROM courses');
    const coaches = await pool.query('SELECT COUNT(*) FROM coaches');
    const purchases = await pool.query('SELECT COUNT(*) FROM purchases');
    const bookings = await pool.query('SELECT COUNT(*) FROM bookings');
    const revenue = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM purchases');
    
    res.json({
      users: parseInt(users.rows[0].count),
      courses: parseInt(courses.rows[0].count),
      coaches: parseInt(coaches.rows[0].count),
      purchases: parseInt(purchases.rows[0].count),
      bookings: parseInt(bookings.rows[0].count),
      revenue: parseFloat(revenue.rows[0].total)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ADMIN ENDPOINTS ============

// GET /api/admin/stats - Get detailed admin statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const courses = await pool.query('SELECT COUNT(*) FROM courses');
    const coaches = await pool.query('SELECT COUNT(*) FROM coaches');
    const purchases = await pool.query('SELECT COUNT(*) FROM purchases');
    const bookings = await pool.query('SELECT COUNT(*) FROM bookings');
    const revenue = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM purchases');
    
    // Additional stats
    const pendingBookings = await pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'");
    const confirmedBookings = await pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'");
    const recentUsers = await pool.query('SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL \'7 days\'');
    const recentPurchases = await pool.query('SELECT COUNT(*) FROM purchases WHERE purchase_date > NOW() - INTERVAL \'7 days\'');
    
    res.json({
      users: parseInt(users.rows[0].count),
      courses: parseInt(courses.rows[0].count),
      coaches: parseInt(coaches.rows[0].count),
      purchases: parseInt(purchases.rows[0].count),
      bookings: parseInt(bookings.rows[0].count),
      revenue: parseFloat(revenue.rows[0].total),
      pendingBookings: parseInt(pendingBookings.rows[0].count),
      confirmedBookings: parseInt(confirmedBookings.rows[0].count),
      recentUsers: parseInt(recentUsers.rows[0].count),
      recentPurchases: parseInt(recentPurchases.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ADMIN - USER MANAGEMENT ============

// GET /api/admin/users - Get all users with details
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.*, 
             (SELECT COUNT(*) FROM purchases WHERE user_id = u.id) as purchases_count,
             (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as bookings_count
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id - Update user
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4',
      [name, email, role, id]
    );
    
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete user
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting admin users
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (user.rows[0]?.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin users' });
    }
    
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ ADMIN - COURSE MANAGEMENT ============

// POST /api/admin/courses - Create new course
app.post('/api/admin/courses', async (req, res) => {
  try {
    const { title, description, category, instructor, price, duration, level, image, color } = req.body;
    
    const result = await pool.query(
      `INSERT INTO courses (title, description, category, instructor, price, duration, level, image, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, category, instructor, price, duration, level, image || '📚', color || '#E8D5E0']
    );
    
    res.status(201).json({ success: true, course: result.rows[0] });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/courses/:id - Update course
app.put('/api/admin/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, instructor, price, duration, level, image, color } = req.body;
    
    await pool.query(
      `UPDATE courses SET title = $1, description = $2, category = $3, instructor = $4, 
       price = $5, duration = $6, level = $7, image = $8, color = $9 WHERE id = $10`,
      [title, description, category, instructor, price, duration, level, image, color, id]
    );
    
    res.json({ success: true, message: 'Course updated' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/courses/:id - Delete course
app.delete('/api/admin/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ ADMIN - COACH MANAGEMENT ============

// POST /api/admin/coaches - Create new coach
app.post('/api/admin/coaches', async (req, res) => {
  try {
    const { name, title, specialty, bio, experience, price, image } = req.body;
    
    const result = await pool.query(
      `INSERT INTO coaches (name, title, specialty, bio, experience, price, image, rating, sessions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 5.0, 0) RETURNING *`,
      [name, title, specialty, bio, experience, price, image || '👤']
    );
    
    res.status(201).json({ success: true, coach: result.rows[0] });
  } catch (error) {
    console.error('Error creating coach:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/coaches/:id - Update coach
app.put('/api/admin/coaches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, specialty, bio, experience, price, image } = req.body;
    
    await pool.query(
      `UPDATE coaches SET name = $1, title = $2, specialty = $3, bio = $4, 
       experience = $5, price = $6, image = $7 WHERE id = $8`,
      [name, title, specialty, bio, experience, price, image, id]
    );
    
    res.json({ success: true, message: 'Coach updated' });
  } catch (error) {
    console.error('Error updating coach:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/coaches/:id - Delete coach
app.delete('/api/admin/coaches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM coaches WHERE id = $1', [id]);
    res.json({ success: true, message: 'Coach deleted' });
  } catch (error) {
    console.error('Error deleting coach:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ ADMIN - BOOKING MANAGEMENT ============

// GET /api/admin/bookings - Get all bookings
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.name as user_name, u.email as user_email, c.name as coach_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN coaches c ON b.coach_id = c.id
      ORDER BY b.booking_date DESC, b.booking_time DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/bookings/:id/status - Update booking status
app.put('/api/admin/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true, message: 'Booking status updated' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/bookings/:id - Delete booking
app.delete('/api/admin/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ PRODUCTIVITY - CATEGORIES ============

// GET /api/categories/:userId - Get user's categories
app.get('/api/categories/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM task_categories WHERE user_id = $1 ORDER BY name',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories - Create category
app.post('/api/categories', async (req, res) => {
  try {
    const { userId, name, icon, color } = req.body;
    const result = await pool.query(
      'INSERT INTO task_categories (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, icon || '📋', color || '#6B7280']
    );
    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ PRODUCTIVITY - TASKS ============

// GET /api/tasks/:userId - Get all user's tasks
app.get('/api/tasks/:userId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:userId/date/:date - Get tasks for specific date
app.get('/api/tasks/:userId/date/:date', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.scheduled_date = $2
      ORDER BY t.scheduled_time ASC
    `, [req.params.userId, req.params.date]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:userId/backlog - Get backlog tasks (not scheduled)
app.get('/api/tasks/:userId/backlog', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND (t.scheduled_date IS NULL OR t.scheduled_date = '')
      ORDER BY 
        CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
        CASE 
          WHEN t.is_urgent AND t.is_important THEN 1  -- DO FIRST
          WHEN NOT t.is_urgent AND t.is_important THEN 2  -- SCHEDULE
          WHEN t.is_urgent AND NOT t.is_important THEN 3  -- DELEGATE
          ELSE 4  -- ELIMINATE
        END,
        t.created_at DESC
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching backlog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks - Create task (with recurring support)
app.post('/api/tasks', async (req, res) => {
  try {
    const { userId, title, description, categoryId, isUrgent, isImportant, estimatedMinutes, 
            scheduledDate, scheduledTime, scheduledEndDate, scheduledEndTime,
            isRecurring, recurrenceRule, recurrenceEndDate, status: providedStatus } = req.body;
    
    // Determine status: use provided status (for 2-min rule) or infer from schedule
    const status = providedStatus || (scheduledDate ? 'planned' : 'backlog');
    
    // If recurring, create a template task (no schedule) and generate all instances
    if (isRecurring && recurrenceRule && scheduledDate) {
      // Create the parent template task (stores recurrence info but not scheduled itself)
      const result = await pool.query(
        `INSERT INTO tasks (user_id, title, description, category_id, is_urgent, is_important, estimated_minutes, 
          scheduled_date, scheduled_time, scheduled_end_date, scheduled_end_time, status,
          is_recurring, recurrence_rule, recurrence_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, NULL, NULL, 'backlog', $8, $9, $10) RETURNING *`,
        [userId, title, description, categoryId, isUrgent || false, isImportant || false, estimatedMinutes || 30,
         true, recurrenceRule, recurrenceEndDate || null]
      );
      
      const parentTask = result.rows[0];
      
      // Generate all recurring instances including the first day
      const startDate = new Date(scheduledDate);
      const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : new Date(startDate);
      if (!recurrenceEndDate) {
        endDate.setMonth(endDate.getMonth() + 3); // Default 3 months ahead
      }
      
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        let shouldCreate = false;
        
        switch (recurrenceRule) {
          case 'daily':
            shouldCreate = true;
            break;
          case 'weekly':
            shouldCreate = currentDate.getDay() === startDate.getDay();
            break;
          case 'weekdays':
            shouldCreate = currentDate.getDay() >= 1 && currentDate.getDay() <= 5;
            break;
          case 'monthly':
            shouldCreate = currentDate.getDate() === startDate.getDate();
            break;
        }
        
        if (shouldCreate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          await pool.query(
            `INSERT INTO tasks (user_id, title, description, category_id, is_urgent, is_important, estimated_minutes,
             scheduled_date, scheduled_time, scheduled_end_date, scheduled_end_time, status, parent_task_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'planned', $12)`,
            [userId, title, description, categoryId, isUrgent || false, isImportant || false, estimatedMinutes || 30,
             dateStr, scheduledTime, dateStr, scheduledEndTime, parentTask.id]
          );
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      res.status(201).json({ success: true, task: parentTask });
    } else {
      // Non-recurring task - create normally
      const completedAt = status === 'completed' ? new Date() : null;
      const result = await pool.query(
        `INSERT INTO tasks (user_id, title, description, category_id, is_urgent, is_important, estimated_minutes, 
          scheduled_date, scheduled_time, scheduled_end_date, scheduled_end_time, status,
          is_recurring, recurrence_rule, recurrence_end_date, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
        [userId, title, description, categoryId, isUrgent || false, isImportant || false, estimatedMinutes || 30,
         scheduledDate || null, scheduledTime || null, scheduledEndDate || null, scheduledEndTime || null, status,
         false, null, null, completedAt]
      );
      
      res.status(201).json({ success: true, task: result.rows[0] });
    }
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, categoryId, isUrgent, isImportant, estimatedMinutes, status, 
            scheduledDate, scheduledTime, scheduledEndDate, scheduledEndTime } = req.body;
    await pool.query(
      `UPDATE tasks SET title = $1, description = $2, category_id = $3, is_urgent = $4, is_important = $5,
       estimated_minutes = $6, status = $7, scheduled_date = $8, scheduled_time = $9,
       scheduled_end_date = $10, scheduled_end_time = $11 WHERE id = $12`,
      [title, description, categoryId, isUrgent || false, isImportant || false, estimatedMinutes, status, 
       scheduledDate, scheduledTime, scheduledEndDate, scheduledEndTime, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/tasks/:id/schedule - Schedule task to a date/time
app.put('/api/tasks/:id/schedule', async (req, res) => {
  try {
    const { date, time, endDate, endTime } = req.body;
    
    if (endDate && endTime) {
      // If end date/time provided, use them
      await pool.query(
        `UPDATE tasks SET scheduled_date = $1, scheduled_time = $2, 
         scheduled_end_date = $3, scheduled_end_time = $4, status = 'planned' WHERE id = $5`,
        [date, time, endDate, endTime, req.params.id]
      );
    } else {
      // Calculate end time based on estimated_minutes
      await pool.query(
        `UPDATE tasks SET scheduled_date = $1, scheduled_time = $2, 
         scheduled_end_date = $1, 
         scheduled_end_time = ($2::TIME + (COALESCE(estimated_minutes, 30) * INTERVAL '1 minute'))::TIME,
         status = 'planned' WHERE id = $3`,
        [date, time, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error scheduling task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/tasks/:id/complete - Mark task complete or uncomplete (toggle)
app.put('/api/tasks/:id/complete', async (req, res) => {
  try {
    // Check current status
    const checkResult = await pool.query('SELECT status, scheduled_date FROM tasks WHERE id = $1', [req.params.id]);
    const task = checkResult.rows[0];
    
    if (task.status === 'completed') {
      // Uncomplete: set status back based on whether it's scheduled
      const newStatus = task.scheduled_date ? 'planned' : 'backlog';
      await pool.query(
        `UPDATE tasks SET status = $1, completed_at = NULL WHERE id = $2`,
        [newStatus, req.params.id]
      );
    } else {
      // Complete
      await pool.query(
        `UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [req.params.id]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling task completion:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/tasks/:id/unschedule - Move task back to backlog
app.put('/api/tasks/:id/unschedule', async (req, res) => {
  try {
    await pool.query(
      `UPDATE tasks SET scheduled_date = NULL, scheduled_time = NULL, status = 'backlog' WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error unscheduling task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/tasks/:id/delete-recurring - Delete recurring task with options
app.delete('/api/tasks/:id/delete-recurring', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { mode, taskDate } = req.body; // mode: 'single', 'following', 'all'
    
    // Get the task to find parent or check if it's a parent
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    const parentId = task.parent_task_id || task.id; // If this is a child, get parent; if parent, use own id
    const isParent = !task.parent_task_id;
    
    switch (mode) {
      case 'single':
        // Delete just this task
        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        break;
        
      case 'following':
        // Delete this task and all following (by date)
        if (isParent) {
          // Delete parent and all children from this date onwards
          await pool.query(
            `DELETE FROM tasks WHERE id = $1 OR (parent_task_id = $1 AND scheduled_date >= $2)`,
            [taskId, taskDate || task.scheduled_date]
          );
        } else {
          // Delete this child and all siblings from this date onwards
          await pool.query(
            `DELETE FROM tasks WHERE id = $1 OR (parent_task_id = $2 AND scheduled_date >= $3)`,
            [taskId, parentId, taskDate || task.scheduled_date]
          );
        }
        break;
        
      case 'all':
        // Delete the parent and all children in the series
        if (isParent) {
          // Delete this parent and all its children
          await pool.query('DELETE FROM tasks WHERE id = $1 OR parent_task_id = $1', [taskId]);
        } else {
          // Delete the parent and all siblings
          await pool.query('DELETE FROM tasks WHERE id = $1 OR parent_task_id = $1', [parentId]);
        }
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid mode' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/:userId/week/:startDate - Get tasks for a week (7 days from startDate)
app.get('/api/tasks/:userId/week/:startDate', async (req, res) => {
  try {
    const { userId, startDate } = req.params;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const result = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.scheduled_date >= $2 AND t.scheduled_date <= $3
      ORDER BY t.scheduled_date, t.scheduled_time
    `, [userId, startDate, endDate.toISOString().split('T')[0]]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching week tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/categories/:id - Update category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    await pool.query(
      'UPDATE task_categories SET name = $1, icon = $2, color = $3 WHERE id = $4',
      [name, icon, color, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/categories/:id - Delete category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM task_categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ TIME TRACKING ============

// PUT /api/tasks/:id/start - Start tracking time on a task
app.put('/api/tasks/:id/start', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // First, stop any other active tasks for this user
    const task = await pool.query('SELECT user_id FROM tasks WHERE id = $1', [taskId]);
    if (task.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    const userId = task.rows[0].user_id;
    
    // Stop other active tasks
    await pool.query(
      `UPDATE tasks SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE`,
      [userId]
    );
    
    // Start this task
    await pool.query(
      `UPDATE tasks SET is_active = TRUE, started_at = NOW(), status = 'in_progress' WHERE id = $1`,
      [taskId]
    );
    
    // Create a time entry
    await pool.query(
      `INSERT INTO time_entries (task_id, user_id, start_time, entry_date)
       VALUES ($1, $2, NOW(), CURRENT_DATE)`,
      [taskId, userId]
    );
    
    res.json({ success: true, message: 'Timer started' });
  } catch (error) {
    console.error('Error starting task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/tasks/:id/stop - Stop tracking time on a task
app.put('/api/tasks/:id/stop', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Get the active time entry
    const entryResult = await pool.query(
      `SELECT id, start_time FROM time_entries 
       WHERE task_id = $1 AND end_time IS NULL 
       ORDER BY start_time DESC LIMIT 1`,
      [taskId]
    );
    
    if (entryResult.rows.length > 0) {
      const entry = entryResult.rows[0];
      const durationMinutes = Math.round((Date.now() - new Date(entry.start_time).getTime()) / 60000);
      
      // Update the time entry
      await pool.query(
        `UPDATE time_entries SET end_time = NOW(), duration_minutes = $1 WHERE id = $2`,
        [durationMinutes, entry.id]
      );
      
      // Update the task's actual_minutes
      await pool.query(
        `UPDATE tasks SET 
         actual_minutes = COALESCE(actual_minutes, 0) + $1,
         is_active = FALSE,
         started_at = NULL
         WHERE id = $2`,
        [durationMinutes, taskId]
      );
    } else {
      // Just stop the task if no entry found
      await pool.query(
        `UPDATE tasks SET is_active = FALSE, started_at = NULL WHERE id = $1`,
        [taskId]
      );
    }
    
    res.json({ success: true, message: 'Timer stopped' });
  } catch (error) {
    console.error('Error stopping task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/:userId/active - Get the currently active task
app.get('/api/tasks/:userId/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.is_active = TRUE
      LIMIT 1
    `, [req.params.userId]);
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching active task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/time-entries/:userId - Get time entries for a user
app.get('/api/time-entries/:userId', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = `
      SELECT te.*, t.title as task_title, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE te.user_id = $1
    `;
    const params = [req.params.userId];
    
    if (date) {
      query += ` AND te.entry_date = $2`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND te.entry_date BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY te.start_time DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/time-entries/:userId/stats - Get time tracking stats
app.get('/api/time-entries/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Today's total
    const todayResult = await pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total 
       FROM time_entries WHERE user_id = $1 AND entry_date = $2`,
      [userId, today]
    );
    
    // This week's total
    const weekResult = await pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total 
       FROM time_entries WHERE user_id = $1 AND entry_date >= $2`,
      [userId, weekStartStr]
    );
    
    // Category breakdown for today
    const categoryResult = await pool.query(`
      SELECT c.name, c.icon, c.color, COALESCE(SUM(te.duration_minutes), 0) as minutes
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE te.user_id = $1 AND te.entry_date = $2
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY minutes DESC
    `, [userId, today]);
    
    // Tasks completed today
    const completedResult = await pool.query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE user_id = $1 AND status = 'completed' AND DATE(completed_at) = $2`,
      [userId, today]
    );
    
    res.json({
      todayMinutes: parseInt(todayResult.rows[0].total),
      weekMinutes: parseInt(weekResult.rows[0].total),
      categories: categoryResult.rows,
      tasksCompleted: parseInt(completedResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/time-entries - Manual time entry
app.post('/api/time-entries', async (req, res) => {
  try {
    const { taskId, userId, startTime, endTime, durationMinutes, date, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO time_entries (task_id, user_id, start_time, end_time, duration_minutes, entry_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [taskId, userId, startTime, endTime, durationMinutes, date, notes]
    );
    
    // Update task's actual_minutes
    await pool.query(
      `UPDATE tasks SET actual_minutes = COALESCE(actual_minutes, 0) + $1 WHERE id = $2`,
      [durationMinutes, taskId]
    );
    
    res.status(201).json({ success: true, entry: result.rows[0] });
  } catch (error) {
    console.error('Error creating time entry:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/time-entries/:id - Delete time entry
app.delete('/api/time-entries/:id', async (req, res) => {
  try {
    // Get the entry to update task actual_minutes
    const entry = await pool.query('SELECT task_id, duration_minutes FROM time_entries WHERE id = $1', [req.params.id]);
    
    if (entry.rows.length > 0) {
      // Subtract from task's actual_minutes
      await pool.query(
        `UPDATE tasks SET actual_minutes = GREATEST(0, COALESCE(actual_minutes, 0) - $1) WHERE id = $2`,
        [entry.rows[0].duration_minutes || 0, entry.rows[0].task_id]
      );
    }
    
    await pool.query('DELETE FROM time_entries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ RECURRING TASKS ============

// POST /api/tasks/:id/recurring - Set task as recurring
app.put('/api/tasks/:id/recurring', async (req, res) => {
  try {
    const { isRecurring, recurrenceRule, recurrenceEndDate } = req.body;
    
    await pool.query(
      `UPDATE tasks SET is_recurring = $1, recurrence_rule = $2, recurrence_end_date = $3 WHERE id = $4`,
      [isRecurring, recurrenceRule, recurrenceEndDate, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating recurring:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tasks/:id/generate-recurring - Generate recurring task instances
app.post('/api/tasks/:id/generate-recurring', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { days } = req.body; // How many days ahead to generate
    
    // Get the parent task
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    if (!task.is_recurring || !task.recurrence_rule) {
      return res.status(400).json({ success: false, message: 'Task is not recurring' });
    }
    
    const createdTasks = [];
    const startDate = task.scheduled_date ? new Date(task.scheduled_date) : new Date();
    const endDate = task.recurrence_end_date ? new Date(task.recurrence_end_date) : new Date();
    endDate.setDate(endDate.getDate() + (days || 30));
    
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1); // Start from next occurrence
    
    while (currentDate <= endDate) {
      let shouldCreate = false;
      
      switch (task.recurrence_rule) {
        case 'daily':
          shouldCreate = true;
          break;
        case 'weekly':
          shouldCreate = currentDate.getDay() === startDate.getDay();
          break;
        case 'weekdays':
          shouldCreate = currentDate.getDay() >= 1 && currentDate.getDay() <= 5;
          break;
        case 'monthly':
          shouldCreate = currentDate.getDate() === startDate.getDate();
          break;
      }
      
      if (shouldCreate) {
        // Check if instance already exists
        const dateStr = currentDate.toISOString().split('T')[0];
        const existing = await pool.query(
          `SELECT id FROM tasks WHERE parent_task_id = $1 AND scheduled_date = $2`,
          [taskId, dateStr]
        );
        
        if (existing.rows.length === 0) {
          const result = await pool.query(
            `INSERT INTO tasks (user_id, title, description, category_id, priority, estimated_minutes,
             scheduled_date, scheduled_time, scheduled_end_date, scheduled_end_time, status, parent_task_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'planned', $11) RETURNING *`,
            [task.user_id, task.title, task.description, task.category_id, task.priority, 
             task.estimated_minutes, dateStr, task.scheduled_time, dateStr, task.scheduled_end_time, taskId]
          );
          createdTasks.push(result.rows[0]);
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({ success: true, created: createdTasks.length, tasks: createdTasks });
  } catch (error) {
    console.error('Error generating recurring tasks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/:userId/recurring - Get all recurring task templates
app.get('/api/tasks/:userId/recurring', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.is_recurring = TRUE AND t.parent_task_id IS NULL
      ORDER BY t.title
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ANALYTICS & REVIEWS ============

// GET /api/analytics/:userId/daily/:date - Get daily analytics
app.get('/api/analytics/:userId/daily/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    // Tasks for the day
    const tasksResult = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.scheduled_date = $2
      ORDER BY t.scheduled_time
    `, [userId, date]);
    
    // Category breakdown
    const categoryResult = await pool.query(`
      SELECT c.id, c.name, c.icon, c.color,
             COUNT(t.id) as task_count,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
             SUM(t.estimated_minutes) as planned_minutes
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.scheduled_date = $2
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY planned_minutes DESC
    `, [userId, date]);
    
    // Summary stats
    const tasks = tasksResult.rows;
    const totalPlanned = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalCompleted = completedTasks.length;
    
    res.json({
      date,
      tasks,
      categories: categoryResult.rows,
      summary: {
        totalTasks: tasks.length,
        completedTasks: totalCompleted,
        completionRate: tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0,
        totalPlannedMinutes: totalPlanned,
        totalPlannedHours: (totalPlanned / 60).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/:userId/weekly/:weekStart - Get weekly analytics
app.get('/api/analytics/:userId/weekly/:weekStart', async (req, res) => {
  try {
    const { userId, weekStart } = req.params;
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    const weekEnd = endDate.toISOString().split('T')[0];
    
    // Daily breakdown
    const dailyResult = await pool.query(`
      SELECT 
        scheduled_date::date as date,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(estimated_minutes) as planned_minutes
      FROM tasks
      WHERE user_id = $1 AND scheduled_date >= $2 AND scheduled_date <= $3
      GROUP BY scheduled_date::date
      ORDER BY scheduled_date::date
    `, [userId, weekStart, weekEnd]);
    
    // Category breakdown for week
    const categoryResult = await pool.query(`
      SELECT c.id, c.name, c.icon, c.color,
             COUNT(t.id) as task_count,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
             SUM(t.estimated_minutes) as planned_minutes
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.scheduled_date >= $2 AND t.scheduled_date <= $3
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY planned_minutes DESC
    `, [userId, weekStart, weekEnd]);
    
    // Overall stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(estimated_minutes) as total_planned_minutes
      FROM tasks
      WHERE user_id = $1 AND scheduled_date >= $2 AND scheduled_date <= $3
    `, [userId, weekStart, weekEnd]);
    
    const stats = statsResult.rows[0];
    
    res.json({
      weekStart,
      weekEnd,
      daily: dailyResult.rows,
      categories: categoryResult.rows,
      summary: {
        totalTasks: parseInt(stats.total_tasks) || 0,
        completedTasks: parseInt(stats.completed_tasks) || 0,
        completionRate: stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0,
        totalPlannedMinutes: parseInt(stats.total_planned_minutes) || 0,
        totalPlannedHours: ((stats.total_planned_minutes || 0) / 60).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error fetching weekly analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/:userId/monthly/:year/:month - Get monthly analytics
app.get('/api/analytics/:userId/monthly/:year/:month', async (req, res) => {
  try {
    const { userId, year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
    
    // Weekly breakdown
    const weeklyResult = await pool.query(`
      SELECT 
        DATE_TRUNC('week', scheduled_date)::date as week_start,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(estimated_minutes) as planned_minutes
      FROM tasks
      WHERE user_id = $1 AND scheduled_date >= $2 AND scheduled_date <= $3
      GROUP BY DATE_TRUNC('week', scheduled_date)
      ORDER BY week_start
    `, [userId, startDate, endDate]);
    
    // Category breakdown
    const categoryResult = await pool.query(`
      SELECT c.id, c.name, c.icon, c.color,
             COUNT(t.id) as task_count,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
             SUM(t.estimated_minutes) as planned_minutes
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.scheduled_date >= $2 AND t.scheduled_date <= $3
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY planned_minutes DESC
    `, [userId, startDate, endDate]);
    
    // Overall stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(estimated_minutes) as total_planned_minutes
      FROM tasks
      WHERE user_id = $1 AND scheduled_date >= $2 AND scheduled_date <= $3
    `, [userId, startDate, endDate]);
    
    const stats = statsResult.rows[0];
    
    res.json({
      year,
      month,
      startDate,
      endDate,
      weekly: weeklyResult.rows,
      categories: categoryResult.rows,
      summary: {
        totalTasks: parseInt(stats.total_tasks) || 0,
        completedTasks: parseInt(stats.completed_tasks) || 0,
        completionRate: stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0,
        totalPlannedMinutes: parseInt(stats.total_planned_minutes) || 0,
        totalPlannedHours: ((stats.total_planned_minutes || 0) / 60).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/:userId/alltime - Get all-time analytics
app.get('/api/analytics/:userId/alltime', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Overall stats (all time)
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(estimated_minutes) as total_planned_minutes,
        MIN(scheduled_date) as first_task_date,
        MAX(scheduled_date) as last_task_date
      FROM tasks
      WHERE user_id = $1 AND scheduled_date IS NOT NULL
    `, [userId]);
    
    // Category breakdown (all time)
    const categoryResult = await pool.query(`
      SELECT c.id, c.name, c.icon, c.color,
             COUNT(t.id) as task_count,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
             SUM(t.estimated_minutes) as planned_minutes
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.scheduled_date IS NOT NULL
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY planned_minutes DESC
    `, [userId]);
    
    // Monthly breakdown (last 12 months)
    const monthlyResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', scheduled_date)::date as month_start,
        TO_CHAR(scheduled_date, 'Mon YYYY') as month_label,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(estimated_minutes) as planned_minutes
      FROM tasks
      WHERE user_id = $1 AND scheduled_date IS NOT NULL
        AND scheduled_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', scheduled_date), TO_CHAR(scheduled_date, 'Mon YYYY')
      ORDER BY month_start DESC
      LIMIT 12
    `, [userId]);
    
    // Daily average
    const avgResult = await pool.query(`
      SELECT 
        AVG(daily_tasks) as avg_tasks_per_day,
        AVG(daily_minutes) as avg_minutes_per_day
      FROM (
        SELECT 
          scheduled_date,
          COUNT(*) as daily_tasks,
          SUM(estimated_minutes) as daily_minutes
        FROM tasks
        WHERE user_id = $1 AND scheduled_date IS NOT NULL
        GROUP BY scheduled_date
      ) daily
    `, [userId]);
    
    // Streak calculation (consecutive days with completed tasks)
    const streakResult = await pool.query(`
      WITH completed_days AS (
        SELECT DISTINCT DATE(completed_at) as day
        FROM tasks
        WHERE user_id = $1 AND status = 'completed' AND completed_at IS NOT NULL
        ORDER BY day DESC
      ),
      streaks AS (
        SELECT day,
          day - (ROW_NUMBER() OVER (ORDER BY day))::int AS streak_group
        FROM completed_days
      )
      SELECT COUNT(*) as current_streak
      FROM streaks
      WHERE streak_group = (SELECT streak_group FROM streaks WHERE day = CURRENT_DATE)
    `, [userId]);
    
    const stats = statsResult.rows[0];
    const avg = avgResult.rows[0];
    
    res.json({
      summary: {
        totalTasks: parseInt(stats.total_tasks) || 0,
        completedTasks: parseInt(stats.completed_tasks) || 0,
        completionRate: stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0,
        totalPlannedMinutes: parseInt(stats.total_planned_minutes) || 0,
        totalPlannedHours: ((stats.total_planned_minutes || 0) / 60).toFixed(1),
        firstTaskDate: stats.first_task_date,
        lastTaskDate: stats.last_task_date,
        avgTasksPerDay: parseFloat(avg.avg_tasks_per_day || 0).toFixed(1),
        avgHoursPerDay: ((avg.avg_minutes_per_day || 0) / 60).toFixed(1),
        currentStreak: parseInt(streakResult.rows[0]?.current_streak) || 0
      },
      categories: categoryResult.rows,
      monthly: monthlyResult.rows.reverse()
    });
  } catch (error) {
    console.error('Error fetching all-time analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ DAILY REVIEWS ============

// GET /api/reviews/daily/:userId/:date - Get daily review
app.get('/api/reviews/daily/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const result = await pool.query(
      'SELECT * FROM daily_reviews WHERE user_id = $1 AND review_date = $2',
      [userId, date]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching daily review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/reviews/daily - Create/update daily review
app.post('/api/reviews/daily', async (req, res) => {
  try {
    const { userId, date, productivityRating, notes, isFinalized } = req.body;
    
    // Get task stats for the day
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(estimated_minutes) as planned_minutes
      FROM tasks
      WHERE user_id = $1 AND scheduled_date = $2
    `, [userId, date]);
    
    const stats = statsResult.rows[0];
    
    // Upsert review
    const result = await pool.query(`
      INSERT INTO daily_reviews (user_id, review_date, productivity_rating, notes, 
        total_planned_minutes, tasks_completed, tasks_planned, is_finalized)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, review_date) 
      DO UPDATE SET 
        productivity_rating = $3, notes = $4, total_planned_minutes = $5,
        tasks_completed = $6, tasks_planned = $7, is_finalized = $8,
        updated_at = NOW()
      RETURNING *
    `, [userId, date, productivityRating, notes, 
        stats.planned_minutes || 0, stats.completed_tasks || 0, stats.total_tasks || 0, isFinalized || false]);
    
    res.json({ success: true, review: result.rows[0] });
  } catch (error) {
    console.error('Error saving daily review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ WEEKLY REVIEWS ============

// GET /api/reviews/weekly/:userId/:weekStart - Get weekly review
app.get('/api/reviews/weekly/:userId/:weekStart', async (req, res) => {
  try {
    const { userId, weekStart } = req.params;
    
    // Get review
    const reviewResult = await pool.query(
      'SELECT * FROM weekly_reviews WHERE user_id = $1 AND week_start = $2',
      [userId, weekStart]
    );
    
    // Get goals for the week
    const goalsResult = await pool.query(
      'SELECT * FROM weekly_goals WHERE user_id = $1 AND week_start = $2 ORDER BY created_at',
      [userId, weekStart]
    );
    
    res.json({
      review: reviewResult.rows[0] || null,
      goals: goalsResult.rows
    });
  } catch (error) {
    console.error('Error fetching weekly review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/reviews/weekly - Create/update weekly review
app.post('/api/reviews/weekly', async (req, res) => {
  try {
    const { userId, weekStart, productivityScore, notes, isFinalized } = req.body;
    
    // Calculate stats for the week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const statsResult = await pool.query(`
      SELECT SUM(estimated_minutes) as total_minutes
      FROM tasks
      WHERE user_id = $1 AND scheduled_date >= $2 AND scheduled_date <= $3
    `, [userId, weekStart, weekEnd.toISOString().split('T')[0]]);
    
    // Get goals stats
    const goalsResult = await pool.query(`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_achieved THEN 1 ELSE 0 END) as achieved
      FROM weekly_goals WHERE user_id = $1 AND week_start = $2
    `, [userId, weekStart]);
    
    const totalHours = ((statsResult.rows[0].total_minutes || 0) / 60).toFixed(1);
    const goals = goalsResult.rows[0];
    
    // Upsert review
    const result = await pool.query(`
      INSERT INTO weekly_reviews (user_id, week_start, productivity_score, total_hours, 
        goals_achieved, goals_total, notes, is_finalized)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET 
        productivity_score = $3, total_hours = $4, goals_achieved = $5,
        goals_total = $6, notes = $7, is_finalized = $8,
        updated_at = NOW()
      RETURNING *
    `, [userId, weekStart, productivityScore, totalHours, 
        goals.achieved || 0, goals.total || 0, notes, isFinalized || false]);
    
    res.json({ success: true, review: result.rows[0] });
  } catch (error) {
    console.error('Error saving weekly review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ WEEKLY GOALS ============

// POST /api/goals/weekly - Add weekly goal
app.post('/api/goals/weekly', async (req, res) => {
  try {
    const { userId, weekStart, goalText } = req.body;
    const result = await pool.query(
      'INSERT INTO weekly_goals (user_id, week_start, goal_text) VALUES ($1, $2, $3) RETURNING *',
      [userId, weekStart, goalText]
    );
    res.status(201).json({ success: true, goal: result.rows[0] });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/goals/weekly/:id - Update goal (toggle achieved)
app.put('/api/goals/weekly/:id', async (req, res) => {
  try {
    const { isAchieved } = req.body;
    await pool.query('UPDATE weekly_goals SET is_achieved = $1 WHERE id = $2', [isAchieved, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/goals/weekly/:id - Delete goal
app.delete('/api/goals/weekly/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM weekly_goals WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ EAT THE FROG & DAILY HIGHLIGHT ============

// PUT /api/tasks/:id/frog/:date - Set task as frog for specific date
app.put('/api/tasks/:id/frog/:date', async (req, res) => {
  try {
    const { id: taskId, date } = req.params;
    
    // Get task to verify it's scheduled for this date
    const taskResult = await pool.query(
      'SELECT user_id, scheduled_date::text FROM tasks WHERE id = $1',
      [taskId]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    const taskDate = task.scheduled_date;
    
    // Verify task is scheduled for this date
    if (taskDate !== date) {
      return res.status(400).json({ success: false, message: 'Task must be scheduled for this date' });
    }
    
    const userId = task.user_id;
    
    // Clear any existing frog for this user on this date
    await pool.query(
      `UPDATE tasks SET is_frog = FALSE 
       WHERE user_id = $1 AND scheduled_date::text = $2 AND is_frog = TRUE`,
      [userId, date]
    );
    
    // Set this task as the frog
    await pool.query('UPDATE tasks SET is_frog = TRUE WHERE id = $1', [taskId]);
    
    // Upsert frog_history
    await pool.query(`
      INSERT INTO frog_history (user_id, task_id, frog_date)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, frog_date)
      DO UPDATE SET task_id = $2
    `, [userId, taskId, date]);
    
    res.json({ success: true, message: 'Task set as frog! 🐸' });
  } catch (error) {
    console.error('Error setting frog:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/tasks/:id/frog - Remove frog designation
app.delete('/api/tasks/:id/frog', async (req, res) => {
  try {
    const taskResult = await pool.query('SELECT user_id, scheduled_date FROM tasks WHERE id = $1', [req.params.id]);
    if (taskResult.rows.length > 0) {
      const task = taskResult.rows[0];
      const date = task.scheduled_date?.toISOString?.().split('T')[0] || task.scheduled_date;
      await pool.query('DELETE FROM frog_history WHERE user_id = $1 AND frog_date = $2', [task.user_id, date]);
    }
    await pool.query('UPDATE tasks SET is_frog = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing frog:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/frog/:userId/date/:date - Get frog task for specific date
app.get('/api/frog/:userId/date/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const result = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
             fh.completed as frog_completed
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      LEFT JOIN frog_history fh ON fh.task_id = t.id AND fh.frog_date::text = $2
      WHERE t.user_id = $1 AND t.scheduled_date::text = $2 AND t.is_frog = TRUE
      LIMIT 1
    `, [userId, date]);
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching frog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/frog/:userId/complete/:date - Complete frog for specific date
app.put('/api/frog/:userId/complete/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    // Get frog task for this date
    const frogResult = await pool.query(
      `SELECT id FROM tasks WHERE user_id = $1 AND scheduled_date::text = $2 AND is_frog = TRUE`,
      [userId, date]
    );
    
    if (frogResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No frog task found for this date' });
    }
    
    const taskId = frogResult.rows[0].id;
    
    // Complete the task
    await pool.query(
      `UPDATE tasks SET status = 'completed', completed_at = NOW(), frog_completed_at = NOW() WHERE id = $1`,
      [taskId]
    );
    
    // Update frog_history
    await pool.query(`
      UPDATE frog_history 
      SET completed = TRUE, completed_at = NOW()
      WHERE user_id = $1 AND frog_date = $2
    `, [userId, date]);
    
    res.json({ success: true, message: 'Frog eaten! 🎉🐸' });
  } catch (error) {
    console.error('Error completing frog:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/frog/:userId/stats - Get frog statistics
app.get('/api/frog/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    const today = new Date().toISOString().split('T')[0];
    
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM frog_history WHERE user_id = $1 AND completed = TRUE`,
      [userId]
    );
    
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthResult = await pool.query(
      `SELECT COUNT(*) as total FROM frog_history WHERE user_id = $1 AND completed = TRUE AND frog_date >= $2`,
      [userId, monthStart.toISOString().split('T')[0]]
    );
    
    const streakResult = await pool.query(`
      WITH dates AS (
        SELECT frog_date,
          frog_date - (ROW_NUMBER() OVER (ORDER BY frog_date DESC))::int AS streak_group
        FROM frog_history
        WHERE user_id = $1 AND completed = TRUE
        ORDER BY frog_date DESC
      )
      SELECT COUNT(*) as streak
      FROM dates
      WHERE streak_group = (SELECT streak_group FROM dates LIMIT 1)
    `, [userId]);
    
    res.json({
      totalFrogsEaten: parseInt(totalResult.rows[0].total),
      frogsThisMonth: parseInt(monthResult.rows[0].total),
      currentStreak: parseInt(streakResult.rows[0]?.streak) || 0
    });
  } catch (error) {
    console.error('Error fetching frog stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ DAILY HIGHLIGHT ============

// PUT /api/tasks/:id/highlight/:date - Set task as highlight for specific date
app.put('/api/tasks/:id/highlight/:date', async (req, res) => {
  try {
    const { id: taskId, date } = req.params;
    
    // Get task to verify it's scheduled for this date
    const taskResult = await pool.query(
      'SELECT user_id, scheduled_date::text FROM tasks WHERE id = $1',
      [taskId]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    const taskDate = task.scheduled_date;
    
    if (taskDate !== date) {
      return res.status(400).json({ success: false, message: 'Task must be scheduled for this date' });
    }
    
    const userId = task.user_id;
    
    // Clear any existing highlight for this user on this date
    await pool.query(
      `UPDATE tasks SET is_highlight = FALSE 
       WHERE user_id = $1 AND scheduled_date::text = $2 AND is_highlight = TRUE`,
      [userId, date]
    );
    
    // Set this task as the highlight
    await pool.query('UPDATE tasks SET is_highlight = TRUE WHERE id = $1', [taskId]);
    
    // Upsert highlight_history
    await pool.query(`
      INSERT INTO highlight_history (user_id, task_id, highlight_date)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, highlight_date)
      DO UPDATE SET task_id = $2
    `, [userId, taskId, date]);
    
    res.json({ success: true, message: 'Task set as highlight! ⭐' });
  } catch (error) {
    console.error('Error setting highlight:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/tasks/:id/highlight - Remove highlight designation
app.delete('/api/tasks/:id/highlight', async (req, res) => {
  try {
    const taskResult = await pool.query('SELECT user_id, scheduled_date FROM tasks WHERE id = $1', [req.params.id]);
    if (taskResult.rows.length > 0) {
      const task = taskResult.rows[0];
      const date = task.scheduled_date?.toISOString?.().split('T')[0] || task.scheduled_date;
      await pool.query('DELETE FROM highlight_history WHERE user_id = $1 AND highlight_date = $2', [task.user_id, date]);
    }
    await pool.query('UPDATE tasks SET is_highlight = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing highlight:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/highlight/:userId/date/:date - Get highlight task for specific date
app.get('/api/highlight/:userId/date/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const result = await pool.query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
             hh.completed as highlight_completed
      FROM tasks t
      LEFT JOIN task_categories c ON t.category_id = c.id
      LEFT JOIN highlight_history hh ON hh.task_id = t.id AND hh.highlight_date::text = $2
      WHERE t.user_id = $1 AND t.scheduled_date::text = $2 AND t.is_highlight = TRUE
      LIMIT 1
    `, [userId, date]);
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching highlight:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/highlight/:userId/complete/:date - Complete highlight for specific date
app.put('/api/highlight/:userId/complete/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    const highlightResult = await pool.query(
      `SELECT id FROM tasks WHERE user_id = $1 AND scheduled_date::text = $2 AND is_highlight = TRUE`,
      [userId, date]
    );
    
    if (highlightResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No highlight task found for this date' });
    }
    
    const taskId = highlightResult.rows[0].id;
    
    await pool.query(
      `UPDATE tasks SET status = 'completed', completed_at = NOW(), highlight_completed_at = NOW() WHERE id = $1`,
      [taskId]
    );
    
    await pool.query(`
      UPDATE highlight_history 
      SET completed = TRUE, completed_at = NOW()
      WHERE user_id = $1 AND highlight_date = $2
    `, [userId, date]);
    
    res.json({ success: true, message: 'Highlight completed! 🌟' });
  } catch (error) {
    console.error('Error completing highlight:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/highlight/:userId/stats - Get highlight statistics
app.get('/api/highlight/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM highlight_history WHERE user_id = $1 AND completed = TRUE`,
      [userId]
    );
    
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthResult = await pool.query(
      `SELECT COUNT(*) as total FROM highlight_history WHERE user_id = $1 AND completed = TRUE AND highlight_date >= $2`,
      [userId, monthStart.toISOString().split('T')[0]]
    );
    
    const streakResult = await pool.query(`
      WITH dates AS (
        SELECT highlight_date,
          highlight_date - (ROW_NUMBER() OVER (ORDER BY highlight_date DESC))::int AS streak_group
        FROM highlight_history
        WHERE user_id = $1 AND completed = TRUE
        ORDER BY highlight_date DESC
      )
      SELECT COUNT(*) as streak
      FROM dates
      WHERE streak_group = (SELECT streak_group FROM dates LIMIT 1)
    `, [userId]);
    
    res.json({
      totalHighlightsCompleted: parseInt(totalResult.rows[0].total),
      highlightsThisMonth: parseInt(monthResult.rows[0].total),
      currentStreak: parseInt(streakResult.rows[0]?.streak) || 0
    });
  } catch (error) {
    console.error('Error fetching highlight stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ POMODORO TIMER ============

// POST /api/pomodoro/start - Start a new pomodoro session
app.post('/api/pomodoro/start', async (req, res) => {
  try {
    const { userId, taskId, sessionType, durationMinutes } = req.body;
    
    // End any existing active session for this user
    await pool.query(
      `UPDATE pomodoro_sessions SET was_interrupted = TRUE, completed_at = NOW() 
       WHERE user_id = $1 AND completed_at IS NULL`,
      [userId]
    );
    
    // Create new session
    const result = await pool.query(
      `INSERT INTO pomodoro_sessions (user_id, task_id, session_type, duration_minutes, started_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [userId, taskId || null, sessionType || 'work', durationMinutes || 25]
    );
    
    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    console.error('Error starting pomodoro:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/pomodoro/:id/complete - Complete a pomodoro session
app.put('/api/pomodoro/:id/complete', async (req, res) => {
  try {
    await pool.query(
      `UPDATE pomodoro_sessions SET completed_at = NOW(), was_interrupted = FALSE 
       WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing pomodoro:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/pomodoro/:id/interrupt - Mark pomodoro as interrupted
app.put('/api/pomodoro/:id/interrupt', async (req, res) => {
  try {
    await pool.query(
      `UPDATE pomodoro_sessions SET completed_at = NOW(), was_interrupted = TRUE 
       WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error interrupting pomodoro:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/pomodoro/:userId/active - Get active pomodoro session
app.get('/api/pomodoro/:userId/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, t.title as task_title, t.category_id, c.icon as task_icon, c.color as task_color
      FROM pomodoro_sessions p
      LEFT JOIN tasks t ON p.task_id = t.id
      LEFT JOIN task_categories c ON t.category_id = c.id
      WHERE p.user_id = $1 AND p.completed_at IS NULL
      ORDER BY p.started_at DESC
      LIMIT 1
    `, [req.params.userId]);
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching active pomodoro:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/pomodoro/:userId/stats - Get pomodoro statistics
app.get('/api/pomodoro/:userId/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's pomodoros
    const todayResult = await pool.query(`
      SELECT COUNT(*) as count, SUM(duration_minutes) as total_minutes
      FROM pomodoro_sessions
      WHERE user_id = $1 AND DATE(started_at) = $2 AND completed_at IS NOT NULL AND was_interrupted = FALSE
    `, [req.params.userId, today]);
    
    // Best streak (consecutive days with at least 1 pomodoro)
    const streakResult = await pool.query(`
      WITH daily_pomodoros AS (
        SELECT DISTINCT DATE(started_at) as session_date
        FROM pomodoro_sessions
        WHERE user_id = $1 AND completed_at IS NOT NULL AND was_interrupted = FALSE
        ORDER BY DATE(started_at) DESC
      ),
      streaks AS (
        SELECT session_date,
               session_date - ROW_NUMBER() OVER (ORDER BY session_date) * INTERVAL '1 day' as grp
        FROM daily_pomodoros
      )
      SELECT COUNT(*) as streak_length
      FROM streaks
      WHERE grp = (SELECT grp FROM streaks WHERE session_date = (SELECT MAX(session_date) FROM daily_pomodoros))
      GROUP BY grp
    `, [req.params.userId]);
    
    const stats = {
      todayCount: parseInt(todayResult.rows[0].count) || 0,
      todayMinutes: parseInt(todayResult.rows[0].total_minutes) || 0,
      bestStreak: parseInt(streakResult.rows[0]?.streak_length) || 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching pomodoro stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✨ OXY Backend running on http://localhost:${PORT}`);
});
