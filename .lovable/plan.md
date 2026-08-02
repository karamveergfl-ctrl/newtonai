## Goal

Today a classroom board can only be activated with a per-board activation code (`/smartboard/activate`), and onboarding offers just Student and Teacher. You want: one school account (school email + password), used to sign in on every board of that school, and then pick **SmartBoard** on the onboarding screen to turn that device into a board.

## What exists today (verified)

- `sb_institutions`, `sb_boards`, `sb_institution_admins` tables with RLS; `sb_admin_institution(user_id)` and `is_sb_admin()` helpers already exist.
- Board auth is a device token (`sb_boards.device_token_hash`), minted only by the `smartboard-activate` edge function from an activation code.
- `src/pages/Onboarding.tsx` renders exactly two role tiles and redirects to `/dashboard` when `profiles.onboarding_completed` is true.

## Plan

### 1. New edge function: `smartboard-signin`
- Accepts the caller's user JWT plus an optional `boardId`.
- Verifies the user is an admin of a school via `sb_institution_admins`, and that the school is active and unexpired.
- Returns the school's board list when no `boardId` is given; when a `boardId` of that school is supplied, mints a fresh device token (same hashing as `smartboard-activate`), stores it on the board, marks `activated_at`/`last_active_at`, and returns the board context.
- Reuses `_shared/smartboard-auth.ts` (`sha256`, `newDeviceToken`, `json`, `corsHeaders`).

No schema change is required — the activation-code path keeps working unchanged as a fallback.

### 2. Client helper
Add `listSchoolBoards()` and `signInBoardAsSchool(boardId)` to `src/lib/smartboardSession.ts`, writing the returned token into the existing local board session.

### 3. Onboarding: third role tile
In `src/pages/Onboarding.tsx`:
- Add a **SmartBoard** tile ("Classroom board — sign in this display for your school") next to Student and Teacher, with a monitor icon and matching card styling.
- Selecting it opens a new `SmartBoardOnboarding` step (`src/components/onboarding/SmartBoardOnboarding.tsx`) that:
  - calls `listSchoolBoards()`;
  - if the account is not a school account, shows a clear message plus a link to `/smartboard/activate`;
  - otherwise lists the school's boards (name, grade, subject) — tap one to sign this device in, then navigate to `/smartboard/classroom`.
- Adjust `checkAuth` so a signed-in school account is not force-redirected to `/dashboard` before it can pick SmartBoard (keep the redirect for normal students/teachers, and skip it when the user has a SmartBoard school membership).

### 4. Entry points
- On `/auth` and `/smartboard/activate`, keep existing links but point school staff at "Sign in with your school account", which lands on onboarding's SmartBoard step.
- `SmartBoardRoute` and the classroom screen stay as-is — they still just need a valid device token.

## Notes

- School accounts are created the same way as now: a platform admin creates the school in `/admin/smartboards` and links the school's email via the existing `sb_link_institution_admin` RPC. Signing in on each board simply reuses that one account.
- Signing a board in from a new device replaces its token, so the previous device for that board is signed out — that keeps one token per board. Tell me if you'd rather allow multiple simultaneous devices per board; that needs a small token table instead.
