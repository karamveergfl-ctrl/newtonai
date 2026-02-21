

# Live Class Session with Quick Quiz, Attendance & Topic Analysis

## Overview
Build a complete "Live Class Session" workflow where a teacher conducts a physical classroom session, uploads teaching material (PDF/PPT/YouTube), generates a timed quiz from the taught content, students complete it in-class within a time limit, and the system automatically provides:
1. Attendance marking (submitted = present)
2. Weak topic analysis (which topics need re-teaching)
3. Weak student identification (who needs attention)

---

## New Database Table: `live_sessions`

Tracks each live classroom session with its teaching material and quiz results.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| class_id | uuid | FK to classes |
| teacher_id | uuid | FK to auth.users |
| title | text | Session title (e.g., "Chapter 5 - Thermodynamics") |
| content_source | text | 'pdf', 'youtube', 'text' |
| content_text | text | Extracted text from the teaching material |
| content_title | text | File name or video title |
| assignment_id | uuid | FK to assignments (the generated quiz) |
| time_limit_minutes | integer | Quiz time limit (default 5) |
| status | text | 'teaching', 'quiz_active', 'completed' |
| started_at | timestamptz | When session started |
| quiz_started_at | timestamptz | When quiz was published |
| quiz_ended_at | timestamptz | When quiz time expired |
| created_at | timestamptz | default now() |

RLS: Teachers can manage their own sessions. Students enrolled in the class can view sessions.

---

## New Database RPC: `analyze_session_results(p_session_id uuid)`

A SECURITY DEFINER function that returns comprehensive post-quiz analysis:

```json
{
  "success": true,
  "attendance": {
    "total_enrolled": 30,
    "present": 25,
    "absent": 5,
    "present_students": [{ "student_id": "...", "full_name": "...", "submitted_at": "..." }],
    "absent_students": [{ "student_id": "...", "full_name": "..." }]
  },
  "topic_analysis": [
    {
      "question_index": 0,
      "question_text": "What is entropy?",
      "correct_count": 20,
      "incorrect_count": 5,
      "accuracy_pct": 80,
      "status": "strong"
    },
    {
      "question_index": 2,
      "question_text": "Second law applies when...",
      "correct_count": 8,
      "incorrect_count": 17,
      "accuracy_pct": 32,
      "status": "weak"
    }
  ],
  "weak_topics_summary": ["Second law applications", "Carnot cycle efficiency"],
  "student_analysis": [
    {
      "student_id": "...",
      "full_name": "...",
      "score": 2,
      "total": 8,
      "percentage": 25,
      "status": "needs_attention"
    }
  ],
  "class_average": 65,
  "class_median": 70
}
```

