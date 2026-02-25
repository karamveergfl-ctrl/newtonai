
# Institutional Academic Records System

## Overview
Add a complete attendance + marks management system with three new database tables, teacher CRUD UI (including CSV bulk upload), a student marks dashboard, and an admin aggregate view. All integrated into existing institutional hierarchy.

---

## Phase 1: Database Migration

Single migration file: `supabase/migrations/[timestamp]_academic_records.sql`

### 1.1 `attendance_records` Table
```text
attendance_records
  id                  uuid PK DEFAULT gen_random_uuid()
  session_id          uuid NOT NULL FK -> live_sessions(id) ON DELETE CASCADE
  student_id          uuid NOT NULL
  class_id            uuid NOT NULL FK -> classes(id) ON DELETE CASCADE
  status              text NOT NULL DEFAULT 'present'  -- present / absent / late
  auto_marked         boolean NOT NULL DEFAULT false
  participation_score integer DEFAULT 0
  marked_at           timestamptz DEFAULT now()
  UNIQUE(session_id, student_id)
```
RLS:
- SELECT: student can view own (`student_id = auth.uid()`); teacher can view for their class (`is_class_teacher`)
- INSERT: teacher of the class OR via RPC (auto-mark)
- UPDATE: teacher of the class only
- DELETE: teacher of the class only

### 1.2 `student_marks` Table
```text
student_marks
  id                  uuid PK DEFAULT gen_random_uuid()
  student_id          uuid NOT NULL
  course_id           uuid NOT NULL FK -> courses(id) ON DELETE CASCADE
  class_id            uuid NOT NULL FK -> classes(id) ON DELETE CASCADE
  assignment_marks    numeric DEFAULT 0
  attendance_marks    numeric DEFAULT 0
  midsem1             numeric
  midsem2             numeric
  endsem              numeric
  practical_marks     numeric
  project_marks       numeric
  total_marks         numeric GENERATED ALWAYS AS (
    COALESCE(assignment_marks,0) + COALESCE(attendance_marks,0) +
    COALESCE(midsem1,0) + COALESCE(midsem2,0) + COALESCE(endsem,0) +
    COALESCE(practical_marks,0) + COALESCE(project_marks,0)
  ) STORED
  grade               text
  academic_year       text
  semester            text
  updated_at          timestamptz DEFAULT now()
  created_at          timestamptz DEFAULT now()
  UNIQUE(student_id, course_id, class_id)
```
RLS:
- SELECT: `student_id = auth.uid()` OR teacher of the class OR institution admin
- INSERT/UPDATE: teacher of the class OR institution admin
- DELETE: institution admin only

### 1.3 Auto-Attendance RPC
`mark_auto_attendance(p_session_id uuid, p_student_id uuid, p_class_id uuid)` -- SECURITY DEFINER function that inserts/updates attendance when a student submits a quiz or interacts with a live session activity. Called from existing quiz submission and pulse response flows.

### 1.4 Aggregate Marks RPC
`get_institution_marks_summary(p_institution_id uuid)` -- SECURITY DEFINER function returning aggregated marks across all courses/classes for the institution. Used by admin dashboard.

### 1.5 Bulk Upsert RPC
`bulk_upsert_student_marks(p_marks jsonb)` -- SECURITY DEFINER function that accepts a JSON array of marks records and upserts them. Validates teacher ownership of the class before inserting.

---

## Phase 2: Teacher Features

### 2.1 Attendance Management Component
**File:** `src/components/teacher/AttendanceManager.tsx`
- Shows list of students for a session with present/absent/late toggle buttons
- Auto-marked entries shown with a badge; teacher can override
- Attendance summary stats (% present, % late)
- Integrated into ClassDetail page as a new tab or sub-section

### 2.2 Marks Entry UI
**File:** `src/components/teacher/MarksEntryPanel.tsx`
- Table-based form for entering marks per student per course
- Columns: student name, assignment, attendance, midsem1, midsem2, endsem, practical, project, total (auto-calculated), grade (dropdown)
- Inline editing with save button
- Uses `student_marks` table via upsert

### 2.3 CSV Bulk Upload
**File:** `src/components/teacher/BulkMarksUpload.tsx`
- File dropzone (using existing `react-dropzone`)
- CSV parsing on client side (simple split, no new dependency needed)
- Preview table before submission
- Calls `bulk_upsert_student_marks` RPC
- Template download button with expected column headers

### 2.4 AI Grade Analytics
**File:** `src/components/teacher/GradeAnalyticsPanel.tsx`
- Performance distribution chart (using existing `recharts`)
- Pass/fail ratio, average scores per exam component
- AI-powered insights: calls existing `newton-chat` edge function with marks summary to generate text analysis of class performance trends
- Weak student identification

### 2.5 Integration into ClassDetail
Modify `src/pages/teacher/ClassDetail.tsx`:
- Add "Marks" and "Attendance" tabs to the existing tab system
- Marks tab renders `MarksEntryPanel` + `BulkMarksUpload` + `GradeAnalyticsPanel`
- Attendance tab renders `AttendanceManager` alongside the existing `AttendanceGrid`

---

## Phase 3: Student Dashboard

### 3.1 Student Marks View
**File:** `src/components/student/StudentMarksTab.tsx`
- Fetches marks from `student_marks` where `student_id = auth.uid()`
- Card-based layout showing each exam component with score
- Overall grade display with color coding
- Performance trend chart (if multiple semesters exist)
- Weak topics section (reuses existing weak_questions pattern from `StudentPerformanceTab`)

### 3.2 Integration
Modify `src/pages/student/StudentClassView.tsx`:
- Add a "Marks" tab that renders `StudentMarksTab`
- Strict RLS ensures students only see their own data

---

## Phase 4: Admin/Institution View

### 4.1 Academic Records Page
**File:** `src/pages/institution/AcademicRecordsPage.tsx`
- Aggregate marks view across all classes/courses in the institution
- Filter by department, course, semester
- Summary statistics: average scores, pass rates, grade distribution
- Sortable table of all students with their marks
- Export to CSV button

### 4.2 Route & Navigation
- Add route: `/institution/academic-records` in `App.tsx` (guarded by `InstitutionRoute`)
- Add sidebar item in `AppSidebar.tsx` under Institution group: "Academic Records" with `ClipboardList` icon

---

## Files Summary

### New Files (7)
1. `supabase/migrations/[timestamp]_academic_records.sql`
2. `src/components/teacher/AttendanceManager.tsx`
3. `src/components/teacher/MarksEntryPanel.tsx`
4. `src/components/teacher/BulkMarksUpload.tsx`
5. `src/components/teacher/GradeAnalyticsPanel.tsx`
6. `src/components/student/StudentMarksTab.tsx`
7. `src/pages/institution/AcademicRecordsPage.tsx`

### Modified Files (4)
1. `src/pages/teacher/ClassDetail.tsx` -- Add Marks and Attendance tabs
2. `src/pages/student/StudentClassView.tsx` -- Add Marks tab
3. `src/App.tsx` -- Add `/institution/academic-records` route
4. `src/components/AppSidebar.tsx` -- Add Academic Records sidebar link
5. `src/integrations/supabase/types.ts` -- Auto-updated by migration

### Zero Breaking Changes
- All new tables are independent additions
- `attendance_records` extends live session data without modifying `live_sessions`
- `student_marks` links to existing `courses` and `classes` tables via nullable-safe FKs
- Existing attendance grid and student performance tab remain unchanged
- Auto-attendance is additive (RPC-based, no trigger on reserved tables)
