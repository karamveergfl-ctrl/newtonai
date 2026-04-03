

# Part 2 — Teacher Dashboard Enhancement

## Current State
The existing `TeacherDashboard.tsx` is minimal: 4 stat cards, 2 quick actions, and a class grid. No activity feed, no pending actions, no live session indicator, no session stats. The sidebar already has a "Teacher Dashboard" link at `/teacher`.

## What Needs Building

### 1. Enhanced Stats Row (modify TeacherDashboard.tsx)
Replace current 4 stats with meaningful ones from DB:
- **Active Classes** — count from `classes` table (already have)
- **Total Students** — sum from `class_enrollments` (already have)
- **Live Sessions This Month** — query `live_sessions` where `started_at` is in current month and `teacher_id` matches, calculate total hours from duration
- **Avg Understanding** — query `pulse_responses` aggregated across recent sessions (show "—" if no data)

### 2. Two-Column Layout Below Stats

**Left Column (60%)** — "Your Classes" grid:
- Show 6 classes initially with "Load More" button
- Enhance `ClassCard` to show: last session date (from `live_sessions`), "Go Live Now" shortcut button, "Enter Classroom" button
- Keep existing subject color borders

**Right Column (40%)** — Three sections:

**a) Recent Activity Feed** — new component `TeacherActivityFeed.tsx`:
- Query recent events: new enrollments from `class_enrollments`, completed sessions from `live_sessions`, Newton Chat questions from `newton_conversations`
- Each item: icon, description, class name badge, relative timestamp
- Show last 10 items, "View All" link
- Uses existing tables — no migration needed

**b) Upcoming Sessions** — placeholder section showing next 3 scheduled sessions (from `live_sessions` with future `started_at`, or show "No upcoming sessions" with a "Schedule" button)

**c) Pending Actions** — new component `PendingActions.tsx`:
- Ungraded assignments: query `assignments` with no grades
- Red flag alerts: sessions where pulse "lost" > 50%
- Students not active in 7+ days
- Each item: amber/red card with icon, description, action button

### 3. Sidebar Enhancement for Teachers (modify AppSidebar.tsx)
Expand the Teacher section from a single "Dashboard" link to:
- Dashboard (house icon)
- My Classes (grid icon) — with count badge
- Live Now (pulsing red dot) — only if teacher has active `live_sessions` with `status = 'teaching'`
- Analytics (chart icon) → `/teacher/analytics`
- Students (people icon) → `/teacher/students`
- Materials (folder icon) → `/teacher/materials`
- Newton Chat (chat icon) → `/teacher/newton-chat`
- Profile (at bottom, already exists)

### 4. "Live Now" Indicator
Query `live_sessions` for teacher's active session. If found, show pulsing red "LIVE" badge in sidebar and a banner at top of dashboard: "[Class Name] is LIVE — Return to Classroom →"

## Files Changed

| File | Action |
|------|--------|
| `src/pages/teacher/TeacherDashboard.tsx` | Rewrite — two-column layout, enhanced stats, activity feed, pending actions |
| `src/components/teacher/TeacherActivityFeed.tsx` | Create — recent activity feed component |
| `src/components/teacher/PendingActions.tsx` | Create — pending actions widget |
| `src/components/teacher/ClassCard.tsx` | Modify — add last session date, Go Live button |
| `src/components/AppSidebar.tsx` | Modify — expand Teacher sidebar section with full nav items + Live Now indicator |

## No Database Migrations
All data comes from existing tables: `classes`, `class_enrollments`, `live_sessions`, `assignments`, `newton_conversations`, `pulse_responses`.

