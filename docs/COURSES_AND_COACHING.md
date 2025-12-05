# OXY Platform - Courses & Coaching Documentation

## 1. Courses Module

### 1.1 Overview
The courses module allows users to browse and purchase online courses.

### 1.2 Course Properties
| Property | Type | Description |
|----------|------|-------------|
| title | string | Course name |
| description | text | Full course description |
| category | string | Course category |
| instructor | string | Instructor name |
| price | decimal | Course price |
| duration | string | Course length (e.g., "4 weeks") |
| level | string | Beginner/Intermediate/Advanced |
| lessons | integer | Number of lessons |
| image | string | Course thumbnail URL |
| color | string | Theme color (hex) |

### 1.3 Features
- Course catalog with grid/list view
- Category filtering
- Course detail pages
- Shopping cart (Context API)
- Checkout process
- Purchase history (in profile)

### 1.4 Routes
| Route | Description |
|-------|-------------|
| `/courses` | Course catalog |
| `/courses/:id` | Course detail page |
| `/checkout` | Purchase flow |

### 1.5 API Endpoints
```
GET    /api/courses         - List all courses
GET    /api/courses/:id     - Get course details
POST   /api/courses         - Create course (admin)
PUT    /api/courses/:id     - Update course (admin)
DELETE /api/courses/:id     - Delete course (admin)
```

---

## 2. Coaching Module

### 2.1 Overview
Connects users with coaches for 1-on-1 sessions.

### 2.2 Coach Properties
| Property | Type | Description |
|----------|------|-------------|
| name | string | Coach's full name |
| title | string | Professional title |
| specialty | string | Area of expertise |
| bio | text | Coach biography |
| experience | string | Years of experience |
| image | string | Profile photo URL |
| rating | decimal | Average rating (1-5) |
| sessions | integer | Sessions completed |
| price | decimal | Hourly rate |
| color | string | Theme color |
| user_id | FK | Linked user account |

### 2.3 Booking System

#### Booking Properties
| Property | Type | Description |
|----------|------|-------------|
| coach_id | FK | Coach reference |
| user_id | FK | User reference |
| booking_date | date | Session date |
| booking_time | time | Session start time |
| status | enum | pending/confirmed/completed/cancelled/declined |
| notes | text | User notes |
| decline_reason | text | Reason for decline |
| feedback | text | Coach feedback |
| rating | integer | Session rating |

#### Booking Flow
```
User books → Pending → Coach confirms → Confirmed → Session happens → Completed
                    ↓
              Coach declines → Declined (with reason)
```

### 2.4 Availability System

#### Working Hours
- Set per day of week (Monday-Sunday)
- Start time and end time
- Multiple time blocks per day

#### Time Blocking
- Block specific dates/times
- Reason field (optional)
- Prevents bookings during blocked times

#### Slot Generation
Available slots are calculated by:
1. Check working hours for the day
2. Remove already booked slots
3. Remove blocked times
4. Return 1-hour slots

### 2.5 Features

#### For Users
- Browse coach profiles
- View availability calendar
- Book available time slots
- Add notes to bookings
- Cancel bookings
- View booking history
- Receive coach feedback

#### For Coaches (Dashboard)
- View all bookings
- Confirm/decline pending bookings
- Provide feedback after sessions
- Manage availability schedule
- Block time slots
- View session statistics

### 2.6 Routes
| Route | Description |
|-------|-------------|
| `/coaches` | Coach directory |
| `/coaches/:id` | Coach profile + booking |
| `/coach-dashboard` | Coach management panel |

### 2.7 API Endpoints

#### Coaches
```
GET    /api/coaches                    - List all coaches
GET    /api/coaches/:id                - Get coach details
GET    /api/coaches/:id/availability   - Get working hours
GET    /api/coaches/:id/slots/:date    - Get available slots
PUT    /api/coaches/:id/availability   - Update availability
POST   /api/coaches/:id/block          - Block time
DELETE /api/coaches/:id/block/:id      - Unblock time
```

