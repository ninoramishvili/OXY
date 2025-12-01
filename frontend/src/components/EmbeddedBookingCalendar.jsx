import { useState, useEffect } from 'react'
import { getCoachSlots, bookSession } from '../api'

function EmbeddedBookingCalendar({ coach, user, onBookingComplete }) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [weekDates, setWeekDates] = useState([])
  const [confirmPopup, setConfirmPopup] = useState(null)
  const [bookingNotes, setBookingNotes] = useState('')

  function getTodayDate() {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

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

  useEffect(() => {
    setWeekDates(generateWeekDates(getTodayDate()))
  }, [])

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

  const handleSlotClick = (slot) => {
    if (!user) return
    if (slot.available) {
      setConfirmPopup({ slot, action: 'book' })
    }
  }

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

  const formatTime = (hour) => {
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${h}:00 ${ampm}`
  }

  const formatSelectedDate = () => {
    const date = new Date(selectedDate)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const hours = Array.from({ length: 8 }, (_, i) => i + 9)

  if (!coach) return null

  return (
    <div className="embedded-calendar">
      {/* Calendar Header */}
      <div className="embedded-calendar-header">
        <h3>📅 Book a Session</h3>
        <p>${coach.price}/session • 1 hour</p>
      </div>

      {/* Week Navigation */}
      <div className="calendar-nav-embedded">
        <button 
          className="nav-btn-embedded" 
          onClick={() => navigateWeek(-1)}
          disabled={weekDates[0]?.date === getTodayDate()}
        >
          ‹
        </button>
        <span className="current-month-embedded">
          {weekDates.length > 0 && new Date(weekDates[0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button className="nav-btn-embedded" onClick={() => navigateWeek(1)}>
          ›
        </button>
      </div>

      {/* Week Days */}
      <div className="week-calendar-embedded">
        {weekDates.map((day) => (
          <button
            key={day.date}
            className={`day-btn-embedded ${selectedDate === day.date ? 'selected' : ''} ${day.isToday ? 'today' : ''} ${day.isPast ? 'past' : ''}`}
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
        <div className={`calendar-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Time Slots */}
      <div className="time-slots-embedded">
        <div className="selected-date-label">
          {formatSelectedDate()}
        </div>
        
        {loading ? (
          <div className="loading-slots-embedded">Loading available times...</div>
        ) : slots.length > 0 ? (
          <div className="slots-grid-embedded">
            {hours.map(hour => {
              const timeStr = `${hour.toString().padStart(2, '0')}:00`
              const slot = slots.find(s => s.time === timeStr)
              const isAvailable = slot?.available
              
              return (
                <button
                  key={hour}
                  className={`slot-btn-embedded ${isAvailable ? 'available' : 'unavailable'}`}
                  onClick={() => isAvailable && handleSlotClick(slot)}
                  disabled={!isAvailable || !user}
                >
                  <span className="slot-time">{formatTime(hour)}</span>
                  <span className="slot-status">
                    {isAvailable ? (user ? 'Available' : 'Login to book') : 'Booked'}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="no-slots-embedded">
            <p>No availability on this day</p>
            <p className="hint">Available Monday - Friday</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="calendar-legend-embedded">
        <div className="legend-item-embedded">
          <div className="legend-dot available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item-embedded">
          <div className="legend-dot unavailable"></div>
          <span>Booked</span>
        </div>
      </div>

      {/* Confirmation Popup */}
      {confirmPopup && (
        <div className="confirm-overlay-embedded" onClick={() => { setConfirmPopup(null); setBookingNotes(''); }}>
          <div className="confirm-popup-embedded" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">📅</div>
            <h3>Confirm Booking</h3>
            <p>Book a session with <strong>{coach.name}</strong>?</p>
            <div className="confirm-details-embedded">
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
            <div className="confirm-buttons-embedded">
              <button className="btn btn-secondary" onClick={() => { setConfirmPopup(null); setBookingNotes(''); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleConfirmBook}>
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmbeddedBookingCalendar

