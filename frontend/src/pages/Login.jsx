import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = await login(username, password)

      if (data.success) {
        setSuccess('Login successful! Redirecting...')
        onLogin(data.user)
        setTimeout(() => navigate('/'), 1500)
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome Back! 👋</h2>
        
        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-large login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </p>
        
        <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#888', fontSize: '0.8rem' }}>
          Demo: username "admin", password "password"
        </p>
      </div>
    </div>
  )
}

export default Login
