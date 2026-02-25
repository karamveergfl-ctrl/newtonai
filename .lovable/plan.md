

# Teacher Onboarding Flow -- Implementation Plan

## Overview
Replace the current generic onboarding (which forces teachers through student-centric steps like "study goals" and "education level") with a dedicated, teacher-specific onboarding path. When a teacher selects their role at Step 0, they branch into a tailored 7-step flow designed for fast classroom adoption (5-7 min).

---

## Architecture

The current `Onboarding.tsx` (1269 lines) handles both roles in a single flow. We will:
1. Extract the teacher branch into a new `TeacherOnboarding.tsx` component
2. Keep `Onboarding.tsx` as the router -- after Step 0 (role selection), teachers are redirected to the teacher-specific flow
3. Add a `teacher_preferences` column to the `profiles` table for storing teaching style, smartboard settings, and institution link

---

## Database Migration

Add a `teacher_preferences` JSONB column to the `profiles` table:

```text
profiles.teacher_preferences  jsonb  DEFAULT NULL
```

Stores:
```json
{
  "institution_name": "MIT",
  "department": "Physics",
  "class_level": "college",
  "teaching_style": "smartboard",
  "smartboard_enabled": true,
  "voice_commands": false,
  "auto_lecture_notes": true,
  "auto_attendance": true,
  "marks_tracking": "excel",
  "institution_code": null
}
```

No new tables needed -- all preferences live in a single JSONB field on the existing `profiles` table. No RLS changes needed since profiles already have per-user access policies.

---

## Teacher Onboarding Steps (7 steps total)

### Step 0: Role Selection (existing, shared)
Already in Onboarding.tsx. Teacher selects "Teacher" and auto-advances.

### Step 1: Teaching Profile (30 sec)
"Let's Set Up Your Teaching Profile"
- Full Name (pre-filled from Google auth if available)
- Institution Name (free text)
- Department / Subject (free text)
- Class Level: School / College / Coaching Institute / University (single select, auto-advance)

### Step 2: Teaching Style Detection
"How do you usually teach?"
- Smartboard / Digital board
- Traditional board + PDF
- Mostly presentations
- Hybrid teaching
(Single select, auto-advance. Determines default tool configuration.)

### Step 3: First Class Creation (CRITICAL)
"Create Your First Class"
- Class Name field
- Subject field (with quick-pick chips)
- Semester/Grade field
- Approximate student count (visual slider: 10-200)
- On submit: creates class via existing `useClasses.createClass`, shows generated invite code with copy button and share options

### Step 4: Smartboard Setup Wizard
"Optimize NewtonAI for Classroom Teaching"
- Toggle: Enable Smartboard Mode (default ON if teaching_style is "smartboard")
- Toggle: Auto Lecture Notes
- Toggle: Auto Attendance
- Device info displayed (auto-detected screen size, touch support)
- Preview card showing what Smartboard mode looks like

### Step 5: AI Teaching Assistant Activation
"Your AI Teaching Assistant Is Ready"
- Visual showcase of 4 capabilities with icons:
  - Generate quizzes instantly
  - Make notes automatically
  - Answer student doubts
  - Track performance
- "AI assists you, never replaces you" confidence message
- Single "Activate Assistant" CTA button

### Step 6: Academic Records Setup
"How do you track marks?"
- Options: Excel sheets / LMS software / Manual register / New to digital
- Optional: Institution code input ("Are you part of an institution using NewtonAI?")
- Skip option available

### Step 7: Success Screen
"You're Ready to Teach Smarter"
- Animated success with confetti-style sparkles
- 4 action cards:
  - Start Live Class
  - Add Material
  - Invite Students (shows join code)
  - Try Smartboard Mode
- "Get Started" button navigates to `/teacher`

---

## Files Summary

### New Files (1)
1. `src/components/onboarding/TeacherOnboarding.tsx` -- Complete teacher onboarding flow (Steps 1-7). Reuses existing animation variants and UI patterns from `Onboarding.tsx`.

### Modified Files (2)
1. `src/pages/Onboarding.tsx` -- After Step 0 role selection, if teacher is selected, render `TeacherOnboarding` component instead of student steps. Minimal change: conditional render after step 0.
2. Database migration -- Add `teacher_preferences` JSONB column to `profiles`.

### No Changes Needed
- `App.tsx` -- No new routes needed (teacher onboarding lives within `/onboarding`)
- `useClasses.ts` -- Reused as-is for class creation in Step 3
- `CreateClassDialog.tsx` -- Not reused directly; Step 3 has inline class creation form

---

## Technical Details

### Completion Handler
On final step, the `handleComplete` function will:
1. Save `teacher` role to `user_roles` table (existing pattern)
2. Update `profiles` with `full_name`, `teacher_preferences` JSONB, and `onboarding_completed: true`
3. Create the first class if the teacher filled in class details (via `supabase.from("classes").insert(...)`)
4. Set localStorage flags for smartboard preferences
5. Navigate to `/teacher`

### Teaching Style to Config Mapping
| Teaching Style | Smartboard Default | Auto Notes | Auto Attendance |
|---|---|---|---|
| Smartboard/Digital | ON | ON | ON |
| Traditional + PDF | OFF | ON | OFF |
| Presentations | ON | OFF | OFF |
| Hybrid | ON | ON | OFF |

### Device Detection (Step 4)
Uses `window.innerWidth`, `window.screen`, and `navigator.maxTouchPoints` to auto-detect:
- Screen size category (Laptop / Desktop / Tablet)
- Touch support (Yes/No)
- Recommended Smartboard mode setting

### Invite Code Display (Step 3)
After class creation, the generated `invite_code` from the classes table is displayed with:
- Large, copyable code display
- "Share via WhatsApp" and "Copy Link" buttons
- QR code generation (using existing canvas approach)

---

## UX Psychology Alignment
- Each step has a single clear purpose -- no scrolling needed
- Single-select steps auto-advance after 600ms (existing pattern)
- "AI assists, not replaces" messaging in Step 5 addresses teacher fear
- First class creation during onboarding provides immediate value
- Success screen shows actionable next steps, not a dead end
