# OXY Platform - Complete Architecture Documentation

## 1. System Overview

OXY is a full-stack web application for online learning and productivity management.

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Neon Cloud) |
| Styling | Custom CSS with Variables |
| Routing | React Router DOM v6 |
| State | React Hooks + Context API |

### Project Structure

```
OXY/
├── backend/
│   ├── server.js              # Express server & API endpoints
│   ├── db.js                  # Database connection pool
│   ├── migrations/            # Database migration scripts
│   │   ├── 001_initial.js
│   │   ├── 020_add_course_columns.js
│   │   ├── 021_add_coach_experience.js
│   │   ├── 022_create_productivity_tables.js
│   │   ├── 023_add_task_end_time.js
│   │   ├── 024_add_time_tracking_and_recurring.js
│   │   └── 025_create_reviews_tables.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app with routing
│   │   ├── main.jsx           # Entry point
│   │   ├── index.css          # Global styles
│   │   ├── api.js             # API configuration
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── Coaches.jsx
│   │   │   ├── CoachDetail.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── CoachDashboard.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   └── Productivity.jsx
│   │   └── components/        # Reusable components
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       └── CartContext.jsx
│   ├── public/
│   └── package.json
│
└── docs/                      # Documentation
    ├── ARCHITECTURE.md
    ├── PRODUCTIVITY_FEATURES.md
    └── PRODUCTIVITY_TOOLS.md
```

---

## 2. Database Schema

### 2.1 Core Tables

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'user',  -- user, coach, admin
  remember_token TEXT,
  token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### courses
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(255),
  instructor VARCHAR(255),
  price DECIMAL(10,2),
  duration VARCHAR(100),
  level VARCHAR(50),
  lessons INTEGER,
  image VARCHAR(255),
  color VARCHAR(7)
);
```

#### coaches
```sql
CREATE TABLE coaches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  specialty VARCHAR(255),
  bio TEXT,
  experience VARCHAR(255),
  image VARCHAR(255),
  rating DECIMAL(2,1) DEFAULT 5.0,
  sessions INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  color VARCHAR(7),
  user_id INTEGER REFERENCES users(id)
);
```

#### coach_availability
```sql
CREATE TABLE coach_availability (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20),  -- Monday, Tuesday, etc.
  start_time TIME,
  end_time TIME
);
```

#### blocked_times
```sql
CREATE TABLE blocked_times (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(255)
);
```

#### bookings
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',  -- pending, confirmed, completed, cancelled, declined
  notes TEXT,
  decline_reason TEXT,
  feedback TEXT,
  rating INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Productivity Tables

#### task_categories
```sql
CREATE TABLE task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### tasks
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL,
  priority VARCHAR(50) DEFAULT 'medium',  -- high, medium, low
  estimated_minutes INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'backlog',   -- backlog, planned, in_progress, completed
  scheduled_date DATE,
  scheduled_time TIME,
  scheduled_end_date DATE,
  scheduled_end_time TIME,
  completed_at TIMESTAMP,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(50),  -- daily, weekly, weekdays, monthly
  recurrence_end_date DATE,
  parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  actual_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### time_entries
```sql
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  entry_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### daily_reviews
```sql
CREATE TABLE daily_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 10),
  notes TEXT,
  total_planned_minutes INTEGER DEFAULT 0,
  total_actual_minutes INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_planned INTEGER DEFAULT 0,
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, review_date)
);
```

#### weekly_reviews
```sql
CREATE TABLE weekly_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  productivity_score DECIMAL(3,1),
  total_hours DECIMAL(5,1) DEFAULT 0,
  goals_achieved INTEGER DEFAULT 0,
  goals_total INTEGER DEFAULT 0,
  notes TEXT,
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);
```

#### weekly_goals
```sql
CREATE TABLE weekly_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  goal_text VARCHAR(255) NOT NULL,
  is_achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. API Reference

### 3.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User login (returns user object) |
| POST | `/api/users` | Register new user |

### 3.2 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get single user |
| PUT | `/api/users/:id` | Update user profile |
| PUT | `/api/users/:id/password` | Change password |

### 3.3 Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all courses |
| GET | `/api/courses/:id` | Get single course |
| POST | `/api/courses` | Create course (admin) |
| PUT | `/api/courses/:id` | Update course (admin) |
| DELETE | `/api/courses/:id` | Delete course (admin) |

### 3.4 Coaches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coaches` | Get all coaches |
| GET | `/api/coaches/:id` | Get single coach |
| GET | `/api/coaches/:id/availability` | Get coach's working hours |
| GET | `/api/coaches/:id/slots/:date` | Get available slots for date |
| PUT | `/api/coaches/:id/availability` | Update availability |
| POST | `/api/coaches/:id/block` | Block time slot |
| DELETE | `/api/coaches/:id/block/:blockId` | Unblock time |

