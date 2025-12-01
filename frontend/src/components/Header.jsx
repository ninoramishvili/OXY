import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Header({ user, onLogout }) {
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
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/courses" className="nav-link">Courses</Link>
          <Link to="/coaches" className="nav-link">Coach</Link>
          <Link to="/about" className="nav-link">About</Link>
          
          <button 
            onClick={toggleTheme} 
            className="theme-toggle"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {user ? (
            <div className="user-info">
              <Link to="/profile" className="user-profile-link">
                <span className="user-avatar">{(user.name || user.username || 'U')[0].toUpperCase()}</span>
                <span className="user-name">{user.name || user.username}</span>
              </Link>
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

