import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCoachFeedback, getCoachAverageRating } from '../api'

const API_BASE = 'http://localhost:5000/api'

function CoachDashboard({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 })
  const [stats, setStats] = useState({ totalSessions: 0, upcomingSessions: 0, completedSessions: 0 })

  useEffect(() => {
    if (!user || user.role !== 'coach') {
      navigate('/')
      return
    }
    
    fetchDashboardData()
  }, [user, navigate])

  const fetchDashboardData = async () => {
    try {
      // Fetch coach bookings (coach_id = 1 for now since we have single coach)
      const bookingsRes = await fetch(`${API_BASE}/bookings/coach/1`)
      const bookingsData = await bookingsRes.json()
      setBookings(bookingsData)
      
      // Fetch feedbacks
      const feedbackData = await getCoachFeedback(1)
      setFeedbacks(feedbackData)
      
      // Fetch rating
      const ratingData = await getCoachAverageRating(1)
      setRating(ratingData)
      
      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const upcoming = bookingsData.filter(b => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate >= today && b.status !== 'cancelled'
      }).length
      
      const completed = bookingsData.filter(b => {
        const bookingDate = new Date(b.booking_date)
        return bookingDate < today && b.status !== 'cancelled'
      }).length
      
      setStats({
        totalSessions: bookingsData.filter(b => b.status !== 'cancelled').length,
        upcomingSessions: upcoming,
        completedSessions: completed
      })
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <span className="stat-number">{rating.totalReviews > 0 ? rating.averageRating : '5.0'}</span>
            <span className="stat-label">Average Rating</span>
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
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <span className="stat-number">{rating.totalReviews}</span>
            <span className="stat-label">Client Reviews</span>
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
                    <span>Status</span>
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
                        <span className="status-badge completed">Completed</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="empty-message">No past sessions</p>
              )}
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
    </div>
  )
}

export default CoachDashboard

