# 🛠️ OXY Productivity Tools - Feature Specification

## Overview

A comprehensive productivity suite integrated into the OXY platform, enabling users to manage tasks, plan their days, track time spent on different activities, and utilize proven productivity techniques.

---

## 🎯 Core Modules

### 1. Task Backlog (The Brain Dump)
**Purpose:** Central repository for all tasks before they're scheduled

**Features:**
- **Quick Add:** Fast task creation with title only (expand for details later)
- **Task Properties:**
  - Title (required)
  - Description (optional)
  - Category (customizable: Work, Personal, Health, Learning, etc.)
  - Priority (High/Medium/Low or P1/P2/P3)
  - Estimated Duration (15min, 30min, 1hr, 2hr, custom)
  - Due Date (optional soft deadline)
  - Tags (multiple, for filtering)
  - Recurring (daily, weekly, monthly, custom)
- **Backlog Views:**
  - List view (default)
  - Kanban board (by status: Backlog → Planned → In Progress → Done)
  - Category grouped view
- **Bulk Actions:** Multi-select for move, delete, categorize
- **Search & Filter:** By category, priority, tags, date range

---

### 2. Daily Planner (Time Blocking)
**Purpose:** Plan your day by scheduling tasks into specific time slots

**Features:**
- **Day View Calendar:**
  - Vertical timeline (6 AM - 11 PM configurable)
  - 15/30/60 minute slot options
  - Drag tasks from backlog to time slots
  - Resize tasks to adjust duration
  - Color-coded by category
- **Quick Schedule:**
  - "Plan My Day" wizard - auto-suggests task placement based on priority
  - Morning routine, lunch, end-of-day blocks (pre-defined templates)
- **Time Slot Actions:**
  - Start task (begins timer)
  - Complete task
  - Reschedule to later/tomorrow
  - Add notes/comments
- **Daily Summary:**
  - Total planned hours
  - Breakdown by category (pie chart preview)
  - Buffer/free time highlighted

---

### 3. Weekly Planner
**Purpose:** Bird's eye view of the week for strategic planning

**Features:**
- **Week Grid View:**
  - 7 columns (Mon-Sun or Sun-Sat configurable)
  - Each day shows scheduled tasks
  - Drag tasks between days
  - Week navigation (prev/next week)
- **Week Goals:**
  - Set 3-5 weekly objectives
  - Link tasks to goals
  - Progress tracking per goal
- **Recurring Tasks:**
  - Visualize recurring patterns
  - Batch edit recurring series
- **Week Overview Stats:**
  - Hours planned per day
  - Category distribution for the week
  - Comparison with previous week

---

### 4. Categories & Time Tracking
**Purpose:** Categorize work and track where time goes

**Features:**
- **Default Categories:**
  - 💼 Work
  - 📚 Learning
  - 🏃 Health & Fitness
  - 👨‍👩‍👧 Personal/Family
  - 🎨 Creative
  - 🧘 Self-Care
  - 📋 Admin/Chores
  - Custom categories (user-defined)
- **Category Properties:**
  - Name
  - Icon/Emoji
  - Color (for visual distinction)
  - Weekly goal hours (optional)
- **Time Tracking:**
  - Auto-track when task is in progress
  - Manual time entry
  - Edit logged time
  - Time rounding options (nearest 5/15 min)

---

### 5. Daily Review & Finalization
**Purpose:** End-of-day reflection and data capture

**Features:**
- **Day Finalization Flow:**
  1. Mark incomplete tasks (move to tomorrow or back to backlog)
  2. Adjust actual time spent (if different from planned)
  3. Rate your productivity (1-5 stars)
  4. Add daily notes/journal entry
  5. View daily stats summary
- **Daily Stats:**
  - Total time tracked
  - Planned vs Actual comparison
  - Category breakdown (pie chart)
  - Top 3 accomplishments
  - Tasks completed / tasks planned ratio
- **Streak Tracking:**
  - Consecutive days finalized
  - Productivity score trend

---

### 6. Weekly Review & Statistics
**Purpose:** Weekly reflection and analytics

**Features:**
- **Week Finalization:**
  - Triggered on Sunday evening (configurable)
  - Review week goals - achieved or not
  - Carry forward incomplete tasks
  - Set goals for next week
