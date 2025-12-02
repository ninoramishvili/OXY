import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000/api'

function Productivity({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('day')
  const [tasks, setTasks] = useState([])
  const [backlog, setBacklog] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [message, setMessage] = useState({ text: '', type: '' })
  
  // New task form
  const [newTask, setNewTask] = useState({ title: '', categoryId: '', priority: 'medium', estimatedMinutes: 30 })
  const [showAddTask, setShowAddTask] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchData()
  }, [user, selectedDate])

  const fetchData = async () => {
    try {
      const [catRes, backlogRes, dayRes] = await Promise.all([
        fetch(`${API_BASE}/categories/${user.id}`),
        fetch(`${API_BASE}/tasks/${user.id}/backlog`),
        fetch(`${API_BASE}/tasks/${user.id}/date/${selectedDate}`)
      ])
      setCategories(await catRes.json())
      setBacklog(await backlogRes.json())
      setTasks(await dayRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const showToast = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newTask.title,
          categoryId: newTask.categoryId || null,
          priority: newTask.priority,
          estimatedMinutes: newTask.estimatedMinutes
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast('✅ Task added to backlog', 'success')
        setNewTask({ title: '', categoryId: '', priority: 'medium', estimatedMinutes: 30 })
        setShowAddTask(false)
        fetchData()
      }
    } catch (error) {
      showToast('Failed to add task', 'error')
    }
  }

  const handleScheduleTask = async (taskId, time) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, time })
      })
      showToast('📅 Task scheduled', 'success')
      fetchData()
    } catch (error) {
      showToast('Failed to schedule', 'error')
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/complete`, { method: 'PUT' })
      showToast('✅ Task completed!', 'success')
      fetchData()
    } catch (error) {
      showToast('Failed to complete', 'error')
    }
  }

  const handleUnschedule = async (taskId) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/unschedule`, { method: 'PUT' })
      showToast('↩️ Moved to backlog', 'success')
      fetchData()
    } catch (error) {
      showToast('Failed', 'error')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' })
      showToast('🗑️ Task deleted', 'success')
      fetchData()
    } catch (error) {
      showToast('Failed to delete', 'error')
    }
  }

  const changeDate = (days) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  // Generate time slots (8 AM to 8 PM)
  const timeSlots = []
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  if (!user) return null

  return (
    <div className="productivity-page">
      {/* Header */}
      <div className="prod-header">
        <h1>📋 Productivity</h1>
        <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>+ New Task</button>
      </div>

      {/* Tabs */}
      <div className="prod-tabs">
        <button className={`prod-tab ${activeTab === 'day' ? 'active' : ''}`} onClick={() => setActiveTab('day')}>
          📅 Day View
        </button>
        <button className={`prod-tab ${activeTab === 'backlog' ? 'active' : ''}`} onClick={() => setActiveTab('backlog')}>
          📥 Backlog ({backlog.length})
        </button>
      </div>

      <div className="prod-content">
        {/* Day View */}
        {activeTab === 'day' && (
          <div className="day-view">
            {/* Date Navigation */}
            <div className="date-nav">
              <button onClick={() => changeDate(-1)}>← Prev</button>
              <span className={`current-date ${isToday ? 'today' : ''}`}>
                {formatDate(selectedDate)}
                {isToday && <span className="today-badge">Today</span>}
              </span>
              <button onClick={() => changeDate(1)}>Next →</button>
            </div>

            <div className="day-layout">
              {/* Scheduled Tasks Timeline */}
              <div className="timeline">
                <h3>Schedule</h3>
                <div className="time-slots">
                  {timeSlots.map(time => {
                    const slotTasks = tasks.filter(t => t.scheduled_time?.slice(0, 5) === time)
                    return (
                      <div key={time} className="time-slot">
                        <div className="time-label">{parseInt(time) > 12 ? parseInt(time) - 12 : parseInt(time)} {parseInt(time) >= 12 ? 'PM' : 'AM'}</div>
                        <div className="slot-content">
                          {slotTasks.length > 0 ? (
                            slotTasks.map(task => (
                              <div 
                                key={task.id} 
                                className={`scheduled-task ${task.status}`}
                                style={{ borderLeftColor: task.category_color || '#6B7280' }}
                              >
                                <div className="task-header">
                                  <span className="task-cat">{task.category_icon}</span>
                                  <span className="task-title">{task.title}</span>
                                  <span className={`priority-dot ${task.priority}`}></span>
                                </div>
                                <div className="task-actions">
                                  {task.status !== 'completed' && (
                                    <button onClick={() => handleCompleteTask(task.id)} title="Complete">✓</button>
                                  )}
                                  <button onClick={() => handleUnschedule(task.id)} title="Unschedule">↩</button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="empty-slot">—</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Backlog Panel */}
              <div className="quick-backlog">
                <h3>📥 Backlog ({backlog.length})</h3>
                <p className="hint">Click time to schedule task</p>
                <div className="backlog-list">
                  {backlog.slice(0, 10).map(task => (
                    <div key={task.id} className="backlog-task" style={{ borderLeftColor: task.category_color || '#6B7280' }}>
                      <div className="task-info">
                        <span className="task-cat">{task.category_icon || '📋'}</span>
                        <span className="task-title">{task.title}</span>
                        <span className={`priority-badge ${task.priority}`}>{task.priority[0].toUpperCase()}</span>
                      </div>
                      <div className="schedule-times">
                        {['09:00', '10:00', '14:00', '16:00'].map(t => (
                          <button key={t} className="time-btn" onClick={() => handleScheduleTask(task.id, t)}>
                            {parseInt(t)}:00
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {backlog.length === 0 && (
                    <p className="empty-text">No tasks in backlog. Add some!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backlog View */}
        {activeTab === 'backlog' && (
          <div className="backlog-view">
            <div className="backlog-header">
              <h3>📥 Task Backlog</h3>
              <span>{backlog.length} tasks</span>
            </div>
            
            <div className="backlog-full">
              {backlog.map(task => (
                <div key={task.id} className="backlog-item" style={{ borderLeftColor: task.category_color || '#6B7280' }}>
                  <div className="item-main">
                    <span className="item-icon">{task.category_icon || '📋'}</span>
                    <div className="item-content">
                      <span className="item-title">{task.title}</span>
                      {task.description && <p className="item-desc">{task.description}</p>}
                      <div className="item-meta">
                        <span className={`priority ${task.priority}`}>{task.priority}</span>
                        <span className="duration">{task.estimated_minutes} min</span>
                        {task.category_name && <span className="cat-name">{task.category_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn btn-small btn-secondary" onClick={() => handleScheduleTask(task.id, '09:00')}>
                      Schedule Today
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDeleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {backlog.length === 0 && (
                <div className="empty-backlog">
                  <span>🎉</span>
                  <p>Backlog is empty! Add new tasks to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="confirm-overlay" onClick={() => setShowAddTask(false)}>
          <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
            <h3>➕ New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="What do you need to do?"
                  autoFocus
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={newTask.categoryId} onChange={(e) => setNewTask({ ...newTask, categoryId: e.target.value })}>
                    <option value="">None</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Estimated Time</label>
                <select value={newTask.estimatedMinutes} onChange={(e) => setNewTask({ ...newTask, estimatedMinutes: parseInt(e.target.value) })}>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add to Backlog</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {message.text && (
        <div className={`toast-message ${message.type}`}>{message.text}</div>
      )}
    </div>
  )
}

export default Productivity

