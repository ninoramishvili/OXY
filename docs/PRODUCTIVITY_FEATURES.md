# OXY Productivity Tools - Complete Feature Documentation

## Overview

The Productivity module is a comprehensive task management and time tracking system integrated into the OXY platform. It enables users to organize tasks, plan their days and weeks, and analyze their productivity patterns.

---

## 1. Core Features

### 1.1 Task Management

#### Task Properties
| Property | Type | Description |
|----------|------|-------------|
| title | string | Task name (required) |
| description | text | Detailed description |
| category | reference | Link to task category |
| priority | enum | high, medium, low |
| estimated_minutes | integer | Planned duration |
| status | enum | backlog, planned, completed |
| scheduled_date | date | When task is scheduled |
| scheduled_time | time | Start time |
| scheduled_end_date | date | End date (for multi-day) |
| scheduled_end_time | time | End time |

#### Task Status Flow
```
backlog → planned → completed
   ↑___________|
   (unschedule)
```

### 1.2 Categories

Users can create custom categories to organize tasks:
- **Properties**: name, icon (emoji), color
- **Default Categories**: Work 💼, Personal 👤, Health 🏃, Learning 📚
- **Icons Available**: 📋💼👤🏃📚🎯💡🔧📞✉️🎨🎵🏠🚗💰❤️
- **Colors**: Blue, Purple, Green, Amber, Red, Pink, Cyan, Gray

### 1.3 Recurring Tasks

Create tasks that repeat automatically:

| Frequency | Description |
|-----------|-------------|
| Daily | Every day |
| Weekdays | Monday through Friday |
| Weekly | Same day each week |
| Monthly | Same date each month |

**Recurrence End Date**: Optional date to stop generating instances

**Deletion Options**:
- Just this task (single instance)
- This and future tasks
- All tasks in series

---

## 2. Views

### 2.1 Backlog Tab

Central repository for unscheduled tasks:
- List view with category colors
- Priority badges
- Duration display
- Quick schedule button (📅)
- Delete button (🗑️)
- Drag to calendar views

### 2.2 Day View Tab

24-hour calendar for daily planning:
- Time slots: 00:00 - 23:30 (30-min intervals)
- Tasks display as colored blocks
- Block height = task duration
- Overlapping tasks side-by-side
- Click slot to add task
- Drag to select time range
- Navigate between days

### 2.3 Week View Tab

7-day overview for weekly planning:
- Monday to Sunday layout
- Same time slot structure
- Compact task display
- Today column highlighted
- Click/drag to add tasks
- Navigate between weeks

---

## 3. Analytics Dashboard

### 3.1 Daily Summary Card
Shows for the selected date:
- Tasks completed / total
- Completion percentage
- Hours planned
- Progress bar

### 3.2 Weekly Summary Card
Shows for the selected week:
- Same metrics as daily
- Aggregated for 7 days

### 3.3 Category Breakdown
Bar chart showing:
- Time allocated per category
- Percentage of total
- Tasks completed vs planned

### 3.4 Task List
Interactive list with:
- Task icon and title
- Scheduled time
- Duration
- **Complete button** for pending tasks
- ✓ Done indicator for completed

### 3.5 Week Overview Chart
Bar chart showing daily distribution:
- One bar per day
- Height = planned minutes
- Completed/total task count
- Today highlighted

---

## 4. Daily Review

End-of-day reflection feature:

### Components
1. **Summary Stats** (gradient header)
   - Completed tasks count
   - Planned tasks count
   - Completion percentage
   - Total hours

2. **Productivity Score**
   - 1-10 scale input
   - Numeric rating

3. **Notes Section**
   - Text area for reflections
   - "What went well? What could improve?"

4. **Task List**
   - All tasks for the day
   - Complete button for pending tasks
   - Checkmarks for completed

5. **Actions**
   - Save Draft
   - Finalize Day (locks the review)

### Date Display
Clear indication of which day is being reviewed (full date format)

---

## 5. Weekly Review

End-of-week reflection and goal tracking:

### Components
1. **Summary Stats** (gradient header)
   - Same as daily, aggregated for week

