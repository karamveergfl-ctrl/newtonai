---
name: TTS provider chain
description: Google Gemini TTS via Lovable AI Gateway is primary for all speech; ElevenLabs fallback; Kokoro/OpenRouter last resort.
type: feature
---
Order for every server TTS call (`supabase/functions/_shared/tts-router.ts`):
1. `google/gemini-2.5-flash-tts` via Lovable AI Gateway `/v1/audio/speech` (SSE, PCM) — no provider key, billed in Lovable credits. ~1.9s per short segment.
2. ElevenLabs (mp3) when Gemini fails or is unconfigured.
3. Kokoro/OpenRouter only when neither of the above is available.

Gemini voices by role: host1=Kore, host2=Puck, tutor=Charon (`_shared/gemini-tts.ts`).
Gemini returns raw PCM; multi-chunk turns are joined with `concatPcmToWav` under one 24kHz mono WAV header, stored with `extension: "wav"` / `contentType: "audio/wav"`. Other engines stay mp3.
Provider label in `tts_audio_cache` / `tts_usage_events` for Gemini is `lovable-ai`.
