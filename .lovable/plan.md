## Problem

On every study tool page (Quiz, Flashcards, Podcast, Mind Map, Lecture Notes, Summarizer, Homework Help, PDF Chat), the input card (Upload / Recording / YouTube / Text tabs) only appears after a ~5s delay. The page header and educational sections render immediately, but the interactive area is blank for several seconds.

## Root cause

The input card is wrapped in `<ToolAuthGate>` (`src/components/ToolAuthGate.tsx`). That component calls `supabase.auth.getSession()` in a `useEffect`, holds a `loading` state, and **returns `null` while loading**. The blank period is the time it takes for the auth session promise to resolve (plus any cold-start of supabase-js). Nothing else gates this UI — it's purely the loading null.

## Fix

Make `ToolAuthGate` render its children optimistically and only fall back to the signup CTA once we know the user is an exhausted guest. Concretely:

1. Initialize `session` synchronously from `supabase.auth` cached session if available; otherwise treat as "unknown" and **render children immediately**.
2. Remove the `if (loading) return null;` early-return. Replace with: render `children` by default; once auth resolves, if `!session && guestLimitReached`, swap to the fallback CTA.
3. Keep the guest banner ("Sign up to save…") logic, but only show it after the session check resolves and confirms guest (avoid flicker by hiding it during the brief unknown window).
4. Keep `onAuthStateChange` subscription intact.

This is a single-file change in `src/components/ToolAuthGate.tsx` and fixes the delay across all 8 tool pages at once — no per-page edits needed.

## Verification

- Open `/tools/quiz`, `/tools/flashcards`, `/tools/podcast`, `/tools/mind-map`, `/tools/lecture-notes`, `/tools/summarizer`, `/tools/homework-help`, `/pdf-chat` — the upload tabs should appear in the same frame as the header.
- Logged-in user: no flicker, no CTA shown.
- Guest with remaining trial: input visible immediately, small "Sign up to save…" hint appears after session resolves.
- Guest with exhausted trial (localStorage `guestLimitReached=true`): input briefly visible, then replaced by "Create a free account" CTA after session resolves. (Acceptable trade-off; exhausted-guest case is rare and the CTA still appears.)

## Out of scope

No changes to per-tool components, no changes to generation logic, no changes to `ContentInputTabs`. Only the auth gate rendering behavior.
