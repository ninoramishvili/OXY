import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCourses, purchaseCourse, getUserFavorites, addFavorite, removeFavorite } from '../api'
import { useCart } from '../context/CartContext'

function Courses({ user }) {
  const { addToCart, isInCart } = useCart()
  const [courses, setCourses] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    duration: ''
  })

  // Sort states - load from localStorage
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('courseSortBy') || 'default'
  })
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('courseSortOrder') || 'asc'
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesData = await getCourses()
        setCourses(coursesData)
        
        // Fetch favorites if user is logged in
        if (user?.id) {
          const favoritesData = await getUserFavorites(user.id)
          setFavorites(favoritesData.map(f => f.course_id))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setMessage({ text: 'Failed to load courses', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user])

  // Save sort preferences to localStorage
  useEffect(() => {
    localStorage.setItem('courseSortBy', sortBy)
    localStorage.setItem('courseSortOrder', sortOrder)
  }, [sortBy, sortOrder])

  // Extract unique categories from courses
  const categories = useMemo(() => {
    const cats = [...new Set(courses.map(c => c.category))]
    return cats.sort()
  }, [courses])

  // Price ranges
  const priceRanges = [
    { label: 'Under $30', min: 0, max: 30 },
    { label: '$30 - $50', min: 30, max: 50 },
    { label: '$50 - $75', min: 50, max: 75 },
    { label: 'Over $75', min: 75, max: Infinity }
  ]

  // Duration options
  const durations = [
    { label: '1 hour', value: '1' },
    { label: '2 hours', value: '2' },
    { label: '3+ hours', value: '3+' }
  ]

  // Sort options
  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price', label: 'Price' },
    { value: 'title', label: 'Title' },
    { value: 'newest', label: 'Newest' }
  ]

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    // First filter
    let result = courses.filter(course => {
      if (filters.category && course.category !== filters.category) {
        return false
      }
      
      if (filters.priceRange) {
        const range = priceRanges.find(r => r.label === filters.priceRange)
        if (range && (course.price < range.min || course.price >= range.max)) {
          return false
        }
      }
      
      if (filters.duration) {
        const durationNum = parseInt(course.duration)
        if (filters.duration === '1' && durationNum !== 1) return false
        if (filters.duration === '2' && durationNum !== 2) return false
        if (filters.duration === '3+' && durationNum < 3) return false
      }
      
      return true
    })

    // Then sort
    if (sortBy !== 'default') {
      result = [...result].sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
          case 'price':
            comparison = a.price - b.price
            break
          case 'title':
            comparison = a.title.localeCompare(b.title)
            break
          case 'newest':
            comparison = b.id - a.id // Higher ID = newer
            break
          default:
            comparison = 0
        }
        
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [courses, filters, sortBy, sortOrder])

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      priceRange: '',
      duration: ''
    })
  }

  const handleSortChange = (value) => {
    setSortBy(value)
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const handlePurchase = async (course) => {
    if (!user) return
    
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

  const toggleFavorite = async (e, courseId) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user?.id) {
      setMessage({ text: 'Please login to save favorites', type: 'error' })
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
      return
    }
    
    try {
      if (favorites.includes(courseId)) {
        const result = await removeFavorite(courseId, user.id)
        if (result.success) {
          setFavorites(prev => prev.filter(id => id !== courseId))
          setMessage({ text: '💔 Removed from favorites', type: 'success' })
        } else {
          setMessage({ text: result.message || 'Failed to remove', type: 'error' })
        }
      } else {
        const result = await addFavorite(user.id, courseId)
        if (result.success) {
          setFavorites(prev => [...prev, courseId])
          setMessage({ text: '❤️ Added to favorites!', type: 'success' })
        } else {
          setMessage({ text: result.message || 'Failed to add', type: 'error' })
        }
      }
    } catch (error) {
      console.error('Favorite error:', error)
      setMessage({ text: 'Failed to update favorites', type: 'error' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 2000)
  }

  const isFavorite = (courseId) => favorites.includes(courseId)

  const handleAddToCart = (e, course) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isInCart(course.id)) {
      setMessage({ text: 'Already in cart!', type: 'error' })
    } else {
      addToCart(course)
      setMessage({ text: '🛒 Added to cart!', type: 'success' })
    }
    
    setTimeout(() => setMessage({ text: '', type: '' }), 2000)
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
        <h1>Live Masterclasses</h1>
        <p>2-hour intensive sessions led by expert instructors</p>
      </div>

      {/* Guest Banner */}
      {!user && (
        <div className="guest-banner">
          <div className="guest-banner-content">
            <span className="guest-banner-icon">🎓</span>
            <div className="guest-banner-text">
              <strong>Join our 2-hour masterclasses!</strong>
              <p>Login or create an account to enroll in intensive live sessions with expert instructors.</p>
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
        {/* Filter & Sort Bar */}
        <div className="filter-bar">
          <div className="filter-bar-left">
            <button 
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="filter-icon">🔍</span>
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-count">{activeFilterCount}</span>
              )}
            </button>
            
            {activeFilterCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                ✕ Clear all
              </button>
            )}
          </div>
          
          <div className="filter-bar-right">
            {/* Sort Controls */}
            <div className="sort-controls">
              <label className="sort-label">Sort by:</label>
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              
              {sortBy !== 'default' && (
                <button 
                  className="sort-order-btn"
                  onClick={toggleSortOrder}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              )}
            </div>
            
            <span className="results-count">
              {filteredAndSortedCourses.length} {filteredAndSortedCourses.length === 1 ? 'course' : 'courses'}
            </span>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filter-panel">
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <div className="filter-options">
                <button 
                  className={`filter-option ${filters.category === '' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('category', '')}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    className={`filter-option ${filters.category === cat ? 'active' : ''}`}
                    onClick={() => handleFilterChange('category', cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="filter-group">
              <label className="filter-label">Price Range</label>
              <div className="filter-options">
                <button 
                  className={`filter-option ${filters.priceRange === '' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('priceRange', '')}
                >
                  All
                </button>
                {priceRanges.map(range => (
                  <button 
                    key={range.label}
                    className={`filter-option ${filters.priceRange === range.label ? 'active' : ''}`}
                    onClick={() => handleFilterChange('priceRange', range.label)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Filter */}
            <div className="filter-group">
              <label className="filter-label">Duration</label>
              <div className="filter-options">
                <button 
                  className={`filter-option ${filters.duration === '' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('duration', '')}
                >
                  All
                </button>
                {durations.map(dur => (
                  <button 
                    key={dur.value}
                    className={`filter-option ${filters.duration === dur.value ? 'active' : ''}`}
                    onClick={() => handleFilterChange('duration', dur.value)}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Tags */}
        {activeFilterCount > 0 && (
          <div className="active-filters">
            {filters.category && (
              <span className="filter-tag">
                {filters.category}
                <button onClick={() => handleFilterChange('category', '')}>✕</button>
              </span>
            )}
            {filters.priceRange && (
              <span className="filter-tag">
                {filters.priceRange}
                <button onClick={() => handleFilterChange('priceRange', '')}>✕</button>
              </span>
            )}
            {filters.duration && (
              <span className="filter-tag">
                {durations.find(d => d.value === filters.duration)?.label}
                <button onClick={() => handleFilterChange('duration', '')}>✕</button>
              </span>
            )}
          </div>
        )}

        {/* Courses Grid */}
        {filteredAndSortedCourses.length > 0 ? (
          <div className="cards-grid">
            {filteredAndSortedCourses.map(course => (
              <div key={course.id} className="course-card">
                <button 
                  className={`favorite-btn ${isFavorite(course.id) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorite(e, course.id)}
                  title={isFavorite(course.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite(course.id) ? '❤️' : '🤍'}
                </button>
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
                  <div className="course-actions">
                    <button 
                      className={`btn btn-cart ${isInCart(course.id) ? 'in-cart' : ''}`}
                      onClick={(e) => handleAddToCart(e, course)}
                    >
                      {isInCart(course.id) ? '✓ In Cart' : '🛒 Add'}
                    </button>
                    {user ? (
                      <button 
                        className="btn btn-primary"
                        onClick={() => handlePurchase(course)}
                      >
                        Buy Now
                      </button>
                    ) : (
                      <Link to="/login" className="btn btn-secondary">
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <h3>No courses found</h3>
            <p>Try adjusting your filters to find what you're looking for.</p>
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default Courses
