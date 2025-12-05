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
  const [isDragging, setIsDragging] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditTask, setShowEditTask] = useState(null)
  const [showCategories, setShowCategories] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [recurringDeleteOptions, setRecurringDeleteOptions] = useState(null)
  
  const [newTask, setNewTask] = useState({ 
    title: '', description: '', categoryId: '', priority: 'medium', estimatedMinutes: 30,
    startDate: '', startTime: '', endDate: '', endTime: '',
    isRecurring: false, recurrenceRule: '', recurrenceEndDate: ''
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
    if (!minutes || minutes < 60) return `${minutes || 30}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h${mins}m`
  }

  function getSlotIndex(time) {
    const [h, m] = time.split(':').map(Number)
    return h * 2 + (m >= 30 ? 1 : 0)
  }

  function getTaskHeight(minutes, slotHeight = 24) {
    const slots = Math.ceil((minutes || 30) / 30)
    return slots * slotHeight
  }

  function getTaskPositions(taskList) {
    const positions = {}
    const sortedTasks = [...taskList].sort((a, b) => {
      const aTime = a.scheduled_time?.slice(0, 5) || '00:00'
      const bTime = b.scheduled_time?.slice(0, 5) || '00:00'
      return aTime.localeCompare(bTime)
    })

    for (let i = 0; i < sortedTasks.length; i++) {
      const task = sortedTasks[i]
      const startIdx = getSlotIndex(task.scheduled_time?.slice(0, 5) || '00:00')
      const slots = Math.ceil((task.estimated_minutes || 30) / 30)
      const endIdx = startIdx + slots
      const overlapping = sortedTasks.filter((t, j) => {
        if (j >= i) return false
        const tStart = getSlotIndex(t.scheduled_time?.slice(0, 5) || '00:00')
        const tSlots = Math.ceil((t.estimated_minutes || 30) / 30)
        const tEnd = tStart + tSlots
        return !(endIdx <= tStart || startIdx >= tEnd)
      })
      const usedCols = overlapping.map(t => positions[t.id]?.col || 0)
      let col = 0
      while (usedCols.includes(col)) col++
      const maxCols = Math.max(col + 1, ...overlapping.map(t => positions[t.id]?.total || 1))
      positions[task.id] = { col, total: maxCols }
      overlapping.forEach(t => { if (positions[t.id]) positions[t.id].total = maxCols })
    }
    return positions
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
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
      setCategories(await catRes.json().then(d => Array.isArray(d) ? d : []))
      setBacklog(await backlogRes.json().then(d => Array.isArray(d) ? d : []))
      setDayTasks(await dayRes.json().then(d => Array.isArray(d) ? d : []))
      setWeekTasks(await weekRes.json().then(d => Array.isArray(d) ? d : []))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const showToast = (text, type, icon = '') => {
    setMessage({ text, type, icon })
    setTimeout(() => setMessage({ text: '', type: '', icon: '' }), 2500)
  }

  const resetNewTask = () => {
    setNewTask({ title: '', description: '', categoryId: '', priority: 'medium', estimatedMinutes: 30, 
      startDate: '', startTime: '', endDate: '', endTime: '', isRecurring: false, recurrenceRule: '', recurrenceEndDate: '' })
  }

  const openAddTaskWithTime = (date, startTime, endTime = null) => {
    const calcEndTime = endTime || calculateEndTime(startTime, 30)
    const duration = calculateDuration(startTime, calcEndTime)
    setNewTask({ ...newTask, estimatedMinutes: duration, startDate: date, startTime, endDate: date, endTime: calcEndTime })
    setShowAddTask(true)
  }

  // Selection handlers
  const handleSlotMouseDown = (e, date, time) => {
    if (e.button !== 0 || draggedTask) return
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
    if (!isSelecting) return
    if (selectionStart && selectionEnd && selectionStart.date === selectionEnd.date) {
      const times = [selectionStart.time, selectionEnd.time].sort()
      openAddTaskWithTime(selectionStart.date, times[0], calculateEndTime(times[1], 30))
    }
    setIsSelecting(false)
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  const getSelectionRange = (date) => {
    if (!isSelecting || !selectionStart || !selectionEnd || selectionStart.date !== date) return null
    const startIdx = getSlotIndex(selectionStart.time)
    const endIdx = getSlotIndex(selectionEnd.time)
    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)
    return { startIdx: minIdx, endIdx: maxIdx, slots: maxIdx - minIdx + 1 }
  }

  // Task handlers
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    if ((newTask.startDate && !newTask.startTime) || (!newTask.startDate && newTask.startTime)) {
      showToast('Set both date and time', 'error', '✕')
      return
    }
    
    // Validate recurring task requirements
    if (newTask.isRecurring && !newTask.recurrenceRule) {
      showToast('Select recurrence frequency', 'error', '✕')
      return
    }
    if (newTask.isRecurring && !newTask.startDate) {
      showToast('Recurring tasks need a start date', 'error', '✕')
      return
    }
    
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, title: newTask.title, description: newTask.description,
          categoryId: newTask.categoryId || null, priority: newTask.priority,
          estimatedMinutes: newTask.estimatedMinutes,
          scheduledDate: newTask.startDate || null, scheduledTime: newTask.startTime || null,
          scheduledEndDate: newTask.endDate || null, scheduledEndTime: newTask.endTime || null,
          isRecurring: newTask.isRecurring,
          recurrenceRule: newTask.isRecurring ? newTask.recurrenceRule : null,
          recurrenceEndDate: newTask.isRecurring ? newTask.recurrenceEndDate : null
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast(newTask.isRecurring ? 'Recurring task created' : (newTask.startDate ? 'Scheduled' : 'Added'), 'success', '✓')
        resetNewTask()
        setShowAddTask(false)
        fetchData()
      }
    } catch { showToast('Failed', 'error', '✕') }
  }

  const handleEditTask = async (e) => {
    e.preventDefault()
    if (!showEditTask?.title?.trim()) return
    const hasDate = showEditTask.scheduled_date, hasTime = showEditTask.scheduled_time
    if ((hasDate && !hasTime) || (!hasDate && hasTime)) { showToast('Set both date and time', 'error', '✕'); return }
    let status = hasDate && hasTime ? (showEditTask.status === 'backlog' ? 'planned' : showEditTask.status) : 'backlog'
    try {
      await fetch(`${API_BASE}/tasks/${showEditTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: showEditTask.title, description: showEditTask.description,
          categoryId: showEditTask.category_id || null, priority: showEditTask.priority,
          estimatedMinutes: showEditTask.estimated_minutes, status,
          scheduledDate: showEditTask.scheduled_date || null, scheduledTime: showEditTask.scheduled_time || null,
          scheduledEndDate: showEditTask.scheduled_end_date || null, scheduledEndTime: showEditTask.scheduled_end_time || null
        })
      })
      showToast('Updated', 'success', '✓')
      setShowEditTask(null)
      fetchData()
    } catch { showToast('Failed', 'error', '✕') }
  }

  const handleScheduleTask = async (taskId, date, time) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time })
      })
      showToast('Scheduled', 'success', '📅')
      setDraggedTask(null)
      setIsDragging(false)
      fetchData()
    } catch { showToast('Failed', 'error', '✕') }
  }

  const handleCompleteTask = async (taskId) => {
    try { 
      await fetch(`${API_BASE}/tasks/${taskId}/complete`, { method: 'PUT' }) 
      showToast('Done!', 'success', '✓')
      fetchData() 
    } catch {}
  }

  const handleUnschedule = async (taskId) => {
    try { await fetch(`${API_BASE}/tasks/${taskId}/unschedule`, { method: 'PUT' }); showToast('Moved', 'success', '↩'); setDraggedTask(null); setIsDragging(false); fetchData() } catch {}
  }

  // Delete task with recurring options
  const handleDeleteClick = (task) => {
    if (task.is_recurring || task.parent_task_id) {
      // Show recurring delete options
      setRecurringDeleteOptions(task)
    } else {
      // Normal delete confirmation
      setConfirmDelete({ type: 'task', id: task.id, name: task.title })
    }
  }

  const handleDeleteTask = async (taskId) => {
    try { 
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' })
      showToast('Deleted', 'success', '🗑')
      setConfirmDelete(null)
      setShowEditTask(null)
      fetchData() 
    } catch {}
  }

  const handleDeleteRecurring = async (mode) => {
    const task = recurringDeleteOptions
    if (!task) return
    
    try {
      await fetch(`${API_BASE}/tasks/${task.id}/delete-recurring`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, taskDate: task.scheduled_date })
      })
      showToast('Deleted', 'success', '🗑')
      setRecurringDeleteOptions(null)
      setShowEditTask(null)
      fetchData()
    } catch { showToast('Failed', 'error', '✕') }
  }

  // Category handlers
  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return
    try { await fetch(`${API_BASE}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, ...newCategory }) }); setNewCategory({ name: '', icon: '📋', color: '#6B7280' }); fetchData() } catch {}
  }
  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    try { await fetch(`${API_BASE}/categories/${editCategory.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCategory) }); setEditCategory(null); fetchData() } catch {}
  }
  const handleDeleteCategory = async (catId) => {
    try { await fetch(`${API_BASE}/categories/${catId}`, { method: 'DELETE' }); setConfirmDelete(null); fetchData() } catch {}
  }

  // Drag & Drop
  const handleDragStart = (e, task) => { setDraggedTask(task); setIsDragging(true); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.id) }
  const handleDragEnd = () => { setDraggedTask(null); setIsDragging(false) }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDropOnSlot = (e, date, time) => { e.preventDefault(); if (draggedTask) handleScheduleTask(draggedTask.id, date, time) }
  const handleDropOnBacklog = (e) => { e.preventDefault(); if (draggedTask && draggedTask.status !== 'backlog') handleUnschedule(draggedTask.id); else { setDraggedTask(null); setIsDragging(false) } }

  // Navigation
  const changeDate = (d) => { const dt = new Date(selectedDate); dt.setDate(dt.getDate() + d); setSelectedDate(dt.toISOString().split('T')[0]) }
  const changeWeek = (w) => { const dt = new Date(weekStart); dt.setDate(dt.getDate() + w * 7); setWeekStart(dt.toISOString().split('T')[0]) }
  const goToToday = () => { setSelectedDate(new Date().toISOString().split('T')[0]); setWeekStart(getMonday(new Date())) }
  const isToday = (d) => d === new Date().toISOString().split('T')[0]

  const timeSlots = []
  for (let h = 0; h < 24; h++) { timeSlots.push(`${h.toString().padStart(2, '0')}:00`); timeSlots.push(`${h.toString().padStart(2, '0')}:30`) }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const formatShortDay = (d) => ({ day: new Date(d).toLocaleDateString('en-US', { weekday: 'short' }), num: new Date(d).getDate() })

  const handleStartTimeChange = (t, isNew) => {
    if (isNew) { setNewTask({ ...newTask, startTime: t, endTime: calculateEndTime(t, newTask.estimatedMinutes) }) }
    else { setShowEditTask({ ...showEditTask, scheduled_time: t, scheduled_end_time: calculateEndTime(t, showEditTask?.estimated_minutes || 30) }) }
  }
  const handleEndTimeChange = (t, isNew) => {
    if (isNew) { setNewTask({ ...newTask, endTime: t, estimatedMinutes: calculateDuration(newTask.startTime, t) }) }
    else { setShowEditTask({ ...showEditTask, scheduled_end_time: t, estimated_minutes: calculateDuration(showEditTask?.scheduled_time, t) }) }
  }

  const icons = ['📋', '💼', '👤', '🏃', '📚', '🎯', '💡', '🔧', '📞', '✉️', '🎨', '🎵', '🏠', '🚗', '💰', '❤️']
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6B7280']
  const recurrenceOptions = [{ value: 'daily', label: 'Daily' }, { value: 'weekdays', label: 'Weekdays (Mon-Fri)' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]

  if (!user) return null
  const weekDays = getWeekDays(weekStart)
  const getTasksForDate = (taskList, date) => taskList.filter(t => t.scheduled_date?.split('T')[0] === date)
  const DAY_SLOT_HEIGHT = 24
  const WEEK_SLOT_HEIGHT = 20

  return (
    <div className="productivity-page" onMouseUp={handleMouseUp} onMouseLeave={() => { if (isSelecting) { setIsSelecting(false); setSelectionStart(null); setSelectionEnd(null) } }}>
      <div className="prod-header">
        <h1>📋 Productivity</h1>
        <div className="prod-actions">
          <button className="btn btn-secondary" onClick={() => setShowCategories(true)}>🏷️</button>
          <button className="btn btn-primary" onClick={() => { resetNewTask(); setShowAddTask(true) }}>+ New</button>
        </div>
      </div>

      <div className="prod-tabs">
        <button className={`prod-tab ${activeTab === 'backlog' ? 'active' : ''}`} onClick={() => setActiveTab('backlog')}>📥 Backlog ({backlog.length})</button>
        <button className={`prod-tab ${activeTab === 'day' ? 'active' : ''}`} onClick={() => setActiveTab('day')}>📅 Day</button>
        <button className={`prod-tab ${activeTab === 'week' ? 'active' : ''}`} onClick={() => setActiveTab('week')}>📆 Week</button>
      </div>

      {isDragging && <div className="drag-hint">🎯 Drop on Day or Week calendar to schedule "{draggedTask?.title}"</div>}

      <div className="prod-content">
        {/* BACKLOG */}
        {activeTab === 'backlog' && (
          <div className="backlog-view">
            <div className="bl-head"><h3>📥 Backlog</h3><span>{backlog.length}</span></div>
            <div className={`bl-list ${isDragging ? 'drop-active' : ''}`} onDragOver={handleDragOver} onDrop={handleDropOnBacklog}>
              {backlog.map(t => (
                <div key={t.id} className="bl-item" style={{ borderLeftColor: t.category_color || '#6B7280' }} draggable onDragStart={(e) => handleDragStart(e, t)} onDragEnd={handleDragEnd}>
                  <div className="bl-main" onClick={() => setShowEditTask(t)}>
                    <span className="bl-icon">{t.category_icon || '📋'}</span>
                    <div className="bl-info">
                      <span className="bl-title">{t.title} {(t.is_recurring || t.parent_task_id) && <span className="recurring-badge">🔄</span>}</span>
                      <div className="bl-meta">
                        <span className={`pri ${t.priority}`}>{t.priority}</span>
                        <span>{formatDuration(t.estimated_minutes)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bl-btns">
                    <button onClick={() => handleScheduleTask(t.id, selectedDate, '09:00')}>📅</button>
                    <button onClick={() => handleDeleteClick(t)}>🗑️</button>
                  </div>
                </div>
              ))}
              {backlog.length === 0 && <div className="empty">🎉 Empty!</div>}
            </div>
            {isDragging && (
              <div className="quick-drop-zones">
                <button className="quick-drop" onClick={() => setActiveTab('day')}>📅 Go to Day View to drop</button>
                <button className="quick-drop" onClick={() => setActiveTab('week')}>📆 Go to Week View to drop</button>
              </div>
            )}
          </div>
        )}

        {/* DAY VIEW */}
        {activeTab === 'day' && (
          <div className="day-view">
            <div className="nav-bar">
              <button onClick={() => changeDate(-1)}>←</button>
              <button className="today-btn" onClick={goToToday}>Today</button>
              <span className="nav-date">{formatDate(selectedDate)} {isToday(selectedDate) && <span className="today-tag">Today</span>}</span>
              <button onClick={() => changeDate(1)}>→</button>
            </div>
            <div className={`calendar-grid day-calendar ${isDragging ? 'drag-active' : ''}`}>
              <div className="time-column">
                {timeSlots.map((time) => (
                  <div key={time} className={`time-label ${time.endsWith(':30') ? 'half' : ''}`} style={{ height: DAY_SLOT_HEIGHT }}>{time.endsWith(':00') ? time : ''}</div>
                ))}
              </div>
              <div className="slots-column">
                {timeSlots.map(time => (
                  <div key={time} className={`slot ${isDragging ? 'drop-target' : ''}`} style={{ height: DAY_SLOT_HEIGHT }}
                    onMouseDown={(e) => handleSlotMouseDown(e, selectedDate, time)}
                    onMouseEnter={() => handleSlotMouseEnter(selectedDate, time)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnSlot(e, selectedDate, time)}
                  />
                ))}
                {(() => {
                  const range = getSelectionRange(selectedDate)
                  if (!range) return null
                  return <div className="selection-overlay" style={{ top: range.startIdx * DAY_SLOT_HEIGHT, height: range.slots * DAY_SLOT_HEIGHT }} />
                })()}
                {(() => {
                  const positions = getTaskPositions(dayTasks)
                  return dayTasks.map(task => {
                    const startTime = task.scheduled_time?.slice(0, 5) || '00:00'
                    const slotIdx = getSlotIndex(startTime)
                    const height = getTaskHeight(task.estimated_minutes, DAY_SLOT_HEIGHT)
                    const pos = positions[task.id] || { col: 0, total: 1 }
                    const width = `calc(${100 / pos.total}% - 4px)`
                    const left = `calc(${(pos.col * 100) / pos.total}% + 2px)`
                    return (
                      <div key={task.id} className={`cal-task ${task.status}`}
                        style={{ top: slotIdx * DAY_SLOT_HEIGHT, height, width, left, backgroundColor: task.category_color || '#3B82F6' }}
                        draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd}
                        onClick={() => setShowEditTask(task)} title={`${task.title} (${formatDuration(task.estimated_minutes)})`}
                      >
                        <span className="ct-icon">{task.category_icon || '📋'}</span>
                        <span className="ct-title">{task.title} {(task.is_recurring || task.parent_task_id) && '🔄'}</span>
                        <span className="ct-dur">{formatDuration(task.estimated_minutes)}</span>
                        <div className="ct-btns">
                          {task.status !== 'completed' && <button onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id) }}>✓</button>}
                          <button onClick={(e) => { e.stopPropagation(); handleUnschedule(task.id) }}>↩</button>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {activeTab === 'week' && (
          <div className="week-view">
            <div className="nav-bar">
              <button onClick={() => changeWeek(-1)}>←</button>
              <button className="today-btn" onClick={goToToday}>This Week</button>
              <span className="nav-date">{formatDate(weekDays[0])} - {formatDate(weekDays[6])}</span>
              <button onClick={() => changeWeek(1)}>→</button>
            </div>
            <div className={`calendar-grid week-calendar ${isDragging ? 'drag-active' : ''}`}>
              <div className="week-header">
                <div className="time-header"></div>
                {weekDays.map(d => {
                  const { day, num } = formatShortDay(d)
                  return <div key={d} className={`day-header ${isToday(d) ? 'today' : ''}`}><span>{day}</span><span className="day-num">{num}</span></div>
                })}
              </div>
              <div className="week-body">
                <div className="time-column">
                  {timeSlots.map(time => (
                    <div key={time} className={`time-label ${time.endsWith(':30') ? 'half' : ''}`} style={{ height: WEEK_SLOT_HEIGHT }}>{time.endsWith(':00') ? time : ''}</div>
                  ))}
                </div>
                {weekDays.map(day => {
                  const tasksForDay = getTasksForDate(weekTasks, day)
                  const selectionRange = getSelectionRange(day)
                  return (
                    <div key={day} className={`day-column ${isToday(day) ? 'today' : ''}`}>
                      {timeSlots.map(time => (
                        <div key={time} className={`slot ${isDragging ? 'drop-target' : ''}`} style={{ height: WEEK_SLOT_HEIGHT }}
                          onMouseDown={(e) => handleSlotMouseDown(e, day, time)}
                          onMouseEnter={() => handleSlotMouseEnter(day, time)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropOnSlot(e, day, time)}
                        />
                      ))}
                      {selectionRange && <div className="selection-overlay" style={{ top: selectionRange.startIdx * WEEK_SLOT_HEIGHT, height: selectionRange.slots * WEEK_SLOT_HEIGHT }} />}
                      {(() => {
                        const positions = getTaskPositions(tasksForDay)
                        return tasksForDay.map(task => {
                          const startTime = task.scheduled_time?.slice(0, 5) || '00:00'
                          const slotIdx = getSlotIndex(startTime)
                          const height = getTaskHeight(task.estimated_minutes, WEEK_SLOT_HEIGHT)
                          const pos = positions[task.id] || { col: 0, total: 1 }
                          const width = `calc(${100 / pos.total}% - 2px)`
                          const left = `calc(${(pos.col * 100) / pos.total}% + 1px)`
                          return (
                            <div key={task.id} className={`cal-task week-task ${task.status}`}
                              style={{ top: slotIdx * WEEK_SLOT_HEIGHT, height, width, left, backgroundColor: task.category_color || '#3B82F6' }}
                              draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd}
                              onClick={() => setShowEditTask(task)} title={`${task.title} (${formatDuration(task.estimated_minutes)})`}
                            >
                              {task.title.slice(0, 8)}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {showAddTask && (
        <div className="modal-bg" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowAddTask(false)}>×</button>
            <h3>➕ New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="fg"><label>Title *</label><input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} autoFocus /></div>
              <div className="fr">
                <div className="fg"><label>Category</label><select value={newTask.categoryId} onChange={e => setNewTask({...newTask, categoryId: e.target.value})}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
                <div className="fg"><label>Priority</label><select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}><option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option></select></div>
              </div>
              <div className="sched-box">
                <label className="sched-title">📅 Schedule</label>
                <div className="fr"><div className="fg"><label>Start Date</label><input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value, endDate: e.target.value || newTask.endDate})} /></div><div className="fg"><label>Start Time</label><input type="time" value={newTask.startTime} onChange={e => handleStartTimeChange(e.target.value, true)} disabled={!newTask.startDate} /></div></div>
                <div className="fr"><div className="fg"><label>End Date</label><input type="date" value={newTask.endDate} onChange={e => setNewTask({...newTask, endDate: e.target.value})} disabled={!newTask.startDate} /></div><div className="fg"><label>End Time</label><input type="time" value={newTask.endTime} onChange={e => handleEndTimeChange(e.target.value, true)} disabled={!newTask.startDate} /></div></div>
                {newTask.startTime && newTask.endTime && <div className="dur-badge">Duration: {formatDuration(newTask.estimatedMinutes)}</div>}
              </div>
              <div className="recur-box">
                <label className="recur-toggle">
                  <input type="checkbox" checked={newTask.isRecurring} onChange={e => setNewTask({...newTask, isRecurring: e.target.checked})} />
                  <span>🔄 Recurring task</span>
                </label>
                {newTask.isRecurring && (
                  <div className="recur-opts">
                    <div className="fg">
                      <label>Frequency *</label>
                      <select value={newTask.recurrenceRule} onChange={e => setNewTask({...newTask, recurrenceRule: e.target.value})}>
                        <option value="">Select frequency</option>
                        {recurrenceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="fg">
                      <label>End Date (optional)</label>
                      <input type="date" value={newTask.recurrenceEndDate} onChange={e => setNewTask({...newTask, recurrenceEndDate: e.target.value})} min={newTask.startDate} />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-btns"><button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>Cancel</button><button type="submit" className="btn btn-primary">{newTask.startDate ? 'Schedule' : 'Add'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditTask && (
        <div className="modal-bg" onClick={() => setShowEditTask(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowEditTask(null)}>×</button>
            <h3>✏️ Edit Task {(showEditTask.is_recurring || showEditTask.parent_task_id) && <span className="recurring-badge">🔄 Recurring</span>}</h3>
            <form onSubmit={handleEditTask}>
              <div className="fg"><label>Title *</label><input type="text" value={showEditTask.title || ''} onChange={e => setShowEditTask({...showEditTask, title: e.target.value})} /></div>
              <div className="fr">
                <div className="fg"><label>Category</label><select value={showEditTask.category_id || ''} onChange={e => setShowEditTask({...showEditTask, category_id: e.target.value})}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
                <div className="fg"><label>Priority</label><select value={showEditTask.priority || 'medium'} onChange={e => setShowEditTask({...showEditTask, priority: e.target.value})}><option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option></select></div>
              </div>
              <div className="sched-box">
                <label className="sched-title">📅 Schedule</label>
                <div className="fr"><div className="fg"><label>Start Date</label><input type="date" value={showEditTask.scheduled_date?.split('T')[0] || ''} onChange={e => setShowEditTask({...showEditTask, scheduled_date: e.target.value, scheduled_end_date: e.target.value || showEditTask.scheduled_end_date})} /></div><div className="fg"><label>Start Time</label><input type="time" value={showEditTask.scheduled_time?.slice(0,5) || ''} onChange={e => handleStartTimeChange(e.target.value, false)} disabled={!showEditTask.scheduled_date} /></div></div>
                <div className="fr"><div className="fg"><label>End Date</label><input type="date" value={showEditTask.scheduled_end_date?.split('T')[0] || ''} onChange={e => setShowEditTask({...showEditTask, scheduled_end_date: e.target.value})} disabled={!showEditTask.scheduled_date} /></div><div className="fg"><label>End Time</label><input type="time" value={showEditTask.scheduled_end_time?.slice(0,5) || ''} onChange={e => handleEndTimeChange(e.target.value, false)} disabled={!showEditTask.scheduled_date} /></div></div>
                {showEditTask.scheduled_time && showEditTask.scheduled_end_time && <div className="dur-badge">Duration: {formatDuration(showEditTask.estimated_minutes)}</div>}
              </div>
              <div className="modal-btns"><button type="button" className="btn btn-danger" onClick={() => handleDeleteClick(showEditTask)}>🗑️</button><button type="button" className="btn btn-secondary" onClick={() => setShowEditTask(null)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {/* RECURRING DELETE OPTIONS */}
      {recurringDeleteOptions && (
        <div className="modal-bg" onClick={() => setRecurringDeleteOptions(null)}>
          <div className="confirm-box recur-delete" onClick={e => e.stopPropagation()}>
            <h4>🔄 Delete Recurring Task</h4>
            <p>This is a recurring task. What would you like to delete?</p>
            <div className="recur-delete-btns">
              <button className="btn btn-secondary" onClick={() => handleDeleteRecurring('single')}>Just this task</button>
              <button className="btn btn-warning" onClick={() => handleDeleteRecurring('following')}>This and future tasks</button>
              <button className="btn btn-danger" onClick={() => handleDeleteRecurring('all')}>All tasks in series</button>
            </div>
            <button className="btn btn-text" onClick={() => setRecurringDeleteOptions(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {showCategories && (
        <div className="modal-bg" onClick={() => setShowCategories(false)}>
          <div className="modal cat-modal" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowCategories(false)}>×</button>
            <h3>🏷️ Categories</h3>
            <div className="cat-list">
              {categories.map(c => (
                <div key={c.id} className="cat-item" style={{borderLeftColor: c.color}}>
                  {editCategory?.id === c.id ? (
                    <form onSubmit={handleUpdateCategory} className="cat-edit">
                      <div className="icon-row">{icons.map(i => <button key={i} type="button" className={editCategory.icon===i?'active':''} onClick={() => setEditCategory({...editCategory, icon:i})}>{i}</button>)}</div>
                      <input value={editCategory.name} onChange={e => setEditCategory({...editCategory, name: e.target.value})} />
                      <div className="color-row">{colors.map(cl => <button key={cl} type="button" className={editCategory.color===cl?'active':''} style={{background:cl}} onClick={() => setEditCategory({...editCategory, color:cl})} />)}</div>
                      <div className="cat-btns"><button type="submit" className="btn btn-small btn-primary">Save</button><button type="button" className="btn btn-small" onClick={() => setEditCategory(null)}>Cancel</button></div>
                    </form>
                  ) : (<><span>{c.icon}</span><span className="cat-name">{c.name}</span><div className="cat-actions"><button onClick={() => setEditCategory(c)}>✏️</button><button onClick={() => setConfirmDelete({type:'category',id:c.id,name:c.name})}>🗑️</button></div></>)}
                </div>
              ))}
            </div>
            <div className="add-cat">
              <h4>Add Category</h4>
              <form onSubmit={handleAddCategory}>
                <div className="icon-row">{icons.map(i => <button key={i} type="button" className={newCategory.icon===i?'active':''} onClick={() => setNewCategory({...newCategory, icon:i})}>{i}</button>)}</div>
                <input value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} placeholder="Name" />
                <div className="color-row">{colors.map(cl => <button key={cl} type="button" className={newCategory.color===cl?'active':''} style={{background:cl}} onClick={() => setNewCategory({...newCategory, color:cl})} />)}</div>
                <button type="submit" className="btn btn-primary">+ Add</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM */}
      {confirmDelete && (
        <div className="modal-bg" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <p>Delete <strong>"{confirmDelete.name}"</strong>?</p>
            <div className="confirm-btns"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={() => confirmDelete.type === 'task' ? handleDeleteTask(confirmDelete.id) : handleDeleteCategory(confirmDelete.id)}>Delete</button></div>
          </div>
        </div>
      )}

      {message.text && <div className={`toast ${message.type}`}><span>{message.icon}</span> {message.text}</div>}
    </div>
  )
}

export default Productivity
