

# Part 4 — Live Session & Classroom Experience Enhancement

## Current State Audit

| Sub-feature | Status |
|---|---|
| Session creation dialog (text/file/YouTube + interaction settings) | Done |
| SmartBoard with whiteboard, canvas, undo/redo, multi-page | Done |
| Document teaching view (PDF render + annotation) | Done |
| Pulse meter + confusion alert | Done |
| Question wall + auto-answer | Done |
| Voice commands | Done |
| Walk-in banner | Done |
| Lecture capture (speech transcription) | Done |
| Handwriting recognition (OCR) | Done |
| Concept checks | Done |
| Spotlight sync | Done |
| Live notes generation | Done |
| **Text selection floating menu on PDF** | Missing |
| **Video search from selected text** | Missing |
| **In-classroom YouTube player with "Play for Class" sync** | Missing |
| **Session end progress modal (6-step checklist)** | Missing — currently instant redirect |
| **PDF thumbnail strip (left sidebar of pages)** | Missing — only prev/next arrows |
| **Quiz generation from PDF selected text** | Missing in classroom context |
| **"Ready to Teach" state before GO LIVE** | Missing — session starts immediately |

Given the size, I'll implement the **4 highest-impact missing features** that the spec explicitly calls out and are most visible to users.

## Plan — 4 Changes

### 1. PDF Thumbnail Strip in Document Teaching View

Modify `DocumentTeachingView.tsx` to add a left sidebar showing small page thumbnails (60px wide). Clicking a thumbnail jumps to that page. Current page highlighted with indigo ring. Scrollable strip for large documents.

### 2. Text Selection Floating Action Menu

Create `src/components/smartboard/TextSelectionMenu.tsx` — a floating popover that appears when the teacher selects text on a PDF page in the Document Teaching View:
- Detect `mouseup`/`touchend` on the PDF content area
- Get `window.getSelection().toString()`
- If non-empty, show a floating menu at the selection position with 4 buttons:
  - **Search Video** — opens a video search panel (invokes existing `search-youtube` edge function)
  - **Generate Quiz** — sends selected text to `generate-quiz` edge function, shows results inline
  - **Explain to Class** — sends text to Newton Chat for a class-friendly explanation
  - **Add to Notes** — appends text to current slide notes

Wire this into `DocumentTeachingView.tsx` by enabling the text layer (`renderTextLayer={true}`) so text is selectable.

### 3. In-Classroom YouTube Player Panel

Create `src/components/smartboard/ClassroomVideoPlayer.tsx`:
- Search bar at top — teacher types a topic, results from `search-youtube` edge function shown as cards (thumbnail, title, channel, duration)
- Click a result → embedded YouTube iframe player loads
- "Play for Class" button broadcasts the video URL + timestamp via Supabase Realtime channel `video-sync:{sessionId}`
- Student side (`StudentLiveView.tsx`): listen on the same channel, show a "Teacher is showing a video" overlay with the embedded player
- "Stop Video" button on teacher side removes the broadcast

Add a "Video" view option to `SmartBoardToolbar.tsx` (alongside session/whiteboard/document).

### 4. Session End Progress Modal

Create `src/components/smartboard/EndSessionModal.tsx`:
- When teacher clicks "End", show a modal with 6 checklist steps instead of instant redirect:
  1. Saving whiteboard snapshots — save canvas pages as data URLs to `live_sessions.whiteboard_data`
  2. Saving lecture transcript — already saved incrementally, just confirm
  3. Processing OCR notes — confirm notes saved
  4. Generating AI study guide — invoke `generate-session-guide` edge function
  5. Updating Newton Chat corpus — invoke `trigger-all-student-reports`
  6. Finalizing attendance — mark session as ended
- Each step shows: spinner → green checkmark as it completes
- Steps run sequentially, ~2-3 seconds each
- On completion: "Session Complete ✓" with "View Report" button → navigates to teacher report

Modify `ClassDetail.tsx` `handleEndSession` and `SmartBoardPanel.tsx` `onEndSession` to use this modal instead of the current instant update.

## Files Changed

| File | Action |
|---|---|
| `src/components/smartboard/DocumentTeachingView.tsx` | Modify — add thumbnail strip, enable text layer |
| `src/components/smartboard/TextSelectionMenu.tsx` | Create — floating action menu on text selection |
| `src/components/smartboard/ClassroomVideoPlayer.tsx` | Create — video search + player + realtime sync |
| `src/components/smartboard/EndSessionModal.tsx` | Create — 6-step progress modal for session end |
| `src/components/smartboard/SmartBoardToolbar.tsx` | Modify — add "Video" view option |
| `src/components/live-session/SmartBoardPanel.tsx` | Modify — wire video view, end session modal |
| `src/components/live-session/StudentLiveView.tsx` | Modify — add video sync listener overlay |
| `src/pages/teacher/ClassDetail.tsx` | Modify — use EndSessionModal |

No database migrations needed — uses existing tables and Supabase Realtime channels.

