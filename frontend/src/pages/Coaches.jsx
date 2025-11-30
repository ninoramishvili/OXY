import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCoaches, getUserBookings, cancelBooking } from '../api'
import BookingModal from '../components/BookingModal'

function Coaches({ user }) {
  const [coaches, setCoaches] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [showBookings, setShowBookings] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coachesData = await getCoaches()
        setCoaches(coachesData)
        
        // Fetch user's bookings if logged in
        if (user?.id) {
          const bookingsData = await getUserBookings(user.id)
          setMyBookings(bookingsData.filter(b => b.status !== 'cancelled'))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setMessage({ text: 'Failed to load coaches', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user])

  const handleOpenBooking = (coach) => {
    if (!user) return // Prevent booking modal if not logged in
    setSelectedCoach(coach)
  }

  const handleCloseModal = () => {
    setSelectedCoach(null)
  }

  const handleBookingComplete = async (booking) => {
    // Refresh bookings
    if (user?.id) {
      const bookingsData = await getUserBookings(user.id)
      setMyBookings(bookingsData.filter(b => b.status !== 'cancelled'))
    }
    // Update coach session count in UI
    setCoaches(prev => prev.map(c => 
      c.id === booking.coach_id ? { ...c, sessions: c.sessions + 1 } : c
    ))
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
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
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
    const hour = parseInt(time.split(':')[0])
    const timeStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    return `${dateStr} at ${timeStr}`
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading coaches...</p>
      </div>
    )
  }

  return (
    <div className="coaches-page">
      <div className="page-header" style={{ background: 'linear-gradient(135deg, #D5E8D4 0%, #D4E5F7 100%)' }}>
        <h1>Our Coaches</h1>
        <p>Expert coaches ready to guide your personal growth journey</p>
      </div>

      {/* Guest Banner */}
      {!user && (
        <div className="guest-banner">
          <div className="guest-banner-content">
            <span className="guest-banner-icon">🗓️</span>
            <div className="guest-banner-text">
              <strong>Book a session with our expert coaches!</strong>
              <p>Login or create an account to schedule your personalized coaching session.</p>
            </div>
            <Link to="/login" className="btn btn-primary">
              Login to Book
            </Link>
          </div>
        </div>
      )}

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

      {/* My Bookings Section */}
      {user && myBookings.length > 0 && (
        <section className="my-bookings-section">
          <div className="my-bookings-header" onClick={() => setShowBookings(!showBookings)}>
            <h3>📅 My Upcoming Sessions ({myBookings.length})</h3>
            <span className="toggle-icon">{showBookings ? '▼' : '▶'}</span>
          </div>
          
          {showBookings && (
            <div className="my-bookings-list">
              {myBookings.map(booking => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-coach-avatar" style={{ background: '#E8D5E0' }}>
                    {booking.image}
                  </div>
                  <div className="booking-details">
                    <h4>{booking.coach_name}</h4>
                    <p>{formatBookingDate(booking.booking_date, booking.booking_time)}</p>
                    <span className={`booking-status ${booking.status}`}>{booking.status}</span>
                  </div>
                  <button 
                    className="btn btn-cancel"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Coaches Grid */}
      <section className="section">
        <div className="cards-grid">
          {coaches.map(coach => (
            <div key={coach.id} className="coach-card">
              <div className="coach-avatar" style={{ background: coach.color }}>
                {coach.image}
              </div>
              <h3>{coach.name}</h3>
              <p className="coach-title">{coach.title}</p>
              <span className="coach-specialty">{coach.specialty}</span>
              <p className="coach-bio">{coach.bio}</p>
              <div className="coach-stats">
                <span>⭐ {coach.rating}</span>
                <span>📅 {coach.sessions}+ sessions</span>
              </div>
              <p className="coach-price">${coach.price}/session</p>
              {user ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleOpenBooking(coach)}
                >
                  Book Session
                </button>
              ) : (
                <Link to="/login" className="btn btn-secondary">
                  Login to Book
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      {selectedCoach && (
        <BookingModal
          coach={selectedCoach}
          user={user}
          onClose={handleCloseModal}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  )
}

export default Coaches
