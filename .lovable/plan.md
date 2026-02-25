

# Institutional Admin Dashboard -- Implementation Plan

## Overview
Build a comprehensive admin dashboard for institutional roles (Principal, Dean, Exam Admin, Department Head) with 4 subsystems: analytics, result processing, faculty monitoring, and compliance. All pages are scoped to the user's institution and protected by existing `InstitutionRoute` and `is_institution_admin` RLS.

---

## Phase 1: Database Migration

Single migration: `supabase/migrations/[timestamp]_institution_admin_dashboard.sql`

### 1.1 `institution_audit_logs` Table
Tracks all sensitive actions within the institution for compliance.
```text
institution_audit_logs
  id               uuid PK DEFAULT gen_random_uuid()
  institution_id   uuid NOT NULL
  user_id          uuid NOT NULL
  action           text NOT NULL         -- e.g. 'marks_updated', 'grade_calculated', 'member_added'
  entity_type      text NOT NULL         -- e.g. 'student_marks', 'attendance_records'
  entity_id        uuid
  details          jsonb DEFAULT '{}'
  created_at       timestamptz DEFAULT now()
```
RLS: SELECT only for institution admins via `is_institution_admin`. No direct INSERT/UPDATE/DELETE (populated via triggers/RPCs).

### 1.2 New RPCs (SECURITY DEFINER)

**`get_institution_analytics(p_institution_id uuid)`**
Returns aggregated data:
- Student performance trends (avg marks per course, per semester)
- Attendance rates per class/course
- Active sessions count, total live sessions run
- Course pass/fail rates

**`get_faculty_stats(p_institution_id uuid)`**
Returns per-teacher metrics:
- Number of classes, sessions run, assignments created
- Average student score across their classes
- Last active date

**`calculate_grades_batch(p_class_id uuid, p_grading_scale jsonb)`**
Auto-calculates grades for all students in a class based on total_marks and a configurable grading scale (e.g. `[{"min":90,"grade":"A+"},{"min":80,"grade":"A"},...]`). Updates `student_marks.grade` column.

**`generate_rank_list(p_class_id uuid, p_course_id uuid)`**
Returns students ordered by total_marks descending with rank numbers.

**`log_institution_audit(p_institution_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_details jsonb)`**
Inserts an audit log entry. Validates caller is institution admin.

---

## Phase 2: Institution Analytics Page

**File:** `src/pages/institution/InstitutionAnalyticsPage.tsx`

Tabbed interface with 4 sections:
1. **Overview**: KPI cards (total students, avg score, attendance rate, active courses) + trend line chart (recharts)
2. **Performance**: Per-course average scores bar chart, pass/fail rates, semester comparison
3. **Attendance**: Attendance rate per class shown as horizontal bar chart, highlighting low-attendance classes
4. **Faculty Engagement**: Table of teachers with session count, assignment count, avg student score

Uses `get_institution_analytics` and `get_faculty_stats` RPCs.

---

## Phase 3: Result Processing Engine

**File:** `src/pages/institution/ResultProcessingPage.tsx`

Features:
- **Grade Calculator**: Select class + course, choose grading scale (preset or custom), click "Calculate Grades" to call `calculate_grades_batch` RPC
- **Rank List Generator**: Select class + course, generate and display ranked student list via `generate_rank_list` RPC
- **Report Card PDF**: Uses existing `jsPDF` library to generate per-student report cards with all marks components, grade, and rank. Batch export option.
- **Export**: CSV export of marks/grades using existing `ExportButton` component

**File:** `src/components/institution/GradeCalculator.tsx` -- Grading scale editor + batch calculate UI
**File:** `src/components/institution/ReportCardGenerator.tsx` -- PDF generation for individual/batch report cards
**File:** `src/components/institution/RankListView.tsx` -- Sortable rank list display

---

## Phase 4: Faculty Monitoring Page

**File:** `src/pages/institution/FacultyMonitoringPage.tsx`

Displays:
- Table of all teachers in the institution with metrics (classes, sessions, assignments, avg score, last active)
- Expandable row showing per-class breakdown
- Color-coded engagement indicators (green/amber/red based on session frequency)
- Data sourced from `get_faculty_stats` RPC

---

## Phase 5: Compliance & Audit Page

**File:** `src/pages/institution/CompliancePage.tsx`

Features:
- **Audit Log Viewer**: Paginated table of `institution_audit_logs` with filters (date range, action type, user)
- **Data Export**: Full institution data export (students, marks, attendance, courses) as CSV
- **Role Overview**: Shows all institution members with their roles, providing visibility into access control

---

## Phase 6: Route & Navigation Updates

**File:** `src/App.tsx` -- Add 4 new routes:
- `/institution/analytics`
- `/institution/results`
- `/institution/faculty`
- `/institution/compliance`

All wrapped in `InstitutionRoute`.

**File:** `src/components/AppSidebar.tsx` -- Add 4 new sidebar items under Institution group:
- Analytics (BarChart3 icon)
- Results (Award icon)
- Faculty (Users icon)
- Compliance (Shield icon)

---

## Files Summary

### New Files (7)
1. `supabase/migrations/[timestamp]_institution_admin_dashboard.sql`
2. `src/pages/institution/InstitutionAnalyticsPage.tsx`
3. `src/pages/institution/ResultProcessingPage.tsx`
4. `src/pages/institution/FacultyMonitoringPage.tsx`
5. `src/pages/institution/CompliancePage.tsx`
6. `src/components/institution/GradeCalculator.tsx`
7. `src/components/institution/ReportCardGenerator.tsx`
8. `src/components/institution/RankListView.tsx`

### Modified Files (2)
1. `src/App.tsx` -- Add 4 institution routes
2. `src/components/AppSidebar.tsx` -- Add 4 sidebar links

### Security
- All new tables use RLS with `is_institution_admin` checks
- Audit logs are insert-only via RPC (no direct client writes)
- All RPCs validate institution membership before returning data
- No cross-institution data leakage possible

