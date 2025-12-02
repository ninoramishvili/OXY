/**
 * OXY API Service
 * Centralized API calls to backend endpoints
 */

const API_BASE = '/api';

// ============ USERS ============

// Login user
export const login = async (username, password) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
};

// Register new user
export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Get all users
export const getUsers = async () => {
  const response = await fetch(`${API_BASE}/users`);
  return response.json();
};

// Get user by ID
export const getUser = async (id) => {
  const response = await fetch(`${API_BASE}/users/${id}`);
  return response.json();
};

// Update user profile
export const updateUser = async (id, userData) => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Change user password
export const changePassword = async (id, currentPassword, newPassword) => {
  const response = await fetch(`${API_BASE}/users/${id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return response.json();
};

// ============ COURSES ============

// Get all courses
export const getCourses = async () => {
  const response = await fetch(`${API_BASE}/courses`);
  return response.json();
};

// Get course by ID
export const getCourse = async (id) => {
  const response = await fetch(`${API_BASE}/courses/${id}`);
  return response.json();
};

// Create new course
export const createCourse = async (courseData) => {
  const response = await fetch(`${API_BASE}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(courseData)
  });
  return response.json();
};

// ============ COACHES ============

// Get all coaches
export const getCoaches = async () => {
  const response = await fetch(`${API_BASE}/coaches`);
  return response.json();
};

// Get coach by ID
export const getCoach = async (id) => {
  const response = await fetch(`${API_BASE}/coaches/${id}`);
  return response.json();
};

// Create new coach
export const createCoach = async (coachData) => {
  const response = await fetch(`${API_BASE}/coaches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coachData)
  });
  return response.json();
};

// Get coach availability (working hours)
export const getCoachAvailability = async (coachId) => {
  const response = await fetch(`${API_BASE}/coaches/${coachId}/availability`);
  return response.json();
};

// Get available time slots for a coach on a specific date
export const getCoachSlots = async (coachId, date) => {
  const response = await fetch(`${API_BASE}/coaches/${coachId}/slots/${date}`);
  return response.json();
};

// ============ REVIEWS ============

// Get reviews for a course
export const getCourseReviews = async (courseId) => {
  const response = await fetch(`${API_BASE}/reviews/course/${courseId}`);
  return response.json();
};

// Get average rating for a course
export const getCourseAverageRating = async (courseId) => {
  const response = await fetch(`${API_BASE}/reviews/course/${courseId}/average`);
  return response.json();
};

// Create a review
export const createReview = async (userId, courseId, rating, comment) => {
  const response = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, courseId, rating, comment })
  });
  return response.json();
};

// Update a review
export const updateReview = async (reviewId, userId, rating, comment) => {
  const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, rating, comment })
  });
  return response.json();
};

// Delete a review
export const deleteReview = async (reviewId, userId) => {
  const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  return response.json();
};

// Check if user has reviewed a course
export const getUserReview = async (userId, courseId) => {
  const response = await fetch(`${API_BASE}/reviews/user/${userId}/course/${courseId}`);
  return response.json();
};

// ============ FAVORITES ============

// Get user's favorites
export const getUserFavorites = async (userId) => {
  const response = await fetch(`${API_BASE}/favorites/user/${userId}`);
  return response.json();
};

// Add to favorites
export const addFavorite = async (userId, courseId) => {
  const response = await fetch(`${API_BASE}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, courseId })
  });
  return response.json();
};

// Remove from favorites
export const removeFavorite = async (courseId, userId) => {
  const response = await fetch(`${API_BASE}/favorites/${courseId}/user/${userId}`, {
    method: 'DELETE'
  });
  return response.json();
};

// Check if course is favorited
export const checkFavorite = async (courseId, userId) => {
  const response = await fetch(`${API_BASE}/favorites/check/${courseId}/user/${userId}`);
  return response.json();
};

// ============ PURCHASES ============

// Get all purchases
export const getPurchases = async () => {
  const response = await fetch(`${API_BASE}/purchases`);
  return response.json();
};

