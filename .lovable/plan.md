

# Enhanced Teacher Classroom Analytics & Student Progress Tracking

## Overview
Upgrade the teacher's Class Detail page with comprehensive student-level progress tracking, assignment result breakdowns, and participation/attendance analytics derived from quiz and activity submissions.

---

## 1. New Database RPC: `get_student_progress`

Create a new `SECURITY DEFINER` RPC that returns per-student analytics for a class:
- For each enrolled student: name, total submissions, average score, last submission date, assignments completed vs total
- Only accessible by the class teacher

## 2. New Database RPC: `get_assignment_results`

Create a new `SECURITY DEFINER` RPC that returns per-assignment breakdowns:
- For each assignment: title, type, total submissions, average score, score distribution (buckets: 0-40, 40-60, 60-80, 80-100), list of who submitted and who hasn't

## 3. Redesigned Analytics Tab (`ClassDetail.tsx`)

Replace the current simple analytics tab with a sub-tabbed interface:

### Sub-tab: Overview (existing, enhanced)
- Keep current summary stats cards (Students, Assignments, Submissions, Avg Score)
- Enhanced charts: add a submission trend over time (by assignment creation date), completion rate donut

### Sub-tab: Student Progress (NEW)
- Table view with columns: Student Name, Submissions, Avg Score (progress bar), Last Active, Attendance Rate
- Each row is expandable to show individual assignment scores
- Color-coded performance: green (80%+), amber (50-80%), red (below 50%)
- Sort by name, score, or activity

### Sub-tab: Assignment Results (NEW)
- Card per assignment showing: title, type badge, submission count/total, avg score
- Click to expand: score distribution bar chart + list of students with their scores
- "Not submitted" list highlighted in red
- Filter by assignment type (quiz, flashcard, etc.)

### Sub-tab: Attendance (NEW)
- Grid view: rows = students, columns = assignments
- Each cell shows a colored dot: green (submitted), amber (submitted late), red (not submitted), gray (not yet due)
- Summary row at bottom: participation percentage per assignment
- Summary column on right: each student's overall attendance rate

## 4. New Components

| File | Purpose |
|------|---------|
| `src/components/teacher/StudentProgressTable.tsx` | Sortable table of per-student metrics with expandable rows |
| `src/components/teacher/AssignmentResultsPanel.tsx` | Per-assignment score breakdowns with distribution charts |
| `src/components/teacher/AttendanceGrid.tsx` | Student x Assignment attendance heatmap grid |
| `src/components/teacher/StudentScoreBar.tsx` | Inline colored progress bar for scores |

## 5. Enhanced `ClassAnalyticsCharts.tsx`

- Add a stacked bar chart showing score distribution across all assignments
- Add a completion rate pie/donut chart
- Add submission timeline (line chart by assignment due date)

## 6. Files to Modify

| File | Changes |
|------|---------|
| `src/pages/teacher/ClassDetail.tsx` | Redesign Analytics tab with sub-tabs; fetch student progress and assignment results data |
| `src/components/teacher/ClassAnalyticsCharts.tsx` | Add score distribution and completion charts |
| `src/hooks/useAssignments.ts` | Add `fetchAllSubmissions` method to get all submissions for a class |

## 7. Database Changes (Migrations)

### New RPC: `get_student_progress(p_class_id uuid)`
Returns a JSON array of objects, each containing:
- `student_id`, `full_name`, `total_assignments`, `submitted_count`, `average_score`, `last_submission_at`
- Uses joins across `class_enrollments`, `assignments`, `assignment_submissions`, and `profiles`
- Secured: only the class teacher can call it

### New RPC: `get_assignment_results(p_class_id uuid)`
Returns a JSON array of objects, each containing:
- `assignment_id`, `title`, `assignment_type`, `is_published`, `due_date`, `total_enrolled`, `submission_count`, `average_score`
- Plus a `submissions` array with `student_id`, `full_name`, `score`, `status`, `submitted_at`
- Secured: only the class teacher can call it

### New RPC: `get_attendance_grid(p_class_id uuid)`
Returns the full student-by-assignment matrix:
- `students` array: `student_id`, `full_name`
- `assignments` array: `assignment_id`, `title`, `due_date`
- `attendance` array: `student_id`, `assignment_id`, `status` (submitted/late/missing/not_due)
- Secured: only the class teacher can call it

---

## Design Consistency
- Uses existing `recharts` for all visualizations
- Tables use shadcn `Table` components with sortable headers
- Sub-tabs use pill-style `TabsTrigger` matching existing patterns
- Color coding: green (`text-green-500`), amber (`text-amber-500`), red (`text-destructive`)
- All cards use `border-border/50` and `interactive-card` patterns
- Framer Motion staggered entry animations on rows
- Mobile: tables scroll horizontally; attendance grid uses a compact dot view

