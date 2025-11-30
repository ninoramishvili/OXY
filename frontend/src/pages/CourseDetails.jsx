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
        setMessage({ text: '🎉 Course purchased successfully!', type: 'success' })
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

  // Sample curriculum based on course lessons count
  const curriculum = Array.from({ length: course.lessons || 8 }, (_, i) => ({
    id: i + 1,
    title: getCurriculumTitle(course.category, i + 1),
    duration: `${10 + Math.floor(Math.random() * 20)} min`
  }))

  return (
    <div className="course-details-page">
      {/* Hero Section */}
      <div className="course-hero" style={{ background: course.color }}>
        <div className="course-hero-content">
          <Link to="/courses" className="back-link">← Back to Courses</Link>
          
          <div className="course-hero-grid">
            <div className="course-hero-info">
              <span className="course-category">{course.category}</span>
              <h1>{course.title}</h1>
              <p className="course-hero-description">{course.description}</p>
              
              <div className="course-hero-meta">
                <span>📚 {course.lessons} lessons</span>
                <span>⏱️ {course.duration}</span>
                <span>📊 All Levels</span>
              </div>
            </div>
            
            <div className="course-hero-card">
              <div className="course-hero-icon">{course.image}</div>
              <div className="course-hero-price">${course.price}</div>
              
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
                  Purchase Course
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary btn-large" style={{ width: '100%', textAlign: 'center' }}>
                  Login to Purchase
                </Link>
              )}
              
              <p className="course-guarantee">30-day money-back guarantee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="course-details-content">
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

        {/* Curriculum */}
        <section className="course-section">
          <h2>Course Curriculum</h2>
          <div className="curriculum-list">
            {curriculum.map((lesson, i) => (
              <div key={lesson.id} className="curriculum-item">
                <div className="curriculum-number">{i + 1}</div>
                <div className="curriculum-info">
                  <h4>{lesson.title}</h4>
                  <span className="curriculum-duration">{lesson.duration}</span>
                </div>
                <span className="curriculum-lock">🔒</span>
              </div>
            ))}
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

// Helper function for curriculum titles
function getCurriculumTitle(category, lessonNum) {
  const titles = {
    'Wellbeing': [
      'Introduction to Mental Wellbeing',
      'Understanding Your Emotions',
      'Building Healthy Habits',
      'Mindfulness Basics',
      'Stress Recognition',
      'Self-Care Strategies',
      'Building Resilience',
      'Creating Balance',
      'Long-term Wellness Planning',
      'Final Assessment'
    ],
    'Productivity': [
      'Productivity Foundations',
      'Goal Setting Mastery',
      'Time Blocking Techniques',
      'Eliminating Distractions',
      'Energy Management',
      'Workflow Optimization',
      'Tools & Systems',
      'Building Momentum',
      'Sustainable Productivity',
      'Final Project'
    ],
    'Mindfulness': [
      'What is Mindfulness?',
      'Breath Awareness',
      'Body Scan Meditation',
      'Mindful Movement',
      'Dealing with Thoughts',
      'Emotional Awareness',
      'Daily Practice Integration',
      'Advanced Techniques',
      'Mindfulness in Relationships',
      'Continuing Your Journey'
    ],
    'Focus': [
      'The Science of Focus',
      'Attention Training',
      'Deep Work Principles',
      'Environment Design',
      'Digital Minimalism',
      'Flow State Access',
      'Focus Rituals',
      'Recovery & Rest',
      'Long-term Focus Building',
      'Mastery Assessment'
    ]
  }
  
  const categoryTitles = titles[category] || titles['Wellbeing']
  return categoryTitles[lessonNum - 1] || `Lesson ${lessonNum}`
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

