

# AI-Driven Academic Insights

## Overview
Add a dedicated edge function `generate-academic-insights` that produces contextual AI analysis at three levels (student, teacher, institution). Integrate insight panels into existing pages -- no new database tables needed since insights are generated on-demand from existing data.

---

## Phase 1: Edge Function

**File:** `supabase/functions/generate-academic-insights/index.ts`

A single edge function with a `type` parameter (`student`, `teacher`, `institution`) that:
- Accepts a data payload (pre-aggregated on the client or via existing RPCs)
- Sends it to Lovable AI (gemini-3-flash-preview) with role-specific system prompts
- Returns structured JSON insights via tool calling (not free-text)

**Student prompt** produces:
- `weak_topics`: array of {topic, reason, suggested_action}
- `engagement_analysis`: {level, trend, recommendation}
- `risk_assessment`: {risk_level, factors, mitigation}
- `study_plan`: array of {day, focus_area, activity, duration_mins}

**Teacher prompt** produces:
- `reteach_topics`: array of {topic, reason, affected_student_pct}
- `students_needing_help`: array of {student_id_short, signals, priority}
- `assignment_improvements`: array of {suggestion, rationale}

**Institution prompt** produces:
- `department_performance`: array of {department, rating, insight}
- `exam_difficulty_trends`: array of {course, finding}
- `attendance_correlations`: array of {finding, recommendation}
- `overall_recommendations`: array of strings

All prompts explicitly instruct the model to never include PII -- only anonymized IDs and aggregate metrics.

---

## Phase 2: Student Learning Insights Component

**File:** `src/components/student/StudentLearningInsights.tsx`

- Gathers data from `get_student_class_performance` RPC + `student_marks` table
- Sends aggregated summary to `generate-academic-insights` with `type: "student"`
- Renders:
  - **Weak Topics** cards with suggested actions and links to study tools
  - **Engagement Trend** indicator (rising/falling/stable) with recommendation
  - **Risk Assessment** badge (low/medium/high) with contributing factors
  - **Personalized Study Plan** -- 5-day plan in a timeline/list format
- "Generate Insights" button (on-demand, not automatic)

**Integration:** Add as a section within `StudentPerformanceTab.tsx` or as a new sub-tab in `StudentClassView.tsx` under "Performance"

---

## Phase 3: Teacher Insights Component

**File:** `src/components/teacher/TeacherAIInsights.tsx`

- Gathers data from `student_marks` + `attendance_records` + `assignment_submissions` for the selected class
- Sends to `generate-academic-insights` with `type: "teacher"`
- Renders:
  - **Topics to Reteach** -- cards with topic name, reason, and % of students affected
  - **Students Needing Help** -- priority-sorted list with signal indicators (low scores, low attendance, declining trend)
  - **Assignment Improvements** -- actionable suggestions for better assessments
- Replaces/enhances the simple "Generate" button in existing `GradeAnalyticsPanel`

**Integration:** Add as a new card section at the bottom of the existing `GradeAnalyticsPanel.tsx`, or as a standalone panel in the Marks tab of `ClassDetail.tsx`

---

## Phase 4: Institutional Insights Component

**File:** `src/components/institution/InstitutionAIInsights.tsx`

- Uses data from `get_institution_analytics` + `get_faculty_stats` RPCs (already fetched on the analytics page)
- Sends aggregate data to `generate-academic-insights` with `type: "institution"`
- Renders:
  - **Department Performance** -- color-coded cards per department with ratings
  - **Exam Difficulty Trends** -- findings about which courses have unusually hard/easy exams
  - **Attendance Correlations** -- insights linking attendance patterns to performance
  - **Recommendations** -- actionable items for institutional improvement
- "Generate Insights" button (on-demand)

**Integration:** Add as a new "AI Insights" tab in `InstitutionAnalyticsPage.tsx`

---

## Privacy & Security

- The edge function uses JWT auth validation (same pattern as `newton-chat`)
- Rate limited: reuse existing `check_rate_limit` RPC (e.g., 10 req/hr per user)
- Data sent to AI is pre-aggregated -- no raw student names or emails; only anonymized IDs (first 8 chars of UUID) and numeric scores
- Student insights only use their own data (RLS-enforced at the query level)
- Teacher insights only use data from their own classes
- Institution insights only use data from their own institution

---

## Files Summary

### New Files (4)
1. `supabase/functions/generate-academic-insights/index.ts` -- Multi-mode AI insight generator
2. `src/components/student/StudentLearningInsights.tsx` -- Student-facing insight panel
3. `src/components/teacher/TeacherAIInsights.tsx` -- Teacher-facing insight panel
4. `src/components/institution/InstitutionAIInsights.tsx` -- Admin-facing insight panel

### Modified Files (4)
1. `src/components/student/StudentPerformanceTab.tsx` -- Add StudentLearningInsights section
2. `src/components/teacher/GradeAnalyticsPanel.tsx` -- Replace simple AI button with TeacherAIInsights
3. `src/pages/institution/InstitutionAnalyticsPage.tsx` -- Add "AI Insights" tab
4. `supabase/config.toml` -- Register new edge function with `verify_jwt = false`

### No Database Changes
All insights are computed on-demand from existing tables (`student_marks`, `attendance_records`, `assignment_submissions`, `live_sessions`, `concept_check_responses`). No new tables or RPCs required.

