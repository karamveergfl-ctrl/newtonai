

# Fix Broken Pages, Functions, and Options

## Issues Found

### 1. Logo.tsx -- `fetchPriority` React Warning (Console Error)
The `<img>` tag uses camelCase `fetchPriority="high"` which React does not recognize as a valid DOM attribute. This produces a console warning on every page load. Fix: change to lowercase `fetchpriority`.

### 2. Onboarding.tsx -- ~800 Lines of Dead Code
After adding `TeacherOnboarding` and `StudentOnboarding`, the old steps 1-6 (name, education level, subjects, study goals, referral source, theme/language) in `Onboarding.tsx` are **never reached**. The branching at line 470 sends teachers and students to their dedicated components at step 1. The old `handleNext` validation for steps 1-6 and the old `handleComplete` function are also dead. This bloats the file from ~500 lines to 1294 lines and makes maintenance harder. Fix: Remove old steps 1-6, keeping only step 0 (role selection) in the parent component.

### 3. FacultyMonitoringPage -- Layout Bug When Feature is Gated
The `InstitutionFeatureGate` component is placed as a direct child of the flex container alongside `AppSidebar`, but it renders a centered div without `flex-1`. When the feature is locked (for non-Growth tier users), the lock overlay doesn't fill the remaining space, resulting in a broken layout. Fix: wrap the gate output in a `flex-1` container.

### 4. CompliancePage -- Same Layout Pattern Issue
Similar to FacultyMonitoringPage, the gated content needs to ensure proper flex layout when the gate is active.

### 5. InstitutionFeatureGate -- Missing flex-1 on Non-Overlay Mode
The "full replacement" mode (non-overlay) renders a centered div without `className="flex-1"`, which breaks layouts when used inside flex containers. Fix: add `flex-1 w-full` to the wrapper div.

### 6. TeacherReportPage -- Null Safety (Already Fixed)
The `slide_title` null crash was fixed in the previous edit. No further action needed.

---

## Changes

### File: `src/components/Logo.tsx`
- Change `fetchPriority="high"` to `fetchpriority="high"` (lowercase HTML attribute)

### File: `src/pages/Onboarding.tsx`
- Remove old steps 1-6 JSX (lines ~635-1285 approximately)
- Remove dead `handleNext` validation for steps 1-6
- Remove dead `handleComplete` function (old student flow)
- Remove unused state variables, imports, and option arrays (`educationLevels`, `subjects`, `studyGoals`, `referralSources`, `themeOptions`, `languageOptions`)
- Keep: step 0 (role selection), `checkAuth`, avatar upload, and the branching to `TeacherOnboarding`/`StudentOnboarding`
- This reduces the file from ~1294 lines to ~300 lines

### File: `src/components/institution/InstitutionFeatureGate.tsx`
- Add `flex-1 w-full` to the non-overlay locked state wrapper div so it fills flex containers properly

### File: `src/pages/institution/FacultyMonitoringPage.tsx`
- Wrap `InstitutionFeatureGate` in a `div className="flex-1"` so the gate content fills the remaining space beside the sidebar

---

## Technical Details

### Logo Fix
```text
Before: fetchPriority="high"
After:  fetchpriority="high"
```

### InstitutionFeatureGate Fix
The non-overlay locked state changes from:
```text
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
```
to:
```text
<div className="flex-1 w-full flex flex-col items-center justify-center py-16 px-4 text-center">
```

### Onboarding Cleanup
The file structure after cleanup:
- Imports (trimmed)
- Step 0 role selection UI
- Branching: teacher -> TeacherOnboarding, student -> StudentOnboarding
- checkAuth + avatar upload helpers
- No more dead steps 1-6

### Files Modified (4)
1. `src/components/Logo.tsx` -- Fix fetchPriority warning
2. `src/pages/Onboarding.tsx` -- Remove ~800 lines of dead code
3. `src/components/institution/InstitutionFeatureGate.tsx` -- Fix flex layout
4. `src/pages/institution/FacultyMonitoringPage.tsx` -- Fix gated content layout

