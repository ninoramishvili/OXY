# OXY Productivity Tools - Feature Documentation

## Overview

The Productivity module provides comprehensive task management, planning, and analytics features to help users manage their time effectively.

---

## Features Implemented

### Phase 1: Core Task Management ✅

#### 1.1 Task Categories
- Custom categories with name, icon, and color
- Default categories: Work, Personal, Health, Learning
- CRUD operations for categories
- Tasks inherit category styling

#### 1.2 Task Backlog
- Central repository for all unscheduled tasks
- Task properties: title, description, category, priority, estimated duration
- Priority levels: High (🔴), Medium (🟡), Low (🟢)
- Drag-and-drop to calendar views

#### 1.3 Day View Calendar
- 24-hour timeline with 30-minute slots
- Click/drag to create new tasks
- Visual task blocks with category colors
- Tasks span multiple slots based on duration
- Overlapping tasks display side-by-side (Google Calendar style)

#### 1.4 Week View Calendar
- 7-day grid view (Monday-Sunday)
- Same functionality as day view
- Navigate between weeks
- "Today" highlighting

---

### Phase 2: Planning & Recurring ✅

#### 2.1 Recurring Tasks
- Frequency options: Daily, Weekdays (Mon-Fri), Weekly, Monthly
- Optional end date for recurrence
- Parent task (template) + child instances
- Delete options:
  - Just this task
  - This and future tasks
  - All tasks in series

#### 2.2 Task Scheduling
- Drag from backlog to calendar
- Quick schedule button (📅)
- Edit date/time in task modal
- Start date + end date support

---

### Phase 3: Analytics & Reviews ✅

#### 3.1 Analytics Dashboard
**Daily Statistics:**
- Tasks completed vs planned
- Completion percentage
- Total hours planned
- Progress bar visualization

**Weekly Statistics:**
- Weekly task summary
- Day-by-day bar chart
- Category breakdown with percentages

**Category Breakdown:**
- Visual bar chart by category
- Time allocated per category
- Task count per category

#### 3.2 Daily Review
- Date navigation
- Summary statistics (completed, planned, rate, hours)
- Productivity rating (1-5 stars)
- Notes/reflections textarea
- Save draft or finalize day
- Task list with completion status

#### 3.3 Weekly Review
- Week navigation
- Summary statistics
- Weekly goals management:
  - Add/delete goals
  - Toggle goal completion
- Productivity score (1-10)
- Weekly reflections
- Category breakdown for the week
- Save draft or finalize week

---

## User Interface

### Navigation Tabs
1. **📥 Backlog** - Unscheduled tasks
2. **📅 Day** - Daily calendar view
3. **📆 Week** - Weekly calendar view
4. **📊 Analytics** - Statistics dashboard
5. **✍️ Daily** - Daily review
6. **📝 Weekly** - Weekly review

### Visual Elements
- Category color coding throughout
- Priority badges (🔴🟡🟢)
- Recurring task indicator (🔄)
- Today highlighting in calendars
- Progress bars and charts
- Toast notifications for feedback

---

## Database Schema

### task_categories
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Owner |
| name | VARCHAR | Category name |
| icon | VARCHAR | Emoji icon |
| color | VARCHAR | Hex color |

### tasks
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Owner |
| title | VARCHAR | Task title |
| description | TEXT | Details |
| category_id | INTEGER | FK to categories |
| priority | VARCHAR | high/medium/low |
| estimated_minutes | INTEGER | Planned duration |
| status | VARCHAR | backlog/planned/completed |
| scheduled_date | DATE | Start date |
| scheduled_time | TIME | Start time |
| scheduled_end_date | DATE | End date |
| scheduled_end_time | TIME | End time |
| is_recurring | BOOLEAN | Is template |
| recurrence_rule | VARCHAR | daily/weekly/etc |
| recurrence_end_date | DATE | When to stop |
| parent_task_id | INTEGER | FK to parent |
| completed_at | TIMESTAMP | When completed |

### daily_reviews
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Owner |
| review_date | DATE | Which day |
| productivity_rating | INTEGER | 1-5 stars |
| notes | TEXT | Reflections |
| tasks_completed | INTEGER | Count |
| tasks_planned | INTEGER | Count |
| is_finalized | BOOLEAN | Locked |

### weekly_reviews
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Owner |
| week_start | DATE | Monday |
| productivity_score | DECIMAL | 1-10 |
| total_hours | DECIMAL | Hours logged |
| goals_achieved | INTEGER | Count |
| goals_total | INTEGER | Count |
| notes | TEXT | Reflections |
| is_finalized | BOOLEAN | Locked |

### weekly_goals
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Owner |
| week_start | DATE | Which week |
| goal_text | VARCHAR | Goal description |
| is_achieved | BOOLEAN | Completed |

---

## API Endpoints

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

## Future Enhancements (Phase 4-5)

### Phase 4: Productivity Techniques
- [ ] Pomodoro Timer
- [ ] Eisenhower Matrix
- [ ] Eat The Frog feature
- [ ] 2-Minute Rule detection

### Phase 5: Advanced Features
- [ ] Tags and advanced filtering
- [ ] Export/reports (PDF)
- [ ] Notifications/reminders
- [ ] Keyboard shortcuts
- [ ] Mobile optimization

---

## Usage Guide

### Creating a Task
1. Click "+ New" button
2. Enter title (required)
3. Select category and priority
4. Optionally set schedule (date + time)
5. For recurring: check "🔄 Recurring task" and set frequency

### Scheduling from Backlog
- **Drag & drop**: Drag task to Day or Week view
- **Quick schedule**: Click 📅 button on task

### Using Analytics
1. Go to "📊 Analytics" tab
2. Navigate dates with ← → buttons
3. View daily summary, weekly chart, and category breakdown

### Daily Review Process
1. Go to "✍️ Daily" tab at end of day
2. Review task completion summary
3. Rate your productivity (1-5 stars)
4. Add notes/reflections
5. Click "Finalize Day" to lock

### Weekly Review Process
1. Go to "📝 Weekly" tab
2. Add weekly goals at week start
3. Mark goals as achieved during week
4. At week end: rate productivity (1-10)
5. Add reflections
6. Click "Finalize Week" to lock

