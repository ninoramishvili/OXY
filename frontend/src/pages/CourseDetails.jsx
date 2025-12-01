import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getCourse, getCourses, getCourseReviews, getCourseAverageRating, createReview, updateReview, deleteReview, getUserReview, getUserPurchases } from '../api'
import { useCart } from '../context/CartContext'

function CourseDetails({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, isInCart } = useCart()
  const [course, setCourse] = useState(null)
  const [relatedCourses, setRelatedCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  
  // Reviews state
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState({ average_rating: 0, review_count: 0 })
  const [userReview, setUserReview] = useState(null)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [editingReview, setEditingReview] = useState(false)

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
        
        // Fetch reviews
        const reviewsData = await getCourseReviews(id)
        setReviews(reviewsData)
        
        // Fetch average rating
        const avgData = await getCourseAverageRating(id)
        setAverageRating(avgData)
        
        // Check if user has purchased and reviewed
        if (user?.id) {
          const purchases = await getUserPurchases(user.id)
          const purchased = purchases.some(p => p.course_id === parseInt(id))
          setHasPurchased(purchased)
          
          const userReviewData = await getUserReview(user.id, id)
          if (userReviewData.hasReviewed) {
            setUserReview(userReviewData.review)
            setReviewForm({ 
              rating: userReviewData.review.rating, 
              comment: userReviewData.review.comment || '' 
            })
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id, user])

  const handleBuyNow = () => {
    if (!isInCart(course.id)) {
      addToCart(course)
    }
    navigate('/cart')
  }

  const handleAddToCart = () => {
    if (isInCart(course.id)) {
      setMessage({ text: 'Already in cart!', type: 'error' })
    } else {
      addToCart(course)
      setMessage({ text: '🛒 Added to cart!', type: 'success' })
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 2000)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingReview && userReview) {
        const result = await updateReview(userReview.id, user.id, reviewForm.rating, reviewForm.comment)
        if (result.success) {
          setMessage({ text: '✅ Review updated!', type: 'success' })
          setUserReview(result.review)
          setEditingReview(false)
          // Refresh reviews
          const reviewsData = await getCourseReviews(id)
          setReviews(reviewsData)
          const avgData = await getCourseAverageRating(id)
          setAverageRating(avgData)
        } else {
          setMessage({ text: result.message || 'Failed to update review', type: 'error' })
        }
      } else {
        const result = await createReview(user.id, id, reviewForm.rating, reviewForm.comment)
        if (result.success) {
          setMessage({ text: '✅ Review submitted!', type: 'success' })
          setUserReview(result.review)
          setShowReviewForm(false)
          // Refresh reviews
          const reviewsData = await getCourseReviews(id)
          setReviews(reviewsData)
          const avgData = await getCourseAverageRating(id)
          setAverageRating(avgData)
        } else {
          setMessage({ text: result.message || 'Failed to submit review', type: 'error' })
        }
      }
    } catch (error) {
      setMessage({ text: 'Failed to submit review', type: 'error' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleDeleteReview = async () => {
    if (!confirm('Are you sure you want to delete your review?')) return
    
    try {
      const result = await deleteReview(userReview.id, user.id)
      if (result.success) {
        setMessage({ text: '🗑️ Review deleted', type: 'success' })
        setUserReview(null)
        setReviewForm({ rating: 5, comment: '' })
        // Refresh reviews
        const reviewsData = await getCourseReviews(id)
        setReviews(reviewsData)
        const avgData = await getCourseAverageRating(id)
        setAverageRating(avgData)
      }
    } catch (error) {
      setMessage({ text: 'Failed to delete review', type: 'error' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const renderStars = (rating, interactive = false, size = 'medium') => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${size} ${i <= rating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={interactive ? () => setReviewForm(prev => ({ ...prev, rating: i })) : undefined}
        >
          {i <= rating ? '★' : '☆'}
        </span>
      )
    }
    return <span className="stars-container">{stars}</span>
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Loading masterclass...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Masterclass not found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Masterclasses
        </Link>
      </div>
    )
  }

  // Get next available masterclass date (next Saturday)
  const nextSession = getNextMasterclassDate()

  return (
    <div className="course-details-page">
      {/* Hero Section */}
      <div className="course-hero" style={{ background: course.color }}>
        <div className="course-hero-content">
          <Link to="/courses" className="back-link">← Back to Masterclasses</Link>
          
          <div className="course-hero-grid">
            <div className="course-hero-info">
              <div className="live-badge">🔴 LIVE MASTERCLASS</div>
              <span className="course-category">{course.category}</span>
              <h1>{course.title}</h1>
              <p className="course-hero-description">{course.description}</p>
              
              {/* Rating Display */}
              {averageRating.review_count > 0 && (
                <div className="course-rating-display">
                  {renderStars(Math.round(averageRating.average_rating))}
                  <span className="rating-text">
                    {averageRating.average_rating} ({averageRating.review_count} {averageRating.review_count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
              
              <div className="course-hero-meta">
                <span>⏱️ 2 hours intensive</span>
                <span>🎯 Single session</span>
                <span>👥 Small group (max 15)</span>
              </div>
            </div>
            
            <div className="course-hero-card">
              <div className="course-hero-icon">{course.image}</div>
              <div className="course-hero-price">${course.price}</div>
              <p className="course-price-note">One-time payment</p>
              
              {message.text && (
                <div className={`course-message ${message.type}`}>
                  {message.text}
                </div>
              )}
              
              {hasPurchased ? (
                <div className="already-purchased">
                  <span className="purchased-badge">✅ You own this course</span>
                  <p>Access your course materials anytime</p>
                </div>
              ) : (
                <>
                  <div className="course-hero-buttons">
                    <button 
                      className="btn btn-primary btn-large"
                      onClick={handleBuyNow}
                      style={{ flex: 1 }}
                    >
                      Buy Now
                    </button>
                    <button 
                      className={`btn btn-cart-large ${isInCart(course.id) ? 'in-cart' : ''}`}
                      onClick={handleAddToCart}
                    >
                      {isInCart(course.id) ? '✓' : '🛒'}
                    </button>
                  </div>
                  
                  <p className="course-guarantee">Limited spots available</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="course-details-content">
        {/* Next Session */}
        <section className="course-section">
          <h2>Upcoming Masterclass</h2>
          <div className="masterclass-date-card">
            <div className="masterclass-calendar">
              <span className="masterclass-day">{nextSession.day}</span>
              <span className="masterclass-month">{nextSession.month}</span>
            </div>
            <div className="masterclass-details">
              <h3>{course.title} Masterclass</h3>
              <p className="masterclass-time">📅 {nextSession.fullDate}</p>
              <p className="masterclass-time">🕐 {nextSession.time}</p>
              <p className="masterclass-time">💻 Live on Zoom</p>
            </div>
            <div className="masterclass-duration-badge">
              2 HOURS
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="course-section">
          <h2>What's Included</h2>
          <div className="included-grid">
            <div className="included-item">
              <span className="included-icon">🎯</span>
              <h4>2-Hour Intensive Session</h4>
              <p>Deep dive into the topic with expert guidance</p>
            </div>
            <div className="included-item">
              <span className="included-icon">👥</span>
              <h4>Live Q&A</h4>
              <p>Get your questions answered in real-time</p>
            </div>
            <div className="included-item">
              <span className="included-icon">📝</span>
              <h4>Workbook & Resources</h4>
              <p>Take-home materials to continue your practice</p>
            </div>
            <div className="included-item">
              <span className="included-icon">🔄</span>
              <h4>Session Recording</h4>
              <p>Access the recording for 30 days</p>
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

        {/* Masterclass Agenda */}
        <section className="course-section">
          <h2>Masterclass Agenda</h2>
          <div className="agenda-list">
            {getAgenda(course.category).map((item, i) => (
              <div key={i} className="agenda-item">
                <div className="agenda-time">{item.time}</div>
                <div className="agenda-content">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Who Is This For */}
        <section className="course-section">
          <h2>Who Is This For?</h2>
          <div className="audience-list">
            {getAudience(course.category).map((item, i) => (
              <div key={i} className="audience-item">
                <span className="audience-check">👤</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="course-section reviews-section">
          <div className="reviews-header">
            <h2>⭐ Reviews & Ratings</h2>
            {averageRating.review_count > 0 && (
              <div className="reviews-summary">
                <span className="big-rating">{averageRating.average_rating}</span>
                {renderStars(Math.round(averageRating.average_rating), false, 'large')}
                <span className="review-count">({averageRating.review_count} reviews)</span>
              </div>
            )}
          </div>

          {/* Write Review Section */}
          {user && hasPurchased && (
            <div className="write-review-section">
              {userReview && !editingReview ? (
                <div className="user-review-card">
                  <h4>Your Review</h4>
                  <div className="user-review-content">
                    {renderStars(userReview.rating)}
                    <p>{userReview.comment || 'No comment'}</p>
                  </div>
                  <div className="user-review-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setEditingReview(true)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-cancel"
                      onClick={handleDeleteReview}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {!showReviewForm && !editingReview && !userReview && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowReviewForm(true)}
                    >
                      ✍️ Write a Review
                    </button>
                  )}
                  
                  {(showReviewForm || editingReview) && (
                    <form className="review-form" onSubmit={handleReviewSubmit}>
                      <h4>{editingReview ? 'Edit Your Review' : 'Write a Review'}</h4>
                      
                      <div className="rating-input">
                        <label>Your Rating</label>
                        {renderStars(reviewForm.rating, true)}
                      </div>
                      
                      <div className="comment-input">
                        <label>Your Review (optional)</label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                          placeholder="Share your experience with this masterclass..."
                          rows={4}
                        />
                      </div>
                      
                      <div className="review-form-actions">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowReviewForm(false)
                            setEditingReview(false)
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                          {editingReview ? 'Update Review' : 'Submit Review'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}

          {user && !hasPurchased && (
            <div className="purchase-to-review">
              <p>📚 Purchase this course to leave a review</p>
            </div>
          )}

          {!user && (
            <div className="login-to-review">
              <p>
                <Link to="/login">Login</Link> to leave a review
              </p>
            </div>
          )}

          {/* Reviews List */}
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-avatar">
                        {(review.user_name || review.username || 'U')[0].toUpperCase()}
                      </span>
                      <div>
                        <span className="reviewer-name">{review.user_name || review.username}</span>
                        <span className="review-date">
                          {new Date(review.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                    {renderStars(review.rating, false, 'small')}
                  </div>
                  {review.comment && (
                    <p className="review-comment">{review.comment}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="no-reviews">
                <p>No reviews yet. Be the first to review this masterclass!</p>
              </div>
            )}
          </div>
        </section>

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <section className="course-section">
            <h2>More Masterclasses</h2>
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

// Get next available masterclass date (next Saturday)
function getNextMasterclassDate() {
  const today = new Date()
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7
  const nextSaturday = new Date(today)
  nextSaturday.setDate(today.getDate() + daysUntilSaturday)
  
  return {
    day: nextSaturday.getDate(),
    month: nextSaturday.toLocaleString('en-US', { month: 'short' }),
    fullDate: nextSaturday.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    time: '10:00 AM - 12:00 PM (GMT+4)'
  }
}

// Masterclass agenda by category
function getAgenda(category) {
  const agendas = {
    'Mental Health': [
      { time: '0:00', title: 'Welcome & Introduction', description: 'Setting intentions and understanding what we\'ll cover' },
      { time: '0:15', title: 'Understanding Anxiety', description: 'The science behind anxiety and how it affects us' },
      { time: '0:45', title: 'Practical Techniques', description: 'Hands-on exercises for managing anxious thoughts' },
      { time: '1:15', title: 'Building Your Toolkit', description: 'Creating a personalized anxiety management plan' },
      { time: '1:45', title: 'Q&A & Closing', description: 'Open discussion and next steps' }
    ],
    'Productivity': [
      { time: '0:00', title: 'Welcome & Assessment', description: 'Understanding your current productivity patterns' },
      { time: '0:15', title: 'Core Principles', description: 'The science of peak performance and focus' },
      { time: '0:45', title: 'Systems & Tools', description: 'Setting up your productivity system' },
      { time: '1:15', title: 'Implementation Workshop', description: 'Apply what you\'ve learned to your real goals' },
      { time: '1:45', title: 'Q&A & Action Planning', description: 'Finalize your productivity plan' }
    ],
    'Mental Skills': [
      { time: '0:00', title: 'Welcome & Focus Assessment', description: 'Measuring your current focus capabilities' },
      { time: '0:15', title: 'The Science of Attention', description: 'Understanding how focus works in the brain' },
      { time: '0:45', title: 'Deep Work Techniques', description: 'Practical methods for achieving deep focus' },
      { time: '1:15', title: 'Environment Design', description: 'Creating your ideal focus environment' },
      { time: '1:45', title: 'Q&A & Habit Building', description: 'Making focus a daily habit' }
    ],
    'Personal Growth': [
      { time: '0:00', title: 'Welcome & Reflection', description: 'Understanding where you are and where you want to be' },
      { time: '0:15', title: 'Core Concepts', description: 'Key principles for personal transformation' },
      { time: '0:45', title: 'Practical Exercises', description: 'Hands-on activities for growth' },
      { time: '1:15', title: 'Creating Your Plan', description: 'Building your personal development roadmap' },
      { time: '1:45', title: 'Q&A & Commitments', description: 'Setting intentions for the future' }
    ]
  }
  
  return agendas[category] || agendas['Personal Growth']
}

// Target audience by category
function getAudience(category) {
  const audiences = {
    'Mental Health': [
      'Anyone experiencing stress or anxiety in daily life',
      'Professionals dealing with work-related pressure',
      'People going through life transitions',
      'Those wanting to build emotional resilience'
    ],
    'Productivity': [
      'Professionals looking to achieve more in less time',
      'Entrepreneurs and business owners',
      'Students preparing for exams or projects',
      'Anyone feeling overwhelmed by their to-do list'
    ],
    'Mental Skills': [
      'Knowledge workers needing deep concentration',
      'Creatives seeking flow state',
      'Students needing better study habits',
      'Anyone struggling with digital distractions'
    ],
    'Personal Growth': [
      'People seeking positive life changes',
      'Those at a career or life crossroads',
      'Anyone wanting to discover their potential',
      'Individuals looking for direction and motivation'
    ]
  }
  
  return audiences[category] || audiences['Personal Growth']
}

// Helper function for learning outcomes
function getLearnOutcomes(category) {
  const outcomes = {
    'Mental Health': [
      'Understand the root causes of anxiety and stress',
      'Master 3 proven techniques for instant calm',
      'Build a daily practice for mental wellness',
      'Create your personalized anxiety toolkit',
      'Develop resilience for challenging situations',
      'Learn when and how to seek additional support'
    ],
    'Productivity': [
      'Identify and eliminate your biggest time wasters',
      'Master the art of prioritization',
      'Create systems that work on autopilot',
      'Design your ideal productive environment',
      'Build sustainable high-performance habits',
      'Achieve work-life balance'
    ],
    'Mental Skills': [
      'Train your attention like a muscle',
      'Achieve flow state on command',
      'Eliminate digital distractions permanently',
      'Design your focus-optimized environment',
      'Build unbreakable concentration habits',
      'Boost cognitive performance naturally'
    ],
    'Personal Growth': [
      'Clarify your values and life vision',
      'Build unshakeable self-confidence',
      'Master the art of change and adaptation',
      'Develop lasting motivation and drive',
      'Create meaningful goals and achieve them',
      'Build resilience for life\'s challenges'
    ]
  }
  
  return outcomes[category] || outcomes['Personal Growth']
}

export default CourseDetails
