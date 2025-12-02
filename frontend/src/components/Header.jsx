import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { getUnreadCommentCount } from '../api'

const API_BASE = 'http://localhost:5000/api'

function Header({ user, onLogout }) {
  const { getCartCount } = useCart()
  const cartCount = getCartCount()
  const [unreadCount, setUnreadCount] = useState(0)
  const [coachNotifications, setCoachNotifications] = useState([])
  const [coachUnreadCount, setCoachUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Fetch unread comment count for regular users
  useEffect(() => {
    if (user && user.role !== 'coach') {
      const fetchUnread = async () => {
        try {
          const data = await getUnreadCommentCount(user.id)
          setUnreadCount(data.unreadCount || 0)
        } catch (error) {
          console.error('Error fetching unread count:', error)
        }
      }
      fetchUnread()
      // Poll every 30 seconds
      const interval = setInterval(fetchUnread, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Fetch notifications for coaches
  useEffect(() => {
    if (user && user.role === 'coach') {
      const fetchCoachNotifications = async () => {
        try {
          // Fetch unread count
          const countRes = await fetch(`${API_BASE}/coach-notifications/1/unread`)
          const countData = await countRes.json()
          setCoachUnreadCount(countData.count || 0)
          
          // Fetch notifications
          const notifRes = await fetch(`${API_BASE}/coach-notifications/1`)
          const notifData = await notifRes.json()
          setCoachNotifications(Array.isArray(notifData) ? notifData : [])
        } catch (error) {
          console.error('Error fetching coach notifications:', error)
        }
      }
      fetchCoachNotifications()
      // Poll every 15 seconds
      const interval = setInterval(fetchCoachNotifications, 15000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setDarkMode(!darkMode)
  }

  const markNotificationRead = async (notificationId) => {
    try {
      await fetch(`${API_BASE}/coach-notifications/${notificationId}/read`, { method: 'PUT' })
      setCoachNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setCoachUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/coach-notifications/1/read-all`, { method: 'PUT' })
      setCoachNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setCoachUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <div className="logo-circle">O</div>
          <span>OXY</span>
        </Link>
        
        <nav className="nav">
          {user?.role === 'coach' ? (
            // Coach Navigation
            <>
              <Link to="/coach-dashboard" className="nav-link">Dashboard</Link>
              <Link to="/about" className="nav-link">About</Link>
              
              {/* Coach Notification Bell */}
              <div className="notification-bell-container" ref={notificationRef}>
                <button 
                  className="notification-bell"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  🔔
                  {coachUnreadCount > 0 && (
                    <span className="notification-badge">{coachUnreadCount}</span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h4>Notifications</h4>
                      {coachUnreadCount > 0 && (
                        <button className="mark-all-read" onClick={markAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notification-list">
                      {coachNotifications.length > 0 ? (
                        coachNotifications.slice(0, 10).map(notif => (
                          <div 
                            key={notif.id} 
                            className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                            onClick={() => !notif.is_read && markNotificationRead(notif.id)}
                          >
                            <div className="notification-icon">
                              {notif.type === 'new_booking' && '📅'}
                              {notif.type === 'booking_cancelled' && '❌'}
                              {notif.type === 'user_message' && '💬'}
                            </div>
                            <div className="notification-content">
                              <span className="notification-title">{notif.title}</span>
                              <p className="notification-message">{notif.message}</p>
                              <span className="notification-time">{formatTimeAgo(notif.created_at)}</span>
                            </div>
                            {!notif.is_read && <span className="unread-dot"></span>}
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">
                          <span>🔔</span>
                          <p>No notifications yet</p>
                        </div>
                      )}
                    </div>
                    <Link to="/coach-dashboard" className="notification-footer" onClick={() => setShowNotifications(false)}>
                      View all in Dashboard
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            // User Navigation
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/courses" className="nav-link">Courses</Link>
              <Link to="/coaches" className="nav-link">Coach</Link>
              <Link to="/about" className="nav-link">About</Link>
              
              {/* Cart Icon */}
              <Link to="/cart" className="cart-icon-link">
                <span className="cart-icon">🛒</span>
                {cartCount > 0 && (
                  <span className="cart-count">{cartCount}</span>
                )}
              </Link>
            </>
          )}
          
          <button 
            onClick={toggleTheme} 
            className="theme-toggle"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {user ? (
            <div className="user-info">
              {user.role === 'coach' ? (
                <Link to="/coach-dashboard" className="user-profile-link">
                  <span className="user-avatar coach-avatar">🎓</span>
                  <span className="user-name">{user.name || user.username}</span>
                </Link>
              ) : (
                <Link to="/profile" className="user-profile-link">
                  <span className="user-avatar">
                    {(user.name || user.username || 'U')[0].toUpperCase()}
                    {unreadCount > 0 && <span className="notification-dot"></span>}
                  </span>
                  <span className="user-name">{user.name || user.username}</span>
                </Link>
              )}
              <button onClick={onLogout} className="btn btn-secondary btn-small">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
