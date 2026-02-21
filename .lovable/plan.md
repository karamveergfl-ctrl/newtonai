
# Phase 1: Teacher's Hub -- Roles, Classes, and Assignments

## Overview

This phase transforms NewtonAI from a student-only tool into a classroom-aware platform by adding:
- Teacher and Student roles (chosen during onboarding)
- Class creation with invite codes for teachers
- A Teacher Dashboard to manage classes and materials
- The ability to turn existing AI tool outputs into class assignments
- Basic class analytics for teachers

---

## 1. Database Schema Changes

### A. Extend the `app_role` enum

Add `teacher` and `student` values to the existing `app_role` enum.

### B. New Tables

**`classes`** -- A classroom created by a teacher

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| teacher_id | uuid (FK profiles) | Owner |
| name | text | e.g. "Physics 101" |
| subject | text | Optional |
| description | text | Optional |
| invite_code | text (unique) | 6-char alphanumeric, auto-generated |
| academic_year | text | e.g. "2025-26" |
| is_active | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Teacher sees own classes; students see classes they're enrolled in.

**`class_enrollments`** -- Maps students to classes

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| class_id | uuid (FK classes) | |
| student_id | uuid (FK profiles) | |
| enrolled_at | timestamptz | |
| status | text | 'active', 'removed' |

RLS: Teachers see enrollments for their classes; students see their own.
Unique constraint on (class_id, student_id).

**`class_materials`** -- Links teacher-uploaded content to a class

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| class_id | uuid (FK classes) | |
| teacher_id | uuid (FK profiles) | |
| title | text | Material name |
| description | text | Optional |
| material_type | text | 'pdf', 'link', 'text', 'video' |
| content_ref | text | File path / URL / text content |
| is_visible | boolean | Default true (students can see) |
| created_at | timestamptz | |

RLS: Teachers CRUD on own class materials; enrolled students SELECT when visible.

**`assignments`** -- Teacher-created assignments from AI tools

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| class_id | uuid (FK classes) | |
| teacher_id | uuid (FK profiles) | |
| title | text | |
| description | text | |
| assignment_type | text | 'quiz', 'flashcards', 'summary', 'worksheet' |
| content | jsonb | Generated quiz/flashcard data |
| due_date | timestamptz | Optional |
| is_published | boolean | Default false |
| max_score | integer | Optional |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Teachers CRUD own assignments; enrolled students SELECT when published.

**`assignment_submissions`** -- Student responses

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| assignment_id | uuid (FK assignments) | |
| student_id | uuid (FK profiles) | |
| answers | jsonb | Student's responses |
| score | integer | Nullable, set by auto-grade or teacher |
| graded_at | timestamptz | |
| submitted_at | timestamptz | Default now() |
| status | text | 'submitted', 'graded', 'returned' |

RLS: Students CRUD own submissions; teachers SELECT/UPDATE for their class assignments.
Unique constraint on (assignment_id, student_id).

**`class_join_codes`** -- Rate-limited join code attempts (security)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | Who attempted |
| code | text | Code tried |
| success | boolean | |
| attempted_at | timestamptz | Default now() |

RLS: No direct access (used by security-definer function only).

### C. Database Functions

- **`join_class_by_code(p_code text)`** -- Security definer. Validates code, checks rate limit, enrolls student, returns class info.
- **`generate_invite_code()`** -- Security definer. Returns a unique 6-char alphanumeric code.
- **`get_class_analytics(p_class_id uuid)`** -- Security definer. Returns enrollment count, submission stats, average scores for teacher.
- **`auto_grade_quiz_submission(p_submission_id uuid)`** -- Security definer. Compares student answers to quiz content, calculates score.

---

## 2. Onboarding Changes

### Add Role Selection as Step 0

Before the current "What's your name?" step, add a new step:

**"How will you use NewtonAI?"**
- Student (default) -- "I want to learn and study"
- Teacher -- "I want to manage a classroom"

This selection:
- Inserts a row into `user_roles` with the chosen role
- Saves a `user_role` field in the onboarding form state
- Adjusts subsequent steps slightly (teachers skip "study goals" step, get "subject you teach" instead)

The role is stored in the `user_roles` table (never on `profiles`), per security requirements.

---

## 3. Role-Aware Routing and Navigation

### Post-Login Routing

After onboarding completes:
- **Students** go to `/dashboard` (existing behavior)
- **Teachers** go to `/teacher` (new teacher dashboard)

### Sidebar Changes (`AppSidebar.tsx`)

Add a role-aware section:
- Fetch user role from `user_roles` table on mount
- If teacher: Show "My Classes" section above Study Tools with links to `/teacher`, `/teacher/classes`
- If student: Show "My Classes" section with enrolled classes list
- Both roles keep access to all existing study tools (tools remain standalone + class-linkable)

### New Routes in `App.tsx`

```
/teacher                    -- Teacher Dashboard (ProtectedRoute + role check)
/teacher/classes/:id        -- Class Detail (materials, assignments, students)
/teacher/assignments/:id    -- Assignment Detail (submissions, grading)
/student/classes            -- Student's enrolled classes
/student/class/:id          -- Student class view (materials, assignments)
/join-class                 -- Join class by invite code
```

All protected by a new `<RoleRoute role="teacher">` or `<RoleRoute role="student">` wrapper.

---

## 4. Teacher Dashboard (`/teacher`)

A clean command center showing:

### Top Stats Row
- Total classes count
- Total students across classes
- Assignments created this month
- Average class score

### Classes Grid
- Cards for each class: name, subject, student count, recent activity
- "Create Class" button opens a dialog
- Click a class to go to `/teacher/classes/:id`

### Quick Actions
- "Create Class" 
- "Create Assignment" (select class, then generate from AI tools)

---

## 5. Class Detail Page (`/teacher/classes/:id`)

Tabs:
- **Students** -- List of enrolled students, remove option, share invite code
- **Materials** -- Upload PDFs, add links, toggle visibility
- **Assignments** -- List assignments, create new, view submissions
- **Analytics** -- Basic charts: submission rate, average scores, engagement

### Invite Code Flow
- Teacher sees a shareable invite code (e.g., `ABC123`)
- "Copy Link" button copies `https://newtonai.lovable.app/join-class?code=ABC123`
- Teacher can regenerate code if needed

---

## 6. Student Class Experience

### Join Class Page (`/join-class`)
- Simple input: "Enter your class code"
- Calls `join_class_by_code` RPC
- On success, redirects to `/student/class/:id`

### Student Class View (`/student/class/:id`)
- **Materials** tab: View teacher-shared PDFs, links, notes
- **Assignments** tab: See published assignments, submit answers, view grades
- Clicking a material opens it in the existing PDF viewer / study tools

### Assignment Taking
- Quiz assignments render using existing `QuizMode` component
- Flashcard assignments render using existing `FlashcardDeck` component
- On completion, answers are saved as a submission via RPC
- Auto-grading for MCQ quizzes happens server-side

---

## 7. Assignment Creation Flow (Teacher)

From the class detail page:
1. Teacher clicks "Create Assignment"
2. Selects type: Quiz, Flashcards, Summary, or Worksheet
3. Uploads source material (PDF, text, or selects from class materials)
4. AI generates content using existing edge functions (generate-quiz, generate-flashcards, etc.)
5. Teacher reviews, edits questions if needed
6. Sets due date and publishes to class

This reuses all existing AI generation pipelines -- no new edge functions needed for content generation.

---

## 8. Security Model

### RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| classes | Owner or enrolled student | Teacher role only | Owner only | Owner only |
| class_enrollments | Owner teacher or own student record | Via `join_class_by_code` RPC only | Teacher (remove student) | Teacher only |
| class_materials | Teacher owner or enrolled student (if visible) | Teacher owner | Teacher owner | Teacher owner |
| assignments | Teacher owner or enrolled student (if published) | Teacher owner | Teacher owner | Teacher owner |
| assignment_submissions | Own submission or teacher of that class | Student (own) | Teacher (grading) | No deletes |

### Role Checking

All teacher-only pages use a `<RoleRoute role="teacher">` component that:
1. Checks `user_roles` table for the current user
2. Redirects to dashboard if role doesn't match
3. Uses the existing `has_role` security-definer function pattern

---

## 9. Files to Create

| File | Purpose |
|------|---------|
| `src/pages/teacher/TeacherDashboard.tsx` | Main teacher home |
| `src/pages/teacher/ClassDetail.tsx` | Class management page |
| `src/pages/teacher/AssignmentDetail.tsx` | View submissions & grade |
| `src/pages/student/StudentClasses.tsx` | Student's enrolled classes |
| `src/pages/student/StudentClassView.tsx` | View class materials & assignments |
| `src/pages/JoinClass.tsx` | Enter invite code to join |
| `src/components/RoleRoute.tsx` | Role-based route guard |
| `src/components/teacher/CreateClassDialog.tsx` | Create class form |
| `src/components/teacher/ClassCard.tsx` | Class card for dashboard grid |
| `src/components/teacher/InviteCodeCard.tsx` | Display & copy invite code |
| `src/components/teacher/CreateAssignmentFlow.tsx` | Multi-step assignment creator |
| `src/components/teacher/SubmissionsList.tsx` | View student submissions |
| `src/components/teacher/ClassAnalyticsCards.tsx` | Basic analytics widgets |
| `src/components/student/AssignmentCard.tsx` | Assignment card in student view |
| `src/components/student/TakeAssignment.tsx` | Wrapper for quiz/flashcard taking |
| `src/hooks/useUserRole.ts` | Hook to fetch current user's role |
| `src/hooks/useClasses.ts` | Hook for class CRUD operations |
| `src/hooks/useAssignments.ts` | Hook for assignment operations |

## 10. Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add new routes for teacher/student pages |
| `src/pages/Onboarding.tsx` | Add role selection step (Step 0) |
| `src/components/AppSidebar.tsx` | Add role-aware "My Classes" section |
| `src/components/OnboardingGate.tsx` | Route teachers to `/teacher` instead of `/dashboard` |

## 11. Database Migration

One migration with:
- ALTER TYPE app_role ADD VALUE 'teacher'; ADD VALUE 'student';
- CREATE TABLE classes, class_enrollments, class_materials, assignments, assignment_submissions, class_join_codes
- CREATE FUNCTION generate_invite_code, join_class_by_code, get_class_analytics, auto_grade_quiz_submission
- All RLS policies listed above
- Triggers for updated_at columns

---

## 12. What This Does NOT Include (Phases 2-3)

- Live classroom sessions / real-time transcription
- Study rooms / collaborative features
- Confusion heatmap / doubt pulse
- Voice-to-task automation
- Personalized learning engine
- Institution admin / SSO
- Enterprise licensing flows

These are intentionally deferred to keep Phase 1 focused and shippable.
