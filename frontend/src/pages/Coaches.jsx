import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCoaches, getUserBookings, cancelBooking } from '../api'
import EmbeddedBookingCalendar from '../components/EmbeddedBookingCalendar'

function Coaches({ user }) {
  const [coach, setCoach] = useState(null)
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [showBookings, setShowBookings] = useState(true)
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', message: '' })
  const [inquirySubmitted, setInquirySubmitted] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coachesData = await getCoaches()
        // Get the single coach
        if (coachesData.length > 0) {
          setCoach(coachesData[0])
        }
        
        // Fetch user's bookings if logged in
        if (user?.id) {
          const bookingsData = await getUserBookings(user.id)
          setMyBookings(bookingsData.filter(b => b.status !== 'cancelled'))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setMessage({ text: 'Failed to load coach', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user])

  const handleBookingComplete = async (booking) => {
    if (user?.id) {
      const bookingsData = await getUserBookings(user.id)
      setMyBookings(bookingsData.filter(b => b.status !== 'cancelled'))
    }
    if (coach) {
      setCoach(prev => ({ ...prev, sessions: prev.sessions + 1 }))
    }
  }

  const handleInquiryChange = (e) => {
    const { name, value } = e.target
    setInquiryForm(prev => ({ ...prev, [name]: value }))
  }

  const handleInquirySubmit = (e) => {
    e.preventDefault()
    // In a real app, this would send to a backend
    console.log('Inquiry submitted:', inquiryForm)
    setInquirySubmitted(true)
    setInquiryForm({ name: '', email: '', message: '' })
    setTimeout(() => setInquirySubmitted(false), 5000)
  }

  const handleCancelBooking = async () => {
    if (!cancelConfirm) return
    
    const bookingId = cancelConfirm.id
    setCancelConfirm(null)
    
    try {
      const result = await cancelBooking(bookingId, user?.id)
      if (result.success) {
        setMyBookings(prev => prev.filter(b => b.id !== bookingId))
        setMessage({ text: '✅ Booking cancelled successfully', type: 'success' })
      } else {
        setMessage({ text: result.message || 'Failed to cancel', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to cancel booking', type: 'error' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const formatBookingDate = (date, time) => {
    const d = new Date(date)
    const dateStr = d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    })
    const hour = parseInt(time.split(':')[0])
    const timeStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    return { dateStr, timeStr }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!coach) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Coach not available</h2>
      </div>
    )
  }

  return (
    <div className="coach-profile-page">
      {/* Hero Section */}
      <section className="coach-hero">
        <div className="coach-hero-content">
          <div className="coach-hero-avatar">
            <div className="coach-avatar-large" style={{ background: coach.color }}>
              {coach.image}
            </div>
            <div className="coach-status">
              <span className="status-dot"></span>
              Available for booking
            </div>
          </div>
          
          <div className="coach-hero-info">
            <h1>{coach.name}</h1>
            <p className="coach-hero-title">{coach.title}</p>
            <span className="coach-hero-specialty">{coach.specialty}</span>
            
            <div className="coach-hero-stats">
              <div className="stat-item">
                <span className="stat-value">⭐ {coach.rating}</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{coach.sessions}+</span>
                <span className="stat-label">Sessions</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">${coach.price}</span>
                <span className="stat-label">Per Session</span>
              </div>
            </div>
            
            <a href="#booking-calendar" className="btn btn-primary btn-large">
              Book a Session
            </a>
          </div>
        </div>
      </section>

      {message.text && (
        <div style={{ 
          background: message.type === 'success' ? '#D5E8D4' : '#FFE5E5', 
          padding: '1rem', 
          textAlign: 'center', 
          fontWeight: '600',
          color: message.type === 'success' ? '#2D5A27' : '#C00'
        }}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="coach-profile-content">
        {/* My Upcoming Sessions */}
        {user && myBookings.length > 0 && (
          <section className="coach-section">
            <div className="section-header" onClick={() => setShowBookings(!showBookings)}>
              <h2>📅 Your Upcoming Sessions</h2>
              <span className="toggle-icon">{showBookings ? '▼' : '▶'}</span>
            </div>
            
            {showBookings && (
              <div className="upcoming-sessions-list">
                {myBookings.map(booking => {
                  const { dateStr, timeStr } = formatBookingDate(booking.booking_date, booking.booking_time)
                  return (
                    <div key={booking.id} className="upcoming-session-card">
                      <div className="session-date-box">
                        <span className="session-day">{new Date(booking.booking_date).getDate()}</span>
                        <span className="session-month">{new Date(booking.booking_date).toLocaleString('en-US', { month: 'short' })}</span>
                      </div>
                      <div className="session-details">
                        <h4>Coaching Session with {coach.name}</h4>
                        <p>📅 {dateStr}</p>
                        <p>🕐 {timeStr} (1 hour)</p>
                        <span className={`session-status ${booking.status}`}>{booking.status}</span>
                      </div>
                      <button 
                        className="btn-cancel-session"
                        onClick={() => setCancelConfirm(booking)}
                      >
                        Cancel
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* About Section */}
        <section className="coach-section">
          <h2>About {coach.name}</h2>
          <p className="coach-bio-full">{coach.bio}</p>
        </section>

        {/* What to Expect */}
        <section className="coach-section">
          <h2>What to Expect</h2>
          <div className="expect-grid">
            <div className="expect-item">
              <span className="expect-icon">🎯</span>
              <h4>1-on-1 Sessions</h4>
              <p>Private, focused sessions tailored to your specific needs and goals</p>
            </div>
            <div className="expect-item">
              <span className="expect-icon">💬</span>
              <h4>Safe Space</h4>
              <p>A judgment-free environment to explore your thoughts and challenges</p>
            </div>
            <div className="expect-item">
              <span className="expect-icon">📋</span>
              <h4>Action Plans</h4>
              <p>Leave each session with clear steps and strategies to implement</p>
            </div>
            <div className="expect-item">
              <span className="expect-icon">🔄</span>
              <h4>Ongoing Support</h4>
              <p>Continuous guidance on your personal growth journey</p>
            </div>
          </div>
        </section>

        {/* Areas of Focus */}
        <section className="coach-section">
          <h2>Areas of Focus</h2>
          <div className="focus-areas">
            <span className="focus-tag">Life Transitions</span>
            <span className="focus-tag">Career Decisions</span>
            <span className="focus-tag">Mindset Shifts</span>
            <span className="focus-tag">Personal Growth</span>
            <span className="focus-tag">Goal Setting</span>
            <span className="focus-tag">Confidence Building</span>
            <span className="focus-tag">Work-Life Balance</span>
            <span className="focus-tag">Stress Management</span>
          </div>
        </section>

        {/* Session Details */}
        <section className="coach-section">
          <h2>Session Details</h2>
          <div className="session-info-grid">
            <div className="session-info-item">
              <span className="info-icon">⏱️</span>
              <div>
                <strong>Duration</strong>
                <p>60 minutes per session</p>
              </div>
            </div>
            <div className="session-info-item">
              <span className="info-icon">💻</span>
              <div>
                <strong>Format</strong>
                <p>Video call via Zoom</p>
              </div>
            </div>
            <div className="session-info-item">
              <span className="info-icon">📅</span>
              <div>
                <strong>Availability</strong>
                <p>Monday - Friday, 9am - 5pm</p>
              </div>
            </div>
            <div className="session-info-item">
              <span className="info-icon">💰</span>
              <div>
                <strong>Investment</strong>
                <p>${coach.price} per session</p>
              </div>
            </div>
          </div>
        </section>

        {/* Embedded Booking Calendar */}
        <section className="coach-section" id="booking-calendar">
          <h2>Schedule Your Session</h2>
          {user ? (
            <EmbeddedBookingCalendar 
              coach={coach} 
              user={user} 
              onBookingComplete={handleBookingComplete}
            />
          ) : (
            <div className="login-to-book-banner">
              <div className="login-banner-content">
                <span className="login-banner-icon">📅</span>
                <div>
                  <h4>Ready to book a session?</h4>
                  <p>Login or create an account to schedule your personalized coaching session with {coach.name}.</p>
                </div>
                <div className="login-banner-buttons">
                  <Link to="/login" className="btn btn-primary">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-secondary">
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Contact/Inquiry Section */}
        <section className="coach-section">
          <h2>Have a Question?</h2>
          <p className="inquiry-subtitle">Send a message to {coach.name} before booking</p>
          
          {inquirySubmitted ? (
            <div className="inquiry-success">
              <span className="success-icon">✅</span>
              <h4>Message Sent!</h4>
              <p>{coach.name} will get back to you soon.</p>
            </div>
          ) : (
            <form className="inquiry-form" onSubmit={handleInquirySubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inquiry-name">Your Name</label>
                  <input 
                    type="text" 
                    id="inquiry-name"
                    name="name"
                    value={inquiryForm.name}
                    onChange={handleInquiryChange}
                    placeholder="Enter your name"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="inquiry-email">Your Email</label>
                  <input 
                    type="email" 
                    id="inquiry-email"
                    name="email"
                    value={inquiryForm.email}
                    onChange={handleInquiryChange}
                    placeholder="Enter your email"
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="inquiry-message">Your Message</label>
                <textarea 
                  id="inquiry-message"
                  name="message"
                  value={inquiryForm.message}
                  onChange={handleInquiryChange}
                  placeholder="What would you like to discuss in your coaching session?"
                  rows="4"
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">
                Send Message
              </button>
            </form>
          )}
        </section>

        {/* CTA Section */}
        <section className="coach-cta">
          <h2>Ready to Start Your Journey?</h2>
          <p>Book a session with {coach.name} and take the first step towards positive change.</p>
          <a href="#booking-calendar" className="btn btn-primary btn-large">
            Book Your Session Now
          </a>
        </section>
      </div>

      {/* Cancel Booking Confirmation Popup */}
      {cancelConfirm && (
        <div className="confirm-overlay" onClick={() => setCancelConfirm(null)}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">❌</div>
            <h3>Cancel Booking?</h3>
            <p>Are you sure you want to cancel this session with <strong>{coach.name}</strong>?</p>
            <div className="confirm-details">
              <p>👤 Coach: {coach.name}</p>
              <p>📆 Date: {cancelConfirm.booking_date ? new Date(cancelConfirm.booking_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'N/A'}</p>
              <p>🕐 Time: {cancelConfirm.booking_time ? cancelConfirm.booking_time.slice(0, 5) : 'N/A'}</p>
            </div>
            <div className="confirm-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => setCancelConfirm(null)}
              >
                Keep Booking
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleCancelBooking}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Coaches
