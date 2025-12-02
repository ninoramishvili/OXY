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
    
    // Check which slots are already booked
    const bookings = await pool.query(
      `SELECT id, booking_time, user_id, status FROM bookings 
       WHERE coach_id = $1 AND booking_date = $2 AND status NOT IN ('cancelled', 'declined')`,
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
        slot.bookingId = booking.id; // Include booking ID for cancellation
      }
    }
    
    res.json({ available: true, slots, date });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Server error' });
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

// Start server
app.listen(PORT, () => {
  console.log(`✨ OXY Backend running on http://localhost:${PORT}`);
});
