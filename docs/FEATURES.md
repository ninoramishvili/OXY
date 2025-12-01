# OXY - Features & Functionalities

> Self-development and coaching platform

---

## ✅ Completed Features (MVP)

| Feature | Status |
|---------|--------|
| Landing Page with Header/Footer | ✅ Done |
| Login (admin/password) | ✅ Done |
| Courses List Display | ✅ Done |
| Coach Display (1 coach) | ✅ Done |
| Google Calendar-style Booking | ✅ Done |
| Book/Cancel Sessions | ✅ Done |
| Dark Mode Toggle | ✅ Done |
| Database Integration (PostgreSQL) | ✅ Done |
| Initial Guest View (#1) | ✅ Done |
| Registration (#2) | ✅ Done |
| About OXY Page (#3) | ✅ Done |
| Course Details Page (#4) | ✅ Done |
| **Coach Details Page (#5)** | ✅ Done |
| **Filters - Courses (#6)** | ✅ Done |
| **Sorting - Courses (#7)** | ✅ Done |
| **User Profile (#8)** | ✅ Done |
| **Courses Favourites (#9)** | ✅ Done |
| **Courses Cart (#10)** | ✅ Done |
| **Course Ratings & Reviews (#11)** | ✅ Done |

---

## 📋 Planned Features - Sorted by Implementation Order

Features are sorted by: **Dependencies → Complexity → User Value**

---

### 🟢 PHASE 1: Foundation (Low Complexity)
*Build the basic structure that other features depend on*

---

#### 1. Initial View of the Website (Guest View)
**Complexity:** 🟢 Low | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 2-3 hours

**Description:**
When no user is logged in, the website should show a public view with limited functionality. Users can browse courses and coaches but cannot purchase or book without logging in.

**Requirements:**
- Show all courses and coaches publicly
- "Login to Purchase" button instead of "Buy Now"
- "Login to Book" button instead of booking slots
- Promotional messaging encouraging sign-up
- Clear call-to-action to register/login

**Dependencies:** None

---

#### 2. Registration
**Complexity:** 🟢 Low | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 3-4 hours

**Description:**
Allow new users to create an account to access purchasing and booking features.

**Requirements:**
- Registration form: Name, Email, Password, Confirm Password
- Email validation
- Password strength requirements
- Success message and redirect to login
- Database: Add new user to `users` table
- Prevent duplicate email registration

**Dependencies:** None (builds on existing auth)

---

#### 3. About OXY Page
**Complexity:** 🟢 Low | **Priority:** ⭐⭐ Medium | **Estimate:** 1-2 hours

**Description:**
Static page describing the OXY company, mission, and values.

**Requirements:**
- Company story/mission statement
- Team section (optional)
- Contact information
- Company values/philosophy
- Responsive design

**Dependencies:** None

---

#### 4. Course Details Page
**Complexity:** 🟢 Low | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 3-4 hours

**Description:**
Dedicated page for each course showing full details, curriculum, and purchase option.

**Requirements:**
- Course title, description, instructor
- Full curriculum/lesson list
- Duration and difficulty level
- Price and "Buy Now" button
- Related courses section
- Back to courses list link

**Dependencies:** None

---

#### 5. Coach Details Page ✅ COMPLETED
**Complexity:** 🟢 Low | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 3-4 hours

**Description:**
Dedicated page for each coach with full bio, specialties, and booking calendar.

**Requirements:**
- ✅ Full coach biography
- ✅ Specialties and certifications
- ✅ Rating and review summary
- ✅ Embedded booking calendar
- ✅ Session price and duration
- ✅ Contact/inquiry option

**Dependencies:** None

---

#### 6. Filters (Courses & Coaches) ✅ COMPLETED
**Complexity:** 🟢 Low | **Priority:** ⭐⭐ Medium | **Estimate:** 2-3 hours

**Description:**
Allow users to filter courses by category, price range, and coaches by specialty.

**Requirements:**
- ✅ Course filters: Category, Price Range, Duration
- ⏭️ Coach filters: N/A (single coach)
- ✅ Clear filters button
- ✅ Filter count indicator
- ✅ Mobile-friendly filter UI

**Dependencies:** None

---

#### 7. Sorting (Courses & Coaches) ✅ COMPLETED
**Complexity:** 🟢 Low | **Priority:** ⭐⭐ Medium | **Estimate:** 1-2 hours

**Description:**
Allow users to sort lists by various criteria.

**Requirements:**
- ✅ Courses: Sort by Price, Title, Newest
- ⏭️ Coaches: N/A (single coach)
- ✅ Ascending/Descending toggle
- ✅ Remember sort preference (localStorage)

**Dependencies:** None

---

### 🟡 PHASE 2: User Features (Medium Complexity)
*Enhance user experience and engagement*

---

#### 8. User Profile ✅ COMPLETED
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 4-5 hours

**Description:**
Personal profile page where users can view and edit their information.

**Requirements:**
- ✅ View/Edit name, email
- ✅ Change password functionality
- ✅ View purchased courses
- ✅ View booking history
- ✅ Account settings (notifications, preferences)

**Dependencies:** Registration (#2)

---

#### 9. Courses > Favourites ✅ COMPLETED
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 3-4 hours

**Description:**
Allow users to save courses to a favorites list for later.

**Requirements:**
- ✅ Heart icon on course cards
- ✅ "My Favorites" tab in Profile page
- ✅ Add/Remove from favorites
- ✅ Database: `user_favorites` table
- ✅ Persist across sessions

**Dependencies:** Registration (#2), User Profile (#8)

---

#### 10. Courses > Cart ✅ COMPLETED
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 4-5 hours

**Description:**
Shopping cart for purchasing multiple courses at once.

**Requirements:**
- ✅ Add to cart button on courses
- ✅ Cart icon with item count in header
- ✅ Cart page with course list
- ✅ Remove items from cart
- ✅ Cart total calculation
- ✅ Proceed to checkout button
- ✅ Persist cart (localStorage)

**Dependencies:** Course Details Page (#4)

---

#### 11. Course Ratings with Comments ✅ COMPLETED
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 4-5 hours

**Description:**
Users who purchased a course can leave ratings (1-5 stars) and written reviews.

**Requirements:**
- ✅ Star rating input (1-5)
- ✅ Text comment field
- ✅ Display average rating on course details page
- ✅ Reviews list on course details page
- ✅ Only purchasers can review
- ✅ Edit/Delete own review
- ✅ Database: `course_reviews` table

**Dependencies:** Course Details Page (#4), User Profile (#8)

---

#### 12. User View > Coach Session > Comment Window When Booking
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 2-3 hours

**Description:**
When booking a session, users can add a note about what they want to discuss.

**Requirements:**
- Text area in booking confirmation popup
- Optional field (not required)
- Save with booking in database
- Coach can view this note
- Character limit (e.g., 500 chars)

**Dependencies:** Booking system (already done)

---

#### 13. User View > Courses > Progress Bar
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 3-4 hours

**Description:**
Track and display user's progress through purchased courses.

**Requirements:**
- Progress bar on course card (for owned courses)
- Track completed lessons/modules
- "Continue where you left off" button
- Completion percentage
- Database: `user_course_progress` table

**Dependencies:** Course Details Page (#4), Buy Course (#14)

---

#### 14. Buy Course > Payment
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 6-8 hours

**Description:**
Integrate payment processing for course purchases.

**Requirements:**
- Checkout page with order summary
- Payment form (Stripe integration recommended)
- Order confirmation page
- Email receipt
- Add to user's purchased courses
- Handle payment failures gracefully

**Dependencies:** Cart (#10), User Profile (#8)

---

#### 15. User View > Courses > Notes
**Complexity:** 🟡 Medium | **Priority:** ⭐ Low | **Estimate:** 3-4 hours

**Description:**
Users can take personal notes while viewing course content.

**Requirements:**
- Notes panel alongside course content
- Auto-save notes
- Organize notes by lesson
- Export notes option
- Database: `user_notes` table

**Dependencies:** Course Details Page (#4), Progress Bar (#13)

---

#### 16. User View > Coach Session > Session Feedback from User
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 3-4 hours

**Description:**
After a session, users can rate and provide feedback about the coach.

**Requirements:**
- Prompt after session completion
- Star rating (1-5)
- Text feedback field
- Feedback visible to coach
- Contributes to coach's overall rating
- Database: `session_feedback` table

**Dependencies:** Booking system (done), User Profile (#8)

---

#### 17. User View > Receive Comment from Coach
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 2-3 hours

**Description:**
Users receive and can view feedback/comments from coaches after sessions.

**Requirements:**
- Notification indicator
- View coach feedback in profile/bookings
- Feedback history
- Mark as read functionality

**Dependencies:** Coach Feedback feature (#20)

---

### 🟠 PHASE 3: Coach Features (Medium-High Complexity)
*Enable coaches to manage their business*

---

#### 18. Coach View of the Website
**Complexity:** 🟠 Medium-High | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 6-8 hours

**Description:**
Separate dashboard/view for logged-in coaches to manage their coaching business.

**Requirements:**
- Coach login (new user role)
- Coach dashboard with overview stats
- View upcoming sessions
- View earnings summary
- Quick access to manage availability
- Different header/navigation for coaches

**Dependencies:** Registration (#2), role-based authentication

---

#### 19. Coach View > Confirm or Cancel Pending Booking
**Complexity:** 🟠 Medium-High | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 4-5 hours

**Description:**
Coaches can approve or decline booking requests before they're confirmed.

**Requirements:**
- Pending bookings list
- Accept/Decline buttons
- Decline with reason/comment
- User notified of decision
- Auto-decline if not responded in X hours (optional)
- Database: Add `status` field to bookings (pending/confirmed/declined)

**Dependencies:** Coach View (#18)

---

#### 20. Coach View > Coaches Feedback After Session
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 3-4 hours

**Description:**
Coaches can leave notes/feedback for users after completing a session.

**Requirements:**
- Post-session feedback form
- Private notes (coach only)
- Feedback for user (user can see)
- Session summary
- Database: `coach_session_notes` table

**Dependencies:** Coach View (#18)

---

#### 21. Coach View > Manage Booked Sessions > Cancel with Comment
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 3-4 hours

**Description:**
Coaches can cancel confirmed sessions with an explanation for the user.

**Requirements:**
- Cancel button on confirmed sessions
- Required comment/reason field
- User receives notification with reason
- Slot becomes available again
- Cancellation logged for records

**Dependencies:** Coach View (#18)

---

#### 22. Coach View > Receive Notification for Bookings
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 4-5 hours

**Description:**
Coaches get notified when bookings are made or cancelled.

**Requirements:**
- In-app notification bell/indicator
- Notification list/dropdown
- Mark as read
- Email notifications (optional)
- Notification types: New booking, Cancellation, User message

**Dependencies:** Coach View (#18)

---

#### 23. Coach View > Block Time (Show Unavailable)
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 3-4 hours

**Description:**
Coaches can manually block time slots to show as unavailable to users.

**Requirements:**
- Calendar view for coach
- Click to block/unblock slots
- Block with reason (vacation, busy, etc.)
- Bulk block (e.g., entire day)
- Blocked slots show as unavailable to users

**Dependencies:** Coach View (#18)

---

### 🔴 PHASE 4: Admin Features (High Complexity)
*Administrative control and content management*

---

#### 24. Admin Panel Page
**Complexity:** 🔴 High | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 8-10 hours

**Description:**
Comprehensive admin dashboard for managing the entire platform.

**Requirements:**
- Admin login/role
- Dashboard with platform stats (users, courses, bookings, revenue)
- Quick links to all admin functions
- User management section
- Course management section
- Coach management section
- Protected routes (admin only)

**Dependencies:** Role-based authentication

---

#### 25. Admin Panel > Courses > Delete Course
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐ Medium | **Estimate:** 2-3 hours

**Description:**
Admins can remove courses from the platform.

**Requirements:**
- Delete button on course management
- Confirmation dialog
- Soft delete (archive) vs Hard delete option
- Handle users who purchased the course
- Log deletion for audit

**Dependencies:** Admin Panel (#24)

---

#### 26. Admin Panel > Courses > Edit Course Details
**Complexity:** 🟡 Medium | **Priority:** ⭐⭐⭐ Critical | **Estimate:** 4-5 hours

**Description:**
Admins can modify course information.

**Requirements:**
- Edit form with all course fields
- Preview changes before saving
- Update course image
- Change price, description, category
- Publish/Unpublish course
- Version history (optional)

**Dependencies:** Admin Panel (#24)

---

#### 27. Admin Panel > Courses > Add Video and File
**Complexity:** 🔴 High | **Priority:** ⭐⭐ Medium | **Estimate:** 8-10 hours

**Description:**
Upload and manage course content (videos, PDFs, resources).

**Requirements:**
- File upload interface
- Video upload (consider external hosting: YouTube, Vimeo, or cloud storage)
- PDF/document upload
- Organize by lesson/module
- File size limits
- Progress indicator for uploads
- Cloud storage integration (S3, Cloudinary, etc.)

**Dependencies:** Admin Panel (#24), Edit Course (#26)

---

#### 28. Admin Panel > Courses > Manage Tests and Quizzes
**Complexity:** 🔴 High | **Priority:** ⭐ Low | **Estimate:** 10-12 hours

**Description:**
Create and manage quizzes/tests for courses.

**Requirements:**
- Quiz builder interface
- Question types: Multiple choice, True/False, Short answer
- Set correct answers
- Passing score threshold
- Randomize questions option
- Time limit option
- View quiz results/analytics
- Database: `quizzes`, `questions`, `user_quiz_results` tables

**Dependencies:** Admin Panel (#24), Course content system (#27)

---

## 📊 Implementation Summary

| Phase | Features | Est. Time | Complexity |
|-------|----------|-----------|------------|
| **Phase 1** | 7 features | 15-22 hrs | 🟢 Low |
| **Phase 2** | 10 features | 35-48 hrs | 🟡 Medium |
| **Phase 3** | 6 features | 24-33 hrs | 🟠 Medium-High |
| **Phase 4** | 5 features | 32-42 hrs | 🔴 High |
| **TOTAL** | **28 features** | **~106-145 hrs** | - |

---

## 🎯 Recommended Starting Order

1. **Initial View** (#1) - Foundation for guest experience
2. **Registration** (#2) - Enable user creation
3. **Course Details Page** (#4) - Better course presentation
4. **Coach Details Page** (#5) - Better coach presentation
5. **About OXY Page** (#3) - Company information
6. **Filters & Sorting** (#6, #7) - Improve navigation
7. **User Profile** (#8) - Personal dashboard
8. **Cart** (#10) - Shopping experience
9. **Payment** (#14) - Enable purchases
10. **Continue with remaining features...**

---

## 📝 Notes

- Time estimates assume one developer
- Complexity includes frontend, backend, and database work
- Some features can be developed in parallel
- Testing time not included in estimates
- Mobile responsiveness included in each feature

---

*Last updated: 2024-11-30*