Logic:
- Attendance = who submitted vs total enrolled
- Topic analysis = per-question accuracy from quiz content (compares each student's answer to correctIndex in assignment content)
- Weak students = those scoring below 50%

---

## New Components

### 1. `src/components/teacher/LiveSessionDialog.tsx`
**"Start Live Session" dialog** with:
- Session title input
- Content upload area (reuse existing UploadZone pattern for PDF/PPT, YouTube URL input, or paste text)
- Content gets extracted (calls existing extract-text / fetch-transcript edge functions)
- "Start Teaching" button -- creates the live_sessions record with status='teaching'

### 2. `src/components/teacher/LiveSessionPanel.tsx`
**Active session panel** shown at the top of the Class Detail page when a session is active:
- Shows session title, content source, elapsed time
- "Generate Quiz" button:
  - Opens a small settings popover: number of questions (5-10), difficulty, time limit (default 5 min)
  - Calls `generate-quiz` edge function with the session's content_text
  - Creates an assignment with `is_published=true`, `due_date` = now + time_limit
  - Updates live_sessions.status to 'quiz_active', stores assignment_id
- During quiz: shows a live countdown timer, real-time submission counter (polls every 5s)
- "End Quiz" button (or auto-end when timer expires)
- Updates session status to 'completed'

### 3. `src/components/teacher/SessionResultsPanel.tsx`
**Post-quiz analysis dashboard** with three sections:

**Section A -- Attendance**
- Green/red pie chart: Present vs Absent
- List of present students (with submission time) and absent students (highlighted red)
- Attendance percentage prominently displayed

**Section B -- Topic Analysis (Weak Topics)**
- Per-question accuracy bar chart (horizontal bars, color-coded: green >70%, amber 50-70%, red <50%)
- "Weak Topics" card listing questions with <50% accuracy, showing the question text
- Recommendation: "Consider re-teaching: [topic list]"

**Section C -- Student Performance (Needs Attention)**
- Sortable table: Student Name, Score, Percentage, Status badge
- Color-coded: Green (80%+), Amber (50-80%), Red (<50% "Needs Attention")
- Students below 50% get a red "Needs Attention" badge
- Bottom summary: "X students need additional support"

### 4. `src/components/student/LiveQuizTaker.tsx`
**Student-side quiz interface** for in-class quizzes:
- Countdown timer prominently displayed at top
- MCQ questions rendered one-by-one or all at once
- Auto-submit when timer expires
- Calls existing `submitAssignment` + `auto_grade_quiz_submission`
- Shows score immediately after submission

---

## Modified Files

### `src/pages/teacher/ClassDetail.tsx`
- Add "Start Live Session" button in the header area
- Show `LiveSessionPanel` banner when an active session exists for this class
- After session completes, show "View Results" button that opens `SessionResultsPanel`

### `src/hooks/useAssignments.ts`
- Add `deleteAssignment(id)` method
- No other changes needed (createAssignment and publishAssignment already exist)

### `src/pages/student/StudentClassView.tsx`
- Detect active quiz sessions for the class (poll live_sessions where status='quiz_active')
- Show a prominent "Live Quiz" banner with countdown timer
- Clicking it opens `LiveQuizTaker` component
- After submission, show score card

---

## Teacher Workflow (End-to-End)

```text
1. Teacher opens class detail page
2. Clicks "Start Live Session"
3. Uploads PDF/PPT or pastes YouTube URL for today's lecture
4. Content is extracted and stored
5. Teacher teaches in physical classroom using the material
6. When ready, clicks "Generate Quiz"
7. Selects: 5 questions, medium difficulty, 5-minute timer
8. Quiz is auto-generated and published instantly
9. Students see "Live Quiz!" banner on their class view
10. Students complete quiz within 5 minutes
11. Timer expires -> quiz auto-closes
12. Teacher sees instant results dashboard:
    - Attendance: 25/30 present
    - Weak Topics: Q3 (32% accuracy) - "Second law applications"
    - Needs Attention: 4 students below 50%
```

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/teacher/LiveSessionDialog.tsx` | Start session dialog with content upload |
| `src/components/teacher/LiveSessionPanel.tsx` | Active session banner with quiz generation |
| `src/components/teacher/SessionResultsPanel.tsx` | Post-quiz analysis (attendance, topics, students) |
| `src/components/student/LiveQuizTaker.tsx` | Student quiz-taking interface with timer |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/teacher/ClassDetail.tsx` | Add live session button, active session banner, results view |
| `src/pages/student/StudentClassView.tsx` | Add live quiz detection and quiz-taking flow |
| `src/hooks/useAssignments.ts` | Add deleteAssignment method |

### Database Changes (1 migration)
- Create `live_sessions` table with RLS policies
- Create `analyze_session_results` RPC function
- RLS: Teacher CRUD on own sessions, students SELECT on enrolled class sessions

### No new edge functions needed
- Reuses existing `generate-quiz` for quiz generation
- Reuses existing `extract-text` / `fetch-transcript` for content extraction
- Analysis RPC runs server-side in the database

### Design Consistency
- Live session banner uses a gradient card with pulse animation to indicate "live" status
- Timer uses `tabular-nums` font for clean countdown display
- Results use existing recharts patterns (bar charts, pie charts)
- Color coding consistent: green (good), amber (warning), red (needs attention)
- All cards use `border-border/50` and motion animations

