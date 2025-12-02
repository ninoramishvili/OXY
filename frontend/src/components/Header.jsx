import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'

function Header({ user, onLogout }) {
  const { getCartCount } = useCart()
  const cartCount = getCartCount()
  
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

  const toggleTheme = () => {
    setDarkMode(!darkMode)
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
                  <span className="user-avatar">{(user.name || user.username || 'U')[0].toUpperCase()}</span>
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
