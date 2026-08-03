# SmartBoard Classroom Redesign

Full visual and UX rebuild of the classroom screen, with permanent kiosk login and instant load. No backend, schema, auth, or routing architecture changes.

## What changes

### 1. Permanent device login (verify + harden)
The session already uses `localStorage` with no expiry, and `SmartBoardDeviceRedirect` already sends `/` to `/smartboard/classroom`. Work here is confirmation plus small hardening: keep the guard checking only that `deviceToken` + `boardId` exist, and add the optional `activationCode` field to the session type so it can be stored when the board signs in.

### 2. Classroom redesign (two-column)
- Top bar reduced to 56px, background `#0D1117`, logomark + divider + stacked board/institution name, tabular-nums live clock, ACTIVE pill with pulsing dot, outlined Exit button.
- Exit now opens a confirmation dialog ("Exit SmartBoard? You will need to enter the activation code again.") with Cancel / Exit and Clear.
- Body becomes `100vh - 56px`, no outer scroll, background `#0A0F1A`.
- **Left panel (380px)**: Document / Whiteboard pill tabs. Document mode shows the dashed upload zone (click-anywhere + drag-over state) or, once loaded, the page viewer with prev/next, page indicator, annotation tool row (pen, highlighter, eraser, clear, undo) and a close button. Whiteboard mode renders the existing `WhiteboardCanvas` untouched.
- **Right panel (flex-1)**: heading with result-count pill, 56px search bar with gradient Search button and clear control, subject-coloured Quick Topic chips (Science / Maths / Physics / Chemistry), and a scrolling results area.
- Results area: 6 subject gradient cards before the first search, 3x3 skeleton grid while loading, responsive 2/3-column video card grid with hover lift, duration badge, hover play overlay and a "Play for Class" button, and a no-results state with suggestion chips.
- Below 1200px the two panels stack vertically (search first).

### 3. Video player overlay
Rebuilt full-screen overlay: blurred backdrop, 60px header (thumbnail, title, channel, "Playing for class" badge, mute / fullscreen / close), 16:9 centred player, and an "Up Next" bottom strip built from the current results. Escape closes, F toggles fullscreen, K/Space play-pause via the YouTube iframe API.

### 4. Idle screen
Idle timeout moves from 5 to 10 minutes. Redesigned overlay at z-40 (below the player): gradient background, logo + NewtonAI / SmartBoard lockup, giant HH:MM clock, full date, and a pulsing "Touch anywhere to continue teaching" line, with fade in/out.

### 5. Usage logging
Search already logs through `smartboard-video-search` (it takes an `action` field) and plays log through `smartboard-log-play`. There is no `smartboard-log-usage` function in this project, so logging will keep using those two existing functions — every search and every play fires one, silently, never blocking the UI. `sb_boards.last_active_at` is refreshed by the existing `smartboard-session` verify call on mount.

### 6. Kiosk CSS + instant load
A `.smartboard-classroom` wrapper class in `index.css` disables text selection, tap highlight, overscroll and visible scrollbars, and pins Plus Jakarta Sans at 16px base. In `App.tsx` the classroom is imported eagerly instead of lazily, and the Suspense fallback becomes a dark `#0A0F1A` panel so there is no white flash. Board name and institution render synchronously from localStorage on first paint.

### 7. Fonts
`index.html` already loads Plus Jakarta Sans (400-700); the weight list gets `800` added for the new display headings.

## Technical notes
- Files touched: `src/pages/smartboard/SmartBoardClassroom.tsx`, `src/components/smartboard/` (VideoResultsGrid, VideoCard, QuickTopicChips, SmartBoardVideoPlayer, IdleScreen, DocumentStage, TeacherNotesPanel), `src/components/routes/SmartBoardDeviceRedirect.tsx`, `src/lib/smartboardSession.ts`, `src/App.tsx`, `src/index.css`, `index.html`.
- Untouched: all edge functions, `sb_*` tables and RLS, `/smartboard/activate`, `/smartboard-admin/*`, `/admin/smartboards`, `WhiteboardCanvas`, and every non-classroom route.
- Layout verified at 1920x1080 and 3840x2160 via a headless browser pass after implementation.
