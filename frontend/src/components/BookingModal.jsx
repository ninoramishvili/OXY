import { useState, useEffect } from 'react'
import { getCoachSlots, bookSession, cancelBooking } from '../api'

function BookingModal({ coach, user, onClose, onBookingComplete }) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [weekDates, setWeekDates] = useState([])
  const [confirmPopup, setConfirmPopup] = useState(null)
  const [bookingNotes, setBookingNotes] = useState('')

  // Get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Generate dates for the current week view
  function generateWeekDates(startDate) {
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
        isToday: date.toISOString().split('T')[0] === getTodayDate(),
        isPast: date < new Date(getTodayDate())
      })
    }
    return dates
  }

  // Navigate to next/previous week
  const navigateWeek = (direction) => {
    const currentStart = new Date(weekDates[0].date)
    currentStart.setDate(currentStart.getDate() + (direction * 7))
    
    const today = new Date(getTodayDate())
    if (currentStart < today) {
      currentStart.setTime(today.getTime())
    }
    
    setWeekDates(generateWeekDates(currentStart.toISOString().split('T')[0]))
    setSelectedDate(currentStart.toISOString().split('T')[0])
  }

  // Load initial week dates
  useEffect(() => {
    setWeekDates(generateWeekDates(getTodayDate()))
  }, [])

  // Fetch slots when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !coach) return
      
      setLoading(true)
      setMessage({ text: '', type: '' })
      
      try {
        const data = await getCoachSlots(coach.id, selectedDate)
        if (data.available) {
          setSlots(data.slots)
        } else {
          setSlots([])
        }
      } catch (error) {
        console.error('Error fetching slots:', error)
        setMessage({ text: 'Failed to load schedule', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [selectedDate, coach])

  // Refresh slots after action
  const refreshSlots = async () => {
    try {
      const data = await getCoachSlots(coach.id, selectedDate)
      if (data.available) {
        setSlots(data.slots)
      } else {
        setSlots([])
      }
    } catch (error) {
      console.error('Error refreshing slots:', error)
    }
  }

  // Handle slot click - show confirmation
  const handleSlotClick = (slot) => {
    // If slot is available, show booking confirmation
    if (slot.available) {
      setConfirmPopup({ slot, action: 'book' })
      return
    }
    
    // If slot is booked by current user, show cancel confirmation
    if (slot.bookedBy === user?.id && slot.bookingId) {
      setConfirmPopup({ 
        slot, 
        action: 'cancel', 
        bookingId: slot.bookingId 
      })
    }
  }

  // Confirm booking
  const handleConfirmBook = async () => {
    if (!confirmPopup) return
    
    const { slot } = confirmPopup
    setConfirmPopup(null)
    setMessage({ text: '', type: '' })

    try {
      const result = await bookSession({
        coachId: coach.id,
        userId: user?.id || 1,
        date: selectedDate,
        time: slot.time,
        notes: bookingNotes.trim() || ''
      })

      if (result.success) {
        setMessage({ text: '✅ Session booked successfully!', type: 'success' })
        setBookingNotes('') // Clear notes after booking
        await refreshSlots()
        if (onBookingComplete) onBookingComplete(result.booking)
      } else {
        setMessage({ text: result.message || 'Booking failed', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to book session', type: 'error' })
    }
  }

  // Confirm cancellation
  const handleConfirmCancel = async () => {
    if (!confirmPopup?.bookingId) return
    
    const { bookingId } = confirmPopup
    setConfirmPopup(null)
    setMessage({ text: '', type: '' })

    try {
      const result = await cancelBooking(bookingId, user?.id)
      if (result.success) {
        setMessage({ text: '✅ Booking cancelled successfully!', type: 'success' })
        // Immediately refresh slots to show the slot as available
        await refreshSlots()
      } else {
        setMessage({ text: result.message || 'Failed to cancel', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to cancel booking', type: 'error' })
    }
  }

  // Format time for display
  const formatTime = (hour) => {
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${h}:00 ${ampm}`
  }

  // Format selected date for display
  const formatSelectedDate = () => {
    const date = new Date(selectedDate)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Generate hour labels (9am to 5pm)
  const hours = Array.from({ length: 8 }, (_, i) => i + 9) // 9, 10, 11, 12, 13, 14, 15, 16

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-modal gcal-style" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="coach-info-mini">
            <div className="coach-avatar-mini" style={{ background: coach.color }}>
              {coach.image}
            </div>
            <div>
              <h3>Book Session with {coach.name}</h3>
              <p>{coach.title} • ${coach.price}/session</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Calendar Navigation */}
        <div className="calendar-nav">
          <button 
            className="nav-btn" 
            onClick={() => navigateWeek(-1)}
            disabled={weekDates[0]?.date === getTodayDate()}
          >
            ‹
          </button>
          <span className="current-month">
            {weekDates.length > 0 && new Date(weekDates[0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button className="nav-btn" onClick={() => navigateWeek(1)}>
            ›
          </button>
        </div>

        {/* Week Calendar */}
        <div className="week-calendar">
          {weekDates.map((day) => (
            <button
              key={day.date}
              className={`day-btn ${selectedDate === day.date ? 'selected' : ''} ${day.isToday ? 'today' : ''} ${day.isPast ? 'past' : ''}`}
              onClick={() => !day.isPast && setSelectedDate(day.date)}
              disabled={day.isPast}
            >
              <span className="day-name">{day.dayName}</span>
              <span className="day-number">{day.dayNumber}</span>
            </button>
          ))}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`booking-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Google Calendar Style Daily View */}
        <div className="gcal-container">
          <div className="gcal-header">
            <h4>{formatSelectedDate()}</h4>
          </div>
          
          {loading ? (
            <div className="loading-slots">Loading schedule...</div>
          ) : slots.length > 0 ? (
            <div className="gcal-timeline">
              {/* Time labels column */}
              <div className="gcal-time-labels">
                {hours.map(hour => (
                  <div key={hour} className="gcal-time-label">
                    {formatTime(hour)}
                  </div>
                ))}
              </div>
              
              {/* Slots column */}
              <div className="gcal-slots-column">
                {hours.map(hour => {
                  const timeStr = `${hour.toString().padStart(2, '0')}:00`
                  const slot = slots.find(s => s.time === timeStr)
                  const isMyBooking = slot && !slot.available && slot.bookedBy === user?.id
                  
                  if (!slot) {
                    return (
                      <div key={hour} className="gcal-slot unavailable">
                        <div className="slot-content booked-content">
                          <span className="slot-label">Unavailable</span>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div 
                      key={hour} 
                      className={`gcal-slot ${slot.available ? 'available' : 'booked'} ${isMyBooking ? 'my-booking' : ''}`}
                      onClick={() => handleSlotClick(slot)}
                    >
                      {slot.available ? (
                        <div className="slot-content available-content">
                          <span className="slot-label">Available</span>
                          <span className="slot-action">Click to book</span>
                        </div>
                      ) : isMyBooking ? (
                        <div className="slot-content my-booking-content">
                          <span className="slot-label">📅 Your Session</span>
                          <span className="slot-action">Click to cancel</span>
                        </div>
                      ) : (
                        <div className="slot-content booked-content">
                          <span className="slot-label">Booked</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="no-slots">
              <p>😔 No availability on this day</p>
              <p className="hint">Coach is available Monday - Friday</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="gcal-legend">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-color booked"></div>
            <span>Booked</span>
          </div>
          <div className="legend-item">
            <div className="legend-color my-booking"></div>
            <span>Your Booking</span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <p className="booking-note">
            💡 Each session is 1 hour. Click on an available slot to book.
          </p>
        </div>
      </div>

      {/* Confirmation Popup */}
      {confirmPopup && (
        <div className="confirm-overlay" onClick={() => setConfirmPopup(null)}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            {confirmPopup.action === 'book' ? (
              <>
                <div className="confirm-icon">📅</div>
                <h3>Confirm Booking</h3>
                <p>Book a session with <strong>{coach.name}</strong>?</p>
                <div className="confirm-details">
                  <p>📆 {formatSelectedDate()}</p>
                  <p>🕐 {confirmPopup.slot.display} (1 hour)</p>
                  <p>💰 ${coach.price}</p>
                </div>
                <div className="booking-notes-input">
                  <label>What would you like to discuss? (optional)</label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value.slice(0, 500))}
                    placeholder="Share what topics or goals you'd like to focus on..."
                    rows={3}
                    maxLength={500}
                  />
                  <span className="char-count">{bookingNotes.length}/500</span>
                </div>
                <div className="confirm-buttons">
                  <button className="btn btn-secondary" onClick={() => { setConfirmPopup(null); setBookingNotes(''); }}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleConfirmBook}>
                    Confirm Booking
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="confirm-icon">❌</div>
                <h3>Cancel Booking?</h3>
                <p>Are you sure you want to cancel this session?</p>
                <div className="confirm-details">
                  <p>👤 {coach.name}</p>
                  <p>📆 {formatSelectedDate()}</p>
                  <p>🕐 {confirmPopup.slot.display}</p>
                </div>
                <div className="confirm-buttons">
                  <button className="btn btn-secondary" onClick={() => setConfirmPopup(null)}>
                    Keep Booking
                  </button>
                  <button className="btn btn-cancel-confirm" onClick={handleConfirmCancel}>
                    Yes, Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingModal
