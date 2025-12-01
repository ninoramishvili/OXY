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
      'SELECT id, username, name, email FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ 
        success: true, 
        message: 'Login successful!',
        user: { id: user.id, username: user.username, name: user.name, email: user.email }
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
      `SELECT p.*, c.title, c.image, c.category, c.description
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
       WHERE coach_id = $1 AND booking_date = $2 AND status != 'cancelled'`,
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
       WHERE coach_id = $1 AND booking_date = $2 AND booking_time = $3 AND status != 'cancelled'`,
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
       VALUES ($1, $2, $3, $4, $5, 'confirmed') RETURNING *`,
      [coachId, userId || 1, date, time, notes || null]
    );
    
    // Update coach session count
    await pool.query('UPDATE coaches SET sessions = sessions + 1 WHERE id = $1', [coachId]);
    
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
    
    // Update status to cancelled (soft delete)
    await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1",
      [id]
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
