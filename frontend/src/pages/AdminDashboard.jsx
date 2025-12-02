import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000/api'

function AdminDashboard({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  
  // Data states
  const [stats, setStats] = useState({})
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [coaches, setCoaches] = useState([])
  const [bookings, setBookings] = useState([])
  
  // Modal states
  const [editModal, setEditModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [addModal, setAddModal] = useState(null)
  
  // Form states
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }
    fetchAllData()
  }, [user, navigate])

  const fetchAllData = async () => {
    try {
      const [statsRes, usersRes, coursesRes, coachesRes, bookingsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`),
        fetch(`${API_BASE}/admin/users`),
        fetch(`${API_BASE}/courses`),
        fetch(`${API_BASE}/coaches`),
        fetch(`${API_BASE}/admin/bookings`)
      ])
      
      setStats(await statsRes.json())
      setUsers(await usersRes.json())
      setCourses(await coursesRes.json())
      setCoaches(await coachesRes.json())
      setBookings(await bookingsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  // User Management
  const handleUpdateUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ User updated', 'success')
        setEditModal(null)
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to update user', 'error')
    }
  }

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${deleteConfirm.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ User deleted', 'success')
        setDeleteConfirm(null)
        fetchAllData()
      } else {
        showMessage(data.message || 'Failed to delete user', 'error')
      }
    } catch (error) {
      showMessage('Failed to delete user', 'error')
    }
  }

  // Course Management
  const handleAddCourse = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ Course created', 'success')
        setAddModal(null)
        setFormData({})
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to create course', 'error')
    }
  }

  const handleUpdateCourse = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/courses/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ Course updated', 'success')
        setEditModal(null)
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to update course', 'error')
    }
  }

  const handleDeleteCourse = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/courses/${deleteConfirm.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ Course deleted', 'success')
        setDeleteConfirm(null)
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to delete course', 'error')
    }
  }

  // Coach Management
  const handleAddCoach = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/coaches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ Coach created', 'success')
        setAddModal(null)
        setFormData({})
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to create coach', 'error')
    }
  }

  const handleUpdateCoach = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/coaches/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ Coach updated', 'success')
        setEditModal(null)
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to update coach', 'error')
    }
  }

  const handleDeleteCoach = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/coaches/${deleteConfirm.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ Coach deleted', 'success')
        setDeleteConfirm(null)
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to delete coach', 'error')
    }
  }

  // Booking Management
  const handleUpdateBookingStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ Status updated', 'success')
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to update status', 'error')
    }
  }

  const handleDeleteBooking = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${deleteConfirm.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showMessage('✅ Booking deleted', 'success')
        setDeleteConfirm(null)
        fetchAllData()
      }
    } catch (error) {
      showMessage('Failed to delete booking', 'error')
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  if (!user || user.role !== 'admin') return null

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>🛠️ Admin Dashboard</h1>
        <p>Manage your platform</p>
      </div>

      {/* Stats Overview */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-details">
            <span className="stat-number">{stats.users}</span>
            <span className="stat-label">Users</span>
            <span className="stat-sub">+{stats.recentUsers} this week</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">📚</span>
          <div className="stat-details">
            <span className="stat-number">{stats.courses}</span>
            <span className="stat-label">Courses</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">🎓</span>
          <div className="stat-details">
            <span className="stat-number">{stats.coaches}</span>
            <span className="stat-label">Coaches</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-details">
            <span className="stat-number">{stats.bookings}</span>
            <span className="stat-label">Bookings</span>
            <span className="stat-sub">{stats.pendingBookings} pending</span>
          </div>
        </div>
        <div className="admin-stat-card highlight">
          <span className="stat-icon">💰</span>
          <div className="stat-details">
            <span className="stat-number">${stats.revenue?.toFixed(2)}</span>
            <span className="stat-label">Revenue</span>
            <span className="stat-sub">{stats.purchases} purchases</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 Users ({users.length})
        </button>
        <button className={`admin-tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
          📚 Courses ({courses.length})
        </button>
        <button className={`admin-tab ${activeTab === 'coaches' ? 'active' : ''}`} onClick={() => setActiveTab('coaches')}>
          🎓 Coaches ({coaches.length})
        </button>
        <button className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
          📅 Bookings ({bookings.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="admin-grid">
              <div className="admin-card">
                <h3>📈 Recent Activity</h3>
                <div className="activity-list">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="activity-item">
                      <span className="activity-icon">📅</span>
                      <div>
                        <strong>{b.user_name}</strong> booked with <strong>{b.coach_name}</strong>
                        <span className="activity-date">{formatDate(b.booking_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-card">
                <h3>⏳ Pending Bookings</h3>
                <div className="pending-list">
                  {bookings.filter(b => b.status === 'pending').slice(0, 5).map(b => (
                    <div key={b.id} className="pending-item">
                      <div>
                        <strong>{b.user_name}</strong>
                        <span>{formatDate(b.booking_date)}</span>
                      </div>
                      <div className="pending-actions">
                        <button className="btn btn-success btn-small" onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}>✓</button>
                        <button className="btn btn-danger btn-small" onClick={() => handleUpdateBookingStatus(b.id, 'declined')}>✕</button>
                      </div>
                    </div>
                  ))}
                  {bookings.filter(b => b.status === 'pending').length === 0 && (
                    <p className="empty-text">No pending bookings</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h3>👥 User Management</h3>
            </div>
            <div className="admin-table">
              <div className="table-header">
                <span>ID</span>
                <span>Username</span>
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Purchases</span>
                <span>Actions</span>
              </div>
              {users.map(u => (
                <div key={u.id} className="table-row">
                  <span>#{u.id}</span>
                  <span>{u.username}</span>
                  <span>{u.name || '-'}</span>
                  <span>{u.email || '-'}</span>
                  <span className={`role-badge ${u.role}`}>{u.role || 'user'}</span>
                  <span>{u.purchases_count}</span>
                  <span className="actions">
                    <button className="btn btn-small btn-secondary" onClick={() => { setEditModal({ type: 'user', ...u }); setFormData({ name: u.name, email: u.email, role: u.role || 'user' }); }}>
                      Edit
                    </button>
                    {u.role !== 'admin' && (
                      <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm({ type: 'user', ...u })}>
                        Delete
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="courses-section">
            <div className="section-header">
              <h3>📚 Course Management</h3>
              <button className="btn btn-primary" onClick={() => { setAddModal({ type: 'course' }); setFormData({ level: 'beginner', color: '#E8D5E0', image: '📚' }); }}>
                + Add Course
              </button>
            </div>
            <div className="admin-table">
              <div className="table-header">
                <span>ID</span>
                <span>Title</span>
                <span>Category</span>
                <span>Price</span>
                <span>Duration</span>
                <span>Level</span>
                <span>Actions</span>
              </div>
              {courses.map(c => (
                <div key={c.id} className="table-row">
                  <span>#{c.id}</span>
                  <span><strong>{c.title}</strong></span>
                  <span>{c.category}</span>
                  <span>${c.price}</span>
                  <span>{c.duration}</span>
                  <span className={`level-badge ${c.level}`}>{c.level}</span>
                  <span className="actions">
                    <button className="btn btn-small btn-secondary" onClick={() => { setEditModal({ type: 'course', ...c }); setFormData(c); }}>
                      Edit
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm({ type: 'course', ...c })}>
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaches Tab */}
        {activeTab === 'coaches' && (
          <div className="coaches-section">
            <div className="section-header">
              <h3>🎓 Coach Management</h3>
              <button className="btn btn-primary" onClick={() => { setAddModal({ type: 'coach' }); setFormData({ image: '👤' }); }}>
                + Add Coach
              </button>
            </div>
            <div className="admin-table">
              <div className="table-header">
                <span>ID</span>
                <span>Name</span>
                <span>Specialty</span>
                <span>Price/Session</span>
                <span>Sessions</span>
                <span>Rating</span>
                <span>Actions</span>
              </div>
              {coaches.map(c => (
                <div key={c.id} className="table-row">
                  <span>#{c.id}</span>
                  <span><strong>{c.name}</strong></span>
                  <span>{c.specialty}</span>
                  <span>${c.price}</span>
                  <span>{c.sessions}</span>
                  <span>⭐ {c.rating}</span>
                  <span className="actions">
                    <button className="btn btn-small btn-secondary" onClick={() => { setEditModal({ type: 'coach', ...c }); setFormData(c); }}>
                      Edit
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm({ type: 'coach', ...c })}>
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <div className="section-header">
              <h3>📅 Booking Management</h3>
            </div>
            <div className="admin-table">
              <div className="table-header">
                <span>ID</span>
                <span>User</span>
                <span>Coach</span>
                <span>Date</span>
                <span>Time</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {bookings.map(b => (
                <div key={b.id} className="table-row">
                  <span>#{b.id}</span>
                  <span>{b.user_name || 'Unknown'}</span>
                  <span>{b.coach_name}</span>
                  <span>{formatDate(b.booking_date)}</span>
                  <span>{b.booking_time?.slice(0, 5)}</span>
                  <span>
                    <select 
                      value={b.status} 
                      onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                      className={`status-select ${b.status}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </span>
                  <span className="actions">
                    <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm({ type: 'booking', ...b })}>
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast Message */}
      {message.text && (
        <div className={`toast-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="confirm-overlay" onClick={() => setEditModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Edit {editModal.type}</h3>
            
            {editModal.type === 'user' && (
              <div className="modal-form">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={formData.role || 'user'} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option value="user">User</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            )}

            {editModal.type === 'course' && (
              <div className="modal-form">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price</label>
                    <input type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input type="text" value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: e.target.value})} placeholder="e.g., 2 hours" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Level</label>
                    <select value={formData.level || 'beginner'} onChange={(e) => setFormData({...formData, level: e.target.value})}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Instructor</label>
                    <input type="text" value={formData.instructor || ''} onChange={(e) => setFormData({...formData, instructor: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {editModal.type === 'coach' && (
              <div className="modal-form">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Specialty</label>
                  <input type="text" value={formData.specialty || ''} onChange={(e) => setFormData({...formData, specialty: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea value={formData.bio || ''} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price per Session</label>
                    <input type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Experience</label>
                    <input type="text" value={formData.experience || ''} onChange={(e) => setFormData({...formData, experience: e.target.value})} placeholder="e.g., 5 years" />
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                if (editModal.type === 'user') handleUpdateUser()
                else if (editModal.type === 'course') handleUpdateCourse()
                else if (editModal.type === 'coach') handleUpdateCoach()
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <div className="confirm-overlay" onClick={() => setAddModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>➕ Add {addModal.type}</h3>
            
            {addModal.type === 'course' && (
              <div className="modal-form">
                <div className="form-group">
                  <label>Title *</label>
                  <input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input type="text" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price *</label>
                    <input type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input type="text" value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: e.target.value})} placeholder="e.g., 2 hours" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Level</label>
                    <select value={formData.level || 'beginner'} onChange={(e) => setFormData({...formData, level: e.target.value})}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Instructor</label>
                    <input type="text" value={formData.instructor || ''} onChange={(e) => setFormData({...formData, instructor: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {addModal.type === 'coach' && (
              <div className="modal-form">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Life Coach" />
                </div>
                <div className="form-group">
                  <label>Specialty</label>
                  <input type="text" value={formData.specialty || ''} onChange={(e) => setFormData({...formData, specialty: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea value={formData.bio || ''} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price per Session *</label>
                    <input type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Experience</label>
                    <input type="text" value={formData.experience || ''} onChange={(e) => setFormData({...formData, experience: e.target.value})} placeholder="e.g., 5 years" />
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setAddModal(null); setFormData({}); }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                if (addModal.type === 'course') handleAddCourse()
                else if (addModal.type === 'coach') handleAddCoach()
              }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete {deleteConfirm.type}?</h3>
            <p>Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                if (deleteConfirm.type === 'user') handleDeleteUser()
                else if (deleteConfirm.type === 'course') handleDeleteCourse()
                else if (deleteConfirm.type === 'coach') handleDeleteCoach()
                else if (deleteConfirm.type === 'booking') handleDeleteBooking()
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

