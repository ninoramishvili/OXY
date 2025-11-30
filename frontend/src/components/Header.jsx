import { Link } from 'react-router-dom'

function Header({ user, onLogout }) {
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
          <Link to="/coaches" className="nav-link">Coaches</Link>
          
          {user ? (
            <div className="user-info">
              <span className="user-name">Hi, {user.name}!</span>
              <button onClick={onLogout} className="btn btn-secondary">
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

