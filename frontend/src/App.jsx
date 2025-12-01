import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
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

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  const handleUpdateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
  }

  return (
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
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App

