# LiSAN — Complete System Functionality Documentation

## 🎯 System Overview

**LiSAN (ልሳን)** is a comprehensive reading diagnostic and personalized learning platform designed for schools in Ethiopia and beyond. The platform provides AI-powered reading assessment, personalized learning paths, and progress tracking across three user roles: **Students**, **Parents**, and **Admins**.

---

## 👥 User Roles & Authentication

### Authentication System
- **Landing Page** (`/`)
  - Welcome page with platform introduction
  - Sign up / Sign in options
  - Role-based redirection after login
  
- **Sign Up** (`/signup`)
  - Students can create accounts with email/password
  - Requires: first name, last name, email, password, grade selection
  - Auto-login after successful registration
  
- **Sign In** (`/signin`)
  - Email and password authentication
  - Role-based dashboard routing (student/parent/admin)
  - JWT token-based session management

---

## 🎓 STUDENT ROLE - Complete Flow

### 1. Student Dashboard (`/student/dashboard`)
**Purpose**: Central hub showing personalized learning overview

**Features**:
- **Current Reading Readiness Score** (0-100 scale)
  - Visual display with emoji-based status indicators
  - Shows improvement from last assessment
- **Skill Breakdown** (5 core skills with progress bars)
  - 🔊 Phonemic Awareness
  - 🔤 Phonics & Decoding
  - 🎤 Fluency
  - 📚 Vocabulary
  - 🧠 Comprehension
- **Quick Actions**
  - Start/Continue Assessment
  - Continue Learning Plan
  - Practice Skills
  - Check Progress
- **Gamification Stats**
  - XP (Experience Points) earned
  - Badges collected
  - Current streak (days active)
  - Level display
- **This Week's Goal** display
- **Strengths & Weaknesses** summary
- **Recent Activity** feed

**Flow**:
1. Student logs in → Dashboard loads personalized data
2. If no assessment taken → CTA to start assessment
3. If assessment complete → Shows readiness score + learning plan progress
4. Click any quick action → Navigate to respective feature

---

### 2. Reading Assessment (`/student/assessment`)
**Purpose**: Comprehensive reading diagnostic test to determine skill levels

**Features**:
- **Assessment Intro Screen**
  - Explains what the assessment tests
  - Shows estimated time (typically 15-20 minutes)
  - Instructions and tips
  
- **Question Types** (covers all 5 skill areas)
  - Multiple choice questions
  - Passage-based comprehension
  - Phonics/decoding challenges
  - Vocabulary context questions
  - Fluency exercises

- **During Assessment**
  - Progress bar showing completion %
  - Question counter (e.g., "5 of 20")
  - Timer display
  - Cannot skip or go back (ensures accurate results)
  - Auto-save responses
  
- **Assessment Completion**
  - Immediate score calculation
  - Skill-by-skill breakdown
  - Generates personalized learning plan
  - Awards XP based on completion

**Flow**:
1. Student starts assessment
2. Answers 15-25 questions (grade-appropriate)
3. Submits assessment
4. System calculates:
   - Overall reading readiness score
   - Individual skill scores
   - Strengths and weaknesses
5. Generates 6-week personalized learning plan
6. Student receives score report + redirected to learning plan

---

### 3. LiSAN Assessment (`/student/lisan-assessment`)
**Purpose**: Alternative/advanced assessment format with enhanced features

**Features**:
- Similar to standard assessment but with:
  - Voice recording capabilities for fluency testing
  - Read-aloud passages with automatic scoring
  - More detailed diagnostic questions
  - Adaptive difficulty (questions adjust based on responses)

**Flow**:
1. Student selects LiSAN Assessment option
2. Completes enhanced diagnostic questions
3. May include voice recording for fluency
4. Receives detailed score report
5. Updates learning profile

---

### 4. Learning Plan (`/student/plan`)
**Purpose**: Personalized 6-week learning roadmap based on assessment results

**Features**:
- **Plan Overview**
  - Title and duration
  - Overall completion percentage
  - Total activities completed vs. remaining
  
- **Weekly Breakdown** (6 weeks)
  - Week number with title (e.g., "Week 1: Building Phonemic Awareness")
  - Week-specific goals (2-3 bullet points)
  - Progress bar per week
  - Current week highlighted
  - Completed weeks marked with checkmark
  
- **Activities Per Week** (expandable)
  - Each activity shows:
    - Title and description
    - Target skill area with emoji
    - Completion status (checkbox)
    - "Start →" button to practice
  - Can mark activities as complete
  - Activities linked to practice modules
  
- **Progress Tracking**
  - Click checkbox → Activity marked complete
  - Updates overall plan progress
  - Unlocks next activities

**Flow**:
1. Plan generated after assessment
2. Student views 6-week plan
3. Expands current week
4. Clicks "Start →" on an activity
5. Redirected to practice/lesson for that skill
6. Completes activity
7. Returns to plan, marks complete
8. Moves to next activity

---

### 5. Practice Modules (`/student/practice/:skill`)
**Purpose**: Skill-specific practice sessions with immediate feedback

**Skills Available**:
- Phonemic Awareness (`/student/practice/phonemic_awareness`)
- Phonics & Decoding (`/student/practice/phonics_decoding`)
- Fluency (`/student/practice/fluency`)
- Vocabulary (`/student/practice/vocabulary`)
- Comprehension (`/student/practice/comprehension`)

**Features Per Practice Session**:
- **Intro Screen**
  - Skill name and emoji
  - Practice tip specific to the skill
  - Question count preview
  - "Start Practice" button
  
- **Practice Questions**
  - Multiple choice format
  - Difficulty indicator (Easy/Medium/Hard)
  - Progress bar
  - Question counter (e.g., "3 / 10")
  
- **Hint System** (Lemi's Guidance)
  - 💡 "Need a hint?" button
  - 3 progressive hints per question:
    - Hint 1: General thinking prompt
    - Hint 2: Narrowing-down strategy
    - Hint 3: Key insight (near-answer)
  - Hints tracked for scoring
  
- **Answer Feedback**
  - Immediate "Correct ✅" or "Not quite ❌"
  - Explanation provided for all answers
  - Shows correct answer if wrong
  
- **Results Screen**
  - Accuracy percentage (color-coded)
  - Total correct / total questions
  - XP earned (+5 per correct answer)
  - Hints used count
  - Lemi's personalized feedback
  - Options: "Practice Again" or "Back to Plan"

**Flow**:
1. Select skill from learning plan or dashboard
2. Read intro + skill tip
3. Start practice (typically 5-10 questions)
4. For each question:
   - Read question
   - Request hint if needed (optional)
   - Select answer
   - Click "Check Answer"
   - Read explanation
   - Click "Next Question"
5. Complete all questions
6. View results summary
7. Earn XP (gamification)
8. Option to retry or return to plan

---

### 6. Interactive Lessons (`/student/lesson`)
**Purpose**: Guided learning modules teaching specific concepts

**Features**:
- **Multi-Step Learning Flow**
  - Step 1: **Learn** - Concept explanation with examples
  - Step 2: **Example** - Worked example with detailed breakdown
  - Step 3: **Guided Practice** - Try it yourself with hints
  - Step 4: **Independent Practice** - Test knowledge without help
  
- **Example Lesson: "Using Context Clues"**
  - Teaches vocabulary skill
  - Interactive explanations
  - Progressive difficulty
  - Immediate feedback
  
- **Navigation**
  - Progress indicator (e.g., "Step 2 of 4")
  - Can go back to previous steps if needed
  - Step completion tracking
  
- **Completion Rewards**
  - +25 XP upon lesson completion
  - Unlock related practice exercises
  - Adds to progress tracking

**Flow**:
1. Student accesses lesson (from plan or practice)
2. Step 1: Read explanation + tips
3. Step 2: Study worked example
4. Step 3: Attempt guided practice with hints
5. Step 4: Complete independent practice
6. Submit final answer
7. Lesson marked complete
8. Earn XP + redirect to practice or plan

---

### 7. Reading Practice (`/student/reading-practice`)
**Purpose**: Passage-based reading exercises with comprehension questions

**Features**:
- **Passage Selection**
  - Grade-appropriate texts
  - Various genres (fiction, non-fiction, informational)
  - Difficulty levels
  
- **Reading Interface**
  - Full passage display
  - Highlight/annotation tools
  - Dictionary lookup for words
  
- **Comprehension Questions**
  - Multiple questions per passage
  - Tests main idea, details, inference, vocabulary in context
  - Timed or untimed mode
  
- **Fluency Recording**
  - Option to record reading aloud
  - Audio playback for self-assessment
  - Teacher can review recordings

**Flow**:
1. Choose a passage
2. Read passage (optional: record yourself reading)
3. Answer comprehension questions
4. Submit for scoring
5. Review feedback
6. Earn XP based on accuracy

---

### 8. Assignments (`/student/assignments`)
**Purpose**: View and complete teacher-assigned work

**Features**:
- **Assignment List**
  - Upcoming assignments
  - Due dates with countdown
  - Assignment type (lesson, practice, assessment)
  - Status: Not Started / In Progress / Completed
  
- **Assignment Details**
  - Title, description, instructions
  - Assigned by (teacher name)
  - Due date and time
  - Points possible
  - Related resources
  
- **Submission**
  - Complete assignment activities
  - Submit responses
  - View submission confirmation
  - Check grading status

**Flow**:
1. View assignment list
2. Click on an assignment
3. Read instructions
4. Complete required activities (practice/lesson/assessment)
5. Submit assignment
6. See confirmation + points earned
7. Assignment marked complete in list

---

### 9. Classes (`/student/classes`)
**Purpose**: View class enrollment and classmates

**Features**:
- List of enrolled classes
- Class name, grade, teacher
- Classmate roster
- Class-specific assignments
- Class announcements

**Flow**:
1. View enrolled classes
2. Click on a class
3. See class details, roster, assignments
4. Navigate to assignment or other class resources

---

### 10. My Assessments (`/student/my-assessments`)
**Purpose**: View assessment history and retake assessments

**Features**:
- **Assessment History**
  - List of all completed assessments
  - Dates taken
  - Scores received
  - Skill breakdowns
  
- **Score Trends**
  - Graph showing progress over time
  - Improvement indicators
  
- **Retake Option**
  - Can retake assessments after plan completion
  - Compare previous scores

**Flow**:
1. View list of past assessments
2. Click to see detailed results
3. Option to retake assessment
4. New score updates profile

---

### 11. Progress Dashboard (`/student/progress`)
**Purpose**: Comprehensive view of learning progress and achievements

**Features**:
- **Skill Progress Charts**
  - Visual graphs for each of 5 skills
  - Progress over time
  - Current level vs. goal
  
- **Learning Plan Progress**
  - Weekly completion rates
  - Activities completed
  - Time spent learning
  
- **Gamification Stats**
  - Total XP earned
  - Current level
  - Badges unlocked (with descriptions)
  - Streak tracker (days active)
  - Leaderboard position (if enabled)
  
- **Activity Log**
  - Recent practices completed
  - Lessons viewed
  - Assessments taken
  - Time spent per skill

**Flow**:
1. Navigate to Progress page
2. Review skill growth charts
3. Check XP and badges
4. View activity history
5. Identify areas needing more practice

---

### 12. Reading Profile (`/student/profile`)
**Purpose**: Personalized reading strengths, weaknesses, and recommendations

**Features**:
- **Reading Level**
  - Current grade equivalency
  - Readiness score history
  
- **Strengths** (top 3)
  - Skills performing well
  - Percentile ranking
  
- **Areas for Growth** (top 3)
  - Skills needing improvement
  - Recommended activities
  
- **Learning Style Insights**
  - Based on assessment patterns
  - Personalized tips
  
- **Goal Setting**
  - Set personal reading goals
  - Track goal progress

**Flow**:
1. View reading profile
2. Review strengths and weaknesses
3. Set or update goals
4. Follow recommendations

---

### 13. Notifications (`/student/notifications` or `/notifications`)
**Purpose**: Stay updated on assignments, progress, and platform news

**Features**:
- **Notification Types**
  - Assignment reminders
  - Assessment due dates
  - Achievement unlocked (badges, level-ups)
  - Teacher messages
  - Plan milestones reached
  - Streak reminders
  
- **Notification Management**
  - Mark as read/unread
  - Delete notifications
  - Filter by type
  - Notification bell with unread count

**Flow**:
1. Click notification bell (header)
2. View list of notifications
3. Click notification to see details
4. Navigate to related content (e.g., assignment)
5. Mark as read

---

## 👨‍👩‍👧 PARENT ROLE - Complete Flow

### 1. Parent Dashboard (`/parent/dashboard`)
**Purpose**: Monitor all children's reading progress from one central view

**Features**:
- **Child Cards** (one per child)
  - Child's name, grade, profile picture initial
  - Current reading readiness score (large display)
  - Improvement indicator (e.g., "+8 points improvement!")
  - Previous score → Current score
  - Streak count (days active)
  
- **Skill Breakdown Per Child**
  - 5 skill bars with percentages:
    - 🔊 Phonemic Awareness
    - 🔤 Phonics
    - 🎤 Fluency
    - 📚 Vocabulary
    - 🧠 Comprehension
  - Color-coded (green = strong, yellow = needs work, red = weak)
  
- **Strengths & Weaknesses**
  - Top 3 strong areas with checkmarks
  - Top 3 areas needing support with warning icons
  
- **Weekly Goal Display**
  - This week's focus area for the child
  - Goal description
  
- **Gamification Overview**
  - XP earned
  - Badges collected
  - Streak days
  
- **At-Home Support Tips**
  - 4-5 actionable tips for parents:
    - Daily reading practice suggestions
    - Questions to ask children
    - How to celebrate progress
    - Making reading fun

**Special Cases**:
- **No Children Linked**: Shows empty state with message to contact school admin
- **Assessment Not Taken**: Shows message that child hasn't completed first assessment

**Flow**:
1. Parent logs in
2. Dashboard loads all linked children
3. Each child card shows current status
4. Parent scrolls to view all children
5. Can see detailed progress for each child
6. Reads at-home support tips at bottom

---

### 2. Parent Notifications (`/notifications`)
**Purpose**: Receive updates about children's progress and activities

**Features**:
- Weekly progress reports
- Assessment completion alerts
- Milestone achievement notifications (badges, level-ups)
- Reminders if child hasn't logged in
- Important school/teacher announcements

**Flow**:
1. Parent receives notification
2. Views notification center
3. Clicks to see details about child's activity
4. Takes action if needed (e.g., encouragement at home)

---

### 3. Parent Profile Management
**Features**:
- View/edit parent profile information
- Link additional children (via school admin)
- Manage notification preferences
- Account settings

---

## 🛡️ ADMIN ROLE - Complete Flow

### 1. Admin Dashboard (`/admin/dashboard`)
**Purpose**: Comprehensive system management and oversight

**Main Navigation Tabs**:
1. **Overview**
2. **Students**
3. **Teachers**
4. **Parents**
5. **Admins**
6. **Classes**
7. **Content**
8. **Assessments**
9. **Assignments**
10. **Analytics**
11. **Tools**

---

### Tab 1: Overview
**Purpose**: High-level system metrics and quick stats

**Features**:
- **Key Metrics Cards**
  - Total Students enrolled
  - Total Teachers
  - Total Parents
  - Total Classes
  - Active assignments
  - Assessments taken this week
  
- **Recent Activity Feed**
  - Latest student registrations
  - Recent assessment completions
  - New assignments created
  - Teacher activity
  
- **System Health**
  - Database status
  - API uptime
  - Storage usage

**Flow**:
1. Admin logs in → Overview tab
2. Quick scan of metrics
3. Review recent activity
4. Navigate to specific tab for detailed management

---

### Tab 2: Students
**Purpose**: Manage all student accounts and monitor progress

**Features**:
- **Student List**
  - Search by name, email, grade
  - Filter by: grade, class, enrollment status, reading level
  - Sort by: name, join date, last active, reading score
  - Table columns:
    - Name
    - Email
    - Grade
    - Class(es)
    - Reading Score
    - Last Active
    - Status (active/inactive)
    - Actions (Edit, View Profile, Delete)
  
- **Add New Student**
  - Manual entry form:
    - First name, last name
    - Email, password (auto-generate option)
    - Grade selection
    - Class assignment
    - Parent linkage (optional)
  - Bulk import via CSV
  
- **Edit Student**
  - Update personal information
  - Change grade or class
  - Reset password
  - Link/unlink parent account
  - View learning plan
  - View assessment history
  
- **Student Profile View** (read-only)
  - Complete reading profile
  - Assessment scores
  - Learning plan progress
  - Activity history
  - Time spent on platform
  - Assignments completed
  
- **Bulk Actions**
  - Select multiple students
  - Bulk class assignment
  - Bulk password reset
  - Bulk email notifications
  - Export student data

**Flow**:
1. Admin navigates to Students tab
2. Views student list (paginated)
3. Uses search/filter to find specific students
4. Actions:
   - **Add New**: Fill form → Create student → Email credentials
   - **Edit**: Click Edit → Update info → Save
   - **View Profile**: Click name → See detailed student data
   - **Delete**: Click Delete → Confirm → Remove student (soft delete)
   - **Bulk**: Select students → Choose action → Execute

---

### Tab 3: Teachers
**Purpose**: Manage teacher accounts and permissions

**Features**:
- **Teacher List**
  - Name, email, classes assigned, students count
  - Status (active/inactive)
  - Last login
  
- **Add Teacher**
  - First name, last name, email
  - Password (auto-generate)
  - Assign classes
  - Set permissions (full/limited)
  
- **Edit Teacher**
  - Update info
  - Change class assignments
  - Reset password
  - Deactivate account
  
- **Teacher Analytics**
  - Classes managed
  - Students assigned
  - Assignments created
  - Assessment submissions reviewed

**Flow**:
1. Navigate to Teachers tab
2. View teacher list
3. Add new teacher or edit existing
4. Assign classes to teacher
5. Send credentials via email

**Note**: Based on the codebase structure, the teacher role appears to be planned but not fully implemented in the current frontend. Admin can manage teacher accounts, but teacher dashboard features are limited.

---

### Tab 4: Parents
**Purpose**: Manage parent accounts and child linkages

**Features**:
- **Parent List**
  - Name, email, children linked count
  - Last login
  - Status
  
- **Add Parent**
  - First name, last name, email
  - Password setup
  - Link to student(s)
  
- **Link Parent to Child**
  - Search for parent account
  - Search for student account
  - Create linkage
  - Parent receives notification
  
- **Unlink Parent**
  - Remove parent-child connection
  
- **Parent Profile**
  - View children linked
  - Contact information
  - Activity log

**Flow**:
1. Navigate to Parents tab
2. Add new parent account
3. Search for child student account
4. Click "Link to Parent"
5. Select parent → Select student → Confirm
6. Parent can now see child's progress in their dashboard

---

### Tab 5: Admins
**Purpose**: Manage admin accounts and permissions

**Features**:
- **Admin List**
  - All administrator accounts
  - Name, email, role
  - Created date, last login
  
- **Add New Admin**
  - First name, last name, email
  - Password (secure generation)
  - Set permission level:
    - Super Admin (full access)
    - Content Admin (content management only)
    - User Admin (user management only)
  
- **Edit Admin**
  - Update information
  - Change permissions
  - Cannot delete self (safety)
  
- **Activity Log**
  - Track admin actions
  - Who made changes
  - Timestamp and action type

**Flow**:
1. Navigate to Admins tab
2. View current admin accounts
3. Add new admin with specific permissions
4. Save → Admin receives credentials
5. Review admin activity logs

---

### Tab 6: Classes
**Purpose**: Organize students into classes and assign teachers

**Features**:
- **Class List**
  - Class name
  - Grade level
  - Teacher assigned
  - Student count
  - Created date
  
- **Create New Class**
  - Class name (e.g., "Grade 3 - Section A")
  - Grade level selection (Grade 1-12)
  - Teacher assignment (optional)
  - Description/notes
  
- **Edit Class**
  - Update class details
  - Change assigned teacher
  - View/manage student roster
  
- **Student Assignment**
  - View students in class
  - Add students to class
  - Remove students from class
  - Bulk student import to class
  - Search/filter available students
  
- **Class Dashboard** (per class)
  - Student roster with photos/initials
  - Average class reading score
  - Class progress overview
  - Recent assessments
  - Active assignments for this class

**Flow**:
1. Navigate to Classes tab
2. View all classes
3. Create new class:
   - Enter class name (e.g., "Grade 4A")
   - Select grade level
   - Assign teacher
   - Save
4. Assign students:
   - Click "Manage Students" on class
   - Search for students
   - Select students → Click "Add to Class"
   - Students now appear in class roster
5. Monitor class performance from class dashboard

---

### Tab 7: Content (Content Management System)
**Purpose**: Create and manage all learning content (lessons, passages, questions, PDFs)

**Sub-sections**:
1. **Lessons**
2. **Passages**
3. **Questions**
4. **PDF Resources**

---

#### 7.1 Content - Lessons
**Purpose**: Create structured learning modules

**Features**:
- **Lesson Library**
  - List of all lessons
  - Filter by: skill area, grade, difficulty, status
  - Sort by: title, created date, usage count
  
- **Create New Lesson**
  - Lesson title (e.g., "Using Context Clues")
  - Description
  - Skill area selection:
    - Phonemic Awareness
    - Phonics & Decoding
    - Fluency
    - Vocabulary
    - Comprehension
  - Target grade(s): Grade 1-12
  - Difficulty: Easy / Medium / Hard
  - **Lesson Steps** (multi-step builder):
    - Step 1: Explanation (text + examples)
    - Step 2: Worked example
    - Step 3: Guided practice
    - Step 4: Independent practice
  - Rich text editor for content
  - Add images, audio, or video
  - Preview lesson before publishing
  
- **Lesson Status**
  - Draft (not visible to students)
  - Published (visible to students)
  - Archived (hidden but preserved)
  
- **Edit Lesson**
  - Modify any content
  - Update grade/difficulty/skill area
  - Republish or archive
  
- **Lesson Analytics**
  - Number of students completed
  - Average completion time
  - Average score (if includes practice)
  - Student feedback

**Flow**:
1. Navigate to Content → Lessons
2. Click "Create New Lesson"
3. Enter lesson details
4. Build lesson steps:
   - Add explanation text
   - Add example with breakdown
   - Create guided practice with hints
   - Create independent practice questions
5. Preview lesson
6. Set status to "Published"
7. Lesson now appears in student practice modules
8. Monitor usage analytics

---

#### 7.2 Content - Passages
**Purpose**: Create reading passages for comprehension practice

**Features**:
- **Passage Library**
  - All reading passages
  - Filter by: grade, skill area, word count, status
  
- **Create New Passage**
  - Passage title
  - Full text (rich text editor)
  - Word count (auto-calculated)
  - Target grade(s)
  - Skill focus: Usually Comprehension or Fluency
  - Difficulty level
  - Genre: Fiction, Non-fiction, Informational, Narrative, etc.
  - **Associated Questions** (create comprehension questions)
  - Status: Draft / Published / Archived
  
- **Edit Passage**
  - Update text
  - Modify questions
  - Change grade/difficulty
  
- **Passage Analytics**
  - Times read
  - Average comprehension score
  - Average reading time
  - Student difficulty rating

**Flow**:
1. Navigate to Content → Passages
2. Click "Create New Passage"
3. Enter passage title (e.g., "The Water Cycle")
4. Paste or type passage text
5. Select grade and difficulty
6. Create 4-6 comprehension questions:
   - Question text
   - Answer options
   - Correct answer
   - Explanation
7. Preview passage + questions
8. Publish
9. Passage available in Reading Practice module

---

#### 7.3 Content - Questions
**Purpose**: Create standalone practice questions for all skill areas

**Features**:
- **Question Bank**
  - All practice questions
  - Filter by: skill area, grade, difficulty, question type
  - Sort by: created date, usage count
  
- **Create New Question**
  - Question text (supports rich text, images, audio)
  - Question type:
    - Multiple choice (most common)
    - Multiple select
    - Fill in blank
    - Audio response (for fluency)
  - Skill area selection (1 of 5 core skills)
  - Target grade
  - Difficulty: Easy / Medium / Hard
  - **Answer Options** (for multiple choice)
    - Add 3-5 options
    - Mark correct answer
  - **Explanation** (shown after answer)
    - Why correct answer is right
    - Why wrong answers are wrong
  - **Hint Text** (optional, for guided practice)
  - Tags/keywords (for searchability)
  - Status: Draft / Published / Archived
  
- **Edit Question**
  - Modify question text or options
  - Update difficulty or grade
  - Change explanation/hints
  
- **Question Analytics**
  - Times answered
  - Accuracy rate (% correct)
  - Most common wrong answer
  - Average time to answer
  - Difficulty appropriateness (adjust if needed)
  
- **Bulk Import**
  - Upload questions via CSV/Excel
  - Template provided
  - Batch processing

**Flow**:
1. Navigate to Content → Questions
2. Click "Create New Question"
3. Enter question text
4. Select skill area (e.g., Vocabulary)
5. Choose grade and difficulty
6. Add answer options:
   - Option A: [text]
   - Option B: [text]
   - Option C: [text]
   - Option D: [text]
7. Mark correct answer (e.g., Option C)
8. Write explanation:
   - "Option C is correct because..."
9. Add hint (optional)
10. Preview question
11. Publish
12. Question now available in practice modules
13. Monitor analytics to adjust difficulty if needed

---

#### 7.4 Content - PDF Resources
**Purpose**: Upload and manage PDF learning materials

**Features**:
- **PDF Library**
  - All uploaded PDFs
  - Filter by: grade, skill area, topic
  
- **Upload New PDF**
  - File upload (max 10MB)
  - PDF title
  - Description
  - Target grade(s)
  - Skill area
  - Tags
  - Access level: Public / Class-specific / Teacher-only
  
- **PDF Management**
  - View/download PDFs
  - Edit metadata
  - Delete PDFs
  - Track downloads
  
- **PDF Usage**
  - Link PDFs to lessons
  - Attach to assignments
  - Make available in student resources

**Flow**:
1. Navigate to Content → PDF Resources
2. Click "Upload PDF"
3. Select file from computer
4. Enter title, description, grade, skill area
5. Set access level
6. Upload
7. PDF now available:
   - In student resource library (if public)
   - In specific classes (if class-specific)
   - For attachment to assignments

---

### Tab 8: Assessments
**Purpose**: Manage reading diagnostic assessments

**Features**:
- **Assessment Builder**
  - Create new assessments
  - Select questions from question bank
  - Organize by skill area
  - Set time limits
  - Configure scoring rubric
  
- **Assessment List**
  - All assessments (active, draft, archived)
  - Assessment name, grade, question count
  - Created date
  
- **Assessment Configuration**
  - Name (e.g., "Grade 4 Reading Diagnostic")
  - Target grade
  - Duration (suggested time)
  - **Question Selection**:
    - Manually select questions from question bank
    - Or auto-generate from bank based on criteria
    - Ensure balance across 5 skill areas
  - Passing score threshold
  - Status: Draft / Active / Archived
  
- **View Assessment Submissions** (link to dedicated page)
  - See all student attempts
  - View individual student responses
  - Filter by: student, class, date, score range
  - Export results to CSV
  
- **Assessment Analytics**
  - Total attempts
  - Average score
  - Score distribution (histogram)
  - Skill area performance breakdown
  - Question-level analytics (which questions most missed)
  - Time taken averages

**Flow**:
1. Navigate to Assessments tab
2. Click "Create New Assessment"
3. Enter assessment name and grade
4. Add questions:
   - Search question bank
   - Filter by skill area to ensure coverage
   - Select 15-25 questions (3-5 per skill area)
5. Preview assessment
6. Publish (set to "Active")
7. Students can now take this assessment
8. Monitor submissions as students complete
9. Review analytics to improve assessment

---

### Tab 8b: Assessment Submissions Page (`/admin/assessments/:id/submissions`)
**Purpose**: Detailed view of all student submissions for a specific assessment

**Features**:
- **Submissions List**
  - Student name
  - Submission date/time
  - Score (% correct)
  - Time taken
  - Status: Completed / In Progress
  - Actions: View Details
  
- **View Student Submission**
  - Student information
  - Full question-by-question breakdown:
    - Question text
    - Student's answer
    - Correct answer
    - Correct/Incorrect indicator
  - Skill area performance
  - Overall score and feedback
  
- **Filters**
  - By class
  - By score range
  - By submission date
  - By completion status
  
- **Export**
  - Download all submissions as CSV
  - Include detailed or summary data

**Flow**:
1. From Assessments tab → Click "View Submissions" on an assessment
2. See list of all student attempts
3. Click on a student to see detailed results
4. Review their answers
5. Use data to inform teaching or content adjustments

---

### Tab 9: Assignments
**Purpose**: Create and manage assignments for classes or individual students

**Features**:
- **Assignment List**
  - All assignments (active, draft, completed)
  - Assignment name
  - Assigned to (class/student)
  - Due date
  - Type (lesson, practice, assessment, reading)
  - Completion rate
  
- **Create New Assignment**
  - Assignment title (e.g., "Week 1 Vocabulary Practice")
  - Description/instructions
  - **Assignment Type**:
    - Lesson (select from lesson library)
    - Practice (select skill area + # questions)
    - Assessment (select from assessment list)
    - Reading (select passage)
    - Custom (manual instructions)
  - **Assign To**:
    - Entire class (select class)
    - Individual students (select students)
    - Multiple classes
  - **Due Date & Time**
    - Date picker
    - Optional time (default end of day)
  - **Points Possible** (for grading)
  - **Settings**:
    - Allow late submissions (yes/no)
    - Show answers after submission (yes/no)
    - Maximum attempts (1 or unlimited)
  
- **Edit Assignment**
  - Update details
  - Change due date
  - Add/remove students
  - Republish
  
- **Assignment Tracking**
  - See who has completed
  - Who hasn't started
  - Who is in progress
  - Send reminders to students not started
  
- **Grade Assignments** (if points assigned)
  - View student submissions
  - Auto-scored (for practice/assessments)
  - Manual grading for custom assignments
  - Provide feedback comments
  
- **Assignment Analytics**
  - Completion rate
  - Average score
  - Time spent
  - Common difficulties

**Flow**:
1. Navigate to Assignments tab
2. Click "Create New Assignment"
3. Enter assignment title and description
4. Select assignment type:
   - **Example**: Practice → Select "Vocabulary" skill
5. Assign to:
   - Select "Grade 4A" class
6. Set due date: Next Friday, 11:59 PM
7. Set points: 10 points
8. Settings: Allow late submissions = Yes
9. Preview assignment
10. Click "Assign"
11. Students in Grade 4A see assignment in their Assignments page
12. Monitor progress:
    - 15/20 students completed
    - 3 in progress
    - 2 not started
13. Send reminder to students not started
14. Review submissions and scores
15. Close assignment after due date

---

### Tab 10: Analytics
**Purpose**: System-wide data insights and reporting

**Features**:
- **Dashboard Cards**
  - Total active students
  - Average reading readiness score (system-wide)
  - Assessments completed this week/month
  - Total learning hours (all students)
  
- **Visual Charts**
  - **Student Growth Over Time**
    - Line graph showing average scores by month
  - **Skill Area Performance**
    - Bar chart comparing 5 skill areas (system average)
  - **Grade Level Breakdown**
    - Donut chart showing student distribution by grade
  - **Engagement Metrics**
    - Active students per day (line graph)
    - Average time on platform per student
  
- **Advanced Reports**
  - **Student Performance Report**
    - Filter by: grade, class, date range
    - Shows: score trends, completion rates, time spent
    - Export to CSV/PDF
  - **Class Comparison Report**
    - Compare multiple classes
    - Average scores, engagement, progress
  - **Content Usage Report**
    - Most-used lessons
    - Most-practiced skills
    - Question accuracy rates
  - **Teacher Activity Report**
    - Assignments created
    - Submissions reviewed
    - Student interactions
  
- **Real-Time Stats**
  - Students online now
  - Active sessions
  - Recent activities

**Flow**:
1. Navigate to Analytics tab
2. View high-level dashboard
3. Analyze charts:
   - Notice Vocabulary is lowest-performing skill system-wide
   - Decide to create more vocabulary content
4. Generate specific report:
   - Select "Student Performance Report"
   - Filter by Grade 5
   - Date range: Last 3 months
   - Export to PDF
5. Share report with teachers/stakeholders
6. Use insights to improve curriculum

---

### Tab 11: Tools (Admin Utilities)
**Purpose**: System configuration and administrative utilities

**Sub-sections**:
1. **Payment Plans**
2. **Transactions**
3. **Reports**
4. **Settings**

---

#### 11.1 Tools - Payment Plans
**Purpose**: Manage subscription tiers and pricing (if applicable)

**Features**:
- **Plan List**
  - Free tier
  - Basic tier
  - Premium tier
  - Features per tier
  - Pricing
  
- **Create/Edit Plans**
  - Plan name
  - Price (monthly/yearly)
  - Features included
  - Student/class limits
  
- **Plan Assignment**
  - Assign schools/classes to plans
  - Track subscriptions

**Flow**:
1. Navigate to Tools → Payment Plans
2. View existing plans
3. Edit pricing or features
4. Assign plan to a school/class

---

#### 11.2 Tools - Transactions
**Purpose**: Track payment transactions (if payments enabled)

**Features**:
- Transaction history
- Payment status (pending, completed, failed)
- Invoice generation
- Refund processing

---

#### 11.3 Tools - Reports
**Purpose**: Generate and export system reports

**Features**:
- **Report Types**:
  - User report (all students, teachers, parents)
  - Activity report (engagement metrics)
  - Performance report (assessment scores)
  - Content usage report
  
- **Export Formats**:
  - CSV
  - PDF
  - Excel
  
- **Scheduled Reports**
  - Weekly summary emails
  - Monthly performance reports

**Flow**:
1. Navigate to Tools → Reports
2. Select report type
3. Configure parameters (date range, filters)
4. Generate report
5. Download or email

---

#### 11.4 Tools - Settings
**Purpose**: System-wide configuration

**Features**:
- **General Settings**
  - Platform name
  - Logo upload
  - Primary color/theme
  - Contact email
  
- **Email Configuration**
  - SMTP settings
  - Email templates
  - Notification settings
  
- **Security Settings**
  - Password policies
  - Session timeout
  - Two-factor authentication (optional)
  
- **Feature Flags**
  - Enable/disable gamification
  - Enable/disable parent portal
  - Enable/disable payments
  
- **Localization**
  - Language selection
  - Date/time formats
  
- **API Configuration**
  - Google Gemini API key (for Lemi chatbot)
  - Storage settings (Cloudflare R2)

**Flow**:
1. Navigate to Tools → Settings
2. Update settings as needed
3. Save changes
4. Settings apply system-wide

---

## 🤖 AI Features

### Lemi - Reading Coach Chatbot
**Purpose**: AI-powered personalized reading assistance

**Integration**: Google Gemini API

**Features**:
- Conversational reading support
- Answers student questions about lessons
- Provides hints during practice (3-level hint system)
- Gives personalized feedback on answers
- Explains difficult concepts
- Encourages and motivates students

**Student Interaction Points**:
- During practice sessions (hint system)
- After completing assessments (feedback)
- In learning plan (Lemi's tips on results page)

---

## 🎮 Gamification System

### XP (Experience Points)
- Earned from:
  - Completing practice sessions (+5 XP per correct answer)
  - Finishing lessons (+25 XP)
  - Taking assessments (+10-50 XP based on score)
  - Daily login streak bonus (+10 XP per day)

### Levels
- Students level up after earning certain XP thresholds
- Level 1: 0-100 XP
- Level 2: 100-250 XP
- Level 3: 250-500 XP
- (Continues scaling)

### Badges
- Unlocked for achievements:
  - First assessment completed
  - 10-day streak
  - Perfect score on practice
  - All 5 skills practiced
  - Learning plan completed
  - 100 questions answered
  - (Many more badges)

### Streaks
- Tracks consecutive days active on platform
- Displayed prominently in dashboard
- Streak reminder notifications

### Leaderboards (Optional)
- Class leaderboards
- School-wide leaderboards
- Based on XP earned

---

## 🔔 Notification System

### Notification Types
1. **Assignment Notifications**
   - New assignment posted
   - Assignment due tomorrow
   - Assignment graded
   
2. **Assessment Notifications**
   - Time to retake assessment
   - Assessment results ready
   
3. **Progress Notifications**
   - Badge unlocked
   - Level up achieved
   - Streak milestone (7 days, 30 days)
   - Learning plan week completed
   
4. **Social Notifications**
   - Teacher message
   - Class announcement
   
5. **Parent Notifications**
   - Child completed assessment
   - Child hasn't logged in for 3 days
   - Weekly progress report

### Notification Delivery
- In-app notification bell (header)
- Email notifications (configurable)
- Push notifications (if enabled)

---

## 📊 Data & Storage

### Database (Prisma ORM)
- SQLite (development)
- PostgreSQL (production-ready)

**Main Data Models**:
- Users (students, parents, teachers, admins)
- Assessments & Submissions
- Learning Plans & Activities
- Content (lessons, passages, questions, PDFs)
- Classes & Enrollments
- Assignments
- Progress Tracking
- Notifications
- Gamification (XP, badges, streaks)

### File Storage
- Cloudflare R2 (S3-compatible)
- Stores:
  - PDF resources
  - Audio recordings (fluency practice)
  - Images for content
  - User-uploaded files

---

## 🔐 Security & Privacy

### Authentication
- JWT token-based authentication
- Secure password hashing (bcrypt)
- Role-based access control (RBAC)

### Permissions
- Students: Access own data, complete assignments, view own progress
- Parents: View linked children's data (read-only)
- Teachers: Manage assigned classes, grade assignments, view student progress
- Admins: Full system access

### Data Privacy
- Student data protected
- Parent access requires linkage (admin-approved)
- Secure API endpoints with authentication
- GDPR compliance considerations

---

## 🚀 Technical Stack Summary

**Frontend**:
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)

**Backend**:
- Node.js
- Express.js
- TypeScript
- Prisma ORM

**Database**:
- SQLite (dev)
- PostgreSQL (production)

**AI/ML**:
- Google Gemini API (chatbot, hints, feedback)

**Storage**:
- Cloudflare R2 (files, PDFs, audio)

**Deployment**:
- Frontend: Vercel (static hosting)
- Backend: Render, Railway, or Oracle Cloud
- Database: PostgreSQL (cloud provider)

---

## 🎯 Complete User Journey Examples

### Example 1: New Student - Complete First Week
1. **Sign Up** → Student creates account (email, password, grade)
2. **Login** → Redirected to Student Dashboard
3. **Dashboard** → Sees "Take Your First Assessment" CTA
4. **Assessment** → Completes 20-question reading diagnostic
5. **Results** → Receives reading readiness score (e.g., 68/100)
6. **Learning Plan Generated** → 6-week personalized plan created
7. **Week 1 Activities** → Views Week 1 (e.g., "Building Vocabulary")
8. **Activity 1** → Clicks "Start" on "Context Clues Lesson"
9. **Lesson** → Completes 4-step interactive lesson (+25 XP)
10. **Activity 2** → Clicks "Start" on "Vocabulary Practice"
11. **Practice** → Answers 10 vocabulary questions (80% accuracy, +40 XP)
12. **Mark Complete** → Checks off activities in learning plan
13. **Progress** → Week 1: 2/5 activities complete (40%)
14. **Daily Streak** → Logs in next day (+10 XP streak bonus)
15. **Badge Unlocked** → "First Week Warrior" badge unlocked
16. **Continue** → Completes remaining Week 1 activities over next few days
17. **Week 2** → Plan automatically progresses to Week 2

---

### Example 2: Parent Monitoring Child
1. **Parent Account Created** → Admin creates parent account for "Jane Doe"
2. **Link Child** → Admin links Jane's child "Tommy Doe" (student)
3. **Parent Login** → Jane logs in, redirected to Parent Dashboard
4. **View Child Card** → Sees Tommy's card with:
   - Reading score: 72/100 (+8 improvement!)
   - Strengths: Fluency, Phonemic Awareness
   - Weaknesses: Comprehension, Vocabulary
   - Streak: 5 days
5. **Review Skill Bars** → Notices Comprehension at 55% (needs work)
6. **Read Weekly Goal** → "This week: Focus on reading comprehension strategies"
7. **At-Home Tips** → Jane reads tip: "Ask Tommy to summarize what he reads in his own words"
8. **Apply at Home** → Jane practices with Tommy daily
9. **Next Week** → Sees Tommy's Comprehension improved to 62%
10. **Notification** → Receives email: "Tommy unlocked a new badge!"

---

### Example 3: Admin Creating Content and Assignment
1. **Admin Login** → Navigate to Content tab
2. **Create Question** → Click "Create New Question"
   - Question: "What does 'ecstatic' mean?"
   - Skill Area: Vocabulary
   - Grade: 4
   - Difficulty: Medium
   - Options: A) Sad, B) Extremely happy, C) Tired, D) Angry
   - Correct: B
   - Explanation: "Ecstatic means extremely happy or joyful."
