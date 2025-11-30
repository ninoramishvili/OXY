import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCourses, getCoaches } from '../api'

function Home({ user }) {
  const [courses, setCourses] = useState([])
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, coachesData] = await Promise.all([
          getCourses(),
          getCoaches()
        ]);
        setCourses(coursesData.slice(0, 3)); // Show only 3
        setCoaches(coachesData.slice(0, 4)); // Show only 4
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Transform Your Life with OXY</h1>
          <p>
            Join 2-hour masterclasses and coaching sessions that help you manage anxiety, 
            boost productivity, and live your best life. Your journey to 
            personal growth starts here.
          </p>
          <div className="hero-buttons">
            <Link to="/courses" className="btn btn-primary btn-large">
              Explore Courses
            </Link>
            <Link to="/coaches" className="btn btn-secondary btn-large">
              Meet Our Coaches
            </Link>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="section">
        <h2 className="section-title">
          Live <span>Masterclasses</span>
        </h2>
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
                  <span>🔴 Live masterclass</span>
                  <span>⏱️ {course.duration}</span>
                </div>
                </div>
              </Link>
              <div className="course-footer">
                <span className="course-price">${course.price}</span>
                <Link to={`/courses/${course.id}`} className="btn btn-primary">View Details</Link>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/courses" className="btn btn-secondary btn-large">
            View All Courses
          </Link>
        </div>
      </section>

      {/* Coach Preview */}
      <section className="section section-alt">
        <h2 className="section-title">
          Meet Your <span>Coach</span>
        </h2>
        {coaches.length > 0 && (
          <div className="coach-preview">
            <div className="coach-preview-avatar" style={{ background: coaches[0].color }}>
              {coaches[0].image}
            </div>
            <div className="coach-preview-info">
              <h3>{coaches[0].name}</h3>
              <p className="coach-preview-title">{coaches[0].title}</p>
              <span className="coach-preview-specialty">{coaches[0].specialty}</span>
              <p className="coach-preview-bio">{coaches[0].bio}</p>
              <div className="coach-preview-stats">
                <span>⭐ {coaches[0].rating} rating</span>
                <span>📅 {coaches[0].sessions}+ sessions</span>
                <span>💰 ${coaches[0].price}/session</span>
              </div>
              <Link to="/coaches" className="btn btn-primary btn-large">
                Book a Session
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="hero" style={{ background: 'linear-gradient(135deg, #D5E8D4 0%, #FFF3CD 100%)' }}>
        <div className="hero-content">
          {user ? (
            <>
              <h1>Welcome Back, {user.name}! 👋</h1>
              <p>
                Continue your self-development journey. Explore new courses 
                or book a session with our expert coaches.
              </p>
              <div className="hero-buttons">
                <Link to="/courses" className="btn btn-primary btn-large">
                  Browse Courses
                </Link>
                <Link to="/coaches" className="btn btn-secondary btn-large">
                  Book a Session
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1>Ready to Start Your Journey?</h1>
              <p>
                Join thousands of people who have transformed their lives with OXY. 
                Take the first step today.
              </p>
              <div className="hero-buttons">
                <Link to="/login" className="btn btn-primary btn-large">
                  Get Started Free
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
