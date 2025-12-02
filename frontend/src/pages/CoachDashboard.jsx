import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCoachFeedback, getCoachAverageRating, submitCoachComment, getBookingComment } from '../api'

const API_BASE = 'http://localhost:5000/api'

function CoachDashboard({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 })
  const [stats, setStats] = useState({ totalSessions: 0, upcomingSessions: 0, completedSessions: 0, totalEarnings: 0 })
  const [availability, setAvailability] = useState([])
  const [coach, setCoach] = useState(null)
  const [commentModal, setCommentModal] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [bookingComments, setBookingComments] = useState({})
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    if (!user || user.role !== 'coach') {
      navigate('/')
      return
    }
    
    fetchDashboardData()
  }, [user, navigate])

  const fetchDashboardData = async () => {
    try {
      // Fetch coach info
      const coachRes = await fetch(`${API_BASE}/coaches`)
      const coachData = await coachRes.json()
      if (coachData.length > 0) {
        setCoach(coachData[0])
      }
      
      // Fetch coach bookings (coach_id = 1 for now since we have single coach)
      const bookingsRes = await fetch(`${API_BASE}/bookings/coach/1`)
      const bookingsData = await bookingsRes.json()
      const safeBookings = Array.isArray(bookingsData) ? bookingsData : []
      setBookings(safeBookings)
      
      // Fetch coach availability
      const availRes = await fetch(`${API_BASE}/coaches/1/availability`)
      const availData = await availRes.json()
      setAvailability(Array.isArray(availData) ? availData : [])
      
      // Fetch feedbacks
      const feedbackData = await getCoachFeedback(1)
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : [])
      
      // Fetch rating
      const ratingData = await getCoachAverageRating(1)
      setRating(ratingData || { averageRating: 0, totalReviews: 0 })
      
      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const upcoming = safeBookings.filter(b => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate >= today && b.status !== 'cancelled'
      }).length
      
      const completedBookings = safeBookings.filter(b => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate < today && b.status !== 'cancelled'
      })
      
      // Calculate earnings (price per session * completed sessions)
      const pricePerSession = coachData[0]?.price || 75
      const totalEarnings = completedBookings.length * pricePerSession
      
      setStats({
        totalSessions: safeBookings.filter(b => b.status !== 'cancelled').length,
        upcomingSessions: upcoming,
        completedSessions: completedBookings.length,
        totalEarnings
      })
      
      // Check which past bookings have coach comments
      const commentsStatus = {}
      for (const booking of safeBookings.filter(b => b.status !== 'cancelled')) {
        const bookingDate = new Date(booking.booking_date)
        if (bookingDate < today) {
          const result = await getBookingComment(booking.id)
          commentsStatus[booking.id] = result.hasComment ? result.comment : null
        }
      }
      setBookingComments(commentsStatus)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentModal || !commentText.trim()) return
    
    try {
      const result = await submitCoachComment(
        commentModal.id,
        1, // coach_id
        commentModal.user_id,
        commentText.trim()
      )
      
      if (result.success) {
        setMessage({ text: '✅ Comment sent to client!', type: 'success' })
        setBookingComments(prev => ({ ...prev, [commentModal.id]: result.comment }))
        setCommentModal(null)
        setCommentText('')
      } else {
        setMessage({ text: 'Failed to send comment', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to send comment', type: 'error' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const isPastBooking = (booking) => {
    const bookingDate = new Date(booking.booking_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate < today
  }

  if (!user || user.role !== 'coach') return null

  if (loading) {
    return (
      <div className="coach-dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="coach-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Welcome back, {user.name}! 👋</h1>
          <p>Here's what's happening with your coaching sessions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-number">${stats.totalEarnings}</span>
            <span className="stat-label">Total Earnings</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-number">{stats.upcomingSessions}</span>
            <span className="stat-label">Upcoming Sessions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-number">{stats.completedSessions}</span>
            <span className="stat-label">Completed Sessions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <span className="stat-number">{rating.totalReviews > 0 ? rating.averageRating : '5.0'}</span>
            <span className="stat-label">Rating ({rating.totalReviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📅 Bookings ({stats.totalSessions})
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          💰 Earnings
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => setActiveTab('availability')}
        >
          🕐 Availability
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Reviews ({rating.totalReviews})
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            {/* Upcoming Sessions */}
            <div className="dashboard-card">
              <h3>📅 Upcoming Sessions</h3>
              {bookings.filter(b => !isPastBooking(b) && b.status !== 'cancelled').length > 0 ? (
                <div className="upcoming-list">
                  {bookings
                    .filter(b => !isPastBooking(b) && b.status !== 'cancelled')
                    .slice(0, 5)
                    .map(booking => (
                      <div key={booking.id} className="upcoming-item">
                        <div className="upcoming-date">
                          <span className="date-day">{new Date(booking.booking_date).getDate()}</span>
                          <span className="date-month">{new Date(booking.booking_date).toLocaleString('en-US', { month: 'short' })}</span>
                        </div>
                        <div className="upcoming-info">
                          <span className="client-name">{booking.user_name || 'Client'}</span>
                          <span className="session-time">{formatTime(booking.booking_time)}</span>
                          {booking.notes && <span className="session-notes">📝 {booking.notes}</span>}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="empty-message">No upcoming sessions</p>
              )}
            </div>

            {/* Recent Reviews */}
            <div className="dashboard-card">
              <h3>⭐ Recent Reviews</h3>
              {feedbacks.length > 0 ? (
                <div className="reviews-list">
                  {feedbacks.slice(0, 5).map(feedback => (
                    <div key={feedback.id} className="review-item">
                      <div className="review-top">
                        <span className="reviewer">{feedback.user_name}</span>
                        <span className="review-rating">
                          {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="review-text">"{feedback.comment}"</p>
                      )}
                      <span className="review-date">{formatDate(feedback.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">No reviews yet</p>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            {/* Upcoming */}
            <div className="bookings-group">
              <h3>📅 Upcoming Sessions</h3>
              {bookings.filter(b => !isPastBooking(b) && b.status !== 'cancelled').length > 0 ? (
                <div className="bookings-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Time</span>
                    <span>Client</span>
                    <span>Notes</span>
                    <span>Status</span>
                  </div>
                  {bookings
                    .filter(b => !isPastBooking(b) && b.status !== 'cancelled')
                    .map(booking => (
                      <div key={booking.id} className="table-row">
                        <span>{formatDate(booking.booking_date)}</span>
                        <span>{formatTime(booking.booking_time)}</span>
                        <span>{booking.user_name || 'Client'}</span>
                        <span className="notes-cell">{booking.notes || '-'}</span>
                        <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="empty-message">No upcoming sessions</p>
              )}
            </div>

            {/* Past */}
            <div className="bookings-group">
              <h3>✅ Past Sessions</h3>
              {bookings.filter(b => isPastBooking(b) && b.status !== 'cancelled').length > 0 ? (
                <div className="bookings-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Time</span>
                    <span>Client</span>
                    <span>Notes</span>
                    <span>Action</span>
                  </div>
                  {bookings
                    .filter(b => isPastBooking(b) && b.status !== 'cancelled')
                    .slice(0, 10)
                    .map(booking => (
                      <div key={booking.id} className="table-row past">
                        <span>{formatDate(booking.booking_date)}</span>
                        <span>{formatTime(booking.booking_time)}</span>
                        <span>{booking.user_name || 'Client'}</span>
                        <span className="notes-cell">{booking.notes || '-'}</span>
                        <span>
                          {bookingComments[booking.id] ? (
                            <button 
                              className="btn btn-small btn-secondary"
                              onClick={() => {
                                setCommentModal(booking)
                                setCommentText(bookingComments[booking.id].comment || '')
                              }}
                            >
                              ✏️ Edit
                            </button>
                          ) : (
                            <button 
                              className="btn btn-small btn-primary"
                              onClick={() => {
                                setCommentModal(booking)
                                setCommentText('')
                              }}
                            >
                              💬 Comment
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="empty-message">No past sessions</p>
              )}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="earnings-section">
            <div className="earnings-summary">
              <div className="earnings-big">
                <span className="earnings-label">Total Earnings</span>
                <span className="earnings-amount">${stats.totalEarnings}</span>
                <span className="earnings-detail">from {stats.completedSessions} completed sessions</span>
              </div>
            </div>
            
            <div className="earnings-breakdown">
              <h3>💵 Earnings Breakdown</h3>
              <div className="earnings-stats">
                <div className="earnings-stat">
                  <span className="stat-label">Price per Session</span>
                  <span className="stat-value">${coach?.price || 75}</span>
                </div>
                <div className="earnings-stat">
                  <span className="stat-label">Completed Sessions</span>
                  <span className="stat-value">{stats.completedSessions}</span>
                </div>
                <div className="earnings-stat">
                  <span className="stat-label">Pending Sessions</span>
                  <span className="stat-value">{stats.upcomingSessions}</span>
                </div>
                <div className="earnings-stat highlight">
                  <span className="stat-label">Projected Earnings</span>
                  <span className="stat-value">${stats.totalEarnings + (stats.upcomingSessions * (coach?.price || 75))}</span>
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="earnings-history">
              <h3>📊 Session History</h3>
              {bookings.filter(b => b.status !== 'cancelled').length > 0 ? (
                <div className="earnings-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Client</span>
                    <span>Status</span>
                    <span>Amount</span>
                  </div>
                  {bookings
                    .filter(b => b.status !== 'cancelled')
                    .slice(0, 10)
                    .map(booking => (
                      <div key={booking.id} className="table-row">
                        <span>{formatDate(booking.booking_date)}</span>
                        <span>{booking.user_name || 'Client'}</span>
                        <span className={`status-badge ${isPastBooking(booking) ? 'completed' : 'pending'}`}>
                          {isPastBooking(booking) ? 'Completed' : 'Upcoming'}
                        </span>
                        <span className="amount">${coach?.price || 75}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="empty-message">No sessions yet</p>
              )}
            </div>
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="availability-section">
            <div className="availability-header">
              <h3>🕐 Your Weekly Availability</h3>
              <p>Clients can book sessions during these hours</p>
            </div>
            
            <div className="availability-grid">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                const dayAvail = availability.find(a => a.day_of_week && a.day_of_week.toLowerCase() === day.toLowerCase())
                return (
                  <div key={day} className={`availability-day ${dayAvail ? 'available' : 'unavailable'}`}>
                    <span className="day-name">{day}</span>
                    {dayAvail ? (
                      <div className="day-hours">
                        <span className="hours">{dayAvail.start_time?.slice(0, 5)} - {dayAvail.end_time?.slice(0, 5)}</span>
                        <span className="status">✓ Available</span>
                      </div>
                    ) : (
                      <div className="day-hours">
                        <span className="status unavailable">Not Available</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="availability-info">
              <p>📧 Contact admin to update your availability</p>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="reviews-section">
            <div className="reviews-summary">
              <div className="rating-big">
                <span className="rating-number">{rating.totalReviews > 0 ? rating.averageRating : '5.0'}</span>
                <span className="rating-stars">{'★'.repeat(Math.round(parseFloat(rating.averageRating) || 5))}</span>
                <span className="rating-count">{rating.totalReviews} reviews</span>
              </div>
            </div>
            
            {feedbacks.length > 0 ? (
              <div className="reviews-full-list">
                {feedbacks.map(feedback => (
                  <div key={feedback.id} className="review-card-full">
                    <div className="review-card-header">
                      <div className="reviewer-info">
                        <span className="reviewer-avatar">👤</span>
                        <div>
                          <span className="reviewer-name">{feedback.user_name}</span>
                          <span className="session-date">Session on {formatDate(feedback.booking_date)}</span>
                        </div>
                      </div>
                      <div className="review-rating-badge">
                        {'★'.repeat(feedback.rating)} {feedback.rating}/5
                      </div>
                    </div>
                    {feedback.comment ? (
                      <p className="review-comment-full">"{feedback.comment}"</p>
                    ) : (
                      <p className="review-no-comment">No written feedback</p>
                    )}
                    <span className="review-submitted">Submitted {formatDate(feedback.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-reviews">
                <span className="empty-icon">⭐</span>
                <h3>No reviews yet</h3>
                <p>Reviews from your clients will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`toast-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Comment Modal */}
      {commentModal && (
        <div className="confirm-overlay" onClick={() => { setCommentModal(null); setCommentText(''); }}>
          <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comment-modal-header">
              <h3>💬 Send Feedback to Client</h3>
              <p>Leave a comment for <strong>{commentModal.user_name || 'Client'}</strong></p>
            </div>
            
            <div className="comment-session-info">
              <p>📅 Session: {formatDate(commentModal.booking_date)}</p>
              <p>🕐 Time: {formatTime(commentModal.booking_time)}</p>
            </div>
            
            <div className="comment-input-group">
              <label>Your Feedback</label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts, recommendations, or notes from the session..."
                rows={5}
                maxLength={1000}
              />
              <span className="char-count">{commentText.length}/1000</span>
            </div>
            
            <div className="comment-modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => { setCommentModal(null); setCommentText(''); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
              >
                {bookingComments[commentModal.id] ? 'Update Comment' : 'Send Comment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoachDashboard

