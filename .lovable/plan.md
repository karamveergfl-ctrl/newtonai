## Goal
Make the admin account use one reliable switch button between Teacher and Student dashboards, and ensure Student Home always lands on the image dashboard at `/student/dashboard` instead of bouncing back to the teacher view.

## What I’ll change
1. **Add an explicit dashboard mode for admin switching**
   - Introduce a small frontend-only view-mode state for admin accounts (teacher vs student view).
   - Update the single admin switch button so it sets that mode before navigating.
   - Use the current mode, not just raw roles, to determine which dashboard the admin is actively using.

2. **Make Home navigation honor the active mode everywhere**
   - Update the main sidebar Home button so:
     - student accounts go to `/student/dashboard`
     - teacher accounts go to `/dashboard`
     - admin accounts in student view also go to `/student/dashboard`
     - admin accounts in teacher view go to `/teacher`
   - Update the mobile bottom nav Home item with the same logic, since it still defaults to `/dashboard`.

3. **Prevent redirect bounce-back to teacher view**
   - Adjust shared route/onboarding redirect logic so admin users who intentionally switched to student view are not immediately sent back into teacher flow.
   - Keep existing teacher/institution redirects intact for normal users.

4. **Tighten regression coverage**
   - Replace the current string-based test assumptions with checks that cover the new admin-switch behavior.
   - Add/extend a small test to confirm:
     - the admin switch button toggles between teacher and student dashboards
     - Home resolves to `/student/dashboard` when in student view
     - teacher users still keep their expected dashboard path

5. **Update QA checklist**
   - Expand the existing manual QA doc with the exact admin-switch scenario that is failing now.

## Technical details
- Likely files to update:
  - `src/components/AppSidebar.tsx`
  - `src/components/MobileBottomNav.tsx`
  - `src/components/OnboardingGate.tsx`
  - `src/test/studentHomeButton.test.tsx`
  - `docs/qa/student-home-button.md`
- I’ll keep this frontend-only and avoid backend/auth schema changes.
- I’ll preserve the existing single switch button design rather than adding extra controls.