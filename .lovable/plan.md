

# UI/UX Update: Add Classroom Feature Awareness Across All Pages

## Overview
Update the Footer, Header, Landing Page, Sidebar, and Onboarding pages to reflect the new Teacher/Student classroom features throughout the app.

---

## 1. Footer (`src/components/Footer.tsx`)

Add teacher/classroom links to existing sections:

- **Study Tools column**: Add "Classroom Hub" link pointing to `/teacher`
- **Resources column**: Add "For Teachers" link pointing to `/teacher`
- **Company column**: Add "Teacher Dashboard" link pointing to `/teacher`
- Update brand description to mention "Whether you're a student or teacher"

## 2. Header (`src/components/Header.tsx`)

Already has "For Teachers" in the Resources dropdown (added in previous update). Additional polish:

- Ensure the "For Teachers" link is present in the mobile nav flattened list as well

## 3. Landing Page (`src/pages/LandingPage.tsx`)

Add a "For Teachers" section between the Value Proposition and Trust/Authority sections:

- Heading: "Manage Your Classroom with AI"
- 3-column grid with cards:
  - **Create Classes**: Organize students into classes with auto-generated invite codes
  - **Assign AI-Generated Work**: Create quizzes, flashcards, and assignments powered by AI
  - **Track Progress**: Monitor student submissions and performance with analytics
- CTA button: "Start Teaching for Free" linking to `/auth`
- Update social proof text from "12K+ students" to "12K+ students & teachers"
- Update hero subtitle to include "Whether you're a student or teacher"

## 4. Sidebar (`src/components/AppSidebar.tsx`)

Already role-aware with Teacher/Student sections. Enhancements:

- Add a "Join Class" quick link for students below "My Classes"
- Add inline class count badge next to the Teacher "Dashboard" label when collapsed

## 5. Onboarding (`src/pages/Onboarding.tsx`)

Enhance the Step 0 role selection cards:

- Add gradient border on hover instead of plain `border-primary`
- Student card: add "Access AI study tools, flashcards, quizzes & more" description
- Teacher card: add "Create classes, assign work & track student progress" description
- Both cards get a subtle gradient border glow effect on selection

---

## Technical Details

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/Footer.tsx` | Add classroom/teacher links, update brand copy |
| `src/pages/LandingPage.tsx` | Add "For Teachers" section, update hero & social proof |
| `src/components/AppSidebar.tsx` | Add "Join Class" link for students |
| `src/pages/Onboarding.tsx` | Enhanced role card descriptions and gradient styling |

### No new files needed
All changes fit within existing components.

### Design consistency
- Uses existing design tokens: `bg-primary/10`, `border-primary/20`, gradient accents
- Follows the standardized card pattern with icons and descriptions
- Maintains dark-mode-first aesthetic per NewtonAI design system