- **Weekly Report:**
  - **Time Distribution Chart:** Pie/donut chart by category
  - **Daily Comparison:** Bar chart showing hours per day
  - **Productivity Score:** Average of daily ratings
  - **Goal Achievement:** X of Y weekly goals completed
  - **Top Categories:** Where most time went
  - **Trends:** Comparison with last 4 weeks
- **Export Options:**
  - Download as PDF report
  - Share summary image

---

## ⚡ Productivity Techniques

### 7. Pomodoro Timer
**Purpose:** Focus technique with timed work/break intervals

**Features:**
- **Timer Modes:**
  - Work session: 25 min (default, configurable)
  - Short break: 5 min
  - Long break: 15 min (after 4 pomodoros)
- **Timer Interface:**
  - Large countdown display
  - Start/Pause/Reset buttons
  - Session indicator (🍅🍅🍅🍅)
  - Currently linked task shown
- **Integration:**
  - Start pomodoro from any task
  - Auto-log time to task when pomodoro completes
  - Notifications (audio + browser notification)
- **Pomodoro Stats:**
  - Daily pomodoro count
  - Focus time today
  - Best streak

---

### 8. Eisenhower Matrix
**Purpose:** Prioritize tasks by urgency and importance

**Features:**
- **4-Quadrant View:**
  ```
  ┌─────────────────┬─────────────────┐
  │   URGENT &      │  NOT URGENT &   │
  │   IMPORTANT     │    IMPORTANT    │
  │   🔥 DO FIRST   │   📅 SCHEDULE   │
  ├─────────────────┼─────────────────┤
  │   URGENT &      │  NOT URGENT &   │
  │  NOT IMPORTANT  │  NOT IMPORTANT  │
  │   👤 DELEGATE   │    🗑️ DELETE    │
  └─────────────────┴─────────────────┘
  ```
- **Task Placement:**
  - Drag tasks from backlog to quadrants
  - Auto-suggest quadrant based on priority + due date
- **Actions Per Quadrant:**
  - Q1 (Do First): Schedule for today
  - Q2 (Schedule): Add to weekly plan
  - Q3 (Delegate): Mark as delegated, add assignee note
  - Q4 (Delete): Archive or delete
- **Matrix Review:**
  - Weekly balance check
  - Alert if Q1 is overloaded

---

### 9. Time Boxing
**Purpose:** Allocate fixed time blocks to tasks

**Features:**
- **Time Box Creation:**
  - Select task
  - Set fixed duration (15/30/45/60/90/120 min)
  - Task auto-stops when time expires
- **Hard vs Soft Boxes:**
  - Hard: Task marked incomplete if not done
  - Soft: Time extends if needed
- **Visual Indicator:**
  - Progress bar during active time box
  - Warning at 80% and 95%

---

### 10. 2-Minute Rule
**Purpose:** Quick tasks should be done immediately

**Features:**
- **Auto-Detection:**
  - When creating task with duration ≤ 2 min
  - Prompt: "This is quick! Do it now?"
- **2-Min Queue:**
  - Separate list of quick tasks
  - Batch processing mode
  - "Clear the queue" challenge

---

### 11. Eat The Frog
**Purpose:** Do the hardest task first

**Features:**
- **Daily Frog:**
  - Mark one task as "The Frog" 🐸
  - Appears prominently at top of daily view
  - Completion triggers celebration
- **Frog Streak:**
  - Track consecutive days of frog completion
  - Stats: "Frogs eaten this month"

---

## 📊 Analytics Dashboard

### Master Statistics View

**Daily Stats Panel:**
- Hours tracked today
- Tasks completed
- Current streak
- Pomodoros completed

**Weekly Stats Panel:**
- Total hours this week
- Category breakdown (interactive chart)
- Day-by-day comparison
- Week-over-week trend

**Monthly Stats Panel:**
- Monthly totals
- Category trends over 4 weeks
- Productivity score graph
- Achievements unlocked

**All-Time Stats:**
- Total tasks completed
- Total hours tracked
- Most productive day of week
- Most productive time of day
- Category lifetime totals

---

## 🗄️ Database Schema

### Tables Required:

