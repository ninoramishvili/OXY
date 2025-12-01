import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUser, updateUser, changePassword, getUserPurchases, getUserBookings, cancelBooking, getUserFavorites, removeFavorite } from '../api'

function Profile({ user, onUpdateUser }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  
  // Profile data
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [editMode, setEditMode] = useState(false)
  
  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Purchases, bookings, and favorites
  const [purchases, setPurchases] = useState([])
  const [bookings, setBookings] = useState([])
  const [favorites, setFavorites] = useState([])
  const [cancelConfirm, setCancelConfirm] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    const fetchData = async () => {
      try {
        const [userData, purchasesData, bookingsData, favoritesData] = await Promise.all([
          getUser(user.id),
          getUserPurchases(user.id),
          getUserBookings(user.id),
          getUserFavorites(user.id)
        ])
        
        setProfile({ name: userData.name || '', email: userData.email || '' })
        setPurchases(purchasesData)
        setBookings(bookingsData)
        setFavorites(favoritesData)
      } catch (error) {
        console.error('Error fetching profile data:', error)
        setMessage({ text: 'Failed to load profile data', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, navigate])

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(user.id, profile)
      if (result.success) {
        showMessage('✅ Profile updated successfully!', 'success')
        setEditMode(false)
        if (onUpdateUser && result.user) {
          onUpdateUser(result.user)
        }
      } else {
        showMessage(result.message || 'Failed to update profile', 'error')
      }
    } catch (error) {
      showMessage('Failed to update profile', 'error')
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('New passwords do not match', 'error')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', 'error')
      return
    }
    
    try {
      const result = await changePassword(user.id, passwordForm.currentPassword, passwordForm.newPassword)
      if (result.success) {
        showMessage('✅ Password changed successfully!', 'success')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        showMessage(result.message || 'Failed to change password', 'error')
      }
    } catch (error) {
      showMessage('Failed to change password', 'error')
    }
  }

  const handleCancelBooking = async () => {
    if (!cancelConfirm) return
    
    const bookingId = cancelConfirm.id
    setCancelConfirm(null)
    
    try {
      const result = await cancelBooking(bookingId, user.id)
      if (result.success) {
        setBookings(prev => prev.filter(b => b.id !== bookingId))
        showMessage('✅ Booking cancelled successfully!', 'success')
      } else {
        showMessage(result.message || 'Failed to cancel booking', 'error')
      }
    } catch (error) {
      showMessage('Failed to cancel booking', 'error')
    }
  }

  const handleRemoveFavorite = async (courseId) => {
    try {
      const result = await removeFavorite(courseId, user.id)
      if (result.success) {
        setFavorites(prev => prev.filter(f => f.course_id !== courseId))
        showMessage('💔 Removed from favorites', 'success')
      } else {
        showMessage(result.message || 'Failed to remove', 'error')
      }
    } catch (error) {
      showMessage('Failed to remove from favorites', 'error')
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    const hour = parseInt(timeStr.split(':')[0])
    return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading profile...</p>
      </div>
    )
  }

  // Get initials for avatar
  const getInitials = () => {
    const name = profile.name || user.username || 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {getInitials()}
        </div>
        <div className="profile-header-info">
          <h1>{profile.name || user.username}</h1>
          <p>{profile.email || 'No email set'}</p>
          <span className="member-since">Member since {formatDate(user.created_at || new Date())}</span>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
        <button 
          className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ❤️ Favorites ({favorites.length})
        </button>
        <button 
          className={`profile-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 My Courses ({purchases.length})
        </button>
        <button 
          className={`profile-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📅 My Bookings ({bookings.filter(b => b.status !== 'cancelled').length})
        </button>
        <button 
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header-profile">
              <h2>Personal Information</h2>
              {!editMode && (
                <button className="btn btn-secondary" onClick={() => setEditMode(true)}>
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className="profile-form">
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={user.username} 
                  disabled 
                  className="input-disabled"
                />
                <span className="form-hint">Username cannot be changed</span>
              </div>
              
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  disabled={!editMode}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  disabled={!editMode}
                  placeholder="Enter your email"
                />
              </div>
              
              {editMode && (
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="profile-section">
            <h2>My Favorite Courses</h2>
            
            {favorites.length > 0 ? (
              <div className="favorites-grid">
                {favorites.map(fav => (
                  <div key={fav.id} className="favorite-card">
                    <button 
                      className="remove-favorite-btn"
                      onClick={() => handleRemoveFavorite(fav.course_id)}
                      title="Remove from favorites"
                    >
                      ❤️
                    </button>
                    <Link to={`/courses/${fav.course_id}`} className="favorite-card-link">
                      <div className="favorite-image" style={{ background: fav.color || '#E8D5E0' }}>
                        {fav.image || '📚'}
                      </div>
                      <div className="favorite-info">
                        <span className="favorite-category">{fav.category}</span>
                        <h4>{fav.course_title}</h4>
                        <p className="favorite-price">${fav.price}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">❤️</span>
                <h3>No favorites yet</h3>
                <p>Save courses you're interested in by clicking the heart icon.</p>
                <Link to="/courses" className="btn btn-primary">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="profile-section">
            <h2>My Purchased Courses</h2>
            
            {purchases.length > 0 ? (
              <div className="purchases-list">
                {purchases.map(purchase => (
                  <div key={purchase.id} className="purchase-card">
                    <div className="purchase-image" style={{ background: purchase.color || '#E8D5E0' }}>
                      {purchase.image || '📚'}
                    </div>
                    <div className="purchase-info">
                      <h4>{purchase.course_title}</h4>
                      <p className="purchase-category">{purchase.category}</p>
                      <p className="purchase-date">Purchased on {formatDate(purchase.purchase_date)}</p>
                    </div>
                    <div className="purchase-actions">
                      <Link to={`/courses/${purchase.course_id}`} className="btn btn-primary">
                        View Course
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <h3>No courses yet</h3>
                <p>You haven't purchased any courses yet.</p>
                <Link to="/courses" className="btn btn-primary">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="profile-section">
            <h2>My Coaching Sessions</h2>
            
            {bookings.filter(b => b.status !== 'cancelled').length > 0 ? (
              <div className="bookings-list">
                {bookings.filter(b => b.status !== 'cancelled').map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-date-badge">
                      <span className="booking-day">{new Date(booking.booking_date).getDate()}</span>
                      <span className="booking-month">{new Date(booking.booking_date).toLocaleString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="booking-info">
                      <h4>Session with {booking.coach_name}</h4>
                      <p>📅 {formatDate(booking.booking_date)}</p>
                      <p>🕐 {formatTime(booking.booking_time)} (1 hour)</p>
                      {booking.notes && (
                        <div className="booking-notes">
                          <span className="notes-label">📝 Notes:</span>
                          <p>{booking.notes}</p>
                        </div>
                      )}
                      <span className={`booking-status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="booking-actions">
                      <button 
                        className="btn btn-cancel"
                        onClick={() => setCancelConfirm(booking)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📅</span>
                <h3>No bookings yet</h3>
                <p>You haven't booked any coaching sessions yet.</p>
                <Link to="/coaches" className="btn btn-primary">
                  Book a Session
                </Link>
              </div>
            )}

            {/* Past/Cancelled Bookings */}
            {bookings.filter(b => b.status === 'cancelled').length > 0 && (
              <div className="past-bookings">
                <h3>Cancelled Bookings</h3>
                <div className="bookings-list faded">
                  {bookings.filter(b => b.status === 'cancelled').map(booking => (
                    <div key={booking.id} className="booking-card cancelled">
                      <div className="booking-date-badge">
                        <span className="booking-day">{new Date(booking.booking_date).getDate()}</span>
                        <span className="booking-month">{new Date(booking.booking_date).toLocaleString('en-US', { month: 'short' })}</span>
                      </div>
                      <div className="booking-info">
                        <h4>Session with {booking.coach_name}</h4>
                        <p>📅 {formatDate(booking.booking_date)}</p>
                        <span className="booking-status-badge cancelled">Cancelled</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="profile-section">
            <h2>Account Settings</h2>
            
            {/* Change Password */}
            <div className="settings-card">
              <h3>🔒 Change Password</h3>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>
              </form>
            </div>

            {/* Preferences */}
            <div className="settings-card">
              <h3>🔔 Notifications</h3>
              <div className="settings-options">
                <label className="toggle-option">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-label">Email notifications for new courses</span>
                </label>
                <label className="toggle-option">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-label">Booking reminders</span>
                </label>
                <label className="toggle-option">
                  <input type="checkbox" />
                  <span className="toggle-label">Marketing emails</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Booking Confirmation Popup */}
      {cancelConfirm && (
        <div className="confirm-overlay" onClick={() => setCancelConfirm(null)}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">❌</div>
            <h3>Cancel Booking?</h3>
            <p>Are you sure you want to cancel this session with <strong>{cancelConfirm.coach_name}</strong>?</p>
            <div className="confirm-details">
              <p>👤 Coach: {cancelConfirm.coach_name || 'Unknown'}</p>
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

export default Profile

