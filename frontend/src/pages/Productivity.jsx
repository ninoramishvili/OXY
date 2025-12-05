import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000/api'

function Productivity({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('backlog')
  const [dayTasks, setDayTasks] = useState([])
  const [weekTasks, setWeekTasks] = useState([])
  const [backlog, setBacklog] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [message, setMessage] = useState({ text: '', type: '', icon: '' })
  
  const [draggedTask, setDraggedTask] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditTask, setShowEditTask] = useState(null)
  const [showCategories, setShowCategories] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  
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
      console.log('Fetching data for date:', selectedDate, 'week:', weekStart)
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
      
      console.log('Day tasks:', dayData)
      console.log('Week tasks:', weekData)
      
      setCategories(Array.isArray(catData) ? catData : [])
      setBacklog(Array.isArray(backlogData) ? backlogData : [])
      setDayTasks(Array.isArray(dayData) ? dayData : [])
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

  // ========== CLICK/DRAG TIME SELECTION ==========
  const handleSlotClick = (date, time) => {
    if (draggedTask) return
    openAddTaskWithTime(date, time)
  }

  const handleSlotMouseDown = (e, date, time, hasTask) => {
    if (hasTask || draggedTask) return
    e.preventDefault()
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

  const handleMouseUp = () => {
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

  const isSlotInSelection = (date, time) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false
    if (date !== selectionStart.date) return false
    const times = [selectionStart.time, selectionEnd.time].sort()
    return time >= times[0] && time <= times[1]
  }

  // ========== TASK HANDLERS ==========
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    
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
        showToast(newTask.startDate ? 'Task scheduled' : 'Task added', 'success', '✓')
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
      status = 'backlog'
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
      showToast('Failed', 'error', '✕')
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
      showToast('Failed', 'error', '✕')
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/complete`, { method: 'PUT' })
      showToast('Done!', 'success', '✓')
      fetchData()
    } catch (error) {
      showToast('Failed', 'error', '✕')
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
      showToast('Deleted', 'success', '🗑')
      setConfirmDelete(null)
      setShowEditTask(null)
      fetchData()
    } catch (error) {
      showToast('Failed', 'error', '✕')
    }
  }

  // Category handlers
  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return
    try {
      await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...newCategory })
      })
      setNewCategory({ name: '', icon: '📋', color: '#6B7280' })
      fetchData()
    } catch (error) {}
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${API_BASE}/categories/${editCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCategory)
      })
      setEditCategory(null)
      fetchData()
    } catch (error) {}
  }

  const handleDeleteCategory = async (catId) => {
    try {
      await fetch(`${API_BASE}/categories/${catId}`, { method: 'DELETE' })
      setConfirmDelete(null)
      fetchData()
    } catch (error) {}
  }

  // Drag & Drop
  const handleDragStart = (task) => setDraggedTask(task)
  const handleDragOver = (e) => e.preventDefault()
  const handleDropOnSlot = async (date, time) => {
    if (!draggedTask) return
    await handleScheduleTask(draggedTask.id, date, time)
    setDraggedTask(null)
  }
  const handleDropOnBacklog = async () => {
    if (!draggedTask || draggedTask.status === 'backlog') { setDraggedTask(null); return }
    await handleUnschedule(draggedTask.id)
    setDraggedTask(null)
  }

  // Date Navigation
  const changeDate = (days) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }
  const changeWeek = (weeks) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + (weeks * 7))
    setWeekStart(d.toISOString().split('T')[0])
  }
  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
    setWeekStart(getMonday(new Date()))
  }
  const isToday = (dateStr) => dateStr === new Date().toISOString().split('T')[0]

  // Time slots
  const timeSlots = []
  for (let h = 0; h < 24; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`)
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const formatShortDay = (d) => ({ day: new Date(d).toLocaleDateString('en-US', { weekday: 'short' }), num: new Date(d).getDate() })

  const handleStartTimeChange = (t, isNew) => {
    if (isNew) {
      const end = calculateEndTime(t, newTask.estimatedMinutes)
      setNewTask({ ...newTask, startTime: t, endTime: end })
    } else {
      const end = calculateEndTime(t, showEditTask?.estimated_minutes || 30)
      setShowEditTask({ ...showEditTask, scheduled_time: t, scheduled_end_time: end })
    }
  }
  const handleEndTimeChange = (t, isNew) => {
    if (isNew) {
      const dur = calculateDuration(newTask.startTime, t)
      setNewTask({ ...newTask, endTime: t, estimatedMinutes: dur })
    } else {
      const dur = calculateDuration(showEditTask?.scheduled_time, t)
      setShowEditTask({ ...showEditTask, scheduled_end_time: t, estimated_minutes: dur })
    }
  }

  const icons = ['📋', '💼', '👤', '🏃', '📚', '🎯', '💡', '🔧', '📞', '✉️', '🎨', '🎵', '🏠', '🚗', '💰', '❤️']
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6B7280']

  if (!user) return null

  const weekDays = getWeekDays(weekStart)

  // Get task at specific slot
  const getTaskAt = (taskList, date, time) => {
    return taskList.filter(t => {
      const tDate = t.scheduled_date?.split('T')[0]
      const tTime = t.scheduled_time?.slice(0, 5)
      return tDate === date && tTime === time
    })
  }

  // Check if slot is occupied (by task spanning from earlier)
  const isOccupied = (taskList, date, time) => {
    const [h, m] = time.split(':').map(Number)
    const slotMins = h * 60 + m
    return taskList.some(t => {
      if (t.scheduled_date?.split('T')[0] !== date) return false
      const [th, tm] = (t.scheduled_time?.slice(0, 5) || '00:00').split(':').map(Number)
      const start = th * 60 + tm
      const end = start + (t.estimated_minutes || 30)
      return slotMins > start && slotMins < end
    })
  }

  return (
    <div className="productivity-page" onMouseUp={handleMouseUp} onMouseLeave={() => { setIsSelecting(false); setSelectionStart(null); setSelectionEnd(null); }}>
      <div className="prod-header">
        <h1>📋 Productivity</h1>
        <div className="prod-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowCategories(true)}>🏷️</button>
          <button className="btn btn-primary" onClick={() => { resetNewTask(); setShowAddTask(true); }}>+ New</button>
        </div>
      </div>

      <div className="prod-tabs">
        <button className={`prod-tab ${activeTab === 'backlog' ? 'active' : ''}`} onClick={() => setActiveTab('backlog')}>📥 Backlog ({backlog.length})</button>
        <button className={`prod-tab ${activeTab === 'day' ? 'active' : ''}`} onClick={() => setActiveTab('day')}>📅 Day</button>
        <button className={`prod-tab ${activeTab === 'week' ? 'active' : ''}`} onClick={() => setActiveTab('week')}>📆 Week</button>
      </div>

      <div className="prod-content">
        {/* BACKLOG */}
        {activeTab === 'backlog' && (
          <div className="backlog-view">
            <div className="backlog-head"><h3>📥 Backlog</h3><span>{backlog.length} tasks</span></div>
            <div className={`backlog-list ${draggedTask ? 'drop-zone' : ''}`} onDragOver={handleDragOver} onDrop={handleDropOnBacklog}>
              {backlog.map(t => (
                <div key={t.id} className="backlog-item" style={{ borderLeftColor: t.category_color || '#6B7280' }} draggable onDragStart={() => handleDragStart(t)}>
                  <div className="bl-main" onClick={() => setShowEditTask(t)}>
                    <span className="bl-icon">{t.category_icon || '📋'}</span>
                    <div className="bl-info">
                      <span className="bl-title">{t.title}</span>
                      <div className="bl-meta">
                        <span className={`pri ${t.priority}`}>{t.priority}</span>
                        <span>{formatDuration(t.estimated_minutes)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bl-actions">
                    <button onClick={() => handleScheduleTask(t.id, selectedDate, '09:00')}>📅</button>
                    <button onClick={() => setConfirmDelete({ type: 'task', id: t.id, name: t.title })}>🗑️</button>
                  </div>
                </div>
              ))}
              {backlog.length === 0 && <div className="empty">🎉 Backlog empty!</div>}
            </div>
          </div>
        )}

        {/* DAY VIEW */}
        {activeTab === 'day' && (
          <div className="day-view">
            <div className="date-nav">
              <button onClick={() => changeDate(-1)}>←</button>
              <button className="today-btn" onClick={goToToday}>Today</button>
              <span className="cur-date">{formatDate(selectedDate)} {isToday(selectedDate) && <span className="today-tag">Today</span>}</span>
              <button onClick={() => changeDate(1)}>→</button>
            </div>
            <div className="day-grid-container">
              <div className="day-grid">
                {timeSlots.map(time => {
                  const tasksHere = getTaskAt(dayTasks, selectedDate, time)
                  const occupied = isOccupied(dayTasks, selectedDate, time)
                  const hasTask = tasksHere.length > 0
                  const selected = isSlotInSelection(selectedDate, time)
                  const isHour = time.endsWith(':00')
                  
                  return (
                    <div 
                      key={time} 
                      className={`day-row ${isHour ? 'hour' : 'half'} ${selected ? 'selected' : ''} ${occupied ? 'occupied' : ''} ${draggedTask ? 'dropzone' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnSlot(selectedDate, time)}
                      onMouseDown={(e) => handleSlotMouseDown(e, selectedDate, time, hasTask || occupied)}
                      onMouseEnter={() => handleSlotMouseEnter(selectedDate, time)}
                      onClick={() => !hasTask && !occupied && !isSelecting && handleSlotClick(selectedDate, time)}
                    >
                      <div className="time-cell">{time}</div>
                      <div className="task-cell">
                        {hasTask && tasksHere.map(task => (
                          <div 
                            key={task.id} 
                            className={`task-block ${task.status}`}
                            style={{ borderLeftColor: task.category_color || '#6B7280', height: `${getSlotCount(task.estimated_minutes) * 28}px` }}
                            draggable
                            onDragStart={() => handleDragStart(task)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setShowEditTask(task); }}
                          >
                            <span className="tb-icon">{task.category_icon || '📋'}</span>
                            <span className="tb-title">{task.title}</span>
                            <span className="tb-dur">{formatDuration(task.estimated_minutes)}</span>
                            <div className="tb-btns">
                              {task.status !== 'completed' && <button onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id); }}>✓</button>}
                              <button onClick={(e) => { e.stopPropagation(); handleUnschedule(task.id); }}>↩</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {activeTab === 'week' && (
          <div className="week-view">
            <div className="date-nav">
              <button onClick={() => changeWeek(-1)}>←</button>
              <button className="today-btn" onClick={goToToday}>This Week</button>
              <span className="cur-date">{formatDate(weekDays[0])} - {formatDate(weekDays[6])}</span>
              <button onClick={() => changeWeek(1)}>→</button>
            </div>
            <div className="week-grid-container">
              <table className="week-table">
                <thead>
                  <tr>
                    <th className="time-header">Time</th>
                    {weekDays.map(d => {
                      const { day, num } = formatShortDay(d)
                      return <th key={d} className={`day-header ${isToday(d) ? 'today' : ''}`}>{day}<br/><span className="day-num">{num}</span></th>
                    })}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => {
                    const isHour = time.endsWith(':00')
                    return (
                      <tr key={time} className={isHour ? 'hour-row' : 'half-row'}>
                        <td className="time-td">{isHour ? time : ''}</td>
                        {weekDays.map(day => {
                          const tasksHere = getTaskAt(weekTasks, day, time)
                          const occupied = isOccupied(weekTasks, day, time)
                          const hasTask = tasksHere.length > 0
                          const selected = isSlotInSelection(day, time)
                          
                          return (
                            <td 
                              key={`${day}-${time}`} 
                              className={`week-cell ${isToday(day) ? 'today' : ''} ${selected ? 'selected' : ''} ${occupied ? 'occupied' : ''} ${draggedTask ? 'dropzone' : ''}`}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDropOnSlot(day, time)}
                              onMouseDown={(e) => handleSlotMouseDown(e, day, time, hasTask || occupied)}
                              onMouseEnter={() => handleSlotMouseEnter(day, time)}
                              onClick={() => !hasTask && !occupied && !isSelecting && handleSlotClick(day, time)}
                            >
                              {hasTask && tasksHere.map(task => (
                                <div 
                                  key={task.id} 
                                  className={`week-task ${task.status}`}
                                  style={{ backgroundColor: task.category_color || '#6B7280', height: `${getSlotCount(task.estimated_minutes) * 20}px` }}
                                  draggable
                                  onDragStart={() => handleDragStart(task)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => { e.stopPropagation(); setShowEditTask(task); }}
                                  title={`${task.title} (${formatDuration(task.estimated_minutes)})`}
                                >
                                  {task.title.slice(0, 6)}
                                </div>
                              ))}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ADD TASK MODAL */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowAddTask(false)}>×</button>
            <h3>➕ New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="fg"><label>Title *</label><input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} autoFocus /></div>
              <div className="fr">
                <div className="fg"><label>Category</label>
                  <select value={newTask.categoryId} onChange={e => setNewTask({...newTask, categoryId: e.target.value})}>
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="fg"><label>Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div className="sched-box">
                <label className="sched-label">📅 Schedule</label>
                <div className="fr">
                  <div className="fg"><label>Start Date</label><input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value, endDate: e.target.value || newTask.endDate})} /></div>
                  <div className="fg"><label>Start Time</label><input type="time" value={newTask.startTime} onChange={e => handleStartTimeChange(e.target.value, true)} disabled={!newTask.startDate} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label>End Date</label><input type="date" value={newTask.endDate} onChange={e => setNewTask({...newTask, endDate: e.target.value})} disabled={!newTask.startDate} /></div>
                  <div className="fg"><label>End Time</label><input type="time" value={newTask.endTime} onChange={e => handleEndTimeChange(e.target.value, true)} disabled={!newTask.startDate} /></div>
                </div>
                {newTask.startTime && newTask.endTime && <div className="dur-badge">Duration: {formatDuration(newTask.estimatedMinutes)}</div>}
              </div>
              <div className="modal-btns">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{newTask.startDate ? 'Schedule' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditTask && (
        <div className="modal-overlay" onClick={() => setShowEditTask(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowEditTask(null)}>×</button>
            <h3>✏️ Edit Task</h3>
            <form onSubmit={handleEditTask}>
              <div className="fg"><label>Title *</label><input type="text" value={showEditTask.title || ''} onChange={e => setShowEditTask({...showEditTask, title: e.target.value})} /></div>
              <div className="fr">
                <div className="fg"><label>Category</label>
                  <select value={showEditTask.category_id || ''} onChange={e => setShowEditTask({...showEditTask, category_id: e.target.value})}>
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="fg"><label>Priority</label>
                  <select value={showEditTask.priority || 'medium'} onChange={e => setShowEditTask({...showEditTask, priority: e.target.value})}>
                    <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div className="sched-box">
                <label className="sched-label">📅 Schedule</label>
                <div className="fr">
                  <div className="fg"><label>Start Date</label><input type="date" value={showEditTask.scheduled_date?.split('T')[0] || ''} onChange={e => setShowEditTask({...showEditTask, scheduled_date: e.target.value, scheduled_end_date: e.target.value || showEditTask.scheduled_end_date})} /></div>
                  <div className="fg"><label>Start Time</label><input type="time" value={showEditTask.scheduled_time?.slice(0,5) || ''} onChange={e => handleStartTimeChange(e.target.value, false)} disabled={!showEditTask.scheduled_date} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label>End Date</label><input type="date" value={showEditTask.scheduled_end_date?.split('T')[0] || ''} onChange={e => setShowEditTask({...showEditTask, scheduled_end_date: e.target.value})} disabled={!showEditTask.scheduled_date} /></div>
                  <div className="fg"><label>End Time</label><input type="time" value={showEditTask.scheduled_end_time?.slice(0,5) || ''} onChange={e => handleEndTimeChange(e.target.value, false)} disabled={!showEditTask.scheduled_date} /></div>
                </div>
                {showEditTask.scheduled_time && showEditTask.scheduled_end_time && <div className="dur-badge">Duration: {formatDuration(showEditTask.estimated_minutes)}</div>}
              </div>
              <div className="modal-btns">
                <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete({ type: 'task', id: showEditTask.id, name: showEditTask.title })}>🗑️</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditTask(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORIES MODAL */}
      {showCategories && (
        <div className="modal-overlay" onClick={() => setShowCategories(false)}>
          <div className="modal-box cat-modal" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowCategories(false)}>×</button>
            <h3>🏷️ Categories</h3>
            <div className="cat-list">
              {categories.map(c => (
                <div key={c.id} className="cat-item" style={{borderLeftColor: c.color}}>
                  {editCategory?.id === c.id ? (
                    <form onSubmit={handleUpdateCategory} className="cat-edit">
                      <div className="icon-row">{icons.map(i => <button key={i} type="button" className={editCategory.icon===i?'active':''} onClick={() => setEditCategory({...editCategory, icon:i})}>{i}</button>)}</div>
                      <input value={editCategory.name} onChange={e => setEditCategory({...editCategory, name: e.target.value})} />
                      <div className="color-row">{colors.map(c => <button key={c} type="button" className={editCategory.color===c?'active':''} style={{background:c}} onClick={() => setEditCategory({...editCategory, color:c})} />)}</div>
                      <div className="cat-btns"><button type="submit" className="btn btn-small btn-primary">Save</button><button type="button" className="btn btn-small" onClick={() => setEditCategory(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <><span className="cat-icon">{c.icon}</span><span className="cat-name">{c.name}</span><div className="cat-actions"><button onClick={() => setEditCategory(c)}>✏️</button><button onClick={() => setConfirmDelete({type:'category',id:c.id,name:c.name})}>🗑️</button></div></>
                  )}
                </div>
              ))}
            </div>
            <div className="add-cat">
              <h4>Add Category</h4>
              <form onSubmit={handleAddCategory}>
                <div className="icon-row">{icons.map(i => <button key={i} type="button" className={newCategory.icon===i?'active':''} onClick={() => setNewCategory({...newCategory, icon:i})}>{i}</button>)}</div>
                <input value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} placeholder="Name" />
                <div className="color-row">{colors.map(c => <button key={c} type="button" className={newCategory.color===c?'active':''} style={{background:c}} onClick={() => setNewCategory({...newCategory, color:c})} />)}</div>
                <button type="submit" className="btn btn-primary">+ Add</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <p>Delete <strong>"{confirmDelete.name}"</strong>?</p>
            <div className="confirm-btns">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => confirmDelete.type === 'task' ? handleDeleteTask(confirmDelete.id) : handleDeleteCategory(confirmDelete.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {message.text && <div className={`toast ${message.type}`}><span>{message.icon}</span> {message.text}</div>}
    </div>
  )
}

export default Productivity
