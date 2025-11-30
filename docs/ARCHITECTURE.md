# OXY - Technical Architecture

> Self-development and coaching platform

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite | User interface |
| Routing | React Router | Page navigation |
| Styling | CSS (custom) | Pastel theme styling |
| Backend | Node.js + Express | API server |
| Database | PostgreSQL (Neon) | Cloud database |
| Auth | Database-backed | Login system |

## Database Schema

### Tables

```sql
users
├── id (PK)
├── username
├── password
├── name
└── created_at

courses
├── id (PK)
├── title
├── description
├── category
├── price
├── duration
├── lessons
├── image
├── color
└── created_at

coaches
├── id (PK)
├── name
├── title
├── specialty
├── bio
├── image
├── rating
├── sessions
├── price
├── color
└── created_at

purchases
├── id (PK)
├── user_id (FK → users)
├── course_id (FK → courses)
└── purchased_at

bookings
├── id (PK)
├── user_id (FK → users)
├── coach_id (FK → coaches)
├── booking_date
├── booking_time
├── status
└── created_at
```

## Project Structure

```
OXY/
├── backend/
│   ├── server.js           # Express server with API routes
│   ├── db.js               # Database connection (Neon PostgreSQL)
│   ├── initDb.js           # Quick database setup (legacy)
│   ├── migrations/         # Database migrations
│   │   ├── migrate.js      # Migration runner
│   │   ├── 001_create_tables.js
│   │   ├── 002_seed_users.js
│   │   ├── 003_seed_courses.js
│   │   └── 004_seed_coaches.js
│   ├── data/               # (legacy) Hardcoded data backup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api.js          # API service (all endpoints)
│   │   ├── components/     # Reusable components
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Courses.jsx
│   │   │   └── Coaches.jsx
│   │   ├── App.jsx         # Main app with routing
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   └── package.json
│
└── docs/                   # Documentation
```

## Design System

### Color Palette (Two-Color Theme)
Vibrant, readable design with two main colors:

| Color | Hex | Usage |
|-------|-----|-------|
| Coral | #E07B6B | Primary actions, accents, warmth |
| Teal | #3BA3A3 | Secondary actions, success states |
| Background | #F8F8F8 | Page background |
| Border | #D0D0D0 | Card outlines, dividers |
| Text | #333333 | Body text (high contrast) |
| Text Dark | #1A1A1A | Headings |

### Design Principles
- **Visible**: Strong color contrast for readability
- **Clean**: Outline cards with subtle shadows
- **Modern**: Updated icons for courses and coaches
- **Oxytocin-inspired**: Warm coral tones evoke connection

### Typography
- Headings: Bold weight (600-700)
- Body: Clean, readable (#333333 for contrast)

### UI Components
- Cards: 2px outline borders with shadow
- Buttons: Solid coral/teal colors
- Badges: Solid color backgrounds with white text
- Hover effects: Border and shadow changes

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/login | User authentication |
| POST | /api/users | Register new user |
| GET | /api/users | Get all users |
| GET | /api/users/:id | Get user by ID |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/courses | Get all courses |
| GET | /api/courses/:id | Get course by ID |
| POST | /api/courses | Create new course |

### Coaches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/coaches | Get all coaches |
| GET | /api/coaches/:id | Get coach by ID |
| POST | /api/coaches | Create new coach |

### Purchases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/purchases | Get all purchases |
| GET | /api/purchases/user/:userId | Get user's purchases |
| POST | /api/purchases | Purchase a course |

### Coach Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/coaches/:id/availability | Get coach's working hours |
| GET | /api/coaches/:id/slots/:date | Get available time slots for date |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bookings | Get all bookings |
| GET | /api/bookings/user/:userId | Get user's bookings |
| GET | /api/bookings/coach/:coachId | Get coach's bookings |
| POST | /api/bookings | Book a session |
| DELETE | /api/bookings/:id | Cancel a booking |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats | Get platform statistics |

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST to /api/login
3. Backend queries PostgreSQL database
4. Returns user data on success
5. Frontend stores login state in React state

## Database Connection

- **Provider**: Neon (Serverless PostgreSQL)
- **Region**: EU Central (Frankfurt)
- **Connection**: Pooled connection with SSL

## Migration Commands

```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:down

# Reset database (drop all & re-run)
npm run migrate:reset

# Check migration status
npm run migrate:status
```

## Migration Files

| File | Description |
|------|-------------|
| `001_create_tables.js` | Creates all database tables |
| `002_seed_users.js` | Seeds admin user |
| `003_seed_courses.js` | Seeds 6 courses |
| `004_seed_coaches.js` | Seeds 4 coaches |
| `005_add_coach_availability.js` | Adds coach availability table |
| `006_update_icons.js` | Updates to modern icons & colors |

Each migration has `up()` and `down()` functions for running and rolling back.

---

*Last updated: November 30, 2024*
