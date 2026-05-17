
## Goal

Bring the tool slides back to a cleaner **two-column header (Problem ⟷ Solution) with video centered below**, convert the prose to scannable bullet points, and fix issues on the Podcast, Smart Classroom, and In-Class Quiz slides.

## Changes

### A. `src/pitch/slides/ToolSlideLayout.tsx` — rewrite layout
New structure:

```text
┌──────────────────────────────────────────────────────────┐
│  Category chip · Tool name                       [icon]  │  ~14%
├───────────────────────────┬──────────────────────────────┤
│  ❌ THE PROBLEM           │  ✅ NEWTON'S SOLUTION         │  ~36%
│  • bullet                 │  • bullet                     │
│  • bullet                 │  • bullet                     │
│  • bullet                 │  • bullet                     │
├──────────────────────────────────────────────────────────┤
│              ▶  VIDEO (16:9, max 620px)                  │  ~50%
│              caption under frame                          │
└──────────────────────────────────────────────────────────┘
```

- Update the component API: `problem` and `solution` become `string[]` (bullet arrays). Drop the separate `highlights` prop and merge those points into `solution`.
- Left card: red-tinted (`rgba(248,113,113,0.06)`), heading `❌ THE PROBLEM` in `#F87171`, bullets in `#CBD5E1` 13.5px with a `•` marker.
- Right card: green-tinted (`rgba(52,211,153,0.07)`), heading `✅ NEWTON'S SOLUTION` in `#34D399`, bullets in `#F1F5F9` 13.5px with a `✓` marker.
- Video band below both cards, horizontally centered, `max-width: 620px`, `aspect-ratio: 16/9`. Caption in `#94A3B8` italic 11px directly under the frame.
- No `framer-motion`; static layout. Keep bottom 52px reserved for nav.

### B. Update every tool slide to pass bullet arrays
Files: `Slide04NewtonChat.tsx`, `Slide08QuizGenerator.tsx`, `Slide10Flashcards.tsx`, `Slide11Summariser.tsx`, `Slide12HomeworkHelp.tsx`, `Slide13PDFChat.tsx`, `Slide14MindMaps.tsx`, `SlideAdFreeVideos.tsx`.
- Convert each existing paragraph into **3 concise bullets** for problem and **3–4 bullets** for solution (merging the old `highlights`). Same wording, just split.
- Bump `VideoPlayer` `maxWidth` from 520 → 620 to match the new wider video band.

### C. `src/pitch/components/VideoPlayer.tsx`
- Raise `maxWidth` from 520 to 620 so the centered video reads well below the two text cards.
- No other changes.

### D. `Slide15Podcast.tsx` — fix overlap
Rebuild on the same "Problem left / Solution right / video centered below" structure as the tool layout so nothing collides:
- Top header strip (category chip `AI PODCAST`, title, `Headphones` icon on the right).
- Two-column body with the existing problem/solution copy as bullets.
- Single bottom video band with `VideoPlayer` centered, max-width 620px.
- **Remove** the floating chat-bubble mock card (it's the source of the current overlap) and the `Bars`, `Bubble` helpers.
- Keep `framer-motion` import out; static layout.

### E. `SlideSmartClassroom.tsx` — remove the planet animation
- Delete the `PlanetAnim` component and its usage (the orbiting Earth-around-Sun graphic — the "third image animation").
- In its place, show only the `AUTO-GENERATED · Earth's Revolution around the Sun` label centered, with the source caption underneath, so the smart-board mock stays clean. No animation.
- Leave the rest of the slide untouched.

### F. `SlideInClassQuiz.tsx` — polish
- Tighten the 4-step timeline: equalize card heights, align icon + time chip on one row, use consistent `#94A3B8` body text and `#1E293B` divider.
- Lower-half result panels: align the two cards to the same height, switch the white card to the same dark-glass style (`rgba(255,255,255,0.04)` with `1px solid rgba(255,255,255,0.08)`) so it matches the rest of the deck.
- Use the standard category-chip pattern (`#14B8A622` bg, `#14B8A6` text, uppercase letter-spacing) instead of the bare colored label.
- Replace `framer-motion` `motion.*` wrappers with plain `div`s for consistency with the other polished slides; keep content identical.

## Out of scope
- Hero, Problem, Solution (slide 3), Teacher Dashboard, Student Dashboard, CTA.
- No backend, routing, or data changes.

## Note on slide numbering
Interpreting "slide 13" as **Smart Classroom** and "slide 14" as **In-Class Quiz** based on their position in the deck (`SLIDES` array in `src/pitch/slides/index.ts`). If you meant the files literally named `Slide13PDFChat` / `Slide14MindMaps`, say the word and I'll retarget those instead.
