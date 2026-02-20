

## Fix All Study Tools to Fit Mobile Screen

### Problem
On mobile, the bottom action buttons (Submit, Next, Flip, etc.) in Quiz, Flashcards, and other full-screen study tools are hidden behind the MobileBottomNav. Both use `z-50`, and the tool footers use `z-10` (globally positioned via `fixed`), so the bottom nav wins and covers the buttons.

### Root Cause
The study tools use `fixed inset-0 z-50` for the overlay, but their internal fixed footers use `z-10`. Since `fixed` elements are positioned in the viewport stacking context, `z-10` is below the bottom nav's `z-50`. The bottom nav also renders later in the DOM, winning any z-index ties.

### Solution
Bump all full-screen study tool containers from `z-50` to `z-[60]` so they fully cover the bottom nav. This is the cleanest fix -- these are intentionally full-screen overlays that should sit above all app chrome.

### Files to Change

| File | Change |
|------|--------|
| `src/components/QuizMode.tsx` | Change all `z-50` containers to `z-[60]`; change footer `z-10` to `z-[61]` |
| `src/components/FlashcardDeck.tsx` | Change all `z-50` containers to `z-[60]`; change footer `z-10` to `z-[61]` |
| `src/components/QuizReviewMode.tsx` | Change `z-50` container to `z-[60]` |
| `src/components/VisualMindMap.tsx` | Change `z-50` container to `z-[60]` |
| `src/components/FullScreenStudyTool.tsx` | Change `z-50` container to `z-[60]` |

### What This Fixes
- Quiz: Submit/Next/Skip buttons will be fully visible and tappable on mobile
- Flashcards: Flip/Prev/Next/Done buttons will be fully visible
- Mind Map: Full screen view won't have bottom nav peeking through
- Study Guide/Summary: Full screen view clean on mobile
- All loading/skeleton states and completion screens also fixed

### Technical Details

Each component has a main container like:
```
<div className="fixed inset-0 z-50 ...">
```
This changes to:
```
<div className="fixed inset-0 z-[60] ...">
```

For QuizMode and FlashcardDeck, the fixed footer also changes:
```
// Before
<div className="fixed bottom-0 ... z-10">

// After
<div className="fixed bottom-0 ... z-[61]">
```

This ensures the footer sits above both the bottom nav (z-50) and the tool's own scrollable content area.

