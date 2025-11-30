import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCourses, purchaseCourse } from '../api'

function Courses({ user }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses()
        setCourses(data)
      } catch (error) {
        console.error('Error fetching courses:', error)
        setMessage({ text: 'Failed to load courses', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
  }, [])

  const handlePurchase = async (course) => {
    if (!user) return // Prevent purchase if not logged in
    
    try {
      const data = await purchaseCourse(course.id, user.id)
      
      if (data.success) {
        setMessage({ text: `🎉 "${course.title}" purchased successfully!`, type: 'success' })
      } else {
        setMessage({ text: data.message || 'Purchase failed', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to complete purchase', type: 'error' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading courses...</p>
      </div>
    )
  }

  return (
    <div className="courses-page">
      <div className="page-header">
        <h1>Live Courses</h1>
        <p>Join interactive live sessions led by expert instructors</p>
      </div>

      {/* Guest Banner */}
      {!user && (
        <div className="guest-banner">
          <div className="guest-banner-content">
            <span className="guest-banner-icon">🔴</span>
            <div className="guest-banner-text">
              <strong>Join our live courses!</strong>
              <p>Login or create an account to enroll in interactive live sessions with expert instructors.</p>
            </div>
            <Link to="/login" className="btn btn-primary">
              Login to Enroll
            </Link>
          </div>
        </div>
      )}

      {message.text && (
        <div style={{ 
          background: message.type === 'success' ? '#D5E8D4' : '#FFE5E5', 
          padding: '1rem', 
          textAlign: 'center', 
          fontWeight: '600',
          color: message.type === 'success' ? '#2D5A27' : '#C00'
        }}>
          {message.text}
        </div>
      )}

      <section className="section">
        <div className="cards-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <Link to={`/courses/${course.id}`} className="course-card-link">
                <div className="course-image" style={{ background: course.color }}>
                  {course.image}
                </div>
                <div className="course-content">
                  <span className="course-category">{course.category}</span>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                <div className="course-meta">
                  <span>🔴 {course.lessons} live sessions</span>
                  <span>⏱️ {course.duration}</span>
                </div>
                </div>
              </Link>
              <div className="course-footer">
                <span className="course-price">${course.price}</span>
                {user ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handlePurchase(course)}
                  >
                    Buy Now
                  </button>
                ) : (
                  <Link to="/login" className="btn btn-secondary">
                    Login to Purchase
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Courses
