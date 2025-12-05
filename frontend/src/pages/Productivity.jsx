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
  
  // Analytics state
  const [dailyAnalytics, setDailyAnalytics] = useState(null)
  const [weeklyAnalytics, setWeeklyAnalytics] = useState(null)
  const [monthlyAnalytics, setMonthlyAnalytics] = useState(null)
  const [allTimeAnalytics, setAllTimeAnalytics] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [dailyReview, setDailyReview] = useState(null)
  const [weeklyReview, setWeeklyReview] = useState({ review: null, goals: [] })
  const [newGoal, setNewGoal] = useState('')
  
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

  // Helper to safely format date for input (avoid timezone issues)
  function formatDateForInput(dateStr) {
    if (!dateStr) return ''
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
    // If ISO format with T, just take the date part
    if (dateStr.includes('T')) return dateStr.split('T')[0]
    // Otherwise try to parse
    try {
      const d = new Date(dateStr)
      return d.toISOString().split('T')[0]
    } catch { return '' }
  }

  function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  function getWeekDays(mondayStr) {
    const days = []
    const monday = new Date(mondayStr + 'T12:00:00') // Add time to avoid timezone issues
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

  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'daily-review') fetchDailyAnalytics()
    if (activeTab === 'analytics' || activeTab === 'weekly-review') fetchWeeklyAnalytics()
    if (activeTab === 'analytics') { fetchMonthlyAnalytics(); fetchAllTimeAnalytics() }
    if (activeTab === 'daily-review') fetchDailyReview()
    if (activeTab === 'weekly-review') fetchWeeklyReview()
  }, [activeTab, selectedDate, weekStart, selectedMonth])

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
    } catch (error) { console.error('Error:', error) }
  }

  const fetchDailyAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/${user.id}/daily/${selectedDate}`)
      setDailyAnalytics(await res.json())
    } catch (error) { console.error('Error:', error) }
  }

  const fetchWeeklyAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/${user.id}/weekly/${weekStart}`)
      setWeeklyAnalytics(await res.json())
    } catch (error) { console.error('Error:', error) }
  }

  const fetchMonthlyAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/${user.id}/monthly/${selectedMonth.year}/${selectedMonth.month}`)
      setMonthlyAnalytics(await res.json())
    } catch (error) { console.error('Error:', error) }
  }

  const fetchAllTimeAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/${user.id}/alltime`)
      setAllTimeAnalytics(await res.json())
    } catch (error) { console.error('Error:', error) }
  }

  const fetchDailyReview = async () => {
    try {
      const res = await fetch(`${API_BASE}/reviews/daily/${user.id}/${selectedDate}`)
      setDailyReview(await res.json())
    } catch (error) { console.error('Error:', error) }
  }

  const fetchWeeklyReview = async () => {
    try {
      const res = await fetch(`${API_BASE}/reviews/weekly/${user.id}/${weekStart}`)
      setWeeklyReview(await res.json())
    } catch (error) { console.error('Error:', error) }
  }

  const showToast = (text, type, icon = '') => {
    setMessage({ text, type, icon })
    setTimeout(() => setMessage({ text: '', type: '', icon: '' }), 2500)
  }

  const resetNewTask = () => {
    setNewTask({ title: '', description: '', categoryId: '', priority: 'medium', estimatedMinutes: 30, startDate: '', startTime: '', endDate: '', endTime: '', isRecurring: false, recurrenceRule: '', recurrenceEndDate: '' })
  }

  const openAddTaskWithTime = (date, startTime, endTime = null) => {
    const calcEndTime = endTime || calculateEndTime(startTime, 30)
    const duration = calculateDuration(startTime, calcEndTime)
    setNewTask({ ...newTask, estimatedMinutes: duration, startDate: date, startTime, endDate: date, endTime: calcEndTime })
    setShowAddTask(true)
  }

  // Selection & drag handlers
  const handleSlotMouseDown = (e, date, time) => { if (e.button !== 0 || draggedTask) return; e.preventDefault(); setIsSelecting(true); setSelectionStart({ date, time }); setSelectionEnd({ date, time }) }
  const handleSlotMouseEnter = (date, time) => { if (!isSelecting || !selectionStart || date !== selectionStart.date) return; setSelectionEnd({ date, time }) }
  const handleMouseUp = () => { if (!isSelecting) return; if (selectionStart && selectionEnd && selectionStart.date === selectionEnd.date) { const times = [selectionStart.time, selectionEnd.time].sort(); openAddTaskWithTime(selectionStart.date, times[0], calculateEndTime(times[1], 30)) } setIsSelecting(false); setSelectionStart(null); setSelectionEnd(null) }
  const getSelectionRange = (date) => { if (!isSelecting || !selectionStart || !selectionEnd || selectionStart.date !== date) return null; const startIdx = getSlotIndex(selectionStart.time); const endIdx = getSlotIndex(selectionEnd.time); const minIdx = Math.min(startIdx, endIdx); const maxIdx = Math.max(startIdx, endIdx); return { startIdx: minIdx, endIdx: maxIdx, slots: maxIdx - minIdx + 1 } }

  // Task handlers
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    if ((newTask.startDate && !newTask.startTime) || (!newTask.startDate && newTask.startTime)) { showToast('Set both date and time', 'error', '✕'); return }
    if (newTask.isRecurring && !newTask.recurrenceRule) { showToast('Select recurrence frequency', 'error', '✕'); return }
    if (newTask.isRecurring && !newTask.startDate) { showToast('Recurring tasks need a start date', 'error', '✕'); return }
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: newTask.title, description: newTask.description, categoryId: newTask.categoryId || null, priority: newTask.priority, estimatedMinutes: newTask.estimatedMinutes, scheduledDate: newTask.startDate || null, scheduledTime: newTask.startTime || null, scheduledEndDate: newTask.endDate || null, scheduledEndTime: newTask.endTime || null, isRecurring: newTask.isRecurring, recurrenceRule: newTask.isRecurring ? newTask.recurrenceRule : null, recurrenceEndDate: newTask.isRecurring ? newTask.recurrenceEndDate : null })
      })
      if ((await res.json()).success) { showToast(newTask.isRecurring ? 'Recurring task created' : (newTask.startDate ? 'Scheduled' : 'Added'), 'success', '✓'); resetNewTask(); setShowAddTask(false); fetchData() }
    } catch { showToast('Failed', 'error', '✕') }
  }

  const handleEditTask = async (e) => {
    e.preventDefault()
    if (!showEditTask?.title?.trim()) return
    const schedDate = formatDateForInput(showEditTask.scheduled_date)
    const schedTime = showEditTask.scheduled_time?.slice(0,5) || ''
    if ((schedDate && !schedTime) || (!schedDate && schedTime)) { showToast('Set both date and time', 'error', '✕'); return }
    let status = schedDate && schedTime ? (showEditTask.status === 'backlog' ? 'planned' : showEditTask.status) : 'backlog'
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
          status, 
          scheduledDate: schedDate || null, 
          scheduledTime: schedTime || null, 
          scheduledEndDate: formatDateForInput(showEditTask.scheduled_end_date) || null, 
          scheduledEndTime: showEditTask.scheduled_end_time?.slice(0,5) || null 
        }) 
      })
      showToast('Updated', 'success', '✓')
      setShowEditTask(null)
      fetchData()
    } catch { showToast('Failed', 'error', '✕') }
  }

  const handleScheduleTask = async (taskId, date, time) => { 
    try { 
      await fetch(`${API_BASE}/tasks/${taskId}/schedule`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, time }) })
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
      // Refresh analytics if on those tabs
      if (activeTab === 'analytics' || activeTab === 'daily-review') fetchDailyAnalytics()
      if (activeTab === 'analytics' || activeTab === 'weekly-review') fetchWeeklyAnalytics()
    } catch {} 
  }

  const handleUnschedule = async (taskId) => { try { await fetch(`${API_BASE}/tasks/${taskId}/unschedule`, { method: 'PUT' }); showToast('Moved', 'success', '↩'); setDraggedTask(null); setIsDragging(false); fetchData() } catch {} }
  const handleDeleteClick = (task) => { if (task.is_recurring || task.parent_task_id) setRecurringDeleteOptions(task); else setConfirmDelete({ type: 'task', id: task.id, name: task.title }) }
  const handleDeleteTask = async (taskId) => { try { await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' }); showToast('Deleted', 'success', '🗑'); setConfirmDelete(null); setShowEditTask(null); fetchData() } catch {} }
  const handleDeleteRecurring = async (mode) => { const task = recurringDeleteOptions; if (!task) return; try { await fetch(`${API_BASE}/tasks/${task.id}/delete-recurring`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, taskDate: formatDateForInput(task.scheduled_date) }) }); showToast('Deleted', 'success', '🗑'); setRecurringDeleteOptions(null); setShowEditTask(null); fetchData() } catch { showToast('Failed', 'error', '✕') } }

  // Category handlers
  const handleAddCategory = async (e) => { e.preventDefault(); if (!newCategory.name.trim()) return; try { await fetch(`${API_BASE}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, ...newCategory }) }); setNewCategory({ name: '', icon: '📋', color: '#6B7280' }); fetchData() } catch {} }
  const handleUpdateCategory = async (e) => { e.preventDefault(); try { await fetch(`${API_BASE}/categories/${editCategory.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCategory) }); setEditCategory(null); fetchData() } catch {} }
  const handleDeleteCategory = async (catId) => { try { await fetch(`${API_BASE}/categories/${catId}`, { method: 'DELETE' }); setConfirmDelete(null); fetchData() } catch {} }

  // Review handlers - changed to 10-point scale for daily
  const handleSaveDailyReview = async (rating, notes, finalize = false) => {
    try {
      await fetch(`${API_BASE}/reviews/daily`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, date: selectedDate, productivityRating: rating, notes, isFinalized: finalize }) })
      showToast(finalize ? 'Day finalized!' : 'Review saved', 'success', '✓')
      fetchDailyReview()
    } catch { showToast('Failed', 'error', '✕') }
  }

  const handleSaveWeeklyReview = async (score, notes, finalize = false) => {
    try {
      await fetch(`${API_BASE}/reviews/weekly`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, weekStart, productivityScore: score, notes, isFinalized: finalize }) })
      showToast(finalize ? 'Week finalized!' : 'Review saved', 'success', '✓')
      fetchWeeklyReview()
    } catch { showToast('Failed', 'error', '✕') }
  }

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return
    try {
      await fetch(`${API_BASE}/goals/weekly`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, weekStart, goalText: newGoal }) })
      setNewGoal('')
      fetchWeeklyReview()
    } catch {}
  }

  const handleToggleGoal = async (goalId, isAchieved) => {
    try {
      await fetch(`${API_BASE}/goals/weekly/${goalId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isAchieved }) })
      fetchWeeklyReview()
    } catch {}
  }

  const handleDeleteGoal = async (goalId) => {
    try { await fetch(`${API_BASE}/goals/weekly/${goalId}`, { method: 'DELETE' }); fetchWeeklyReview() } catch {}
  }

  // Drag & Drop
  const handleDragStart = (e, task) => { setDraggedTask(task); setIsDragging(true); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.id) }
  const handleDragEnd = () => { setDraggedTask(null); setIsDragging(false) }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDropOnSlot = (e, date, time) => { e.preventDefault(); if (draggedTask) handleScheduleTask(draggedTask.id, date, time) }
  const handleDropOnBacklog = (e) => { e.preventDefault(); if (draggedTask && draggedTask.status !== 'backlog') handleUnschedule(draggedTask.id); else { setDraggedTask(null); setIsDragging(false) } }

  // Navigation - Fixed to avoid timezone issues
  const changeDate = (d) => { 
    const dt = new Date(selectedDate + 'T12:00:00')
    dt.setDate(dt.getDate() + d)
    setSelectedDate(dt.toISOString().split('T')[0]) 
  }
  const changeWeek = (w) => { 
    const dt = new Date(weekStart + 'T12:00:00')
    dt.setDate(dt.getDate() + w * 7)
    setWeekStart(dt.toISOString().split('T')[0]) 
  }
  const goToToday = () => { setSelectedDate(new Date().toISOString().split('T')[0]); setWeekStart(getMonday(new Date())) }
  const isToday = (d) => d === new Date().toISOString().split('T')[0]

  const timeSlots = []; for (let h = 0; h < 24; h++) { timeSlots.push(`${h.toString().padStart(2, '0')}:00`); timeSlots.push(`${h.toString().padStart(2, '0')}:30`) }
  
  const formatDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const formatFullDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const formatShortDay = (d) => ({ day: new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }), num: new Date(d + 'T12:00:00').getDate() })
  
  const handleStartTimeChange = (t, isNew) => { if (isNew) setNewTask({ ...newTask, startTime: t, endTime: calculateEndTime(t, newTask.estimatedMinutes) }); else setShowEditTask({ ...showEditTask, scheduled_time: t, scheduled_end_time: calculateEndTime(t, showEditTask?.estimated_minutes || 30) }) }
  const handleEndTimeChange = (t, isNew) => { if (isNew) setNewTask({ ...newTask, endTime: t, estimatedMinutes: calculateDuration(newTask.startTime, t) }); else setShowEditTask({ ...showEditTask, scheduled_end_time: t, estimated_minutes: calculateDuration(showEditTask?.scheduled_time, t) }) }

  const icons = ['📋', '💼', '👤', '🏃', '📚', '🎯', '💡', '🔧', '📞', '✉️', '🎨', '🎵', '🏠', '🚗', '💰', '❤️']
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6B7280']
  const recurrenceOptions = [{ value: 'daily', label: 'Daily' }, { value: 'weekdays', label: 'Weekdays (Mon-Fri)' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]

  if (!user) return null
  const weekDays = getWeekDays(weekStart)
  const getTasksForDate = (taskList, date) => taskList.filter(t => formatDateForInput(t.scheduled_date) === date)
  const DAY_SLOT_HEIGHT = 24, WEEK_SLOT_HEIGHT = 20

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
        <button className={`prod-tab ${activeTab === 'backlog' ? 'active' : ''}`} onClick={() => setActiveTab('backlog')}>📥 Backlog</button>
        <button className={`prod-tab ${activeTab === 'day' ? 'active' : ''}`} onClick={() => setActiveTab('day')}>📅 Day</button>
        <button className={`prod-tab ${activeTab === 'week' ? 'active' : ''}`} onClick={() => setActiveTab('week')}>📆 Week</button>
        <button className={`prod-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Analytics</button>
        <button className={`prod-tab ${activeTab === 'daily-review' ? 'active' : ''}`} onClick={() => setActiveTab('daily-review')}>✍️ Daily</button>
        <button className={`prod-tab ${activeTab === 'weekly-review' ? 'active' : ''}`} onClick={() => setActiveTab('weekly-review')}>📝 Weekly</button>
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
                      <div className="bl-meta"><span className={`pri ${t.priority}`}>{t.priority}</span><span>{formatDuration(t.estimated_minutes)}</span></div>
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
            {isDragging && <div className="quick-drop-zones"><button className="quick-drop" onClick={() => setActiveTab('day')}>📅 Go to Day View</button><button className="quick-drop" onClick={() => setActiveTab('week')}>📆 Go to Week View</button></div>}
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
              <div className="time-column">{timeSlots.map(time => <div key={time} className={`time-label ${time.endsWith(':30') ? 'half' : ''}`} style={{ height: DAY_SLOT_HEIGHT }}>{time.endsWith(':00') ? time : ''}</div>)}</div>
              <div className="slots-column">
                {timeSlots.map(time => <div key={time} className={`slot ${isDragging ? 'drop-target' : ''}`} style={{ height: DAY_SLOT_HEIGHT }} onMouseDown={(e) => handleSlotMouseDown(e, selectedDate, time)} onMouseEnter={() => handleSlotMouseEnter(selectedDate, time)} onDragOver={handleDragOver} onDrop={(e) => handleDropOnSlot(e, selectedDate, time)} />)}
                {(() => { const range = getSelectionRange(selectedDate); if (!range) return null; return <div className="selection-overlay" style={{ top: range.startIdx * DAY_SLOT_HEIGHT, height: range.slots * DAY_SLOT_HEIGHT }} /> })()}
                {(() => { const positions = getTaskPositions(dayTasks); return dayTasks.map(task => { const startTime = task.scheduled_time?.slice(0, 5) || '00:00'; const slotIdx = getSlotIndex(startTime); const height = getTaskHeight(task.estimated_minutes, DAY_SLOT_HEIGHT); const pos = positions[task.id] || { col: 0, total: 1 }; const width = `calc(${100 / pos.total}% - 4px)`; const left = `calc(${(pos.col * 100) / pos.total}% + 2px)`; return <div key={task.id} className={`cal-task ${task.status}`} style={{ top: slotIdx * DAY_SLOT_HEIGHT, height, width, left, backgroundColor: task.category_color || '#3B82F6' }} draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd} onClick={() => setShowEditTask(task)} title={`${task.title} (${formatDuration(task.estimated_minutes)})`}><span className="ct-icon">{task.category_icon || '📋'}</span><span className="ct-title">{task.title}</span><span className="ct-dur">{formatDuration(task.estimated_minutes)}</span><div className="ct-btns">{task.status !== 'completed' && <button onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id) }}>✓</button>}<button onClick={(e) => { e.stopPropagation(); handleUnschedule(task.id) }}>↩</button></div></div> }) })()}
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
              <div className="week-header"><div className="time-header"></div>{weekDays.map(d => { const { day, num } = formatShortDay(d); return <div key={d} className={`day-header ${isToday(d) ? 'today' : ''}`}><span>{day}</span><span className="day-num">{num}</span></div> })}</div>
              <div className="week-body">
                <div className="time-column">{timeSlots.map(time => <div key={time} className={`time-label ${time.endsWith(':30') ? 'half' : ''}`} style={{ height: WEEK_SLOT_HEIGHT }}>{time.endsWith(':00') ? time : ''}</div>)}</div>
                {weekDays.map(day => { const tasksForDay = getTasksForDate(weekTasks, day); const selectionRange = getSelectionRange(day); return <div key={day} className={`day-column ${isToday(day) ? 'today' : ''}`}>{timeSlots.map(time => <div key={time} className={`slot ${isDragging ? 'drop-target' : ''}`} style={{ height: WEEK_SLOT_HEIGHT }} onMouseDown={(e) => handleSlotMouseDown(e, day, time)} onMouseEnter={() => handleSlotMouseEnter(day, time)} onDragOver={handleDragOver} onDrop={(e) => handleDropOnSlot(e, day, time)} />)}{selectionRange && <div className="selection-overlay" style={{ top: selectionRange.startIdx * WEEK_SLOT_HEIGHT, height: selectionRange.slots * WEEK_SLOT_HEIGHT }} />}{(() => { const positions = getTaskPositions(tasksForDay); return tasksForDay.map(task => { const startTime = task.scheduled_time?.slice(0, 5) || '00:00'; const slotIdx = getSlotIndex(startTime); const height = getTaskHeight(task.estimated_minutes, WEEK_SLOT_HEIGHT); const pos = positions[task.id] || { col: 0, total: 1 }; const width = `calc(${100 / pos.total}% - 2px)`; const left = `calc(${(pos.col * 100) / pos.total}% + 1px)`; return <div key={task.id} className={`cal-task week-task ${task.status}`} style={{ top: slotIdx * WEEK_SLOT_HEIGHT, height, width, left, backgroundColor: task.category_color || '#3B82F6' }} draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd} onClick={() => setShowEditTask(task)} title={`${task.title}`}>{task.title.slice(0, 8)}</div> }) })()}</div> })}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="analytics-view">
            <div className="nav-bar">
              <button onClick={() => { changeDate(-1); changeWeek(-1) }}>←</button>
              <button className="today-btn" onClick={goToToday}>Today</button>
              <span className="nav-date">{formatFullDate(selectedDate)}</span>
              <button onClick={() => { changeDate(1); changeWeek(1) }}>→</button>
            </div>
            
            <div className="analytics-grid">
              {/* Daily Stats */}
              <div className="analytics-card">
                <h3>📅 Daily</h3>
                <div className="card-date">{formatFullDate(selectedDate)}</div>
                {dailyAnalytics && (
                  <div className="stats-content">
                    <div className="stat-row"><span>Tasks</span><strong>{dailyAnalytics.summary.completedTasks}/{dailyAnalytics.summary.totalTasks}</strong></div>
                    <div className="stat-row"><span>Completion</span><strong>{dailyAnalytics.summary.completionRate}%</strong></div>
                    <div className="stat-row"><span>Hours</span><strong>{dailyAnalytics.summary.totalPlannedHours}h</strong></div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${dailyAnalytics.summary.completionRate}%` }} /></div>
                  </div>
                )}
              </div>

              {/* Weekly Stats */}
              <div className="analytics-card">
                <h3>📆 Weekly</h3>
                <div className="card-date">{formatDate(weekDays[0])} - {formatDate(weekDays[6])}</div>
                {weeklyAnalytics && (
                  <div className="stats-content">
                    <div className="stat-row"><span>Tasks</span><strong>{weeklyAnalytics.summary.completedTasks}/{weeklyAnalytics.summary.totalTasks}</strong></div>
                    <div className="stat-row"><span>Completion</span><strong>{weeklyAnalytics.summary.completionRate}%</strong></div>
                    <div className="stat-row"><span>Hours</span><strong>{weeklyAnalytics.summary.totalPlannedHours}h</strong></div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${weeklyAnalytics.summary.completionRate}%` }} /></div>
                  </div>
                )}
              </div>

              {/* Monthly Stats */}
              <div className="analytics-card">
                <h3>📅 Monthly</h3>
                <div className="month-nav">
                  <button onClick={() => setSelectedMonth(m => ({ year: m.month === 1 ? m.year - 1 : m.year, month: m.month === 1 ? 12 : m.month - 1 }))}>←</button>
                  <span>{new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => setSelectedMonth(m => ({ year: m.month === 12 ? m.year + 1 : m.year, month: m.month === 12 ? 1 : m.month + 1 }))}>→</button>
                </div>
                {monthlyAnalytics && (
                  <div className="stats-content">
                    <div className="stat-row"><span>Tasks</span><strong>{monthlyAnalytics.summary.completedTasks}/{monthlyAnalytics.summary.totalTasks}</strong></div>
                    <div className="stat-row"><span>Completion</span><strong>{monthlyAnalytics.summary.completionRate}%</strong></div>
                    <div className="stat-row"><span>Hours</span><strong>{monthlyAnalytics.summary.totalPlannedHours}h</strong></div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${monthlyAnalytics.summary.completionRate}%` }} /></div>
                  </div>
                )}
              </div>

              {/* All Time Stats */}
              <div className="analytics-card highlight">
                <h3>🏆 All Time</h3>
                <div className="card-date">Since you started</div>
                {allTimeAnalytics && (
                  <div className="stats-content">
                    <div className="stat-row"><span>Total Tasks</span><strong>{allTimeAnalytics.summary.totalTasks}</strong></div>
                    <div className="stat-row"><span>Completed</span><strong>{allTimeAnalytics.summary.completedTasks}</strong></div>
                    <div className="stat-row"><span>Total Hours</span><strong>{allTimeAnalytics.summary.totalPlannedHours}h</strong></div>
                    <div className="stat-row"><span>Completion</span><strong>{allTimeAnalytics.summary.completionRate}%</strong></div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${allTimeAnalytics.summary.completionRate}%` }} /></div>
                  </div>
                )}
              </div>

              {/* All Time Additional Stats */}
              {allTimeAnalytics && (
                <div className="analytics-card full-width">
                  <h3>📊 Productivity Insights</h3>
                  <div className="insights-grid">
                    <div className="insight-item">
                      <span className="insight-icon">🔥</span>
                      <span className="insight-value">{allTimeAnalytics.summary.currentStreak}</span>
                      <span className="insight-label">Day Streak</span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-icon">📋</span>
                      <span className="insight-value">{allTimeAnalytics.summary.avgTasksPerDay}</span>
                      <span className="insight-label">Avg Tasks/Day</span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-icon">⏱️</span>
                      <span className="insight-value">{allTimeAnalytics.summary.avgHoursPerDay}h</span>
                      <span className="insight-label">Avg Hours/Day</span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-icon">✅</span>
                      <span className="insight-value">{allTimeAnalytics.summary.completionRate}%</span>
                      <span className="insight-label">Success Rate</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Trend Chart */}
              {allTimeAnalytics?.monthly?.length > 0 && (
                <div className="analytics-card full-width">
                  <h3>📈 Monthly Trend (Last 12 Months)</h3>
                  <div className="month-chart">
                    {allTimeAnalytics.monthly.map(m => {
                      const maxMinutes = Math.max(...allTimeAnalytics.monthly.map(x => x.planned_minutes || 0), 60)
                      const height = ((m.planned_minutes || 0) / maxMinutes) * 100
                      return (
                        <div key={m.month_label} className="month-bar">
                          <div className="month-bar-container">
                            <div className="month-bar-fill" style={{ height: `${height}%` }}>
                              {m.planned_minutes > 0 && <span className="month-bar-value">{formatDuration(m.planned_minutes)}</span>}
                            </div>
                          </div>
                          <div className="month-bar-label">{m.month_label?.split(' ')[0]}</div>
                          <div className="month-bar-tasks">{m.completed_tasks}/{m.total_tasks}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* All Time Category Breakdown */}
              {allTimeAnalytics?.categories?.length > 0 && (
                <div className="analytics-card full-width">
                  <h3>🏷️ All Time by Category</h3>
                  <div className="category-chart">
                    {allTimeAnalytics.categories.map(cat => {
                      const total = allTimeAnalytics.summary.totalPlannedMinutes || 1
                      const pct = Math.round((cat.planned_minutes / total) * 100)
                      return (
                        <div key={cat.id || 'uncategorized'} className="cat-bar-item">
                          <div className="cat-bar-label">
                            <span>{cat.icon || '📋'} {cat.name || 'Uncategorized'}</span>
                            <span>{formatDuration(cat.planned_minutes)} ({pct}%)</span>
                          </div>
                          <div className="cat-bar-track">
                            <div className="cat-bar-fill" style={{ width: `${pct}%`, backgroundColor: cat.color || '#6B7280' }} />
                          </div>
                          <div className="cat-bar-tasks">{cat.completed_count}/{cat.task_count} tasks completed</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tasks for the day - with complete button */}
              <div className="analytics-card full-width">
                <h3>📋 Today's Tasks</h3>
                <div className="card-date">{formatFullDate(selectedDate)}</div>
                {dailyAnalytics?.tasks?.length > 0 ? (
                  <div className="analytics-tasks">
                    {dailyAnalytics.tasks.map(t => (
                      <div key={t.id} className={`analytics-task ${t.status}`}>
                        <span className="at-icon">{t.category_icon || '📋'}</span>
                        <div className="at-info">
                          <span className="at-title">{t.title}</span>
                          <span className="at-meta">{t.scheduled_time?.slice(0,5)} • {formatDuration(t.estimated_minutes)}</span>
                        </div>
                        {t.status === 'completed' ? (
                          <span className="at-done">✓ Done</span>
                        ) : (
                          <button className="at-complete" onClick={() => handleCompleteTask(t.id)}>Complete</button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="no-data">No tasks scheduled</p>}
              </div>

              {/* Weekly by Day */}
              <div className="analytics-card full-width">
                <h3>📈 This Week</h3>
                <div className="card-date">{formatDate(weekDays[0])} - {formatDate(weekDays[6])}</div>
                {weeklyAnalytics?.daily?.length > 0 ? (
                  <div className="week-chart">
                    {weekDays.map(day => {
                      const data = weeklyAnalytics.daily.find(d => d.date === day)
                      const planned = data?.planned_minutes || 0
                      const maxMinutes = Math.max(...weeklyAnalytics.daily.map(d => d.planned_minutes || 0), 60)
                      const height = (planned / maxMinutes) * 100
                      return (
                        <div key={day} className={`day-bar ${isToday(day) ? 'today' : ''}`}>
                          <div className="bar-container">
                            <div className="bar-fill" style={{ height: `${height}%` }}>
                              {planned > 0 && <span className="bar-value">{formatDuration(planned)}</span>}
                            </div>
                          </div>
                          <div className="bar-label">{formatShortDay(day).day}</div>
                          <div className="bar-tasks">{data?.completed_tasks || 0}/{data?.total_tasks || 0}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="no-data">No tasks scheduled this week</p>}
              </div>
            </div>
          </div>
        )}

        {/* DAILY REVIEW */}
        {activeTab === 'daily-review' && (
          <div className="review-view">
            <div className="nav-bar">
              <button onClick={() => changeDate(-1)}>←</button>
              <button className="today-btn" onClick={goToToday}>Today</button>
              <span className="nav-date">{formatFullDate(selectedDate)}</span>
              <button onClick={() => changeDate(1)}>→</button>
            </div>

            <div className="review-content">
              <div className="review-summary">
                <h3>📊 Day Summary - {formatFullDate(selectedDate)}</h3>
                {dailyAnalytics && (
                  <div className="summary-stats">
                    <div className="summary-stat"><span className="stat-num">{dailyAnalytics.summary.completedTasks}</span><span className="stat-label">Completed</span></div>
                    <div className="summary-stat"><span className="stat-num">{dailyAnalytics.summary.totalTasks}</span><span className="stat-label">Planned</span></div>
                    <div className="summary-stat"><span className="stat-num">{dailyAnalytics.summary.completionRate}%</span><span className="stat-label">Done</span></div>
                    <div className="summary-stat"><span className="stat-num">{dailyAnalytics.summary.totalPlannedHours}h</span><span className="stat-label">Hours</span></div>
                  </div>
                )}
              </div>

              <div className="review-form">
                <h3>✍️ Daily Review for {formatDate(selectedDate)} {dailyReview?.is_finalized && <span className="finalized-badge">✓ Finalized</span>}</h3>
                
                <div className="score-section">
                  <label>Daily Productivity Score</label>
                  <div className="score-input">
                    <input type="number" min="1" max="10" 
                      value={dailyReview?.productivity_rating || ''} 
                      onChange={(e) => setDailyReview({ ...dailyReview, productivity_rating: e.target.value })} 
                      disabled={dailyReview?.is_finalized} 
                    />
                    <span>/ 10</span>
                  </div>
                </div>

                <div className="notes-section">
                  <label>Notes & Reflections</label>
                  <textarea placeholder="What went well? What could improve?" value={dailyReview?.notes || ''}
                    onChange={(e) => setDailyReview({ ...dailyReview, notes: e.target.value })}
                    disabled={dailyReview?.is_finalized} />
                </div>

                {!dailyReview?.is_finalized && (
                  <div className="review-actions">
                    <button className="btn btn-secondary" onClick={() => handleSaveDailyReview(dailyReview?.productivity_rating || 5, dailyReview?.notes || '', false)}>Save Draft</button>
                    <button className="btn btn-primary" onClick={() => handleSaveDailyReview(dailyReview?.productivity_rating || 5, dailyReview?.notes || '', true)}>✓ Finalize Day</button>
                  </div>
                )}
              </div>

              {/* Tasks for the day with complete button */}
              {dailyAnalytics?.tasks?.length > 0 && (
                <div className="review-tasks">
                  <h4>Tasks ({dailyAnalytics.summary.completedTasks} of {dailyAnalytics.summary.totalTasks} completed)</h4>
                  <div className="task-list-mini">
                    {dailyAnalytics.tasks.map(t => (
                      <div key={t.id} className={`task-mini ${t.status}`}>
                        <span className="task-mini-icon">{t.category_icon || '📋'}</span>
                        <span className="task-mini-title">{t.title}</span>
                        {t.status === 'completed' ? (
                          <span className="task-mini-status completed">✓</span>
                        ) : (
                          <button className="task-mini-complete" onClick={() => handleCompleteTask(t.id)}>✓</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WEEKLY REVIEW */}
        {activeTab === 'weekly-review' && (
          <div className="review-view">
            <div className="nav-bar">
              <button onClick={() => changeWeek(-1)}>←</button>
              <button className="today-btn" onClick={goToToday}>This Week</button>
              <span className="nav-date">{formatDate(weekDays[0])} - {formatDate(weekDays[6])}</span>
              <button onClick={() => changeWeek(1)}>→</button>
            </div>

            <div className="review-content">
              <div className="review-summary">
                <h3>📊 Week Summary - {formatDate(weekDays[0])} to {formatDate(weekDays[6])}</h3>
                {weeklyAnalytics && (
                  <div className="summary-stats">
                    <div className="summary-stat"><span className="stat-num">{weeklyAnalytics.summary.completedTasks}</span><span className="stat-label">Completed</span></div>
                    <div className="summary-stat"><span className="stat-num">{weeklyAnalytics.summary.totalTasks}</span><span className="stat-label">Planned</span></div>
                    <div className="summary-stat"><span className="stat-num">{weeklyAnalytics.summary.completionRate}%</span><span className="stat-label">Done</span></div>
                    <div className="summary-stat"><span className="stat-num">{weeklyAnalytics.summary.totalPlannedHours}h</span><span className="stat-label">Hours</span></div>
                  </div>
                )}
              </div>

              <div className="goals-section">
                <h3>🎯 Weekly Goals</h3>
                <div className="goals-list">
                  {weeklyReview.goals.map(goal => (
                    <div key={goal.id} className={`goal-item ${goal.is_achieved ? 'achieved' : ''}`}>
                      <button className="goal-check" onClick={() => handleToggleGoal(goal.id, !goal.is_achieved)}>
                        {goal.is_achieved ? '✓' : '○'}
                      </button>
                      <span className="goal-text">{goal.goal_text}</span>
                      <button className="goal-delete" onClick={() => handleDeleteGoal(goal.id)}>×</button>
                    </div>
                  ))}
                </div>
                <div className="add-goal">
                  <input type="text" placeholder="Add a weekly goal..." value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()} />
                  <button onClick={handleAddGoal}>+</button>
                </div>
              </div>

              <div className="review-form">
                <h3>📝 Weekly Review for {formatDate(weekDays[0])} - {formatDate(weekDays[6])} {weeklyReview.review?.is_finalized && <span className="finalized-badge">✓ Finalized</span>}</h3>
                
                <div className="score-section">
                  <label>Weekly Productivity Score</label>
                  <div className="score-input">
                    <input type="number" min="1" max="10" value={weeklyReview.review?.productivity_score || ''} onChange={(e) => setWeeklyReview({ ...weeklyReview, review: { ...weeklyReview.review, productivity_score: e.target.value } })} disabled={weeklyReview.review?.is_finalized} />
                    <span>/ 10</span>
                  </div>
                </div>

                <div className="notes-section">
                  <label>Weekly Reflections</label>
                  <textarea placeholder="Key accomplishments? Lessons learned? Goals for next week?" value={weeklyReview.review?.notes || ''} onChange={(e) => setWeeklyReview({ ...weeklyReview, review: { ...weeklyReview.review, notes: e.target.value } })} disabled={weeklyReview.review?.is_finalized} />
                </div>

                {!weeklyReview.review?.is_finalized && (
                  <div className="review-actions">
                    <button className="btn btn-secondary" onClick={() => handleSaveWeeklyReview(weeklyReview.review?.productivity_score, weeklyReview.review?.notes, false)}>Save Draft</button>
                    <button className="btn btn-primary" onClick={() => handleSaveWeeklyReview(weeklyReview.review?.productivity_score, weeklyReview.review?.notes, true)}>✓ Finalize Week</button>
                  </div>
                )}
              </div>

              {/* Category breakdown for week */}
              {weeklyAnalytics?.categories?.length > 0 && (
                <div className="review-categories">
                  <h4>Time by Category</h4>
                  <div className="category-list">
                    {weeklyAnalytics.categories.map(cat => (
                      <div key={cat.id || 'uncategorized'} className="cat-row">
                        <span className="cat-icon" style={{ color: cat.color }}>{cat.icon || '📋'}</span>
                        <span className="cat-name">{cat.name || 'Uncategorized'}</span>
                        <span className="cat-hours">{formatDuration(cat.planned_minutes)}</span>
                        <span className="cat-tasks">{cat.completed_count}/{cat.task_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddTask && (
        <div className="modal-bg" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowAddTask(false)}>×</button>
            <h3>➕ New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="fg"><label>Title *</label><input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} autoFocus /></div>
              <div className="fr"><div className="fg"><label>Category</label><select value={newTask.categoryId} onChange={e => setNewTask({...newTask, categoryId: e.target.value})}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div><div className="fg"><label>Priority</label><select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}><option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option></select></div></div>
              <div className="sched-box">
                <label className="sched-title">📅 Schedule</label>
                <div className="fr"><div className="fg"><label>Start Date</label><input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value, endDate: e.target.value || newTask.endDate})} /></div><div className="fg"><label>Start Time</label><input type="time" value={newTask.startTime} onChange={e => handleStartTimeChange(e.target.value, true)} disabled={!newTask.startDate} /></div></div>
                <div className="fr"><div className="fg"><label>End Date</label><input type="date" value={newTask.endDate} onChange={e => setNewTask({...newTask, endDate: e.target.value})} disabled={!newTask.startDate} /></div><div className="fg"><label>End Time</label><input type="time" value={newTask.endTime} onChange={e => handleEndTimeChange(e.target.value, true)} disabled={!newTask.startDate} /></div></div>
                {newTask.startTime && newTask.endTime && <div className="dur-badge">Duration: {formatDuration(newTask.estimatedMinutes)}</div>}
              </div>
              <div className="recur-box">
                <label className="recur-toggle"><input type="checkbox" checked={newTask.isRecurring} onChange={e => setNewTask({...newTask, isRecurring: e.target.checked})} /><span>🔄 Recurring task</span></label>
                {newTask.isRecurring && (<div className="recur-opts"><div className="fg"><label>Frequency *</label><select value={newTask.recurrenceRule} onChange={e => setNewTask({...newTask, recurrenceRule: e.target.value})}><option value="">Select frequency</option>{recurrenceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div><div className="fg"><label>End Date (optional)</label><input type="date" value={newTask.recurrenceEndDate} onChange={e => setNewTask({...newTask, recurrenceEndDate: e.target.value})} min={newTask.startDate} /></div></div>)}
              </div>
              <div className="modal-btns"><button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>Cancel</button><button type="submit" className="btn btn-primary">{newTask.startDate ? 'Schedule' : 'Add'}</button></div>
            </form>
          </div>
        </div>
      )}

      {showEditTask && (
        <div className="modal-bg" onClick={() => setShowEditTask(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowEditTask(null)}>×</button>
            <h3>✏️ Edit Task</h3>
            <form onSubmit={handleEditTask}>
              <div className="fg"><label>Title *</label><input type="text" value={showEditTask.title || ''} onChange={e => setShowEditTask({...showEditTask, title: e.target.value})} /></div>
              <div className="fr"><div className="fg"><label>Category</label><select value={showEditTask.category_id || ''} onChange={e => setShowEditTask({...showEditTask, category_id: e.target.value})}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div><div className="fg"><label>Priority</label><select value={showEditTask.priority || 'medium'} onChange={e => setShowEditTask({...showEditTask, priority: e.target.value})}><option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option></select></div></div>
              <div className="sched-box">
                <label className="sched-title">📅 Schedule</label>
                <div className="fr"><div className="fg"><label>Start Date</label><input type="date" value={formatDateForInput(showEditTask.scheduled_date)} onChange={e => setShowEditTask({...showEditTask, scheduled_date: e.target.value, scheduled_end_date: e.target.value || showEditTask.scheduled_end_date})} /></div><div className="fg"><label>Start Time</label><input type="time" value={showEditTask.scheduled_time?.slice(0,5) || ''} onChange={e => handleStartTimeChange(e.target.value, false)} disabled={!showEditTask.scheduled_date} /></div></div>
                <div className="fr"><div className="fg"><label>End Date</label><input type="date" value={formatDateForInput(showEditTask.scheduled_end_date)} onChange={e => setShowEditTask({...showEditTask, scheduled_end_date: e.target.value})} disabled={!showEditTask.scheduled_date} /></div><div className="fg"><label>End Time</label><input type="time" value={showEditTask.scheduled_end_time?.slice(0,5) || ''} onChange={e => handleEndTimeChange(e.target.value, false)} disabled={!showEditTask.scheduled_date} /></div></div>
                {showEditTask.scheduled_time && showEditTask.scheduled_end_time && <div className="dur-badge">Duration: {formatDuration(showEditTask.estimated_minutes)}</div>}
              </div>
              <div className="modal-btns"><button type="button" className="btn btn-danger" onClick={() => handleDeleteClick(showEditTask)}>🗑️</button><button type="button" className="btn btn-secondary" onClick={() => setShowEditTask(null)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}

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

      {showCategories && (
        <div className="modal-bg" onClick={() => setShowCategories(false)}>
          <div className="modal cat-modal" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setShowCategories(false)}>×</button>
            <h3>🏷️ Categories</h3>
            <div className="cat-list">{categories.map(c => (<div key={c.id} className="cat-item" style={{borderLeftColor: c.color}}>{editCategory?.id === c.id ? (<form onSubmit={handleUpdateCategory} className="cat-edit"><div className="icon-row">{icons.map(i => <button key={i} type="button" className={editCategory.icon===i?'active':''} onClick={() => setEditCategory({...editCategory, icon:i})}>{i}</button>)}</div><input value={editCategory.name} onChange={e => setEditCategory({...editCategory, name: e.target.value})} /><div className="color-row">{colors.map(cl => <button key={cl} type="button" className={editCategory.color===cl?'active':''} style={{background:cl}} onClick={() => setEditCategory({...editCategory, color:cl})} />)}</div><div className="cat-btns"><button type="submit" className="btn btn-small btn-primary">Save</button><button type="button" className="btn btn-small" onClick={() => setEditCategory(null)}>Cancel</button></div></form>) : (<><span>{c.icon}</span><span className="cat-name">{c.name}</span><div className="cat-actions"><button onClick={() => setEditCategory(c)}>✏️</button><button onClick={() => setConfirmDelete({type:'category',id:c.id,name:c.name})}>🗑️</button></div></>)}</div>))}</div>
            <div className="add-cat"><h4>Add Category</h4><form onSubmit={handleAddCategory}><div className="icon-row">{icons.map(i => <button key={i} type="button" className={newCategory.icon===i?'active':''} onClick={() => setNewCategory({...newCategory, icon:i})}>{i}</button>)}</div><input value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} placeholder="Name" /><div className="color-row">{colors.map(cl => <button key={cl} type="button" className={newCategory.color===cl?'active':''} style={{background:cl}} onClick={() => setNewCategory({...newCategory, color:cl})} />)}</div><button type="submit" className="btn btn-primary">+ Add</button></form></div>
          </div>
        </div>
      )}

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
