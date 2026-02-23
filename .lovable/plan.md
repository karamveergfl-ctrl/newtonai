

# Enhanced Student & Teacher Class Dashboards

## Problems Identified

1. **Assignments not clickable**: Student assignment cards have no click handler -- students can only take live quizzes but cannot open or attempt regular assignments
2. **No student performance data**: No attendance %, scores, rank, or weak topic analysis
3. **No study tool recommendations**: No suggestions to use flashcards, summaries, etc.
4. **Teacher dashboard lacks interactivity features**: No announcements, no material management from class view

---

## Student Dashboard Changes

### 1. Fix: Make Assignments Clickable (StudentClassView.tsx)

- Add a click handler on each assignment card
- When a quiz assignment is clicked, expand it inline to show the quiz-taking UI (reuse `LiveQuizTaker` pattern but for regular assignments)
- Track which assignments the student has already submitted by fetching their submissions on load
- Show proper status badges: "Not Started", "Submitted", "Graded" with score
- If already submitted and graded, show a review mode with correct/incorrect answers highlighted

### 2. New Tab: "My Performance" (StudentClassView.tsx)

Add a third tab alongside Materials and Assignments:

- **Stats Row** (4 cards):
  - Attendance %: (submitted assignments / total published assignments) x 100
  - Average Score: mean of all graded submissions
  - Class Rank: position among all students (requires new RPC)
  - Assignments Completed: count

- **Weak Topics Section**: Analyze graded quiz submissions to find questions the student got wrong, extract the topic/question text, and display as "Topics to Focus On" cards

- **Study Tool Suggestions**: Based on weak topics, show action buttons:
  - "Generate Flashcards" (links to /tools/flashcards)
  - "Summarize this topic" (links to /tools/summarizer)
  - "Practice with Quiz" (links to /tools/quiz)

### 3. New Database RPC: `get_student_class_performance`

A SECURITY DEFINER function that:
- Takes `p_class_id` as input
- Uses `auth.uid()` for the student
- Returns: attendance %, average score, rank among classmates, per-assignment scores, weak questions list

```sql
CREATE OR REPLACE FUNCTION public.get_student_class_performance(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
```

Returns:
```json
{
  "success": true,
  "attendance_pct": 85.7,
  "average_score": 72.3,
  "rank": 3,
  "total_students": 15,
  "assignments_completed": 6,
  "total_assignments": 7,
  "scores": [
    { "assignment_id": "...", "title": "...", "score": 8, "total": 10, "percentage": 80 }
  ],
  "weak_questions": [
    { "question": "What is photosynthesis?", "assignment_title": "Biology Quiz" }
  ]
}
```

---

## Teacher Dashboard Changes

### 4. Add "Materials" Tab to ClassDetail (ClassDetail.tsx)

Currently the teacher class detail has 3 tabs (Students, Assignments, Analytics). Add a 4th tab: **Materials**

- List existing class materials with edit/delete options
- Add "Upload Material" button that inserts into `class_materials` table
- Support PDF link, video link, or external URL types

### 5. Add "Announcements" Feature

**New table: `class_announcements`**
- `id`, `class_id`, `teacher_id`, `title`, `message`, `is_pinned`, `created_at`
- RLS: Teachers can manage their class announcements; enrolled students can view

**Teacher side**: Add announcement input at top of class detail page
**Student side**: Show announcements banner at top of StudentClassView

### 6. Quick Actions on Teacher Assignments Tab

- Add "Delete" action to assignment cards
- Add "View Results" button linking to the analytics results sub-tab
- Show submission count badge on each assignment card

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/student/StudentQuizTaker.tsx` | Reusable quiz-taking component for regular (non-live) assignments |
| `src/components/student/StudentPerformanceTab.tsx` | Performance tab with stats, weak topics, study suggestions |
| `src/components/teacher/ClassAnnouncementInput.tsx` | Teacher announcement composer |
| `src/components/student/AnnouncementsBanner.tsx` | Student-facing announcements display |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/student/StudentClassView.tsx` | Add Performance tab, make assignments clickable with quiz-taking, fetch student submissions, show announcements |
| `src/pages/teacher/ClassDetail.tsx` | Add Materials tab, announcement input, assignment action buttons, submission counts |
| `src/hooks/useAssignments.ts` | Add `fetchMySubmissions()` method to get current student's submissions for a class |

### Database Migration
1. Create `class_announcements` table with RLS policies
2. Create `get_student_class_performance` RPC function
3. Enable realtime on `class_announcements` for live updates

### No External API Keys Needed
All features use existing database queries and RPCs -- no AI model calls required.

