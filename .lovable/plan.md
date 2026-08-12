# Podcast has no voice: the rate limiter is blocking every audio call

## What the error actually is

"Edge Function returned a non-2xx status code" is the generic message the Supabase client shows when it does not read the error body. The real response, confirmed in the function logs, is:

```text
POST | 429 | .../functions/v1/elevenlabs-podcast-tts   (x20+ in a row, ~400ms each)
```

429 = "Rate limit exceeded". This is NewtonAI's own limiter, not ElevenLabs and not Gemini.

## Why it happens (verified)

- `rate_limit_config` sets `elevenlabs-podcast-tts` to **10 requests per 60 minutes per user**.
- The current user's `rate_limits` row is at **request_count = 10** since 05:57 UTC — the bucket is full, so every further call is rejected before any TTS runs.
- The podcast client sends **one request per 8 segments**, 2 chunks in parallel. A 22-segment episode = 3 calls; a regeneration plus a "Restore missing audio" pass burns 6 more. Three episodes in an hour exhausts the quota.
- Every rejected call marks its 8 segments as failed, so the player sees 22 of 22 without studio audio and falls back to the browser voice. Nothing is wrong with Gemini TTS or storage.

So the limiter counts **HTTP calls**, but the real cost unit is **segments**, and the limit was sized for an era when one podcast meant one call.

## Fix

1. **Right-size the limit.** Raise `elevenlabs-podcast-tts` in `rate_limit_config` to a per-hour budget that fits real usage (e.g. 120 requests/hour ≈ 15 average episodes), keeping abuse protection meaningful since each call is capped at 8 segments anyway.
2. **Don't charge the quota for cache hits.** Segments already in `tts_audio_cache` cost nothing; "Restore missing audio" on an existing episode should not be able to lock a user out.
3. **Surface the real error.** Read the edge function's JSON error body in `src/pages/tools/AIPodcast.tsx` so the banner says "Voice generation limit reached — try again in X minutes" instead of "non-2xx status code".
4. **Stop hammering on 429.** When a chunk returns 429, abort the remaining chunks for that run instead of firing every remaining request and failing them all.
5. **Fewer calls per episode.** Raise the per-request segment cap from 8 to 12 so a typical episode needs 2 calls instead of 3.
6. **Retry after cooldown.** The "Restore missing audio" button should be disabled with a countdown while the window is cooling down, rather than failing instantly.

## Technical notes

- Migration: `UPDATE public.rate_limit_config SET max_requests = ..., window_minutes = 60 WHERE function_name = 'elevenlabs-podcast-tts';` (config-driven, no function code needed for the limit itself).
- `supabase/functions/elevenlabs-podcast-tts/index.ts`: move the rate-limit check to run after the segment/cache resolution so fully cached requests skip it; return `retryAfterMinutes` in the 429 body; bump `MAX_SEGMENTS_PER_REQUEST`.
- `src/pages/tools/AIPodcast.tsx`: in `voiceSegments`, parse `error.context` / response body, propagate a typed rate-limit error, and short-circuit the remaining chunk groups.
- `src/components/podcast/PodcastPlayer.tsx`: show the specific message and a cooldown-aware Restore button.
- No storage or schema changes; existing episodes recover once a call succeeds.
