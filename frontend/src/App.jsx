import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Courses from './pages/Courses'
import CourseDetails from './pages/CourseDetails'
import Coaches from './pages/Coaches'
import About from './pages/About'
import Profile from './pages/Profile'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import CoachDashboard from './pages/CoachDashboard'

function App() {
  const [user, setUser] = useState(null)

  // Check for stored user session on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem('user')
        sessionStorage.removeItem('user')
      }
    }
  }, [])

  const handleLogin = (userData, rememberMe = false) => {
    setUser(userData)
    // Store user based on "Remember Me" preference
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData))
      sessionStorage.removeItem('user')
    } else {
      sessionStorage.setItem('user', JSON.stringify(userData))
      localStorage.removeItem('user')
    }
  }

  const handleLogout = () => {
    setUser(null)
    // Clear both storage types
    localStorage.removeItem('user')
    sessionStorage.removeItem('user')
  }

  const handleUpdateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
  }

  return (
    <CartProvider>
      <div className="app">
        <Header user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<Courses user={user} />} />
            <Route path="/courses/:id" element={<CourseDetails user={user} />} />
            <Route path="/coaches" element={<Coaches user={user} />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile user={user} onUpdateUser={handleUpdateUser} />} />
            <Route path="/cart" element={<Cart user={user} />} />
            <Route path="/checkout" element={<Checkout user={user} />} />
            <Route path="/coach-dashboard" element={<CoachDashboard user={user} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}

export default App
