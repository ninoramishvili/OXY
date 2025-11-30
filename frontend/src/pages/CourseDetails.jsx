import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getCourse, purchaseCourse, getCourses } from '../api'

function CourseDetails({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [relatedCourses, setRelatedCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseData = await getCourse(id)
        setCourse(courseData)
        
        // Fetch related courses (same category, excluding current)
        const allCourses = await getCourses()
        const related = allCourses
          .filter(c => c.category === courseData.category && c.id !== courseData.id)
          .slice(0, 3)
        setRelatedCourses(related)
      } catch (error) {
        console.error('Error fetching course:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    
    try {
      const data = await purchaseCourse(course.id, user.id)
      
      if (data.success) {
        setMessage({ text: '🎉 Enrolled successfully! Check your email for session details.', type: 'success' })
      } else {
        setMessage({ text: data.message || 'Enrollment failed', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Failed to complete enrollment', type: 'error' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading course...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Course not found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Courses
        </Link>
      </div>
    )
  }

  // Generate upcoming live session dates
  const upcomingSessions = generateUpcomingSessions(course.lessons || 8)

  return (
    <div className="course-details-page">
      {/* Hero Section */}
      <div className="course-hero" style={{ background: course.color }}>
        <div className="course-hero-content">
          <Link to="/courses" className="back-link">← Back to Courses</Link>
          
          <div className="course-hero-grid">
            <div className="course-hero-info">
              <div className="live-badge">🔴 LIVE COURSE</div>
              <span className="course-category">{course.category}</span>
              <h1>{course.title}</h1>
              <p className="course-hero-description">{course.description}</p>
              
              <div className="course-hero-meta">
                <span>📅 {course.lessons} live sessions</span>
                <span>⏱️ {course.duration}</span>
                <span>👥 Small group (max 15)</span>
              </div>
            </div>
            
            <div className="course-hero-card">
              <div className="course-hero-icon">{course.image}</div>
              <div className="course-hero-price">${course.price}</div>
              <p className="course-price-note">Full course access</p>
              
              {message.text && (
                <div className={`course-message ${message.type}`}>
                  {message.text}
                </div>
              )}
              
              {user ? (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handlePurchase}
                  style={{ width: '100%' }}
                >
                  Enroll Now
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary btn-large" style={{ width: '100%', textAlign: 'center' }}>
                  Login to Enroll
                </Link>
              )}
              
              <p className="course-guarantee">Limited spots available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="course-details-content">
        {/* Live Course Benefits */}
        <section className="course-section">
          <h2>Why Live Sessions?</h2>
          <div className="live-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">🎯</span>
              <div>
                <h4>Real-time Interaction</h4>
                <p>Ask questions and get immediate answers from your instructor</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">👥</span>
              <div>
                <h4>Group Learning</h4>
                <p>Learn alongside others and benefit from shared experiences</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">📝</span>
              <div>
                <h4>Practical Exercises</h4>
                <p>Participate in live exercises and get real-time feedback</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🔄</span>
              <div>
                <h4>Session Recordings</h4>
                <p>Access recordings if you miss a session (available for 30 days)</p>
              </div>
            </div>
          </div>
        </section>

        {/* What You'll Learn */}
        <section className="course-section">
          <h2>What You'll Learn</h2>
          <div className="learning-outcomes">
            {getLearnOutcomes(course.category).map((outcome, i) => (
              <div key={i} className="outcome-item">
                <span className="outcome-check">✓</span>
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Session Schedule */}
        <section className="course-section">
          <h2>Upcoming Live Sessions</h2>
          <p className="schedule-note">Sessions are held via Zoom. Links will be sent after enrollment.</p>
          <div className="sessions-list">
            {upcomingSessions.map((session, i) => (
              <div key={i} className="session-item">
                <div className="session-date">
                  <span className="session-day">{session.day}</span>
                  <span className="session-month">{session.month}</span>
                </div>
                <div className="session-info">
                  <h4>Session {i + 1}: {getSessionTitle(course.category, i + 1)}</h4>
                  <span className="session-time">{session.time}</span>
                </div>
                <span className="session-duration">60 min</span>
              </div>
            ))}
          </div>
        </section>

        {/* Course Format */}
        <section className="course-section">
          <h2>Course Format</h2>
          <div className="format-grid">
            <div className="format-item">
              <span className="format-icon">📅</span>
              <strong>Schedule</strong>
              <p>Weekly sessions, same day & time</p>
            </div>
            <div className="format-item">
              <span className="format-icon">⏰</span>
              <strong>Duration</strong>
              <p>60 minutes per session</p>
            </div>
            <div className="format-item">
              <span className="format-icon">💻</span>
              <strong>Platform</strong>
              <p>Zoom (link provided after enrollment)</p>
            </div>
            <div className="format-item">
              <span className="format-icon">📧</span>
              <strong>Materials</strong>
              <p>Worksheets sent before each session</p>
            </div>
          </div>
        </section>

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <section className="course-section">
            <h2>Related Courses</h2>
            <div className="related-courses-grid">
              {relatedCourses.map(relCourse => (
                <Link 
                  key={relCourse.id} 
                  to={`/courses/${relCourse.id}`}
                  className="related-course-card"
                >
                  <div className="related-course-icon" style={{ background: relCourse.color }}>
                    {relCourse.image}
                  </div>
                  <div className="related-course-info">
                    <h4>{relCourse.title}</h4>
                    <span className="related-course-price">${relCourse.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// Generate upcoming session dates
function generateUpcomingSessions(count) {
  const sessions = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 7) // Start next week
  
  // Find next Tuesday
  while (startDate.getDay() !== 2) {
    startDate.setDate(startDate.getDate() + 1)
  }
  
  for (let i = 0; i < count; i++) {
    const sessionDate = new Date(startDate)
    sessionDate.setDate(sessionDate.getDate() + (i * 7)) // Weekly sessions
    
    sessions.push({
      day: sessionDate.getDate(),
      month: sessionDate.toLocaleString('en-US', { month: 'short' }),
      time: '7:00 PM - 8:00 PM (GMT+4)',
      fullDate: sessionDate
    })
  }
  
  return sessions
}

// Helper function for session titles
function getSessionTitle(category, sessionNum) {
  const titles = {
    'Wellbeing': [
      'Introduction & Goal Setting',
      'Understanding Your Patterns',
      'Building Daily Practices',
      'Mindfulness Techniques',
      'Managing Stress',
      'Self-Care Planning',
      'Building Resilience',
      'Integration & Next Steps'
    ],
    'Productivity': [
      'Productivity Assessment',
      'Goal Setting & Prioritization',
      'Time Blocking Workshop',
      'Eliminating Distractions',
      'Energy Management',
      'Systems & Tools',
      'Building Habits',
      'Sustainable Success'
    ],
    'Mindfulness': [
      'Foundations of Mindfulness',
      'Breath & Body Awareness',
      'Working with Thoughts',
      'Emotional Regulation',
      'Mindful Communication',
      'Daily Practice Integration',
      'Advanced Techniques',
      'Living Mindfully'
    ],
    'Focus': [
      'The Science of Attention',
      'Focus Assessment',
      'Deep Work Strategies',
      'Environment Design',
      'Digital Wellness',
      'Flow State Training',
      'Building Focus Habits',
      'Mastery & Maintenance'
    ]
  }
  
  const categoryTitles = titles[category] || titles['Wellbeing']
  return categoryTitles[sessionNum - 1] || `Session ${sessionNum}`
}

// Helper function for learning outcomes
function getLearnOutcomes(category) {
  const outcomes = {
    'Wellbeing': [
      'Understand the foundations of mental and emotional wellbeing',
      'Develop daily practices for stress reduction',
      'Build lasting habits that support your health',
      'Create a personalized self-care routine',
      'Learn techniques to manage difficult emotions',
      'Build resilience for life\'s challenges'
    ],
    'Productivity': [
      'Master time management and prioritization',
      'Create systems that automate your workflow',
      'Eliminate procrastination and build momentum',
      'Design your ideal productive environment',
      'Balance high performance with wellbeing',
      'Achieve more in less time'
    ],
    'Mindfulness': [
      'Develop a consistent meditation practice',
      'Reduce anxiety through breath work',
      'Improve focus and mental clarity',
      'Build emotional intelligence',
      'Practice mindfulness in daily activities',
      'Create inner peace and calm'
    ],
    'Focus': [
      'Train your attention for deep work',
      'Eliminate digital distractions effectively',
      'Access flow states on demand',
      'Design your environment for focus',
      'Build sustainable concentration habits',
      'Improve cognitive performance'
    ]
  }
  
  return outcomes[category] || outcomes['Wellbeing']
}

export default CourseDetails
