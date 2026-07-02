## Goal
Drastically reduce YouTube Data API quota consumption so one API key can support 100+ students without hitting the 10k units/day limit.

## What I'll implement (code-level fixes)

Google Cloud quota increases and multi-key rotation require account/console access outside the codebase, so those are excluded. Everything below is implementable now.

### 1. Add a server-side cache layer (biggest win)
Create a new table `youtube_search_cache` that stores search results by a normalized cache key (`query + type + pageToken`) with a 48h TTL.

```text
youtube_search_cache
├─ cache_key        text primary key   (e.g. "photosynthesis|animation|none")
├─ videos           jsonb              (array of video objects)
├─ next_page_token  text
├─ created_at       timestamptz default now()
└─ expires_at       timestamptz         (now() + 48h)
```
- RLS: locked; only `service_role` reads/writes (edge function uses service role).
- Index on `expires_at` for cleanup.
- pg_cron job (daily) deletes expired rows.

In `supabase/functions/search-youtube/index.ts`:
- Normalize query (`trim().toLowerCase()`) → build cache key.
- Look up cache first; if fresh, return immediately (0 quota units).
- On miss, hit YouTube, then write result to cache.
- Expected hit rate for a class of 100 students studying overlapping topics: 60–85% → 3–6× effective quota.

### 2. Reduce `maxResults` from 15 → 8
In `search-youtube/index.ts`. Still returns 8 videos after `#shorts` filtering (usually 6–7 clean results), which matches current UI card counts. Saves no quota per call (search.list is a flat 100 units regardless), but improves relevance and reduces `videos.list` payload.

### 3. Merge the two parallel calls into one batched call
Frontend currently calls `search-youtube` twice per topic (`animation` + `explanation`) = 2× search.list = 200 units per topic.

Change the edge function to accept `type: "both"` and run a single combined query, OR keep two calls but cache each independently (already covered by step 1). I'll keep the two-type structure but rely on cache — simpler and no UX change. **Skip this change to avoid UI churn.**

### 4. Make `videos.list` (details) call optional + cached
`videos.list` is only 1 unit, but we can skip it entirely on cache hits. Already handled by step 1.

### 5. Graceful quota-exceeded handling
When YouTube returns 403 `quotaExceeded`:
- Return stale cache entries (even if expired) as fallback.
- If no cache, return `{ videos: [], quotaExceeded: true }` with a friendly toast in `useVideoSearch.ts` ("YouTube search is temporarily unavailable, try again in a few hours").

### 6. Client-side dedupe (small win)
Add a short-lived in-memory `Map` in `useVideoSearch.ts` so rapid re-searches of the same topic within a session don't even hit the edge function.

## Expected impact
| Change | Quota saved |
|---|---|
| 48h cache with 70% hit rate | ~70% reduction |
| Stale-cache fallback on 403 | Prevents outage |
| Client dedupe | 5–10% extra |

Effective capacity with default 10k/day quota: **~333 unique topic searches/day → ~1,100+ after caching**, comfortably supporting 100 students at 20 topics/day if topics overlap (they will, per class/subject).

## Files touched
- New migration: create `youtube_search_cache` table + RLS + grants + pg_cron cleanup.
- `supabase/functions/search-youtube/index.ts` — cache lookup/write, quota-exceeded handling, `maxResults=8`.
- `src/hooks/useVideoSearch.ts` — in-memory dedupe, quota-exceeded toast.

## Not included (need your action)
- **Quota increase request** — you file this in Google Cloud Console; I can draft the justification text if you want.
- **Multi-key rotation** — against YouTube ToS.
- **Alternative providers** — separate scope; ask if you want a follow-up plan.
