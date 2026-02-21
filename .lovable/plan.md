

# UI/UX Overhaul for Classroom Features

## Summary

Update all existing and new classroom pages to match NewtonAI's polished design system: dark-mode-first aesthetic, micro-interactions, gradient accents, standardized headers, empty states with illustrations, and mobile-responsive layouts. Also add teacher-awareness to the landing page, header, and mobile nav.

---

## 1. Teacher Dashboard (`TeacherDashboard.tsx`) -- Visual Upgrade

**Current**: Basic stats row with plain cards, no header icon, no gradient accents.

**Changes**:
- Add standardized centered header with `rounded-2xl bg-primary/10` icon container (matching tool pages)
- Stats cards get gradient borders, subtle hover lift (`interactive-card` class), and animated count-up numbers
- Empty state gets the Newton character illustration (`newton-character-sm.webp`) instead of plain icon
- "Create Class" button gets primary gradient styling with `Sparkles` icon
- Add a quick-action row below stats: "Create Class" and "Join as Student" shortcut cards with hover effects
- Mobile: single-column stats grid, full-width class cards

## 2. Class Cards (`ClassCard.tsx`) -- Enhanced Design

**Changes**:
- Add colored left border accent based on subject (math=blue, science=teal, etc.)
- Student count badge with `Users` icon gets a subtle pill background
- Add last-activity timestamp ("2 days ago")
- Hover: lift + glow shadow (`shadow-glow` from design tokens)
- Active indicator dot for classes with recent submissions

## 3. Class Detail Page (`ClassDetail.tsx`) -- Full Redesign

**Current**: Basic tabs with minimal styling.

