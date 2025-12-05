import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000/api'

function Productivity({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('day')
  const [tasks, setTasks] = useState([])
  const [weekTasks, setWeekTasks] = useState([])
  const [backlog, setBacklog] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [message, setMessage] = useState({ text: '', type: '', icon: '' })
  
  // Drag state
  const [draggedTask, setDraggedTask] = useState(null)
  
  // Modals
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditTask, setShowEditTask] = useState(null)
  const [showCategories, setShowCategories] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // { type: 'task' | 'category', id, name }
  
  // New task form
  const [newTask, setNewTask] = useState({ title: '', description: '', categoryId: '', priority: 'medium', estimatedMinutes: 30 })
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📋', color: '#6B7280' })

  // Get Monday of a given week
  function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  // Generate week days from Monday
  function getWeekDays(mondayStr) {
    const days = []
    const monday = new Date(mondayStr)
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day.toISOString().split('T')[0])
    }
    return days
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchData()
  }, [user, selectedDate, weekStart])

  const fetchData = async () => {
    try {
      const [catRes, backlogRes, dayRes, weekRes] = await Promise.all([
        fetch(`${API_BASE}/categories/${user.id}`),
        fetch(`${API_BASE}/tasks/${user.id}/backlog`),
        fetch(`${API_BASE}/tasks/${user.id}/date/${selectedDate}`),
        fetch(`${API_BASE}/tasks/${user.id}/week/${weekStart}`)
      ])
      setCategories(await catRes.json())
      setBacklog(await backlogRes.json())
      setTasks(await dayRes.json())
      setWeekTasks(await weekRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const showToast = (text, type, icon = '') => {
    setMessage({ text, type, icon })
    setTimeout(() => setMessage({ text: '', type: '', icon: '' }), 3000)
  }

  // ========== TASK HANDLERS ==========
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
          description: newTask.description,
          categoryId: newTask.categoryId || null,
          priority: newTask.priority,
          estimatedMinutes: newTask.estimatedMinutes
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Task added to backlog', 'success', '✓')
        setNewTask({ title: '', description: '', categoryId: '', priority: 'medium', estimatedMinutes: 30 })
        setShowAddTask(false)
        fetchData()
      }
    } catch (error) {
      showToast('Failed to add task', 'error', '✕')
    }
  }

  const handleEditTask = async (e) => {
    e.preventDefault()
    if (!showEditTask?.title?.trim()) return
    
    try {
      await fetch(`${API_BASE}/tasks/${showEditTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: showEditTask.title,
          description: showEditTask.description,
          categoryId: showEditTask.category_id || showEditTask.categoryId || null,
          priority: showEditTask.priority,
          estimatedMinutes: showEditTask.estimated_minutes || showEditTask.estimatedMinutes,
          status: showEditTask.status,
          scheduledDate: showEditTask.scheduled_date,
          scheduledTime: showEditTask.scheduled_time
        })
      })
      showToast('Task updated', 'success', '✓')
      setShowEditTask(null)
      fetchData()
    } catch (error) {
      showToast('Failed to update task', 'error', '✕')
    }
  }

  const handleScheduleTask = async (taskId, date, time) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time })
      })
      showToast('Task scheduled', 'success', '📅')
      fetchData()
    } catch (error) {
      showToast('Failed to schedule', 'error', '✕')
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/complete`, { method: 'PUT' })
      showToast('Task completed!', 'success', '✓')
      fetchData()
    } catch (error) {
      showToast('Failed to complete', 'error', '✕')
    }
  }

  const handleUnschedule = async (taskId) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/unschedule`, { method: 'PUT' })
      showToast('Moved to backlog', 'success', '↩')
      fetchData()
    } catch (error) {
      showToast('Failed', 'error', '✕')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' })
      showToast('Task deleted', 'success', '🗑')
      setConfirmDelete(null)
      fetchData()
    } catch (error) {
      showToast('Failed to delete', 'error', '✕')
    }
  }

  // ========== CATEGORY HANDLERS ==========
  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return
    
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...newCategory })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Category added', 'success', '✓')
        setNewCategory({ name: '', icon: '📋', color: '#6B7280' })
        fetchData()
      }
    } catch (error) {
      showToast('Failed to add category', 'error', '✕')
    }
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${API_BASE}/categories/${editCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCategory)
      })
      showToast('Category updated', 'success', '✓')
      setEditCategory(null)
      fetchData()
    } catch (error) {
      showToast('Failed to update', 'error', '✕')
    }
  }

  const handleDeleteCategory = async (catId) => {
    try {
      await fetch(`${API_BASE}/categories/${catId}`, { method: 'DELETE' })
      showToast('Category deleted', 'success', '🗑')
      setConfirmDelete(null)
      fetchData()
    } catch (error) {
      showToast('Failed to delete', 'error', '✕')
    }
  }

  // ========== DRAG & DROP ==========
  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDropOnSlot = async (date, time) => {
    if (!draggedTask) return
    await handleScheduleTask(draggedTask.id, date, time)
    setDraggedTask(null)
  }

  const handleDropOnBacklog = async () => {
    if (!draggedTask || draggedTask.status === 'backlog') {
      setDraggedTask(null)
      return
    }
    await handleUnschedule(draggedTask.id)
    setDraggedTask(null)
  }

  // ========== DATE NAVIGATION ==========
  const changeDate = (days) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const changeWeek = (weeks) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + (weeks * 7))
    setWeekStart(date.toISOString().split('T')[0])
  }

  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    setWeekStart(getMonday(new Date()))
  }

  const isToday = (dateStr) => dateStr === new Date().toISOString().split('T')[0]

  // Generate 24-hour time slots with 30-minute intervals
  const timeSlots = []
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
  }

  // Week view shows hourly slots
  const weekTimeSlots = []
  for (let hour = 0; hour < 24; hour++) {
    weekTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const formatShortDate = (dateStr) => {
    const date = new Date(dateStr)
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate()
    }
  }

  const iconOptions = ['📋', '💼', '👤', '🏃', '📚', '🎯', '💡', '🔧', '📞', '✉️', '🎨', '🎵', '🏠', '🚗', '💰', '❤️']
  const colorOptions = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6B7280']

  if (!user) return null

  const weekDays = getWeekDays(weekStart)

  return (
    <div className="productivity-page">
      {/* Header */}
      <div className="prod-header">
        <h1>📋 Productivity</h1>
        <div className="prod-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowCategories(true)}>🏷️ Categories</button>
          <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>+ New Task</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="prod-tabs">
        <button className={`prod-tab ${activeTab === 'day' ? 'active' : ''}`} onClick={() => setActiveTab('day')}>
          📅 Day
        </button>
        <button className={`prod-tab ${activeTab === 'week' ? 'active' : ''}`} onClick={() => setActiveTab('week')}>
          📆 Week
        </button>
        <button className={`prod-tab ${activeTab === 'backlog' ? 'active' : ''}`} onClick={() => setActiveTab('backlog')}>
          📥 Backlog ({backlog.length})
        </button>
      </div>

      <div className="prod-content">
        {/* ========== DAY VIEW ========== */}
        {activeTab === 'day' && (
          <div className="day-view">
            <div className="date-nav">
              <button onClick={() => changeDate(-1)}>← Prev</button>
              <button className="today-btn" onClick={goToToday}>Today</button>
              <span className={`current-date ${isToday(selectedDate) ? 'today' : ''}`}>
                {formatDate(selectedDate)}
                {isToday(selectedDate) && <span className="today-badge">Today</span>}
              </span>
              <button onClick={() => changeDate(1)}>Next →</button>
            </div>

            <div className="day-layout">
              {/* Timeline - 24h with 30min slots */}
              <div className="timeline">
                <h3>📅 Schedule</h3>
                <div className="time-slots">
                  {timeSlots.map(time => {
                    const slotTasks = tasks.filter(t => t.scheduled_time?.slice(0, 5) === time)
                    const isHour = time.endsWith(':00')
                    return (
                      <div 
                        key={time} 
                        className={`time-slot ${draggedTask ? 'droppable' : ''} ${isHour ? 'hour-slot' : 'half-slot'}`}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDropOnSlot(selectedDate, time)}
                      >
                        <div className="time-label">{time}</div>
                        <div className="slot-content">
                          {slotTasks.length > 0 ? (
                            slotTasks.map(task => (
                              <div 
                                key={task.id} 
                                className={`scheduled-task ${task.status}`}
                                style={{ borderLeftColor: task.category_color || '#6B7280' }}
                                draggable
                                onDragStart={() => handleDragStart(task)}
                              >
                                <div className="task-header" onClick={() => setShowEditTask(task)}>
                                  <span className="task-cat">{task.category_icon || '📋'}</span>
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
                            <div className="empty-slot"></div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Backlog Panel */}
              <div 
                className={`quick-backlog ${draggedTask ? 'droppable' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDropOnBacklog}
              >
                <h3>📥 Backlog ({backlog.length})</h3>
                <p className="hint">Drag tasks to schedule • Click to edit</p>
                <div className="backlog-list">
                  {backlog.slice(0, 10).map(task => (
                    <div 
                      key={task.id} 
                      className="backlog-task" 
                      style={{ borderLeftColor: task.category_color || '#6B7280' }}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                    >
                      <div className="task-info" onClick={() => setShowEditTask(task)}>
                        <span className="task-cat">{task.category_icon || '📋'}</span>
                        <span className="task-title">{task.title}</span>
                        <span className={`priority-badge ${task.priority}`}>{task.priority[0].toUpperCase()}</span>
                      </div>
                      <div className="schedule-times">
                        {['09:00', '10:00', '14:00', '16:00'].map(t => (
                          <button key={t} className="time-btn" onClick={() => handleScheduleTask(task.id, selectedDate, t)}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {backlog.length === 0 && (
                    <p className="empty-text">No tasks in backlog</p>
                  )}
                  {backlog.length > 10 && (
                    <p className="more-text">+{backlog.length - 10} more in backlog</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== WEEK VIEW ========== */}
        {activeTab === 'week' && (
          <div className="week-view">
            <div className="date-nav">
              <button onClick={() => changeWeek(-1)}>← Prev Week</button>
              <button className="today-btn" onClick={goToToday}>This Week</button>
              <span className="current-date">
                {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
              </span>
              <button onClick={() => changeWeek(1)}>Next Week →</button>
            </div>

            <div className="week-layout">
              {/* Week Backlog Sidebar */}
              <div 
                className={`week-backlog ${draggedTask ? 'droppable' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDropOnBacklog}
              >
                <h3>📥 Backlog</h3>
                <div className="backlog-mini">
                  {backlog.slice(0, 15).map(task => (
                    <div 
                      key={task.id}
                      className="backlog-mini-task"
                      style={{ borderLeftColor: task.category_color || '#6B7280' }}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => setShowEditTask(task)}
                    >
                      <span className="mini-icon">{task.category_icon || '📋'}</span>
                      <span className="mini-title">{task.title}</span>
                      <span className={`mini-priority ${task.priority}`}></span>
                    </div>
                  ))}
                  {backlog.length === 0 && <p className="empty-text">Empty</p>}
                </div>
              </div>

              {/* Week Calendar Grid - 24h view */}
              <div className="week-calendar">
                <div className="week-header">
                  <div className="time-col"></div>
                  {weekDays.map(day => {
                    const { day: dayName, date } = formatShortDate(day)
                    return (
                      <div key={day} className={`day-col-header ${isToday(day) ? 'today' : ''}`}>
                        <span className="day-name">{dayName}</span>
                        <span className="day-date">{date}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="week-grid">
                  {weekTimeSlots.map(time => {
                    // Also include :30 tasks in this hour slot
                    const halfTime = `${time.slice(0, 2)}:30`
                    return (
                      <div key={time} className="week-row">
                        <div className="time-col">{time}</div>
                        {weekDays.map(day => {
                          const slotTasks = weekTasks.filter(t => 
                            t.scheduled_date?.split('T')[0] === day && 
                            (t.scheduled_time?.slice(0, 5) === time || t.scheduled_time?.slice(0, 5) === halfTime)
                          )
                          return (
                            <div 
                              key={`${day}-${time}`}
                              className={`week-cell ${isToday(day) ? 'today' : ''} ${draggedTask ? 'droppable' : ''}`}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDropOnSlot(day, time)}
                            >
                              {slotTasks.map(task => (
                                <div 
                                  key={task.id}
                                  className={`week-task ${task.status}`}
                                  style={{ background: task.category_color || '#6B7280' }}
                                  draggable
                                  onDragStart={() => handleDragStart(task)}
                                  onClick={() => setShowEditTask(task)}
                                  title={task.title}
                                >
                                  {task.category_icon} {task.title.slice(0, 10)}{task.title.length > 10 ? '..' : ''}
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== BACKLOG VIEW ========== */}
        {activeTab === 'backlog' && (
          <div className="backlog-view">
            <div className="backlog-header">
              <h3>📥 Task Backlog</h3>
              <span>{backlog.length} tasks</span>
            </div>
            
            <div className="backlog-full">
              {backlog.map(task => (
                <div 
                  key={task.id} 
                  className="backlog-item" 
                  style={{ borderLeftColor: task.category_color || '#6B7280' }}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <div className="item-main" onClick={() => setShowEditTask(task)}>
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
                    <button className="btn btn-small btn-secondary" onClick={() => setShowEditTask(task)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-small btn-primary" onClick={() => handleScheduleTask(task.id, selectedDate, '09:00')}>
                      📅 Schedule Today
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => setConfirmDelete({ type: 'task', id: task.id, name: task.title })}>
                      🗑️
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

      {/* ========== ADD TASK MODAL ========== */}
      {showAddTask && (
        <div className="confirm-overlay" onClick={() => setShowAddTask(false)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setShowAddTask(false)}>×</button>
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
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add details (optional)"
                  rows={2}
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

      {/* ========== EDIT TASK MODAL ========== */}
      {showEditTask && (
        <div className="confirm-overlay" onClick={() => setShowEditTask(null)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setShowEditTask(null)}>×</button>
            <h3>✏️ Edit Task</h3>
            <form onSubmit={handleEditTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={showEditTask.title || ''}
                  onChange={(e) => setShowEditTask({ ...showEditTask, title: e.target.value })}
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={showEditTask.description || ''}
                  onChange={(e) => setShowEditTask({ ...showEditTask, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={showEditTask.category_id || ''} 
                    onChange={(e) => setShowEditTask({ ...showEditTask, category_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    value={showEditTask.priority || 'medium'} 
                    onChange={(e) => setShowEditTask({ ...showEditTask, priority: e.target.value })}
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estimated Time</label>
                  <select 
                    value={showEditTask.estimated_minutes || 30} 
                    onChange={(e) => setShowEditTask({ ...showEditTask, estimated_minutes: parseInt(e.target.value) })}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={showEditTask.status || 'backlog'} 
                    onChange={(e) => setShowEditTask({ ...showEditTask, status: e.target.value })}
                  >
                    <option value="backlog">📥 Backlog</option>
                    <option value="planned">📅 Planned</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => setConfirmDelete({ type: 'task', id: showEditTask.id, name: showEditTask.title })}
                >
                  🗑️ Delete
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditTask(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== CATEGORIES MODAL ========== */}
      {showCategories && (
        <div className="confirm-overlay" onClick={() => setShowCategories(false)}>
          <div className="categories-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setShowCategories(false)}>×</button>
            <h3>🏷️ Manage Categories</h3>
            
            {/* Existing Categories */}
            <div className="categories-list">
              {categories.map(cat => (
                <div key={cat.id} className="category-item" style={{ borderLeftColor: cat.color }}>
                  {editCategory?.id === cat.id ? (
                    <form onSubmit={handleUpdateCategory} className="category-edit-form">
                      <div className="icon-select">
                        {iconOptions.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            className={`icon-btn ${editCategory.icon === icon ? 'active' : ''}`}
                            onClick={() => setEditCategory({ ...editCategory, icon })}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={editCategory.name}
                        onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                      />
                      <div className="color-select">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`color-btn ${editCategory.color === color ? 'active' : ''}`}
                            style={{ background: color }}
                            onClick={() => setEditCategory({ ...editCategory, color })}
                          />
                        ))}
                      </div>
                      <div className="edit-actions">
                        <button type="submit" className="btn btn-small btn-primary">Save</button>
                        <button type="button" className="btn btn-small btn-secondary" onClick={() => setEditCategory(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span className="cat-icon">{cat.icon}</span>
                      <span className="cat-name">{cat.name}</span>
                      <div className="cat-actions">
                        <button onClick={() => setEditCategory(cat)}>✏️</button>
                        <button onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Category */}
            <div className="add-category">
              <h4>Add New Category</h4>
              <form onSubmit={handleAddCategory}>
                <div className="icon-select">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-btn ${newCategory.icon === icon ? 'active' : ''}`}
                      onClick={() => setNewCategory({ ...newCategory, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Category name"
                />
                <div className="color-select">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-btn ${newCategory.color === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                    />
                  ))}
                </div>
                <button type="submit" className="btn btn-primary">+ Add Category</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete {confirmDelete.type === 'task' ? 'Task' : 'Category'}?</h3>
            <p>Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>?</p>
            {confirmDelete.type === 'category' && (
              <p className="confirm-warning">Tasks in this category will become uncategorized.</p>
            )}
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  if (confirmDelete.type === 'task') {
                    handleDeleteTask(confirmDelete.id)
                    setShowEditTask(null)
                  } else {
                    handleDeleteCategory(confirmDelete.id)
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Toast */}
      {message.text && (
        <div className={`modern-toast ${message.type}`}>
          <span className="toast-icon">{message.icon}</span>
          <span className="toast-text">{message.text}</span>
        </div>
      )}
    </div>
  )
}

export default Productivity