3. **Publish Question** → Question saved to question bank
4. **Repeat** → Admin creates 20 more vocabulary questions
5. **Create Assignment** → Navigate to Assignments tab
6. **Assignment Details**:
   - Title: "Vocabulary Building Week 2"
   - Type: Practice → Vocabulary skill
   - Assign To: Grade 4A class (20 students)
   - Due: Friday, 5:00 PM
   - Points: 10
7. **Assign** → Assignment published
8. **Students Notified** → All Grade 4A students see assignment in their dashboard
9. **Monitor Progress** → Admin checks: 18/20 students completed by Thursday
10. **Reminder** → Admin sends reminder to 2 students who haven't started
11. **Due Date** → Friday 5 PM passes, assignment closes
12. **Review Results** → Admin views:
    - Class average: 85%
    - Most missed question: Question #14 (only 40% correct)
13. **Improve Content** → Admin notes to revise Question #14 (too difficult)

---

## 📈 Platform Growth & Scalability

### Current Capabilities
- Supports hundreds of students
- Multiple classes and grades
- Extensive content library
- Real-time progress tracking

### Future Enhancements (Potential)
- Mobile app (iOS/Android)
- Offline mode for assessments
- Advanced AI tutoring (voice interaction)
- Multilingual support (Amharic, Oromo, etc.)
- Video lessons
- Collaborative learning features (student groups)
- Adaptive learning (real-time difficulty adjustment)
- Integration with school information systems (SIS)
- API for third-party integrations

---

## 🎓 Educational Impact

### For Students
- Personalized learning paths
- Immediate feedback
- Engaging gamification
- Self-paced learning
- Skill mastery tracking

### For Parents
- Transparent progress monitoring
- Actionable at-home support tips
- Timely notifications
- Involvement in child's learning

### For Admins/Teachers
- Data-driven insights
- Efficient content management
- Easy assignment creation
- Comprehensive analytics
- Scalable classroom management

---

## 📝 Summary of All Pages

### Authentication Pages
1. `/` - Landing Page
2. `/signup` - Sign Up
3. `/signin` - Sign In

### Student Pages
4. `/student/dashboard` - Student Dashboard
5. `/student/assessment` - Reading Assessment
6. `/student/lisan-assessment` - LiSAN Assessment (advanced)
7. `/student/plan` - Learning Plan (6-week personalized)
8. `/student/practice/:skill` - Practice Module (skill-specific)
9. `/student/lesson` - Interactive Lesson
10. `/student/reading-practice` - Passage Reading Practice
11. `/student/assignments` - Assignments List
12. `/student/classes` - Classes Enrolled
13. `/student/my-assessments` - Assessment History
14. `/student/progress` - Progress Dashboard (detailed)
15. `/student/profile` - Reading Profile
16. `/notifications` - Notifications

### Parent Pages
17. `/parent/dashboard` - Parent Dashboard (children overview)
18. `/notifications` - Notifications (parent view)

### Admin Pages
19. `/admin/dashboard` - Admin Dashboard (main)
    - Tab: Overview
    - Tab: Students
    - Tab: Teachers
    - Tab: Parents
    - Tab: Admins
    - Tab: Classes
    - Tab: Content (Lessons, Passages, Questions, PDFs)
    - Tab: Assessments
    - Tab: Assignments
    - Tab: Analytics
    - Tab: Tools (Payment Plans, Transactions, Reports, Settings)
20. `/admin/assessments/:id/submissions` - Assessment Submissions Detail

### Additional Pages
21. `/payment` - Payment Page (subscription management)

---

## 🔄 Key User Flows Recap

### Student Flow
Sign Up → Assessment → Learning Plan → Practice Skills → Complete Activities → Track Progress → Retake Assessment → Improve

### Parent Flow
Login → View Children Cards → Monitor Progress → Read Tips → Receive Notifications → Support at Home

### Admin Flow
Login → Manage Users (Students/Teachers/Parents) → Create Classes → Build Content (Questions/Lessons/Passages) → Create Assignments → Monitor Analytics → Generate Reports

---

This is the complete functionality documentation for the LiSAN platform covering all three roles with detailed flows for every page and feature.
