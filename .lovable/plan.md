# Podcast: how it works, and why the voice is missing

## The full pipeline (verified in code)

```text
AIPodcast.tsx (src/pages/tools/AIPodcast.tsx)
  1. Input -> text extraction (PDF / YouTube / paste)
  2. invoke "generate-podcast-script"  -> { title, segments[{speaker,name,text,emotion}] }
  3. Voicing loop: segments sliced into chunks of 6, sent to
     "elevenlabs-podcast-tts" (server cap = 8 segments/request)
        edge fn -> auth check -> rate limit -> per segment:
             cleanTextForSpeech -> cacheHashes -> lookupCachedAudio (tts_audio_cache)
             miss -> chunkText(1800) -> synthesizeSpeech (_shared/tts-router.ts)
                       Kokoro via OpenRouter (hexgrad/kokoro-82m, English only)
                       else ElevenLabs fallback
             -> storeAudio() uploads MP3 to private "tts-cache" bucket
             -> returns 1-year signed URL + engine + fallbackReason
             -> trackTTSUsage() into tts_usage_events
  4. Row saved into public.podcasts (script + audio_segments incl. audioUrl)
  5. setPodcast() -> PodcastContext -> usePodcastAudioQueue
        getAudioSrc(): segment.audioUrl (signed URL) OR legacy base64 data URI
        no src -> browser Web Speech (the "robotic voice")
        buffers 4 segments ahead, plays serially with a 300ms gap
  6. PodcastPlayer / MiniPlayer show engine badges + failure reasons
```

## What the data actually shows

- `tts_usage_events` contains only today's verification runs — all `provider = openrouter`, audio produced fine (podcast, read-aloud and direct tts rows).
- `public.podcasts`: **every saved episode has 0 segments with an `audioUrl`.** The two most recent episodes (2026-08-10, 2026-07-16) carry `audioError: "ElevenLabs API error: 404"` on every segment; older ones stored no audio at all.
- No podcast has been generated through the app since the Kokoro/OpenRouter migration, so every episode in history predates working audio.

So the player is not broken — it is handed segments with no audio and correctly degrades to the browser voice. Two distinct causes:

1. **Historical episodes are permanently voice-less.** They were generated while ElevenLabs returned 404 (invalid/expired voice or key). Replaying from history always uses Web Speech, because nothing re-runs TTS on playback.
2. **Non-English episodes still have no working engine.** Kokoro via OpenRouter is English-only (`KOKORO_LANGUAGES = {"en"}`), and the ElevenLabs fallback is the same connector key that returned 404. Hindi/Bengali/Tamil podcasts fall straight back to the browser voice.

Secondary risks found while tracing: a 44-segment script needs 8 sequential edge calls (slow, and one failed chunk silently marks 6 segments as fallback), and signed URLs are minted for 1 year but never refreshed when an old episode is replayed.

## Fix plan

1. **Re-voice on playback.** When an episode is opened from history and its segments lack `audioUrl`, call `elevenlabs-podcast-tts` again (cache makes repeats nearly free) and persist the refreshed `audio_segments` back to the `podcasts` row. This alone restores voice for all existing English episodes.
2. **Refresh dead signed URLs.** Add an `onerror` re-fetch path in `usePodcastAudioQueue` so an expired URL triggers one re-request instead of dropping to Web Speech.
3. **Confirm the ElevenLabs fallback.** Verify the connector key with a single voice call; if it still 404s, either fix the connector or show an explicit "voice unavailable in this language" notice instead of silently using the robotic voice.
4. **Harden the voicing loop.** Retry a failed chunk once, and surface one clear banner ("x of y segments have no audio — reason") instead of per-segment silence.
5. **Speed.** Send chunks of 8 (the server cap) and run two chunk requests in parallel to roughly halve generation time on long scripts.

## Technical notes

- Files touched: `src/pages/tools/AIPodcast.tsx`, `src/hooks/usePodcastAudioQueue.ts`, `src/components/podcast/PodcastPlayer.tsx` (banner), `supabase/functions/elevenlabs-podcast-tts/index.ts` (retry only).
- No schema changes; `tts_audio_cache` and `tts_usage_events` already cover dedupe and cost tracking.
- Language gating stays in `_shared/tts-router.ts` (`KOKORO_LANGUAGES`).