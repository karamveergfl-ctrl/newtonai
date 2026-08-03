# SmartBoard Classroom: Full-Screen Teaching Stage

Three UI/UX changes to the classroom screen. No backend, schema, auth, routing or edge function changes.

## 1. Remove Quick Topics

Delete the Quick Topic chip row from the classroom. `QuickTopicChips` is no longer rendered (the component file stays but is unused, or is removed if nothing else imports it). The results area keeps its own no-results suggestion chips.

## 2. Document / Whiteboard panel goes full screen

Today the Document/Whiteboard panel is a 380px left column and the video search takes the rest of the screen. That flips:

- The Document/Whiteboard stage fills the whole area under the top bar (`100vh - 56px`), edge to edge.
- The dashed upload card becomes a large centred drop zone on that full-screen surface, keeping click-anywhere upload, drag-over state and the two hint rows.
- Whiteboard mode fills the same full area; the annotation tool row floats at the bottom.
- The separate right-hand "Find an Educational Video" panel is removed as a permanent column.

## 3. Search strip moves into the tab bar

The Document / Whiteboard pill tabs move to the top bar row, and the search input sits immediately to their left/right on that same strip:

```text
[logo | 6A]  [ Search any topic ...  (Search) ]  [Document|Whiteboard]   ... clock  ACTIVE  Exit
```

- Search field: compact 44px pill matching the reference styling (dark `#151C2B`, magnifier icon, clear button, gradient Search button).
- Submitting a search opens the results as an overlay over the stage: same video card grid, skeletons while loading, error + retry, and the no-results suggestions. A close control returns to the document/whiteboard.
- While a document is open, results still appear in the existing thin `VideoStrip` rail pinned above the page rather than covering it.
- Below 1000px the search field drops to a second row under the tabs so nothing is clipped.

## 4. Text-to-video search on the uploaded document

Selecting text in an open document is supposed to surface "Find animation videos", but it never fires: `.smartboard-classroom` sets `user-select: none` globally for kiosk mode, so the browser makes no selection at all.

Fix:
- Scope the kiosk `user-select: none` so the document page/text layer is exempt (`.smartboard-doc-selectable { user-select: text }` applied to the PDF text layer, the extracted-text article and the image stage).
- Keep the existing selection handler and the "Find animation videos" action bar, which already calls the search with `action: "select_text"`.
- Results from a selection render in the top rail above the document, so the teacher never loses the page.
- Verify for all three document kinds: PDF (react-pdf text layer), extracted DOCX/PPTX text pages, and images (no selection — action bar simply doesn't appear).

## Technical notes
- Files touched: `src/pages/smartboard/SmartBoardClassroom.tsx`, `src/components/smartboard/DocumentStage.tsx`, `src/components/smartboard/VideoResultsGrid.tsx` (overlay container styling only), `src/index.css`.
- Untouched: all edge functions, `sb_*` tables and RLS, `smartboardSession.ts`, `WhiteboardCanvas`, `TeacherNotesPanel`, `SmartBoardVideoPlayer`, `IdleScreen`, and every non-classroom route.
- Layout and text selection verified with a headless browser pass at 1920x1080 after implementation.
