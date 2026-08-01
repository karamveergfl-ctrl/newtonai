# SmartBoard Plan for NewtonAI

A separate product tier for schools: each classroom board is activated once, then opens straight into a teaching screen with document display and instant animation-video lookup. Nothing else from NewtonAI is reachable from those screens.

## Decisions locked in

- Fully separate tables (`sb_*`) — the existing institution/department/course system is untouched.
- Standalone school portal at `/smartboard-admin/*` — existing `/institution/*` portal untouched.
- Super admin uses the existing `admin` role and `AdminRoute`.
- **No PIN, no password on the board.** One-time activation, then the board never asks again.

## How the board login works (revised)

1. School admin creates a board and gets a one-time **Activation Code** (e.g. `DPS-6A-X9F2`).
2. The teacher enters it once on `/smartboard/activate`. A server function validates it, marks it used, and returns a long-lived random **device token** stored in localStorage.
3. From then on, opening the app on that board goes straight to the classroom home — no login screen, no session expiry.
4. Every board request sends the device token; the server resolves the board and logs usage. Admin can revoke or re-issue a board at any time, which instantly kills that token.

No credential is ever readable by the client, and there is no shared PIN that can leak to students.

## Classroom experience (`/smartboard/classroom`)

Optimised for 1920×1080 projectors and 65–85" touch panels: min 16px text, 64px tap targets, high contrast, no icon-only buttons.

- **Top bar:** logo, board name, school name, live clock, ACTIVE badge.
- **Teach area (default view):** drag-and-drop or tap to upload a PDF/PPTX/DOCX/image and display it full-screen with page navigation and zoom. Reuses the project's existing extraction functions; document stays local to the board.
- **Select text → videos:** highlighting any text in the document pops a floating "Find animation videos" button; tapping it shows the **top 5** animation videos for that topic in a side panel, each playable instantly.
- **Manual search:** always-visible search bar plus quick topic chips grouped by Science, Maths, Physics, Chemistry, History, Geography. Chips search on tap.
- **Video player:** full-screen overlay, YouTube iframe, large title, Fullscreen / Close buttons, keyboard shortcuts (Space, Esc, F, ←/→), "Up Next" strip of the other results.
- **Idle screen:** after 5 minutes, a branded screensaver with a large clock; any tap or key dismisses it.
- **States:** shimmer skeletons while searching, clear large empty state with alternative topic chips, and a friendly "Video search is temporarily unavailable — Retry" panel if the quota is exhausted. Never crashes.

## School admin portal (`/smartboard-admin`)

Email + password login, then a sidebar app:

- **Overview:** boards used vs allowed with progress bar, boards active today, searches this month, top topic, and a live activity feed.
- **My SmartBoards:** table of Board Name, Activation Code / status, Last Active, Actions (rename, activate/deactivate, re-issue code, delete with confirmation). "Add SmartBoard" modal enforces the school's board limit and finishes with a copyable credential screen plus **Download PDF** (A5 landscape credential card via jsPDF, already installed).
- **Usage Reports:** date-range picker, bar chart of daily searches, pie chart of top topics, line chart per board (Recharts, already installed), full sortable/filterable log table, CSV export.
- **Settings:** editable school details, read-only plan info, password change.

## NewtonAI super admin (`/admin/smartboards`)

Behind the existing `AdminRoute`. Global stats, searchable institution table, "Add Institution" modal (creates the school, its admin auth user, and emails the invite), and a detail view with all boards, full usage history, board limit, plan expiry, deactivate/delete, and re-issue code.

## Technical details

**Migration** (`sb_` prefix, all with GRANTs then RLS then policies):
- `sb_institutions` — name, type, city, state, contact name/email/phone, plan, max_smartboards, is_active, expires_at, notes.
- `sb_boards` — institution_id, board_name, grade_level, subject_focus, activation_code (unique), activation_code_used_at, device_token_hash, is_active, last_active_at.
- `sb_board_usage` — board_id, institution_id, search_query, video_id/title/channel, action (`search` | `play` | `select_text`), session_date.
- `sb_institution_admins` — institution_id, user_id, role, unique pair.
- Policies: school admins read/manage only their own rows via a `SECURITY DEFINER` membership helper (avoids recursion); app admins get full access via `has_role(auth.uid(),'admin')`; boards themselves have **no** direct client access — all board reads/writes go through edge functions with the service role. `anon` gets no grants.
- Helper functions for activation-code generation.

**Edge functions:**
- `smartboard-activate` — validates a code, issues and stores the hashed device token.
- `smartboard-session` — resolves a device token to board + school, checks `is_active` and `expires_at`, bumps `last_active_at`.
- `smartboard-video-search` — token-gated; reuses the project's existing `youtube_search_cache` table and multi-key fallback so this tier doesn't blow the YouTube quota; returns 5 results for select-text lookups, 12 for manual search, with duration and view count; logs usage server-side.

**Frontend:** new pages `SmartBoardActivate`, `SmartBoardClassroom`, `SmartBoardAdminLogin`, `SmartBoardAdminDashboard` (+ Boards/Reports/Settings), `AdminSmartboardPanel`; components under `src/components/smartboard/` and `src/components/institution-sb/`; guards `SmartBoardRoute` (device token) and `SmartBoardAdminRoute` (auth + membership). Routes added lazily in `App.tsx`. The main app chrome is suppressed for any path starting with `/smartboard`.

**Onboarding:** a third teal "SmartBoard Login" card is added to the role-selection screen in `src/pages/Onboarding.tsx` and a matching link on `src/pages/Auth.tsx`, routing to `/smartboard/activate`. The Teacher and Student cards and their flows are not modified.

**YouTube key:** the project already has `YOUTUBE_API_KEY` (plus fallback keys) in edge-function secrets, so no new secret is needed.

## Verification

Activate a board with a code and confirm the second visit skips activation; upload a document, select text, and confirm 5 videos appear and play; confirm no NewtonAI navigation or tools are reachable from `/smartboard/*`; create/deactivate a board from the school portal and confirm the board's token stops working; confirm teacher and student flows are unchanged.