2. **Weekly Goals**
   - Add goals at week start
   - Check off as achieved
   - Delete goals
   - Progress tracking

3. **Productivity Score**
   - 1-10 scale input

4. **Reflections**
   - Key accomplishments
   - Lessons learned
   - Goals for next week

5. **Category Breakdown**
   - Time per category
   - Completed vs total tasks

6. **Actions**
   - Save Draft
   - Finalize Week

### Date Range Display
Shows the week's date range (e.g., "Mon, Dec 2 - Sun, Dec 8")

---

## 6. Interactions

### Drag & Drop
- Drag tasks from backlog to calendar
- Drag between Day and Week views
- Visual feedback during drag
- Drop on time slots to schedule

### Click to Add
- Click empty slot to add task
- Pre-fills date and time
- Opens add task modal

### Drag to Select
- Click and drag across slots
- Highlights selection
- Creates task with full time range

### Task Actions
- Click task to edit
- Complete button (✓)
- Unschedule button (↩)
- Delete button (🗑️)

---

## 7. API Endpoints

### Categories
```
GET    /api/categories/:userId
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

### Tasks
```
GET    /api/tasks/:userId/backlog
GET    /api/tasks/:userId/date/:date
GET    /api/tasks/:userId/week/:weekStart
POST   /api/tasks
PUT    /api/tasks/:id
PUT    /api/tasks/:id/schedule
PUT    /api/tasks/:id/complete
PUT    /api/tasks/:id/unschedule
DELETE /api/tasks/:id
DELETE /api/tasks/:id/delete-recurring
```

### Analytics
```
GET    /api/analytics/:userId/daily/:date
GET    /api/analytics/:userId/weekly/:weekStart
GET    /api/analytics/:userId/monthly/:year/:month
```

### Reviews
```
GET    /api/reviews/daily/:userId/:date
POST   /api/reviews/daily
GET    /api/reviews/weekly/:userId/:weekStart
POST   /api/reviews/weekly
```

### Goals
```
POST   /api/goals/weekly
PUT    /api/goals/weekly/:id
DELETE /api/goals/weekly/:id
```

---

## 8. Database Tables

### task_categories
- id (UUID, PK)
- user_id (FK to users)
- name, icon, color
- created_at, updated_at

### tasks
- id (SERIAL, PK)
- user_id (FK)
- title, description
- category_id (FK)
- priority, estimated_minutes, status
- scheduled_date, scheduled_time
- scheduled_end_date, scheduled_end_time
- is_recurring, recurrence_rule, recurrence_end_date
- parent_task_id (FK, self-reference)
- completed_at
- timestamps

### daily_reviews
- id (PK)
- user_id (FK)
- review_date (UNIQUE with user_id)
- productivity_rating (1-10)
- notes, task stats
- is_finalized

### weekly_reviews
- id (PK)
- user_id (FK)
- week_start (UNIQUE with user_id)
- productivity_score (1-10)
- total_hours, goal stats
- notes, is_finalized

### weekly_goals
- id (PK)
- user_id (FK)
- week_start
- goal_text
- is_achieved

---

## 9. UI Components

### Modals
- **Add Task**: Title, category, priority, schedule, recurrence
- **Edit Task**: All task fields, delete option
- **Categories**: List, edit inline, add new
- **Confirm Delete**: Simple yes/no
- **Recurring Delete**: Three options

### Navigation
- Tab bar: Backlog, Day, Week, Analytics, Daily, Weekly
- Date navigation: ← Today →
- Full date display in headers

### Visual Feedback
- Toast notifications (success/error)
- Selection overlay (blue border)
- Drop target highlighting
- Drag hint banner

---

## 10. Future Enhancements

### Planned
- [ ] Pomodoro Timer integration
- [ ] Eisenhower Matrix view
- [ ] Keyboard shortcuts
- [ ] Mobile optimization
- [ ] Export reports (PDF/CSV)
- [ ] Email reminders
- [ ] Team collaboration

### Considerations
- Sync across devices
- Offline support
- Calendar integrations (Google, Outlook)
- Habit tracking
- Streak statistics
