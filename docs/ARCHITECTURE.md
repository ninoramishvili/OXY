# OXY Platform - Architecture Documentation

## Overview

OXY is a full-stack web application built with:
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon)
- **Styling**: Custom CSS with CSS Variables

---

## Project Structure

```
OXY/
├── backend/
│   ├── server.js           # Main Express server with all API endpoints
│   ├── db.js               # PostgreSQL connection pool
│   └── migrations/         # Database migration scripts
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main app component with routing
│   │   ├── index.css       # Global styles
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   └── api.js          # API configuration
│   └── public/
└── docs/                   # Documentation
```

---

## Database Schema

### Core Tables

#### users
```sql
id SERIAL PRIMARY KEY
username VARCHAR(255) UNIQUE
password VARCHAR(255)
name VARCHAR(255)
email VARCHAR(255) UNIQUE
role VARCHAR(50) DEFAULT 'user'  -- user, coach, admin
created_at TIMESTAMP
```

#### courses
```sql
id SERIAL PRIMARY KEY
title VARCHAR(255)
description TEXT
category VARCHAR(255)
instructor VARCHAR(255)
price DECIMAL(10,2)
duration VARCHAR(100)
level VARCHAR(50)
lessons INTEGER
image VARCHAR(255)
color VARCHAR(7)
```

#### coaches
```sql
id SERIAL PRIMARY KEY
name VARCHAR(255)
title VARCHAR(255)
specialty VARCHAR(255)
bio TEXT
experience VARCHAR(255)
image VARCHAR(255)
rating DECIMAL(2,1)
sessions INTEGER
price DECIMAL(10,2)
color VARCHAR(7)
user_id INTEGER REFERENCES users(id)
```

#### bookings
```sql
id SERIAL PRIMARY KEY
coach_id INTEGER REFERENCES coaches(id)
user_id INTEGER REFERENCES users(id)
booking_date DATE
booking_time TIME
status VARCHAR(50)  -- pending, confirmed, completed, cancelled, declined
notes TEXT
decline_reason TEXT
created_at TIMESTAMP
```

### Productivity Tables

#### task_categories
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id)
name VARCHAR(255)
icon VARCHAR(10)
color VARCHAR(7)
```

#### tasks
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id)
title VARCHAR(255)
description TEXT
category_id INTEGER REFERENCES task_categories(id)
priority VARCHAR(50)  -- high, medium, low
estimated_minutes INTEGER
status VARCHAR(50)  -- backlog, planned, in_progress, completed
scheduled_date DATE
scheduled_time TIME
scheduled_end_date DATE
scheduled_end_time TIME
completed_at TIMESTAMP
is_recurring BOOLEAN
recurrence_rule VARCHAR(50)  -- daily, weekly, weekdays, monthly
recurrence_end_date DATE
parent_task_id INTEGER REFERENCES tasks(id)
actual_minutes INTEGER
```

#### time_entries
```sql
id SERIAL PRIMARY KEY
task_id INTEGER REFERENCES tasks(id)
user_id INTEGER REFERENCES users(id)
start_time TIMESTAMP
end_time TIMESTAMP
duration_minutes INTEGER
entry_date DATE
notes TEXT
```

#### daily_reviews
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id)
review_date DATE UNIQUE
productivity_rating INTEGER (1-5)
notes TEXT
total_planned_minutes INTEGER
total_actual_minutes INTEGER
tasks_completed INTEGER
tasks_planned INTEGER
is_finalized BOOLEAN
```

#### weekly_reviews
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id)
week_start DATE UNIQUE
productivity_score DECIMAL(3,1)
total_hours DECIMAL(5,1)
goals_achieved INTEGER
goals_total INTEGER
notes TEXT
is_finalized BOOLEAN
```

#### weekly_goals
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id)
week_start DATE
goal_text VARCHAR(255)
is_achieved BOOLEAN
```

---

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/users` - Register new user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/password` - Change password

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course

### Coaches
- `GET /api/coaches` - Get all coaches
- `GET /api/coaches/:id` - Get single coach
- `GET /api/coaches/:id/availability` - Get working hours
- `GET /api/coaches/:id/slots/:date` - Get available time slots

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/user/:userId` - Get user's bookings
- `GET /api/bookings/coach/:coachId` - Get coach's bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/confirm` - Confirm booking
- `PUT /api/bookings/:id/decline` - Decline booking
- `DELETE /api/bookings/:id` - Cancel booking

### Productivity - Categories
- `GET /api/categories/:userId` - Get user's categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Productivity - Tasks
- `GET /api/tasks/:userId` - Get all tasks
- `GET /api/tasks/:userId/backlog` - Get backlog tasks
- `GET /api/tasks/:userId/date/:date` - Get tasks for date
- `GET /api/tasks/:userId/week/:startDate` - Get weekly tasks
- `POST /api/tasks` - Create task (with recurring support)
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/schedule` - Schedule task
- `PUT /api/tasks/:id/complete` - Complete task
- `PUT /api/tasks/:id/unschedule` - Move to backlog
- `DELETE /api/tasks/:id` - Delete task
- `DELETE /api/tasks/:id/delete-recurring` - Delete recurring (single/following/all)

### Analytics
- `GET /api/analytics/:userId/daily/:date` - Daily analytics
- `GET /api/analytics/:userId/weekly/:weekStart` - Weekly analytics
- `GET /api/analytics/:userId/monthly/:year/:month` - Monthly analytics

### Reviews
- `GET /api/reviews/daily/:userId/:date` - Get daily review
- `POST /api/reviews/daily` - Save daily review
- `GET /api/reviews/weekly/:userId/:weekStart` - Get weekly review
- `POST /api/reviews/weekly` - Save weekly review

### Weekly Goals
- `POST /api/goals/weekly` - Create goal
- `PUT /api/goals/weekly/:id` - Toggle goal achieved
- `DELETE /api/goals/weekly/:id` - Delete goal

---

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page |
| `/courses` | Courses | Course catalog |
| `/courses/:id` | CourseDetail | Single course view |
| `/coaches` | Coaches | Coach directory |
| `/coaches/:id` | CoachDetail | Single coach + booking |
| `/productivity` | Productivity | Task management & analytics |
| `/login` | Login | Authentication |
| `/register` | Register | New user signup |
| `/profile` | Profile | User profile |
| `/coach-dashboard` | CoachDashboard | Coach management panel |
| `/admin` | AdminPanel | Admin dashboard |

---

## State Management

The app uses React's built-in state management:
- `useState` for local component state
- `useEffect` for data fetching
- Props for parent-child communication
- Context for global state (CartContext)

---

## Styling System

CSS Variables defined in `:root`:
```css
--primary: #6366F1 (Indigo)
--teal: #14B8A6
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--background: #F8FAFC
--surface: #FFFFFF
--border: #E2E8F0
--text-dark: #1E293B
--text-muted: #64748B
```

---

## Running the Application

### Development
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## Database Migrations

Migrations are stored in `backend/migrations/` and follow the naming convention:
`XXX_description.js`

Each migration exports:
- `up(pool)` - Apply migration
- `down(pool)` - Rollback migration

To run a migration:
```javascript
node -e "const p=require('./db');const m=require('./migrations/XXX_migration');m.up(p).then(()=>p.end())"
```
