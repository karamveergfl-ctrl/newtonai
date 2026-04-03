

# Fix Podcast Audio Issues & Add Personalization

## Problems Identified

1. **Voice overlap / double voice**: `stopAllAudio()` calls `cancelSpeech()` but doesn't wait for it. When `playSegment` is called rapidly (e.g. skip, seek), the previous Web Speech utterance may still be speaking when the next one starts. Also, `play()` can call `playSegment` even when a segment is already mid-play via `playingLockRef`.

2. **Voice pitch changes mid-playback**: `useWebSpeechTTS` adds random `rateVariation` on every `speak()` call (`Math.random() * 0.04 - 0.02`). This means each segment gets a slightly different rate, which on some browsers affects perceived pitch. Combined with voice re-selection happening per-segment, the voice can change.

3. **Voice changes between segments**: Voice selection runs every time `speak()` is called. If browser voices load asynchronously or the sorted order changes, a different voice may be picked. The cache helps but can be invalidated.

4. **More than two narrators**: The script generator correctly outputs only host1/host2, but the `playWithWebSpeech` voice selection may pick different voices for the same speaker across segments, creating the illusion of more narrators.

5. **Raise hand voice issues**: When raise hand opens, `pause()` is called but the response playback in `PodcastRaiseHand` can overlap with a still-finishing Web Speech utterance. After response completes, podcast resumes but may start a new segment instead of continuing.

6. **No personalization**: The podcast doesn't address the user by name or feel conversational/friendly.

## Solution

### 1. `usePodcastAudioQueue.ts` — Eliminate overlap and double-play

- **Add a `playLock` promise chain**: Instead of using a boolean `playingLockRef`, use a promise-based sequential queue so `playSegment` calls are serialized — no two can execute concurrently.
- **Await `cancelSpeech` completion**: Before starting new audio, ensure the previous `speechSynthesis.cancel()` has fully resolved by adding a small delay (50ms) after cancel.
- **Lock voice selection at session start**: On first play, resolve host1 and host2 voices once and store them in refs. All subsequent `playWithWebSpeech` calls use these locked voices — no re-selection per segment.
- **Remove random rate variation**: Delete the `rateVariation` line. Use a fixed rate per speaker for the entire session to prevent pitch drift.
- **Increase transition delay**: Bump `SEGMENT_TRANSITION_DELAY` from 150ms to 300ms to give the browser more time to fully release the previous audio context.

### 2. `useWebSpeechTTS.ts` — Stable voice locking

- **Remove `Math.random()` rate variation** — use deterministic rates.
- **Add a `lockVoices(language)` method** that pre-selects and caches both host1 and host2 voices at the start of playback, returning `{ host1Voice, host2Voice }`. This is called once by the queue hook.
- **`speak()` accepts an optional `lockedVoice: SpeechSynthesisVoice`** parameter — when provided, it skips all voice selection logic and uses this voice directly.

### 3. `PodcastRaiseHand.tsx` — Clean handoff

- **Cancel all audio before playing response**: Call `window.speechSynthesis.cancel()` explicitly before starting response playback.
- **Track playback state properly**: Use a ref to prevent double-invocation of `playResponseSegment`.
- **On close/complete**: Ensure all audio (both HTMLAudioElement and Web Speech) is fully stopped before signaling `onResponseComplete`.

### 4. Personalization — Friendly, name-aware podcast

- **Fetch user's display name** from the auth session in `AIPodcast.tsx` and pass it to the script generation edge function.
- **Update `generate-podcast-script/index.ts`**: Add the user's name to the system prompt with instructions like: "Address the listener by name ({userName}) occasionally — greet them at the start, mention them when asking rhetorical questions, and say goodbye using their name. Keep it natural and friendly, like talking to a friend."
- **Update `podcast-raise-hand/index.ts`**: Include the user's name in the raise-hand prompt so hosts address the user by name when answering their question.

### 5. Smooth playback polish

- **Preload buffer size**: Keep `BUFFER_SIZE = 4` but start preloading from segment 0 immediately on mount (already done).
- **Web Speech keepalive**: Add a `speechSynthesis.resume()` call in a 10-second interval while playing to prevent Chrome's auto-pause bug on long utterances.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/usePodcastAudioQueue.ts` | Promise-based play lock, voice locking at session start, remove random variation, increase transition delay, add speechSynthesis keepalive |
| `src/hooks/useWebSpeechTTS.ts` | Add `lockVoices()` method, add `lockedVoice` param to `speak()`, remove random rate variation |
| `src/components/PodcastRaiseHand.tsx` | Proper audio cleanup, prevent double-play, pass user name |
| `src/pages/tools/AIPodcast.tsx` | Fetch user display name, pass to generation and raise-hand |
| `supabase/functions/generate-podcast-script/index.ts` | Add userName to prompt for friendly personalization |
| `supabase/functions/podcast-raise-hand/index.ts` | Add userName to prompt |

