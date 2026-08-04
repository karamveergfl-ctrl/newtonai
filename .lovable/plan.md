# SmartBoard: 6-video animation panel docked over the document

Bring back the older preview's text-to-animation search behaviour and present results as a compact card grid on top of the document — exactly 6 videos, all visible in one frame, no scrolling, with a close button.

## What changes

1. **Results overlay instead of the scrolling list**
   - Replace the current full-height list panel with a docked overlay anchored to the top of the document/whiteboard stage.
   - It covers the upper portion of the stage (roughly 55-60% height) so the document stays visible underneath; the document does not unmount.

2. **Exactly 6 videos, one frame, zero scroll**
   - Fixed 3x2 card grid (2x3 on narrower boards), cards sized from the available panel height so nothing overflows.
   - Only the top 6 ranked results are shown.
   - Card = thumbnail + duration badge + 2-line title + channel + Play button, matching the reference grid look (reuse the existing `VideoCard` in a compact variant).

3. **Close button**
   - A clear Close (X) control in the panel header, plus Escape to dismiss. Closing returns the full stage to the document.
   - Header shows the topic name, "N animation videos", and the close button.

4. **Search behaviour restored from the older preview**
   - Typed searches from the top bar and text selected inside an uploaded PDF/DOCX/PPTX both open the same overlay.
   - Loading shows 6 skeleton cards in the same fixed grid (no layout jump); error and empty states stay inside the panel with retry / suggested topics.

5. **Better animation matches**
   - Fetch a larger candidate pool and keep only the best 6 by animation + topic-relevance score, so the 6 shown are genuinely animated and on-topic.

## Technical notes

- `src/components/smartboard/AnimationResultsPanel.tsx` — rewritten as a docked, non-scrolling 6-card grid overlay with header + close button (uses `VideoCard`).
- `src/pages/smartboard/SmartBoardClassroom.tsx` — panel rendered as a top-docked overlay inside `<main>` instead of `inset-0`; results sliced to 6; Escape-to-close.
- `supabase/functions/smartboard-video-search/index.ts` — keep existing animation scoring, rank over the larger pool and return the top 6.
- No database or auth changes.