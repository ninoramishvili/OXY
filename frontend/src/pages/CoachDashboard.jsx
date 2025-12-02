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
  const [stats, setStats] = useState({ totalSessions: 0, upcomingSessions: 0, completedSessions: 0, totalEarnings: 0, pendingCount: 0 })
  const [availability, setAvailability] = useState([])
  const [coach, setCoach] = useState(null)
  const [commentModal, setCommentModal] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [bookingComments, setBookingComments] = useState({})
  const [message, setMessage] = useState({ text: '', type: '' })
  const [pendingBookings, setPendingBookings] = useState([])
  const [declineModal, setDeclineModal] = useState(null)
  const [declineReason, setDeclineReason] = useState('')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  
  // Calendar state
  const [weekDates, setWeekDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [calendarSlots, setCalendarSlots] = useState([])

  // Calendar helper functions
  const getTodayDate = () => new Date().toISOString().split('T')[0]
  
  const generateWeekDates = (startDate) => {
    const dates = []
    const start = new Date(startDate)
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: date.toISOString().split('T')[0] === getTodayDate()
      })
    }
    return dates
  }

  const navigateWeek = (direction) => {
    const currentStart = new Date(weekDates[0]?.date || getTodayDate())
    currentStart.setDate(currentStart.getDate() + (direction * 7))
    setWeekDates(generateWeekDates(currentStart.toISOString().split('T')[0]))
    setSelectedDate(currentStart.toISOString().split('T')[0])
  }

  useEffect(() => {
    // Initialize calendar
    const today = getTodayDate()
    setWeekDates(generateWeekDates(today))
    setSelectedDate(today)
  }, [])

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
      
      // Fetch pending bookings
      const pendingRes = await fetch(`${API_BASE}/bookings/pending/1`)
      const pendingData = await pendingRes.json()
      const safePending = Array.isArray(pendingData) ? pendingData : []
      setPendingBookings(safePending)
      
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
        totalSessions: safeBookings.filter(b => b.status !== 'cancelled' && b.status !== 'declined').length,
        upcomingSessions: upcoming,
        completedSessions: completedBookings.length,
        totalEarnings,
        pendingCount: safePending.length
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
    if (!commentModal || (!commentText.trim() && !privateNotes.trim())) return
    
    try {
      const result = await submitCoachComment(
        commentModal.id,
        1, // coach_id
        commentModal.user_id,
        commentText.trim(),
        privateNotes.trim() || null
      )
      
      if (result.success) {
        setMessage({ text: '✅ Feedback saved!', type: 'success' })
        setBookingComments(prev => ({ ...prev, [commentModal.id]: result.comment }))
        setCommentModal(null)
        setCommentText('')
        setPrivateNotes('')
      } else {
        setMessage({ text: 'Failed to save feedback', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to save feedback', type: 'error' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  // Fetch calendar slots when date changes
  useEffect(() => {
    const fetchCalendarSlots = async () => {
      if (!selectedDate) return
      try {
        const res = await fetch(`${API_BASE}/coaches/1/slots?date=${selectedDate}`)
        const data = await res.json()
        if (data.available) {
          setCalendarSlots(data.slots)
        } else {
          setCalendarSlots([])
        }
      } catch (error) {
        console.error('Error fetching slots:', error)
      }
    }
    fetchCalendarSlots()
  }, [selectedDate])

  const handleCoachCancelSession = async () => {
    if (!cancelModal) return
    
    try {
      const res = await fetch(`${API_BASE}/bookings/${cancelModal.id}/coach-cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || 'Cancelled by coach' })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ text: '✅ Session cancelled', type: 'success' })
        setCancelModal(null)
        setCancelReason('')
        fetchDashboardData()
        // Refresh calendar slots
        const slotsRes = await fetch(`${API_BASE}/coaches/1/slots?date=${selectedDate}`)
        const slotsData = await slotsRes.json()
        if (slotsData.available) setCalendarSlots(slotsData.slots)
      } else {
        setMessage({ text: data.message || 'Failed to cancel session', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to cancel session', type: 'error' })
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleConfirmBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ text: '✅ Booking confirmed!', type: 'success' })
        fetchDashboardData() // Refresh data
      } else {
        setMessage({ text: data.message || 'Failed to confirm booking', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to confirm booking', type: 'error' })
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleDeclineBooking = async () => {
    if (!declineModal) return
    
    try {
      const res = await fetch(`${API_BASE}/bookings/${declineModal.id}/decline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason || 'No reason provided' })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ text: '❌ Booking declined', type: 'success' })
        setDeclineModal(null)
        setDeclineReason('')
        fetchDashboardData() // Refresh data
      } else {
        setMessage({ text: data.message || 'Failed to decline booking', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to decline booking', type: 'error' })
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
        {stats.pendingCount > 0 && (
          <div className="stat-card pending-highlight" onClick={() => setActiveTab('bookings')}>
            <div className="stat-icon">🔔</div>
            <div className="stat-info">
              <span className="stat-number">{stats.pendingCount}</span>
              <span className="stat-label">Pending Requests</span>
            </div>
          </div>
        )}
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
            {/* Pending Requests */}
            {pendingBookings.length > 0 && (
              <div className="dashboard-card pending-card full-width">
                <h3>🔔 Pending Booking Requests</h3>
                <div className="pending-list">
                  {pendingBookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="pending-item">
                      <div className="pending-info">
                        <div className="pending-client">
                          <span className="client-avatar">👤</span>
                          <div>
                            <strong>{booking.user_name || 'Client'}</strong>
                            <span className="client-email">{booking.user_email}</span>
                          </div>
                        </div>
                        <div className="pending-details">
                          <span className="pending-date">📅 {formatDate(booking.booking_date)}</span>
                          <span className="pending-time">🕐 {formatTime(booking.booking_time)}</span>
                          {booking.notes && <span className="pending-notes">📝 {booking.notes}</span>}
                        </div>
                      </div>
                      <div className="pending-actions">
                        <button 
                          className="btn btn-success btn-small"
                          onClick={() => handleConfirmBooking(booking.id)}
                        >
                          ✓ Accept
                        </button>
                        <button 
                          className="btn btn-danger btn-small"
                          onClick={() => setDeclineModal(booking)}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            {/* Pending Requests */}
            {pendingBookings.length > 0 && (
              <div className="bookings-group pending-group">
                <h3>🔔 Pending Requests ({pendingBookings.length})</h3>
                <div className="bookings-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Time</span>
                    <span>Client</span>
                    <span>Notes</span>
                    <span>Actions</span>
                  </div>
                  {pendingBookings.map(booking => (
                    <div key={booking.id} className="table-row pending-row">
                      <span>{formatDate(booking.booking_date)}</span>
                      <span>{formatTime(booking.booking_time)}</span>
                      <span>
                        <div className="client-cell">
                          <strong>{booking.user_name || 'Client'}</strong>
                          <small>{booking.user_email}</small>
                        </div>
                      </span>
                      <span className="notes-cell">{booking.notes || '-'}</span>
                      <span className="actions-cell">
                        <button 
                          className="btn btn-success btn-small"
                          onClick={() => handleConfirmBooking(booking.id)}
                        >
                          ✓ Accept
                        </button>
                        <button 
                          className="btn btn-danger btn-small"
                          onClick={() => setDeclineModal(booking)}
                        >
                          ✕ Decline
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            <div className="bookings-group">
              <h3>📅 Upcoming Sessions</h3>
              {bookings.filter(b => !isPastBooking(b) && b.status !== 'cancelled' && b.status !== 'declined').length > 0 ? (
                <div className="bookings-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Time</span>
                    <span>Client</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {bookings
                    .filter(b => !isPastBooking(b) && b.status !== 'cancelled' && b.status !== 'declined')
                    .map(booking => (
                      <div key={booking.id} className="table-row">
                        <span>{formatDate(booking.booking_date)}</span>
                        <span>{formatTime(booking.booking_time)}</span>
                        <span>
                          <div className="client-cell">
                            <strong>{booking.user_name || 'Client'}</strong>
                            {booking.notes && <small>📝 {booking.notes}</small>}
                          </div>
                        </span>
                        <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                        <span className="actions-cell">
                          <button 
                            className="btn btn-danger btn-small"
                            onClick={() => setCancelModal({
                              id: booking.id,
                              user_name: booking.user_name,
                              booking_date: booking.booking_date,
                              booking_time: booking.booking_time,
                              status: booking.status
                            })}
                          >
                            Cancel
                          </button>
                        </span>
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
                                setPrivateNotes(bookingComments[booking.id].private_notes || '')
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
                                setPrivateNotes('')
                              }}
                            >
                              📝 Feedback
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

        {/* Availability Tab - Calendar View */}
        {activeTab === 'availability' && (
          <div className="coach-calendar-section">
            <div className="calendar-header-coach">
              <h3>📅 Your Schedule</h3>
              <p>View and manage your booked sessions</p>
            </div>
            
            {/* Week Navigation */}
            <div className="week-nav-coach">
              <button className="week-nav-btn" onClick={() => navigateWeek(-1)}>
                ← Previous
              </button>
              <span className="week-range">
                {weekDates[0]?.month} {weekDates[0]?.dayNumber} - {weekDates[6]?.month} {weekDates[6]?.dayNumber}
              </span>
              <button className="week-nav-btn" onClick={() => navigateWeek(1)}>
                Next →
              </button>
            </div>

            {/* Week Days */}
            <div className="week-days-coach">
              {weekDates.map(day => (
                <button
                  key={day.date}
                  className={`day-btn-coach ${selectedDate === day.date ? 'selected' : ''} ${day.isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <span className="day-name">{day.dayName}</span>
                  <span className="day-number">{day.dayNumber}</span>
                  {day.isToday && <span className="today-dot"></span>}
                </button>
              ))}
            </div>

            {/* Time Slots */}
            <div className="slots-grid-coach">
              <div className="slots-header">
                <span className="selected-date-display">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
              {calendarSlots.length > 0 ? (
                <div className="slots-list-coach">
                  {calendarSlots.map((slot, idx) => {
                    const hour = parseInt(slot.time.split(':')[0])
                    const displayTime = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
                    
                    return (
                      <div 
                        key={idx} 
                        className={`slot-item-coach ${slot.available ? 'available' : 'booked'} ${slot.status === 'pending' ? 'pending' : ''}`}
                      >
                        <div className="slot-time">{displayTime}</div>
                        <div className="slot-info">
                          {slot.available ? (
                            <span className="slot-status available">Available</span>
                          ) : (
                            <>
                              <span className="slot-client">👤 {slot.userName || 'Client'}</span>
                              <span className={`slot-status ${slot.status}`}>
                                {slot.status === 'pending' && '⏳ Pending'}
                                {slot.status === 'confirmed' && '✅ Confirmed'}
                              </span>
                              {slot.notes && <span className="slot-notes">📝 {slot.notes}</span>}
                            </>
                          )}
                        </div>
                        {!slot.available && slot.bookingId && (
                          <button 
                            className="btn btn-danger btn-small"
                            onClick={() => setCancelModal({
                              id: slot.bookingId,
                              user_name: slot.userName,
                              booking_date: selectedDate,
                              booking_time: slot.time,
                              status: slot.status
                            })}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="no-slots-message">
                  <p>No available hours for this day</p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot available"></span>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot pending"></span>
                <span>Pending</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot confirmed"></span>
                <span>Confirmed</span>
              </div>
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
        <div className="confirm-overlay" onClick={() => { setCommentModal(null); setCommentText(''); setPrivateNotes(''); }}>
          <div className="comment-modal session-feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comment-modal-header">
              <h3>📝 Session Feedback</h3>
              <p>Leave feedback for <strong>{commentModal.user_name || 'Client'}</strong></p>
            </div>
            
            <div className="comment-session-info">
              <p>📅 Session: {formatDate(commentModal.booking_date)}</p>
              <p>🕐 Time: {formatTime(commentModal.booking_time)}</p>
              {commentModal.notes && <p>📋 Client's notes: "{commentModal.notes}"</p>}
            </div>
            
            <div className="comment-input-group">
              <label>💬 Feedback for Client <span className="label-hint">(Client will see this)</span></label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts, recommendations, or follow-up advice for the client..."
                rows={4}
                maxLength={1000}
              />
              <span className="char-count">{commentText.length}/1000</span>
            </div>
            
            <div className="comment-input-group private-notes-group">
              <label>🔒 Private Notes <span className="label-hint">(Only you can see this)</span></label>
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="Personal notes about this session, client progress, areas to focus on next time..."
                rows={3}
                maxLength={1000}
              />
              <span className="char-count">{privateNotes.length}/1000</span>
            </div>
            
            <div className="comment-modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => { setCommentModal(null); setCommentText(''); setPrivateNotes(''); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() && !privateNotes.trim()}
              >
                {bookingComments[commentModal.id] ? 'Update Feedback' : 'Save Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {declineModal && (
        <div className="confirm-overlay" onClick={() => { setDeclineModal(null); setDeclineReason(''); }}>
          <div className="decline-modal" onClick={(e) => e.stopPropagation()}>
            <div className="decline-modal-header">
              <h3>❌ Decline Booking Request</h3>
              <p>Decline session with <strong>{declineModal.user_name || 'Client'}</strong></p>
            </div>
            
            <div className="decline-session-info">
              <p>📅 Date: {formatDate(declineModal.booking_date)}</p>
              <p>🕐 Time: {formatTime(declineModal.booking_time)}</p>
              {declineModal.notes && <p>📝 Their note: "{declineModal.notes}"</p>}
            </div>
            
            <div className="decline-input-group">
              <label>Reason for declining (optional)</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Schedule conflict, fully booked, unavailable on this date..."
                rows={3}
                maxLength={500}
              />
              <span className="char-count">{declineReason.length}/500</span>
            </div>
            
            <div className="decline-modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => { setDeclineModal(null); setDeclineReason(''); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeclineBooking}
              >
                Decline Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Session Modal (for confirmed sessions) */}
      {cancelModal && (
        <div className="confirm-overlay" onClick={() => { setCancelModal(null); setCancelReason(''); }}>
          <div className="decline-modal" onClick={(e) => e.stopPropagation()}>
            <div className="decline-modal-header">
              <h3>🚫 Cancel Session</h3>
              <p>Cancel session with <strong>{cancelModal.user_name || 'Client'}</strong></p>
            </div>
            
            <div className="decline-session-info">
              <p>📅 Date: {formatDate(cancelModal.booking_date)}</p>
              <p>🕐 Time: {formatTime(cancelModal.booking_time)}</p>
              <p>Status: <span className={`status-badge ${cancelModal.status}`}>{cancelModal.status}</span></p>
            </div>
            
            <div className="decline-input-group">
              <label>Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Emergency, schedule conflict, illness..."
                rows={3}
                maxLength={500}
              />
              <span className="char-count">{cancelReason.length}/500</span>
            </div>
            
            <p className="cancel-warning">⚠️ The client will be notified of this cancellation.</p>
            
            <div className="decline-modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => { setCancelModal(null); setCancelReason(''); }}
              >
                Keep Session
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleCoachCancelSession}
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoachDashboard

