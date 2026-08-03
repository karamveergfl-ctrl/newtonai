# SmartBoard: Proper Animation Video Results

Replaces the thin top rail and the side notes tab with one full results panel, matching the student text-to-video experience.

## 1. Remove the thin video rail

The cramped "Animation videos — ..." strip above the document (clipped titles, tiny thumbnails) is deleted. `VideoStrip` is no longer rendered anywhere and the component file is removed.

## 2. Remove the Notes tab

The floating "Notes" tab on the right edge of the document is removed. `TeacherNotesPanel` is no longer mounted in the classroom, and `DocumentStage` no longer takes `sideSlot`/`topSlot`.

## 3. One results panel for both entry points

Selecting text in a document and pressing "Find animation videos" now opens the same full results panel as the top-bar search — the layout in the second reference image:

```text
[X Close]
[sparkle]  bolted joints including eccentrically loaded joints
[  Animation (8)   |   Explanation (8)  ]
-------------------------------------------
[thumb 6:49]   Title
               Channel · Animated · 1.2K views
[thumb 10:32]  Title
               ...
```

- Two tabs: **Animation** (default) and **Explanation**, each with a count.
- Wide horizontal rows: large thumbnail with duration badge on the left; title, channel, "Animated" tag, view count and a Play for Class action on the right.
- Skeleton rows while loading, error + Retry, and the no-results suggestion chips are kept.
- The panel scrolls; the document stays mounted behind it and reappears on Close at the same page and zoom.
- Opens the same way for typed searches, suggestion chips and text selections.

## 4. Make the animation search accurate

Search quality work in the `smartboard-video-search` edge function:

- Return two ranked buckets, `animation` and `explanation`, instead of one flat list, so the tabs are real rather than duplicates.
- **Animation bucket**: requires animation signals (animated / 3d / 2d / simulation / visualisation title terms, or a known animation channel) plus topic relevance; strongly demotes handwritten-whiteboard uploads, exam-solution walkthroughs and anything over ~20 minutes.
- **Explanation bucket**: on-topic teaching videos that are not animation-first, ordered by relevance then views.
- Broader candidate pool: run two YouTube queries (an animation-biased one and a plain topic one), merge and de-duplicate before scoring, so a niche topic like "design of threaded fasteners" is not left with a single unrelated Short.
- Selected text is cleaned before searching: trailing punctuation stripped and capped to a sensible phrase length, so the query is the concept rather than a whole sentence.
- Shorts, `#shorts`, live classes and "one shot" lectures stay filtered out; the 48h cache is kept with the cache key extended for the new two-bucket shape.

## Technical notes
- Touched: `src/pages/smartboard/SmartBoardClassroom.tsx`, `src/components/smartboard/DocumentStage.tsx`, a new `SmartBoardResultsPanel` (row-variant cards reusing `VideoCard` styling), `supabase/functions/smartboard-video-search/index.ts`, `src/lib/smartboardSession.ts` (response type gains `animation` / `explanation`).
- Deleted: `src/components/smartboard/VideoStrip.tsx`; `TeacherNotesPanel` unmounted from the classroom.
- Untouched: auth/device tokens, `sb_*` tables and RLS, whiteboard, idle screen, player, usage logging, and all non-SmartBoard routes.