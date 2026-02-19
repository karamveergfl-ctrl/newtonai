
## Analysis and Fixes for NewtonAI Auth and Guest Trial Issues

### Problems Found

**Problem 1: Guest trial blocks ALL tool usage for unauthenticated users immediately**
In every tool page (HomeworkHelp, AIQuiz, AIFlashcards, etc.), the guest usage gate fires on the FIRST interaction -- it calls `incrementGuestUsage()` AND `setShowTrialPrompt(true)` together, then returns early. This means:
- On the very first use, the trial prompt modal pops up AND the count goes to 1 (blocking the actual generation)
- The user never actually gets to USE the tool -- they see the signup modal right away
- The intent was "2 free uses THEN block", but the current code blocks BEFORE any generation happens

**Problem 2: `returnTo` query param is ignored after login/signup**
The `GuestTrialLimitModal` correctly passes `?returnTo=/tools/homework-help` when navigating to `/auth`. However, `Auth.tsx`'s `checkOnboardingAndRedirect` always navigates to `/dashboard` -- it never reads the `returnTo` query parameter. So after signing up from a tool page, the user lands on `/dashboard` instead of being returned to the tool they were using.

**Problem 3: `fetchPriority` React warning in Logo component**
The console shows: `React does not recognize the fetchPriority prop on a DOM element`. React expects `fetchpriority` (lowercase) on native HTML elements, but the code uses `fetchPriority` (camelCase). This is a known React 18 issue -- the prop should be passed differently.

### Fixes

**Fix 1: Let guests actually use tools before blocking**
Change the guest gate logic in all 7 tool pages so that:
- If `guestLimitReached` is already true, show the prompt and return (block)
- If NOT reached, let the generation proceed. After successful generation, THEN increment and optionally show a soft prompt
- This gives users 2 real generations before being blocked

Current (broken) pattern in all tool pages:
```typescript
if (!isAuthenticated) {
  incrementGuestUsage();      // Always increments
  setShowTrialPrompt(true);   // Always shows modal
  return;                     // Always blocks
}
```

Fixed pattern:
```typescript
if (!isAuthenticated && guestLimitReached) {
  setShowTrialPrompt(true);
  return; // Block -- trial exhausted
}
// ... proceed with generation ...
// After successful generation:
if (!isAuthenticated) {
  incrementGuestUsage();
}
```

Files to update:
- `src/pages/tools/HomeworkHelp.tsx`
- `src/pages/tools/AIQuiz.tsx`
- `src/pages/tools/AIFlashcards.tsx`
- `src/pages/tools/AISummarizer.tsx`
- `src/pages/tools/AILectureNotes.tsx`
- `src/pages/tools/MindMap.tsx`
- `src/pages/tools/AIPodcast.tsx`

Also update `useGuestTrial` destructuring to include `guestLimitReached`.

**Fix 2: Honor `returnTo` after auth in Auth.tsx**
In `checkOnboardingAndRedirect`, read the `returnTo` search param and navigate there instead of always going to `/dashboard`:

```typescript
const params = new URLSearchParams(window.location.search);
const returnTo = params.get('returnTo');

if (profile.onboarding_completed) {
  navigate(returnTo || "/dashboard");
} else {
  navigate("/onboarding");
}
```

File: `src/pages/Auth.tsx` (lines ~151-155)

**Fix 3: Fix `fetchPriority` React warning in Logo**
Change `fetchPriority={eager ? "high" : undefined}` to use a lowercase attribute via spread or remove it since `loading="eager"` already handles priority.

File: `src/components/Logo.tsx` (line ~33)

### Technical Details

| File | Change |
|------|--------|
| `src/pages/tools/HomeworkHelp.tsx` | Fix guest gate: check `guestLimitReached` before blocking, increment after successful generation |
| `src/pages/tools/AIQuiz.tsx` | Same fix |
| `src/pages/tools/AIFlashcards.tsx` | Same fix |
| `src/pages/tools/AISummarizer.tsx` | Same fix |
| `src/pages/tools/AILectureNotes.tsx` | Same fix |
| `src/pages/tools/MindMap.tsx` | Same fix |
| `src/pages/tools/AIPodcast.tsx` | Same fix |
| `src/pages/Auth.tsx` | Read `returnTo` param and navigate there after login/signup |
| `src/components/Logo.tsx` | Remove or fix `fetchPriority` prop to eliminate React warning |