### 3.5 Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get all bookings |
| GET | `/api/bookings/user/:userId` | User's bookings |
| GET | `/api/bookings/coach/:coachId` | Coach's bookings |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/:id/confirm` | Confirm booking |
| PUT | `/api/bookings/:id/decline` | Decline with reason |
| PUT | `/api/bookings/:id/feedback` | Add coach feedback |
| DELETE | `/api/bookings/:id` | Cancel booking |

### 3.6 Task Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/:userId` | Get user's categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### 3.7 Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:userId/backlog` | Get backlog tasks |
| GET | `/api/tasks/:userId/date/:date` | Tasks for specific date |
| GET | `/api/tasks/:userId/week/:weekStart` | Tasks for week |
| GET | `/api/tasks/:userId/recurring` | Get recurring templates |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PUT | `/api/tasks/:id/schedule` | Schedule task |
| PUT | `/api/tasks/:id/complete` | Mark complete |
| PUT | `/api/tasks/:id/unschedule` | Move to backlog |
| DELETE | `/api/tasks/:id` | Delete task |
| DELETE | `/api/tasks/:id/delete-recurring` | Delete recurring (options) |

### 3.8 Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/:userId/daily/:date` | Daily statistics |
| GET | `/api/analytics/:userId/weekly/:weekStart` | Weekly statistics |
| GET | `/api/analytics/:userId/monthly/:year/:month` | Monthly statistics |

### 3.9 Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/daily/:userId/:date` | Get daily review |
| POST | `/api/reviews/daily` | Save daily review |
| GET | `/api/reviews/weekly/:userId/:weekStart` | Get weekly review |
| POST | `/api/reviews/weekly` | Save weekly review |

### 3.10 Weekly Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/goals/weekly` | Create goal |
| PUT | `/api/goals/weekly/:id` | Toggle achieved |
| DELETE | `/api/goals/weekly/:id` | Delete goal |

---

## 4. Frontend Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | Home | Public | Landing page |
| `/courses` | Courses | Public | Course catalog |
| `/courses/:id` | CourseDetail | Public | Course details |
| `/coaches` | Coaches | Public | Coach directory |
| `/coaches/:id` | CoachDetail | Public | Coach profile + booking |
| `/login` | Login | Public | Sign in |
| `/register` | Register | Public | Create account |
| `/profile` | Profile | User | User settings |
| `/checkout` | Checkout | User | Purchase flow |
| `/coach-dashboard` | CoachDashboard | Coach | Coach management |
| `/admin` | AdminPanel | Admin | System administration |
| `/productivity` | Productivity | User | Task management |

---

## 5. User Roles

### User (Default)
- Browse courses and coaches
- Book coaching sessions
- Manage profile
- Use productivity tools

### Coach
- All user permissions
- Manage availability schedule
- View/confirm/decline bookings
- Provide feedback to users
- Block time slots

### Admin
- All permissions
- Manage courses (CRUD)
- Manage coaches (CRUD)
- Manage users
- View system statistics

---

## 6. State Management

### Global State (Context)
- `CartContext` - Shopping cart for courses

### Local State (useState)
- Component-specific data
- Form inputs
- UI state (modals, tabs, etc.)

### Data Fetching
- `useEffect` for API calls
- `async/await` pattern
- Error handling with try/catch

---

## 7. CSS Architecture

### Variables
```css
:root {
  --primary: #6366F1;
  --teal: #14B8A6;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --background: #F8FAFC;
  --surface: #FFFFFF;
  --border: #E2E8F0;
  --text-dark: #1E293B;
  --text-muted: #64748B;
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 32px;
}
```

### Naming Convention
- BEM-like: `.component-element`
- Utility classes: `.btn`, `.modal`, `.toast`
- State classes: `.active`, `.completed`, `.today`

---

## 8. Running the Application

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)

### Environment Setup
Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:pass@host/db
PORT=5000
```

### Development
```bash
# Terminal 1 - Backend
cd backend
npm install
node server.js

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Default Credentials
- Admin: `admin` / `admin123`
- Coach: Create via registration

---

## 9. Database Migrations

### Running Migrations
```bash
cd backend
node -e "const p=require('./db');const m=require('./migrations/XXX_migration');m.up(p).then(()=>p.end())"
```

### Migration List
| # | File | Description |
|---|------|-------------|
| 001 | initial | Core tables |
| 020 | add_course_columns | instructor, level |
| 021 | add_coach_experience | experience column |
| 022 | create_productivity_tables | tasks, categories |
| 023 | add_task_end_time | end date/time fields |
| 024 | add_time_tracking_and_recurring | recurring tasks |
| 025 | create_reviews_tables | daily/weekly reviews |

---

## 10. Security Considerations

### Current Implementation
- Password hashing (bcrypt)
- Remember me tokens
- Role-based access control
- Input validation

### Recommendations for Production
- Add JWT authentication
- Implement HTTPS
- Rate limiting
- Input sanitization
- CORS configuration
- Environment variables for secrets
