# Kokoro TTS Integration (Kokoro-first, ElevenLabs fallback)

Route all NewtonAI speech through your self-hosted Kokoro server, keeping ElevenLabs as an automatic fallback and browser speech as the last resort. No Python runs inside the app — the app only calls your Kokoro HTTP API.

## What you need to provide
Your live Kokoro server details, stored as backend secrets (never in code):
- `KOKORO_TTS_URL` — e.g. `https://tts.yourdomain.com`
- `KOKORO_TTS_TOKEN` — optional bearer token if your server is protected

I will request these securely before wiring the calls. Your server must expose a POST endpoint accepting `{ text, voice, speed, format }` and returning audio bytes (`audio/mpeg` or `audio/wav`).

## 1. Shared TTS router (backend)
A new shared module used by every voice feature:
- Try Kokoro first (with timeout + one retry).
- On Kokoro failure/unreachable, fall back to ElevenLabs with the existing voices.
- Return the audio plus which engine actually produced it, so the UI can show it.
- Voice map per host/language: Kokoro `af_heart` (Host 1 / female) and `am_michael` (Host 2 / male), with per-language overrides where Kokoro supports them; ElevenLabs keeps its current IDs.

## 2. AI Podcast
- `elevenlabs-podcast-tts` becomes engine-agnostic (`podcast-tts`, old name kept working so saved episodes don't break).
- Same chunking as today: max 8 segments per call, small concurrency, MP3 uploaded to the private `podcast-audio` bucket, signed URL returned.
- Kokoro concurrency can be higher than ElevenLabs' since it is your own box — configurable, defaults to 4.
- Existing status panel gains an "Engine: Kokoro / ElevenLabs / Browser" badge per segment and names the reason when it falls back.

## 3. Read-aloud / general TTS
Study-tool read-aloud calls the same router; audio for repeated static text is cached in storage by a hash of text+voice so the same paragraph is never regenerated.

## 4. Voice chat tutor (latency sensitive)
- Streams from Kokoro if your server supports a streaming/chunked response; otherwise generates short (<800 char) replies in one shot as today.
- Automatic ElevenLabs fallback if Kokoro exceeds a ~4s time-to-first-byte budget, so the tutor never goes silent.

## 5. Health + observability
- A lightweight Kokoro health check so a dead server flips traffic to ElevenLabs immediately instead of timing out per request.
- Engine, latency and failure reason logged per request for the cost audit.

## Technical notes
- New: `supabase/functions/_shared/tts-router.ts`, `supabase/functions/_shared/kokoro.ts`.
- Updated: `elevenlabs-podcast-tts`, `voice-chat-tts`, `src/components/podcast/PodcastPlayer.tsx`, `usePodcastAudioQueue.ts`, `AIPodcast.tsx`.
- Podcast audio contract stays `audioUrl` (signed), so no player rewrite; legacy base64 path untouched.
- Merging into a single MP3 stays client-side as today (no FFmpeg server needed); if you later want one stitched file server-side, that's a follow-up.

## Out of scope
The Kokoro FastAPI server itself — it already runs on your host; this plan only consumes it.
