## Goal
Redesign the tool demo slides (9 slides using `ToolSlideLayout`) into a clean, presentation-grade layout with a smaller video frame, properly formatted typography, and a true left/right Problem vs Solution split. Apply consistent fixes across all slides.

## New Tool Slide Layout (applied to all 9 video demo slides)

```text
┌─────────────────────────────────────────────────────────────┐
│  [CATEGORY CHIP]                              [Tool Icon]   │  ← Header band (~14%)
│  Tool Name — Bold Display Headline                          │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  ❌ THE PROBLEM          │   ✅ NEWTON'S SOLUTION           │
│  (left column, ~38%)     │   (right column, ~38%)           │
│  Body copy in clean      │   Body copy + 3 checkmark        │
│  serif/sans hierarchy    │   highlights stacked below       │
│                          │                                  │
├──────────────────────────┴──────────────────────────────────┤
│              ▶  WATCH HOW IT WORKS                          │
│        ┌────────────────────────────────┐                   │  ← Video band (~48%)
│        │   Smaller 16:9 video frame     │                   │
│        │   max-width ~620px, centered   │                   │
│        └────────────────────────────────┘                   │
│              Italic caption beneath                         │
└─────────────────────────────────────────────────────────────┘
```

### Key fixes
1. **True L/R split for Problem vs Solution** — currently both sit in a cramped top-left 70% block. Move to a real 2-column grid spanning full width, generous gap, vertical divider.
2. **Smaller video frame** — cap `max-width: 620px` (was 880px), keep `aspect-ratio: 16/9`, center it, leave breathing room. Fits comfortably above the 52px nav even on 1008px viewports.
3. **Typography polish** (Plus Jakarta Sans is already loaded):
   - Tool name: 32–40px, weight 800, letter-spacing -0.02em
   - Section labels (PROBLEM / SOLUTION): 11px, weight 700, uppercase, 0.25em tracking, colored
   - Body copy: 14–15px, weight 400, line-height 1.6, `#CBD5E1` (problem) / `#F1F5F9` (solution)
   - Highlights: 12.5px with green check chips
   - Caption: italic 12px, `#64748B`
4. **Header band** — category chip + tool name on the left, icon tile on the right, single clean row.
5. **Highlights** — moved under the solution column (right side), not floating beside the icon.
6. **Video section header** — centered "▶ WATCH HOW IT WORKS" with a thin underline accent in tool's `categoryColor`.
7. **Light-band background** kept for the video area but with softer `#F1F5F9` and rounded top corners for visual separation.
8. **Padding consistency** — `px-16 py-10` outer, `gap-12` between columns, all spacing on an 8-px grid.

## Files to change

- **`src/pitch/slides/ToolSlideLayout.tsx`** — full rewrite of the layout per the structure above. This single file controls all 9 demo slides:
  - Slide04NewtonChat, Slide07VideoSearch, Slide08QuizGenerator, Slide10Flashcards, Slide11Summariser, Slide12HomeworkHelp, Slide13PDFChat, Slide14MindMaps, Slide15Podcast
- **`src/pitch/components/VideoPlayer.tsx`** — reduce `maxWidth` from 880 → 620, tighten the empty-state card (smaller icon, smaller "Upload demo video" button), refine caption typography. No logic changes (upload/IndexedDB persistence preserved).

## Out of scope (untouched)
- Slide01Hero, Slide02Problem, Slide03Solution, SlideSmartClassroom, SlideInClassQuiz, SlideTeacherDashboard, SlideStudentDashboard, Slide18CTA — these have custom layouts and were not flagged.
- Video upload / IndexedDB / `useToolVideo` hook — already working.
- Navigation, keyboard shortcuts, slide order.

## Verification
- Visually inspect 2–3 demo slides (Newton Chat, Quiz Generator, Podcast) at the user's 1008×626 preview viewport and at 1920×1080.
- Confirm video frame fully visible above the 52px BottomNav with no clipping.
- Confirm Problem/Solution columns are equal width with readable line-length (~55ch).