// Get user's purchases
export const getUserPurchases = async (userId) => {
  const response = await fetch(`${API_BASE}/purchases/user/${userId}`);
  return response.json();
};

// Purchase a course
export const purchaseCourse = async (courseId, userId) => {
  const response = await fetch(`${API_BASE}/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, userId })
  });
  return response.json();
};

// ============ BOOKINGS ============

// Get all bookings
export const getBookings = async () => {
  const response = await fetch(`${API_BASE}/bookings`);
  return response.json();
};

// Get user's bookings
export const getUserBookings = async (userId) => {
  const response = await fetch(`${API_BASE}/bookings/user/${userId}`);
  return response.json();
};

// Get coach's bookings
export const getCoachBookings = async (coachId) => {
  const response = await fetch(`${API_BASE}/bookings/coach/${coachId}`);
  return response.json();
};

// Book a session
export const bookSession = async (bookingData) => {
  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  return response.json();
};

// Cancel a booking
export const cancelBooking = async (bookingId, userId) => {
  const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  return response.json();
};

// ============ STATISTICS ============

// Get platform stats
export const getStats = async () => {
  const response = await fetch(`${API_BASE}/stats`);
  return response.json();
};

// ============ HELPER EXPORTS ============

// Export all API functions as a single object
const api = {
  // Users
  login,
  registerUser,
  getUsers,
  getUser,
  updateUser,
  changePassword,
  
  // Reviews
  getCourseReviews,
  getCourseAverageRating,
  createReview,
  updateReview,
  deleteReview,
  getUserReview,
  
  // Favorites
  getUserFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  
  // Courses
  getCourses,
  getCourse,
  createCourse,
  
  // Coaches
  getCoaches,
  getCoach,
  createCoach,
  getCoachAvailability,
  getCoachSlots,
  
  // Purchases
  getPurchases,
  getUserPurchases,
  purchaseCourse,
  
  // Bookings
  getBookings,
  getUserBookings,
  getCoachBookings,
  bookSession,
  cancelBooking,
  
  // Stats
  getStats
};

// ============ SESSION FEEDBACK ============

export const submitSessionFeedback = async (bookingId, userId, coachId, rating, comment) => {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, userId, coachId, rating, comment })
  });
  return response.json();
};

export const checkBookingFeedback = async (bookingId) => {
  const response = await fetch(`${API_BASE}/feedback/booking/${bookingId}`);
  return response.json();
};

export const getCoachFeedback = async (coachId) => {
  const response = await fetch(`${API_BASE}/feedback/coach/${coachId}`);
  return response.json();
};

export const getCoachAverageRating = async (coachId) => {
  const response = await fetch(`${API_BASE}/feedback/coach/${coachId}/average`);
  return response.json();
};

export const getUserFeedback = async (userId) => {
  const response = await fetch(`${API_BASE}/feedback/user/${userId}`);
  return response.json();
};

// ============ COACH COMMENTS ============

export const submitCoachComment = async (bookingId, coachId, userId, comment) => {
  const response = await fetch(`${API_BASE}/coach-comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, coachId, userId, comment })
  });
  return response.json();
};

export const getBookingComment = async (bookingId) => {
  const response = await fetch(`${API_BASE}/coach-comments/booking/${bookingId}`);
  return response.json();
};

export const getUserCoachComments = async (userId) => {
  const response = await fetch(`${API_BASE}/coach-comments/user/${userId}`);
  return response.json();
};

export const getUnreadCommentCount = async (userId) => {
  const response = await fetch(`${API_BASE}/coach-comments/user/${userId}/unread`);
  return response.json();
};

export const markCommentAsRead = async (commentId) => {
  const response = await fetch(`${API_BASE}/coach-comments/${commentId}/read`, {
    method: 'PUT'
  });
  return response.json();
};

export const markAllCommentsAsRead = async (userId) => {
  const response = await fetch(`${API_BASE}/coach-comments/user/${userId}/read-all`, {
    method: 'PUT'
  });
  return response.json();
};

export default api;

