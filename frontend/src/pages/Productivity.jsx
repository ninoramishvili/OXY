import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000/api'

function Productivity({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('backlog')
  const [tasks, setTasks] = useState([])
  const [weekTasks, setWeekTasks] = useState([])
  const [backlog, setBacklog] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [message, setMessage] = useState({ text: '', type: '', icon: '' })
  
  // Drag state
  const [draggedTask, setDraggedTask] = useState(null)
  
  // Time selection state
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  
  // Modals
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditTask, setShowEditTask] = useState(null)
  const [showCategories, setShowCategories] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  
  // New task form
  const [newTask, setNewTask] = useState({ 
    title: '', description: '', categoryId: '', priority: 'medium', estimatedMinutes: 30,
    startDate: '', startTime: '', endDate: '', endTime: ''
  })
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📋', color: '#6B7280' })

  function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

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

  function calculateEndTime(startTime, minutes) {
    if (!startTime) return ''
    const [hours, mins] = startTime.split(':').map(Number)
    const totalMins = hours * 60 + mins + minutes
    const endHours = Math.floor(totalMins / 60) % 24
    const endMins = totalMins % 60
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 30
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    return diff > 0 ? diff : 30
  }

  function formatDuration(minutes) {
    if (!minutes || minutes < 60) return `${minutes || 30} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  // Calculate slot count for task height
  function getSlotCount(minutes) {
    return Math.max(1, Math.ceil((minutes || 30) / 30))
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
      const catData = await catRes.json()
      const backlogData = await backlogRes.json()
      const dayData = await dayRes.json()
      const weekData = await weekRes.json()
      
      setCategories(Array.isArray(catData) ? catData : [])
      setBacklog(Array.isArray(backlogData) ? backlogData : [])
      setTasks(Array.isArray(dayData) ? dayData : [])
      setWeekTasks(Array.isArray(weekData) ? weekData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const showToast = (text, type, icon = '') => {
    setMessage({ text, type, icon })
    setTimeout(() => setMessage({ text: '', type: '', icon: '' }), 3000)
  }

  const resetNewTask = () => {
    setNewTask({ 
      title: '', description: '', categoryId: '', priority: 'medium', estimatedMinutes: 30,
      startDate: '', startTime: '', endDate: '', endTime: ''
    })
  }

  const openAddTaskWithTime = (date, startTime, endTime = null) => {
    const calcEndTime = endTime || calculateEndTime(startTime, 30)
    const duration = calculateDuration(startTime, calcEndTime)
    
    setNewTask({
      title: '', description: '', categoryId: '', priority: 'medium',
      estimatedMinutes: duration,
      startDate: date, startTime: startTime,
      endDate: date, endTime: calcEndTime
    })
    setShowAddTask(true)
  }

  // ========== TIME SELECTION ==========
  const handleSlotMouseDown = (date, time, hasTask) => {
    if (hasTask || draggedTask) return
    setIsSelecting(true)
    setSelectionStart({ date, time })
    setSelectionEnd({ date, time })
  }

  const handleSlotMouseEnter = (date, time) => {
    if (!isSelecting || !selectionStart) return
    if (date === selectionStart.date) {
      setSelectionEnd({ date, time })
    }
  }

  const handleSlotMouseUp = () => {
    if (!isSelecting || !selectionStart || !selectionEnd) {
      setIsSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
      return
    }

    const times = [selectionStart.time, selectionEnd.time].sort()
    const startTime = times[0]
    const endTime = calculateEndTime(times[1], 30)
    
    openAddTaskWithTime(selectionStart.date, startTime, endTime)
    
    setIsSelecting(false)
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  const isSlotSelected = (date, time) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false
    if (date !== selectionStart.date) return false
    const times = [selectionStart.time, selectionEnd.time].sort()
    return time >= times[0] && time <= times[1]
  }

  // ========== TASK HANDLERS ==========
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    
    // Validate date/time together
    if ((newTask.startDate && !newTask.startTime) || (!newTask.startDate && newTask.startTime)) {
      showToast('Set both date and time, or leave both empty', 'error', '✕')
      return
    }
    
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
          estimatedMinutes: newTask.estimatedMinutes,
          scheduledDate: newTask.startDate || null,
          scheduledTime: newTask.startTime || null,
          scheduledEndDate: newTask.endDate || null,
          scheduledEndTime: newTask.endTime || null
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast(newTask.startDate ? 'Task scheduled' : 'Task added to backlog', 'success', '✓')
        resetNewTask()
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
    
    const hasDate = showEditTask.scheduled_date
    const hasTime = showEditTask.scheduled_time
    
    if ((hasDate && !hasTime) || (!hasDate && hasTime)) {
      showToast('Set both date and time, or leave both empty', 'error', '✕')
      return
    }
    
    let status = showEditTask.status
    if (hasDate && hasTime) {
      if (status === 'backlog') status = 'planned'
    } else {
      if (status === 'planned') status = 'backlog'
    }
    
    try {
      await fetch(`${API_BASE}/tasks/${showEditTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: showEditTask.title,
          description: showEditTask.description,
          categoryId: showEditTask.category_id || null,
          priority: showEditTask.priority,
          estimatedMinutes: showEditTask.estimated_minutes,
          status: status,
          scheduledDate: showEditTask.scheduled_date || null,
          scheduledTime: showEditTask.scheduled_time || null,
          scheduledEndDate: showEditTask.scheduled_end_date || null,
          scheduledEndTime: showEditTask.scheduled_end_time || null
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
      showToast('Failed', 'error', '✕')
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
      showToast('Failed', 'error', '✕')
    }
  }

  const handleDeleteCategory = async (catId) => {
    try {
      await fetch(`${API_BASE}/categories/${catId}`, { method: 'DELETE' })
      showToast('Category deleted', 'success', '🗑')
      setConfirmDelete(null)
      fetchData()
    } catch (error) {
      showToast('Failed', 'error', '✕')
    }
  }

  // ========== DRAG & DROP ==========
  const handleDragStart = (task) => setDraggedTask(task)
  const handleDragOver = (e) => e.preventDefault()

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
    setSelectedDate(new Date().toISOString().split('T')[0])
    setWeekStart(getMonday(new Date()))
  }

  const isToday = (dateStr) => dateStr === new Date().toISOString().split('T')[0]

  // Time slots - 24h with 30min intervals
  const timeSlots = []
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const formatShortDate = (dateStr) => {
    const date = new Date(dateStr)
    return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), date: date.getDate() }
  }

  const handleStartTimeChange = (startTime, isNew = true) => {
    if (isNew) {
      const endTime = calculateEndTime(startTime, newTask.estimatedMinutes)
      setNewTask({ ...newTask, startTime, endTime })
    } else {
      const endTime = calculateEndTime(startTime, showEditTask?.estimated_minutes || 30)
      setShowEditTask({ ...showEditTask, scheduled_time: startTime, scheduled_end_time: endTime })
    }
  }

  const handleEndTimeChange = (endTime, isNew = true) => {
    if (isNew) {
      const duration = calculateDuration(newTask.startTime, endTime)
      setNewTask({ ...newTask, endTime, estimatedMinutes: duration })
    } else {
      const duration = calculateDuration(showEditTask?.scheduled_time, endTime)
      setShowEditTask({ ...showEditTask, scheduled_end_time: endTime, estimated_minutes: duration })
    }
  }

  const iconOptions = ['📋', '💼', '👤', '🏃', '📚', '🎯', '💡', '🔧', '📞', '✉️', '🎨', '🎵', '🏠', '🚗', '💰', '❤️']
  const colorOptions = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6B7280']

  if (!user) return null

  const weekDays = getWeekDays(weekStart)

  // Check if task starts at this slot
  const getTasksAt = (taskList, date, time) => {
    return taskList.filter(t => 
      t.scheduled_date?.split('T')[0] === date && 
      t.scheduled_time?.slice(0, 5) === time
    )
  }

  // Check if slot is covered by another task
  const isSlotOccupied = (taskList, date, time) => {
    const [slotH, slotM] = time.split(':').map(Number)
    const slotMins = slotH * 60 + slotM
    
    return taskList.some(t => {
      if (t.scheduled_date?.split('T')[0] !== date) return false
      const [taskH, taskM] = (t.scheduled_time?.slice(0, 5) || '00:00').split(':').map(Number)
      const taskStart = taskH * 60 + taskM
      const taskEnd = taskStart + (t.estimated_minutes || 30)
      return slotMins > taskStart && slotMins < taskEnd
    })
  }

  return (
    <div className="productivity-page" onMouseUp={handleSlotMouseUp} onMouseLeave={() => setIsSelecting(false)}>
      {/* Header */}
      <div className="prod-header">
        <h1>📋 Productivity</h1>
        <div className="prod-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowCategories(true)}>🏷️ Categories</button>
          <button className="btn btn-primary" onClick={() => { resetNewTask(); setShowAddTask(true); }}>+ New Task</button>
        </div>
      </div>

      {/* Tabs - Backlog first */}
      <div className="prod-tabs">
        <button className={`prod-tab ${activeTab === 'backlog' ? 'active' : ''}`} onClick={() => setActiveTab('backlog')}>
          📥 Backlog ({backlog.length})
        </button>
        <button className={`prod-tab ${activeTab === 'day' ? 'active' : ''}`} onClick={() => setActiveTab('day')}>
          📅 Day
        </button>
        <button className={`prod-tab ${activeTab === 'week' ? 'active' : ''}`} onClick={() => setActiveTab('week')}>
          📆 Week
        </button>
      </div>

      <div className="prod-content">
        {/* ========== BACKLOG VIEW ========== */}
        {activeTab === 'backlog' && (
          <div className="backlog-view">
            <div className="backlog-header">
              <h3>📥 Task Backlog</h3>
              <span>{backlog.length} tasks</span>
            </div>
            
            <div 
              className={`backlog-full ${draggedTask ? 'droppable' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDropOnBacklog}
            >
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
                        <span className="duration">{formatDuration(task.estimated_minutes)}</span>
                        {task.category_name && <span className="cat-name">{task.category_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn btn-small btn-secondary" onClick={() => setShowEditTask(task)}>✏️</button>
                    <button className="btn btn-small btn-primary" onClick={() => handleScheduleTask(task.id, selectedDate, '09:00')}>📅</button>
                    <button className="btn btn-small btn-danger" onClick={() => setConfirmDelete({ type: 'task', id: task.id, name: task.title })}>🗑️</button>
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

            <div className="day-calendar">
              <div className="day-grid">
                {timeSlots.map(time => {
                  const slotTasks = getTasksAt(tasks, selectedDate, time)
                  const occupied = isSlotOccupied(tasks, selectedDate, time)
                  const isHour = time.endsWith(':00')
                  const hasTask = slotTasks.length > 0
                  const selected = isSlotSelected(selectedDate, time)
                  
                  return (
                    <div 
                      key={time} 
                      className={`day-slot ${isHour ? 'hour' : 'half'} ${selected ? 'selecting' : ''} ${occupied ? 'occupied' : ''} ${draggedTask ? 'droppable' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnSlot(selectedDate, time)}
                      onMouseDown={() => handleSlotMouseDown(selectedDate, time, hasTask || occupied)}
                      onMouseEnter={() => handleSlotMouseEnter(selectedDate, time)}
                    >
                      <div className="slot-time">{time}</div>
                      <div className="slot-content">
                        {hasTask && slotTasks.map(task => {
                          const slots = getSlotCount(task.estimated_minutes)
                          return (
                            <div 
                              key={task.id} 
                              className={`day-task ${task.status}`}
                              style={{ 
                                borderLeftColor: task.category_color || '#6B7280',
                                height: `${slots * 32 - 4}px`
                              }}
                              draggable
                              onDragStart={() => handleDragStart(task)}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => setShowEditTask(task)}
                            >
                              <span className="task-icon">{task.category_icon || '📋'}</span>
                              <span className="task-title">{task.title}</span>
                              <span className="task-time">{formatDuration(task.estimated_minutes)}</span>
                              <div className="task-btns">
                                {task.status !== 'completed' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id); }}>✓</button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handleUnschedule(task.id); }}>↩</button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========== WEEK VIEW ========== */}
        {activeTab === 'week' && (
          <div className="week-view">
            <div className="date-nav">
              <button onClick={() => changeWeek(-1)}>← Prev</button>
              <button className="today-btn" onClick={goToToday}>This Week</button>
              <span className="current-date">
                {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
              </span>
              <button onClick={() => changeWeek(1)}>Next →</button>
            </div>

            <div className="week-calendar">
              {/* Header row with days */}
              <div className="week-header-row">
                <div className="week-time-col"></div>
                {weekDays.map(day => {
                  const { day: dayName, date } = formatShortDate(day)
                  return (
                    <div key={day} className={`week-day-header ${isToday(day) ? 'today' : ''}`}>
                      <span className="day-name">{dayName}</span>
                      <span className="day-num">{date}</span>
                    </div>
                  )
                })}
              </div>

              {/* Time rows */}
              <div className="week-body">
                {timeSlots.map(time => {
                  const isHour = time.endsWith(':00')
                  return (
                    <div key={time} className={`week-time-row ${isHour ? 'hour' : 'half'}`}>
                      <div className="week-time-col">{isHour ? time : ''}</div>
                      {weekDays.map(day => {
                        const slotTasks = getTasksAt(weekTasks, day, time)
                        const occupied = isSlotOccupied(weekTasks, day, time)
                        const hasTask = slotTasks.length > 0
                        const selected = isSlotSelected(day, time)
                        
                        return (
                          <div 
                            key={`${day}-${time}`}
                            className={`week-slot ${isToday(day) ? 'today' : ''} ${selected ? 'selecting' : ''} ${occupied ? 'occupied' : ''} ${draggedTask ? 'droppable' : ''}`}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDropOnSlot(day, time)}
                            onMouseDown={() => handleSlotMouseDown(day, time, hasTask || occupied)}
                            onMouseEnter={() => handleSlotMouseEnter(day, time)}
                            onClick={() => !hasTask && !occupied && openAddTaskWithTime(day, time)}
                          >
                            {hasTask && slotTasks.map(task => {
                              const slots = getSlotCount(task.estimated_minutes)
                              return (
                                <div 
                                  key={task.id}
                                  className={`week-task ${task.status}`}
                                  style={{ 
                                    background: task.category_color || '#6B7280',
                                    height: `${slots * 24 - 2}px`
                                  }}
                                  draggable
                                  onDragStart={() => handleDragStart(task)}
                                  onClick={(e) => { e.stopPropagation(); setShowEditTask(task); }}
                                  title={`${task.title} (${formatDuration(task.estimated_minutes)})`}
                                >
                                  {task.title.slice(0, 8)}{task.title.length > 8 ? '..' : ''}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
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
                <label>Title *</label>
                <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task name" autoFocus />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={newTask.categoryId} onChange={(e) => setNewTask({ ...newTask, categoryId: e.target.value })}>
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
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

              <div className="schedule-box">
                <label className="box-label">📅 Schedule</label>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" value={newTask.startDate} onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value, endDate: e.target.value || newTask.endDate })} />
                  </div>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" value={newTask.startTime} onChange={(e) => handleStartTimeChange(e.target.value, true)} disabled={!newTask.startDate} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>End Date</label>
                    <input type="date" value={newTask.endDate} onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })} disabled={!newTask.startDate} />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input type="time" value={newTask.endTime} onChange={(e) => handleEndTimeChange(e.target.value, true)} disabled={!newTask.startDate} />
                  </div>
                </div>
                {newTask.startTime && newTask.endTime && (
                  <div className="duration-badge">Duration: {formatDuration(newTask.estimatedMinutes)}</div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{newTask.startDate ? 'Schedule' : 'Add to Backlog'}</button>
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
                <label>Title *</label>
                <input type="text" value={showEditTask.title || ''} onChange={(e) => setShowEditTask({ ...showEditTask, title: e.target.value })} autoFocus />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={showEditTask.category_id || ''} onChange={(e) => setShowEditTask({ ...showEditTask, category_id: e.target.value })}>
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={showEditTask.priority || 'medium'} onChange={(e) => setShowEditTask({ ...showEditTask, priority: e.target.value })}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="schedule-box">
                <label className="box-label">📅 Schedule</label>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" value={showEditTask.scheduled_date?.split('T')[0] || ''} onChange={(e) => setShowEditTask({ ...showEditTask, scheduled_date: e.target.value, scheduled_end_date: e.target.value || showEditTask.scheduled_end_date })} />
                  </div>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" value={showEditTask.scheduled_time?.slice(0, 5) || ''} onChange={(e) => handleStartTimeChange(e.target.value, false)} disabled={!showEditTask.scheduled_date} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>End Date</label>
                    <input type="date" value={showEditTask.scheduled_end_date?.split('T')[0] || ''} onChange={(e) => setShowEditTask({ ...showEditTask, scheduled_end_date: e.target.value })} disabled={!showEditTask.scheduled_date} />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input type="time" value={showEditTask.scheduled_end_time?.slice(0, 5) || ''} onChange={(e) => handleEndTimeChange(e.target.value, false)} disabled={!showEditTask.scheduled_date} />
                  </div>
                </div>
                {showEditTask.scheduled_time && showEditTask.scheduled_end_time && (
                  <div className="duration-badge">Duration: {formatDuration(showEditTask.estimated_minutes)}</div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete({ type: 'task', id: showEditTask.id, name: showEditTask.title })}>🗑️</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditTask(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCategories && (
        <div className="confirm-overlay" onClick={() => setShowCategories(false)}>
          <div className="categories-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setShowCategories(false)}>×</button>
            <h3>🏷️ Categories</h3>
            <div className="categories-list">
              {categories.map(cat => (
                <div key={cat.id} className="category-item" style={{ borderLeftColor: cat.color }}>
                  {editCategory?.id === cat.id ? (
                    <form onSubmit={handleUpdateCategory} className="category-edit-form">
                      <div className="icon-select">
                        {iconOptions.map(icon => (
                          <button key={icon} type="button" className={`icon-btn ${editCategory.icon === icon ? 'active' : ''}`} onClick={() => setEditCategory({ ...editCategory, icon })}>{icon}</button>
                        ))}
                      </div>
                      <input type="text" value={editCategory.name} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} />
                      <div className="color-select">
                        {colorOptions.map(color => (
                          <button key={color} type="button" className={`color-btn ${editCategory.color === color ? 'active' : ''}`} style={{ background: color }} onClick={() => setEditCategory({ ...editCategory, color })} />
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
            <div className="add-category">
              <h4>Add Category</h4>
              <form onSubmit={handleAddCategory}>
                <div className="icon-select">
                  {iconOptions.map(icon => (
                    <button key={icon} type="button" className={`icon-btn ${newCategory.icon === icon ? 'active' : ''}`} onClick={() => setNewCategory({ ...newCategory, icon })}>{icon}</button>
                  ))}
                </div>
                <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Name" />
                <div className="color-select">
                  {colorOptions.map(color => (
                    <button key={color} type="button" className={`color-btn ${newCategory.color === color ? 'active' : ''}`} style={{ background: color }} onClick={() => setNewCategory({ ...newCategory, color })} />
                  ))}
                </div>
                <button type="submit" className="btn btn-primary">+ Add</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete?</h3>
            <p>Delete <strong>"{confirmDelete.name}"</strong>?</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => confirmDelete.type === 'task' ? (handleDeleteTask(confirmDelete.id), setShowEditTask(null)) : handleDeleteCategory(confirmDelete.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