#### Bookings
```
GET    /api/bookings                   - All bookings
GET    /api/bookings/user/:userId      - User's bookings
GET    /api/bookings/coach/:coachId    - Coach's bookings
POST   /api/bookings                   - Create booking
PUT    /api/bookings/:id/confirm       - Confirm booking
PUT    /api/bookings/:id/decline       - Decline with reason
PUT    /api/bookings/:id/complete      - Mark completed
PUT    /api/bookings/:id/feedback      - Add feedback
DELETE /api/bookings/:id               - Cancel booking
```

---

## 3. Coach Dashboard

### 3.1 Tabs

#### Overview Tab
- Quick statistics
- Upcoming sessions
- Recent bookings

#### Bookings Tab
- Pending bookings (require action)
- Upcoming sessions (confirmed)
- Completed sessions
- Cancelled/declined history
- Actions: Confirm, Decline, Feedback, Cancel

#### Availability Tab
- Calendar view (monthly)
- Set working hours per day
- View/manage blocked times
- Add time blocks

### 3.2 Actions

#### Confirm Booking
- Changes status to "confirmed"
- Notifies user

#### Decline Booking
- Opens modal for decline reason
- Changes status to "declined"
- Notifies user with reason

#### Provide Feedback
- Opens feedback modal
- Text area for comments
- Rating option
- Updates booking record

#### Block Time
- Select date and time range
- Optional reason
- Creates blocked_time record

---

## 4. Admin Panel

### 4.1 Access
- Role: admin
- Route: `/admin`

### 4.2 Features

#### Course Management
- View all courses
- Add new courses
- Edit existing courses
- Delete courses

#### Coach Management
- View all coaches
- Add new coaches
- Edit coach profiles
- Delete coaches
- View their bookings

#### User Management
- View all users
- Edit user roles
- View user activity
- Delete users

#### Statistics Dashboard
- Total users/courses/coaches
- Booking statistics
- Revenue metrics

### 4.3 API Endpoints (Admin)
```
# Courses
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id

# Users
GET    /api/users
PUT    /api/users/:id
DELETE /api/users/:id

# Coaches
POST   /api/coaches
PUT    /api/coaches/:id
DELETE /api/coaches/:id
```

---

## 5. Database Schema

### courses
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
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

### coaches
```sql
CREATE TABLE coaches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  title VARCHAR(255),
  specialty VARCHAR(255),
  bio TEXT,
  experience VARCHAR(255),
  image VARCHAR(255),
  rating DECIMAL(2,1),
  sessions INTEGER,
  price DECIMAL(10,2),
  color VARCHAR(7),
  user_id INTEGER REFERENCES users(id)
);
```

### coach_availability
```sql
CREATE TABLE coach_availability (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id),
  day_of_week VARCHAR(20),
  start_time TIME,
  end_time TIME
);
```

### blocked_times
```sql
CREATE TABLE blocked_times (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id),
  blocked_date DATE,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255)
);
```

### bookings
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id),
  user_id INTEGER REFERENCES users(id),
  booking_date DATE,
  booking_time TIME,
  status VARCHAR(50),
  notes TEXT,
  decline_reason TEXT,
  feedback TEXT,
  rating INTEGER,
  created_at TIMESTAMP
);
```

---

## 6. UI Components

### Course Card
- Thumbnail image
- Title and category
- Price and duration
- Add to cart button

### Coach Card
- Profile photo
- Name and specialty
- Rating and sessions
- View profile button

### Booking Calendar
- Monthly grid view
- Available dates highlighted
- Click to select date
- Time slots below calendar

### Session Card
- User/coach info
- Date and time
- Status badge
- Action buttons

---

## 7. Status Badges

| Status | Color | Description |
|--------|-------|-------------|
| pending | yellow | Awaiting coach confirmation |
| confirmed | blue | Session scheduled |
| completed | green | Session finished |
| cancelled | gray | Cancelled by user |
| declined | red | Declined by coach |


