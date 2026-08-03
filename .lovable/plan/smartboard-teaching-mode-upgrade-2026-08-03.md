# SmartBoard Teaching Mode Upgrade

Rework the classroom screen so the document is the main stage, animation videos sit in a thin strip above it, and the teacher has a one-click notes panel.

## 1. Home: upload card first

The classroom home leads with a large dashed upload zone (drop or click to browse), matching the reference: title, supported formats line (Images, PDF, DOC, DOCX, PPT, PPTX - max 50MB), and two hint rows underneath — "Topic-Based Video Search" and "Screenshot to Solve". The search bar and quick topic chips stay below it, so a teacher can either open material or search a topic directly.

## 2. Full-screen document viewer

Opening a file switches the board into a dedicated viewer that fills the screen (like the third reference):
- Floating top toolbar: page back/forward, "14 / 48" page counter, zoom out / zoom % / zoom in, fit-to-width, screenshot, close.
- Page fills the available height; no page chrome competing with it.
- Selecting any text on the page still triggers the animation-video search.

## 3. Video strip pinned above the document

Search results appear as a thin horizontal, side-scrolling strip docked to the top of the document (never pushing content below the fold):
- Compact cards: thumbnail, duration badge, title, channel.
- Only animation results are shown.
- The strip can be collapsed to a single slim bar and reopened.
- Clicking a card opens the existing full-screen player.

## 4. Animation-only, on-topic results, 5 at a time

- Backend query becomes animation-focused, and results are scored/filtered so non-animation lecture recordings, shorts, and off-topic hits drop out (title/description/channel signals plus topic-term overlap with the search phrase).
- The strip shows the top 5 first with a **Load more** button that reveals the next batch from the same result set (no extra API call, no extra quota).
- If filtering leaves fewer than 5 animation matches, the closest remaining on-topic results are shown with a note rather than an empty strip.

## 5. Teacher side notes panel

A slide-in panel on the right edge, opened with a single tap on a persistent tab/button while a document is open:
- Free-form large-text notes area sized for board writing.
- Notes are kept per open document while the board session lasts, with clear and copy actions.
- Panel slides over the document without resizing it, and closes with the same tab or Escape.

## Technical notes

- `src/pages/smartboard/SmartBoardClassroom.tsx`: restructure into "home" vs "document" modes; document mode renders viewer + top video strip + notes panel.
- `src/components/smartboard/DocumentStage.tsx`: rebuild the empty state as the upload card; the loaded state becomes the full-screen viewer shell (PDF via react-pdf, extracted DOCX/PPTX text pages, images).
- New `VideoStrip.tsx` (thin scroller + collapse + Load more) used instead of `VideoResultsGrid` in document mode; the grid stays for the home search view.
- New `TeacherNotesPanel.tsx` for the slide-in panel.
- `supabase/functions/smartboard-video-search/index.ts`: animation-biased query, post-filter/rank for animation + topic relevance, return up to 15 ranked results so the client can page 5 at a time; cache key updated for the new ranking.
- `src/lib/smartboardSession.ts`: pass the larger limit through `searchBoardVideos`.