```sql
-- Task categories
CREATE TABLE task_categories (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(7),
  weekly_goal_hours DECIMAL(4,1),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks (backlog and scheduled)
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT REFERENCES task_categories(id),
  priority VARCHAR(10) DEFAULT 'medium', -- high, medium, low
  estimated_minutes INT,
  status VARCHAR(20) DEFAULT 'backlog', -- backlog, planned, in_progress, completed, archived
  due_date DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(50), -- daily, weekly, monthly, custom
  eisenhower_quadrant INT, -- 1, 2, 3, 4
  is_frog BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Task tags
CREATE TABLE task_tags (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7)
);

-- Task-tag relationship
CREATE TABLE task_tag_map (
  task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id INT REFERENCES task_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Scheduled tasks (time slots)
CREATE TABLE scheduled_tasks (
  id SERIAL PRIMARY KEY,
  task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  actual_minutes INT,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Time entries (for manual time tracking)
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,
  task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INT,
  entry_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pomodoro sessions
CREATE TABLE pomodoro_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  task_id INT REFERENCES tasks(id),
  session_type VARCHAR(20) DEFAULT 'work', -- work, short_break, long_break
  duration_minutes INT DEFAULT 25,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  was_interrupted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily reviews
CREATE TABLE daily_reviews (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  review_date DATE NOT NULL UNIQUE,
  productivity_rating INT, -- 1-5
  notes TEXT,
  total_planned_minutes INT,
  total_actual_minutes INT,
  tasks_completed INT,
  tasks_planned INT,
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly goals
CREATE TABLE weekly_goals (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  week_start DATE NOT NULL, -- Monday of the week
  goal_text VARCHAR(255) NOT NULL,
  is_achieved BOOLEAN DEFAULT FALSE,
  linked_task_ids INT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly reviews
CREATE TABLE weekly_reviews (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  week_start DATE NOT NULL UNIQUE,
  productivity_score DECIMAL(3,1),
  total_hours DECIMAL(5,1),
  goals_achieved INT,
  goals_total INT,
  notes TEXT,
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 UI/UX Recommendations

### Navigation:
- New top-level nav item: "Productivity" or "Planner"
- Sub-navigation: Dashboard | Backlog | Day | Week | Tools

### Color Scheme:
- Each category has distinct color
- Priority indicators: 🔴 High, 🟡 Medium, 🟢 Low
- Status colors: Gray (backlog), Blue (planned), Orange (in progress), Green (done)

### Interactions:
- Drag & drop throughout
- Keyboard shortcuts (n: new task, t: today, p: pomodoro)
- Double-click to edit
- Right-click context menus

### Mobile Considerations:
- Simplified day view
- Quick add floating button
- Swipe actions on tasks

---

## 📋 Implementation Phases

### Phase 1: Core Task Management
1. Task categories (CRUD)
2. Tasks backlog (CRUD + list view)
3. Basic daily planner (drag to schedule)
4. Task completion tracking

### Phase 2: Time Tracking & Planning
5. Time entries and tracking
6. Weekly planner view
7. Calendar drag & drop
8. Recurring tasks

### Phase 3: Reviews & Statistics
9. Daily review flow
10. Weekly review flow
11. Statistics dashboard
12. Charts and analytics

### Phase 4: Productivity Techniques
13. Pomodoro timer
14. Eisenhower matrix view
15. Eat the Frog feature
16. 2-minute rule

### Phase 5: Advanced Features
17. Tags and advanced filtering
18. Weekly goals
19. Export/reports
20. Notifications and reminders

---

## 🔗 Integration with Existing OXY Features

- **Courses:** Track learning time as a category
- **Coach Sessions:** Auto-create tasks from coach recommendations
- **User Profile:** Show productivity stats on profile
- **Admin:** View aggregate productivity stats

---

## Questions Before Implementation

1. **User Scope:** Is this for all users or premium only?
2. **Default Categories:** Should I use the suggested defaults or customize?
3. **Timer Sounds:** Any preference for notification sounds?
4. **Week Start:** Monday or Sunday as week start?
5. **Time Format:** 12-hour or 24-hour clock preference?
6. **Which phase to start with?**

---

*Let me know which features to prioritize and any modifications needed!*

