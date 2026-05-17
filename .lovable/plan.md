## Goal

When an admin uses the "Switch to Student" toggle, the UI should look identical to a real student login — no teacher-only nav items, sections, or shortcuts should leak through.

## Root cause

Admins typically also hold the `teacher` role. The sidebar (and mobile nav) decide what to show purely from roles (`isTeacher` / `isStudent`), so even after switching to student view, the Teacher group (My Classes, Analytics, Students, Materials, Newton Chat) still renders. Same for any teacher-only footer/CTA paths.

## Changes (frontend only)

1. **`src/components/AppSidebar.tsx`**
   - Read `dashboardMode` (already imported).
   - Derive effective view for admins:
     - `effectiveTeacher = isTeacher && !(isAdmin && dashboardMode === "student")`
     - `effectiveStudent = isStudent || (isAdmin && dashboardMode === "student")`
   - Replace `isTeacher` / `isStudent` usage in the "My Classes / Teacher" group rendering with these effective flags so admins in student view see the student nav block (Dashboard, My Classes, Join Class) instead of the teacher block.
   - Keep the Admin section (with the switch button) visible regardless of mode so they can switch back.
   - `homePath` logic stays as-is (already correct).

2. **`src/components/MobileBottomNav.tsx`**
   - Apply the same `effectiveTeacher` / `effectiveStudent` derivation so the bottom nav items match what a real student sees.

3. **`src/pages/student/StudentDashboard.tsx`**
   - No content changes needed — it's already student-only. Verify nothing teacher-specific renders.

4. **Tests**
   - Extend `src/test/studentHomeButton.test.tsx` with a string assertion that AppSidebar gates the teacher group via the `effectiveTeacher` flag (i.e. an admin with `dashboardMode === "student"` won't render the teacher block).

## Out of scope

- No backend, role, or RLS changes. Admin still has both roles in the DB — this is purely a view-mode UI gate.
- No changes to onboarding redirect logic (already honors `dashboardMode`).

## Files touched

- `src/components/AppSidebar.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/test/studentHomeButton.test.tsx`