**Changes**:
- Sticky header with class name, subject badge, and invite code as a compact pill (not a separate card)
- Tabs: use pill-style tab triggers with icons (matching the app's existing tab patterns)
- Students tab: avatar circles with initials, enrollment date, and a `MoreHorizontal` menu instead of bare trash icon
- Assignments tab: cards with status indicators (draft=yellow dot, published=green dot), type icon, due date countdown
- Analytics tab: use `recharts` (already installed) for a bar chart of submissions + line chart of average scores over time
- Add "Share Invite" floating action button on mobile
- InviteCodeCard becomes an inline pill in the header with copy-on-click (less visual noise)

## 4. Invite Code Card (`InviteCodeCard.tsx`) -- Compact Redesign

**Changes**:
- Transform from standalone card to a compact inline component
- Code displayed in a `glass` pill with monospace font and subtle shimmer animation
- Single "Copy" icon button; long-press/right-click for "Copy Link"
- QR code option (using a small inline SVG generator)

## 5. Create Class Dialog (`CreateClassDialog.tsx`) -- Polish

**Changes**:
- Add subject auto-suggest with emoji icons (from the subjects array already in Onboarding)
- Form fields get floating labels pattern
- Preview card at the bottom showing what the class card will look like
- Loading state uses the Newton "thinking" animation

## 6. Student Classes Page (`StudentClasses.tsx`) -- Visual Upgrade

**Current**: Plain list with minimal styling.

**Changes**:
- Standardized centered header with `GraduationCap` icon
- Class cards match the teacher's `ClassCard` design (consistency)
- Empty state: Newton character + "Ask your teacher for a code" with prominent "Join a Class" CTA
- "Join a Class" button in header gets `Plus` icon and primary styling
- Add subtle entry animations with staggered framer-motion

## 7. Student Class View (`StudentClassView.tsx`) -- Enhanced

**Changes**:
- Add class subject/year badges below title
- Materials tab: cards with file-type icons (PDF icon, link icon, video icon) and colored left borders
- Assignments tab: cards show status (not started, submitted, graded) with appropriate colors
- Graded assignments show score as a circular progress indicator
- Due date shows countdown ("Due in 3 days" or "Overdue" in red)

## 8. Join Class Page (`JoinClass.tsx`) -- Premium Feel

**Current**: Basic centered card.

**Changes**:
- Add animated background blobs (matching onboarding page)
- Newton mascot illustration above the card
- Input field: each character gets its own box (OTP-style, using existing `input-otp` component)
- Success state: confetti animation + class preview card before redirect
- Error state: shake animation on the input

## 9. Landing Page (`LandingPage.tsx`) -- Teacher Awareness

**Changes**:
- Update hero subtitle: "designed to help you **focus, retain more, and perform better**" -- add "Whether you're a student or teacher"
- Add a "For Teachers" section after the features grid:
  - "Manage your classroom with AI" heading
  - 3-column grid: Create Classes, Assign AI-Generated Work, Track Progress
  - CTA: "Start Teaching for Free"
- Update social proof: "12K+ students" becomes "12K+ students & teachers"

## 10. Header (`Header.tsx`) -- Teacher Link

**Changes**:
- Add "For Teachers" link in the Resources dropdown menu
- When authenticated as teacher: show "Dashboard" link pointing to `/teacher` instead of generic login

## 11. Mobile Bottom Nav (`MobileBottomNav.tsx`) -- Role-Aware

**Changes**:
- For teachers: replace "Snap" (camera) tab with "Classes" tab pointing to `/teacher`
- For students with enrolled classes: add a badge dot on the "Home" tab when new assignments are available

## 12. Onboarding Role Step -- Micro-polish

**Changes**:
- Teacher card: add a small preview of what the teacher dashboard looks like (mini mockup illustration)
- Student card: add a preview of the study tools
- Both cards get gradient borders on hover instead of plain border-primary

## 13. Sidebar (`AppSidebar.tsx`) -- Enhanced Classes Section

**Changes**:
- Teacher section: show mini class list (top 3 classes) with student count badges
- Add "Create Class" quick action button inline
- Student section: show enrolled class names with colored dots
- Add "Join Class" quick action inline
- Collapsed state: show `School` icon with badge count

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/teacher/ClassAnalyticsCharts.tsx` | Recharts-based analytics visualizations |
| `src/components/teacher/InviteCodePill.tsx` | Compact inline invite code component |
| `src/components/teacher/QuickActions.tsx` | Dashboard quick action cards |
| `src/components/student/AssignmentStatusBadge.tsx` | Visual assignment status indicator |
| `src/components/student/ScoreCircle.tsx` | Circular progress for grades |

### Files to Modify
| File | Change |
|------|---------|
| `src/pages/teacher/TeacherDashboard.tsx` | Full visual overhaul |
| `src/pages/teacher/ClassDetail.tsx` | Redesigned tabs, inline invite code, recharts analytics |
| `src/components/teacher/ClassCard.tsx` | Subject-colored borders, hover effects, activity indicator |
| `src/components/teacher/InviteCodeCard.tsx` | Compact glass pill redesign |
| `src/components/teacher/CreateClassDialog.tsx` | Subject suggestions, preview card |
| `src/pages/student/StudentClasses.tsx` | Standardized header, enhanced empty state |
| `src/pages/student/StudentClassView.tsx` | File-type icons, score indicators, due date countdown |
| `src/pages/JoinClass.tsx` | OTP-style input, animated background, success state |
| `src/pages/LandingPage.tsx` | "For Teachers" section, updated social proof |
| `src/components/Header.tsx` | "For Teachers" dropdown link |
| `src/components/MobileBottomNav.tsx` | Role-aware tab swap for teachers |
| `src/components/AppSidebar.tsx` | Expanded classes section with mini list |
| `src/pages/Onboarding.tsx` | Enhanced role card styling |

### Design Tokens Used
- `interactive-card` class for hover lift
- `glass` class for frosted-glass effects
- `gradient-text` for accent headings
- `shadow-glow` for hover emphasis
- `card-hover` for card lift transitions
- Existing `framer-motion` patterns for staggered entry animations
- `recharts` (already installed) for analytics charts

