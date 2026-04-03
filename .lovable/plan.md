

# NewtonAI — Full Platform Refinement Plan

## System Analysis Summary

The codebase is large (~120+ components, 50+ edge functions, 27+ DB tables) and already has solid architecture: lazy-loaded routes, QueryClient with retry/staleTime, error boundaries, deferred loading, and a promise-based podcast audio queue. However, several critical gaps exist.

### Key Findings

**Performance gaps:**
- `fetchWithTimeout` and `withRetry` exist but are **never imported** anywhere — zero API calls use them
- No per-tool error boundaries — a crash in Quiz kills the entire page
- No response caching for AI-generated content (re-generates on every visit)
- Supabase Realtime channels created in `sendReaction` are never unsubscribed (memory leak)

**Podcast audio:**
- Part 2 already added play-lock, voice-locking, and keepalive — these are solid
- Remaining issue: no fallback when ElevenLabs quota is exhausted (silent failure)

**AI pipeline:**
- Edge functions use raw `fetch` without timeout — can hang indefinitely
- No streaming for quiz/flashcard/summary generation (blocking responses)
- Duplicate document extraction if user generates quiz then flashcards from same file

**Live classroom:**
- Student reactions create a new channel per call without cleanup
- No error handling on spotlight sync failures
- Missing: Live OCR integration into SmartBoard (handwriting hook exists but isn't wired to note generation)
- Missing: Live speech-to-notes pipeline (lecture capture exists but doesn't auto-generate notes)

**Missing integrations:**
- Class-specific Newton Chat grounding exists in `chat-with-content` but the class-level chat UI doesn't invoke it with class material context

---

## Implementation Plan (6 Batches)

### Batch 1: Wire Up API Resilience Everywhere

**Goal:** Make every API call use `fetchWithTimeout` + `withRetry`.

| File | Change |
|------|--------|
| `src/utils/contentProcessing.ts` | Replace all raw `fetch()` calls with `fetchWithTimeout()` (6 functions) |
| `src/hooks/useNewtonChat.ts` | Wrap SSE fetch with `fetchWithTimeout` + AbortController cleanup |
| `src/hooks/usePDFChat.ts` | Use `fetchWithTimeout` for RAG calls |
| `src/hooks/useVoiceChat.ts` | Use `fetchWithTimeout` for voice-chat-tts calls |
| `src/pages/tools/AIQuiz.tsx` | Wrap generation call with `fetchWithTimeout` |
| `src/pages/tools/AIFlashcards.tsx` | Same |
| `src/pages/tools/AISummarizer.tsx` | Same |
| `src/pages/tools/MindMap.tsx` | Same |
| `src/pages/tools/AILectureNotes.tsx` | Same |
| `src/pages/tools/AIPodcast.tsx` | Same for script generation |

Also add a `useApiCall` helper hook that wraps any edge function invocation with timeout, retry, and error toast.

### Batch 2: Per-Tool Error Boundaries + Loading States

**Goal:** Every study tool gets its own error boundary and retry UI.

| File | Change |
|------|--------|
| `src/components/ToolErrorBoundary.tsx` | New component — wraps tool pages, shows retry button with tool name |
| All 7 tool pages | Wrap root return in `<ToolErrorBoundary toolName="...">` |
| All tool pages | Add explicit `isGenerating` state with skeleton loader (no blank screens) |
| All tool pages | Add `onRetry` callback that re-triggers last generation |

### Batch 3: AI Response Caching + Document Dedup

**Goal:** Cache generated content; extract documents once.

| File | Change |
|------|--------|
| `src/hooks/useGenerationCache.ts` | New hook — caches AI responses (quiz, flashcards, summary) by content hash in `localStorage` with 24h TTL |
| `src/utils/contentProcessing.ts` | Add `processedDocumentCache` Map — if same file (by name+size+lastModified) was already extracted, return cached text |
| All tool pages | Check cache before calling edge function; store result after successful generation |

### Batch 4: Realtime Channel Leak Fix + Podcast Fallback

**Goal:** Fix memory leaks; add TTS fallback.

| File | Change |
|------|--------|
| `src/components/live-session/StudentLiveView.tsx` | Create reaction channel once on mount, reuse for all sends, unsubscribe on unmount |
| `src/hooks/usePodcastAudioQueue.ts` | Add fallback: if ElevenLabs segment returns null audio AND WebSpeech is available, auto-switch to WebSpeech for that segment with a toast notification |
| `src/components/PodcastRaiseHand.tsx` | Add try/catch around response playback with user-visible error toast |

### Batch 5: Live Classroom Feature Completion

**Goal:** Wire up existing hooks into working features.

| File | Change |
|------|--------|
| `src/components/live-session/SmartBoardPanel.tsx` | Wire `useHandwritingRecognition` output to `generate-slide-notes` edge function — when teacher draws and OCR fires, auto-append recognized text as a slide note |
| `src/components/live-session/SmartBoardPanel.tsx` | Wire `useLectureCapture` transcription output to `generate-slide-notes` — as speech is transcribed, feed it as `slide_context` for the current slide's AI notes |
| `src/components/live-session/SmartBoardPanel.tsx` | Add "Search Animation Video" button in toolbar that takes selected/current topic and calls `search-videos` edge function, showing results in a side drawer |

### Batch 6: Class-Specific Newton Chat Grounding

**Goal:** Make per-class AI chat answer ONLY from class materials.

| File | Change |
|------|--------|
| `src/components/student/ClassNewtonChat.tsx` | New component — class-scoped chat UI that passes `classId` to the backend |
| `src/pages/student/StudentClassView.tsx` | Add "Ask Newton" tab/button that opens `ClassNewtonChat` |
| `supabase/functions/chat-with-content/index.ts` | Accept optional `classId` param; when provided, filter `document_chunks` retrieval to only chunks belonging to that class's materials. Add system prompt: "Answer ONLY from the provided class materials. If the question is outside scope, say so." |
| `src/hooks/useClassChat.ts` | New hook — similar to `useNewtonChat` but scopes context to class materials by passing `classId` in the request body |

---

## Technical Notes

- **No database migrations needed** — all changes are frontend + edge function logic
- **No new tables** — class materials and document_chunks already exist with proper RLS
- All edge function changes are backward-compatible (new optional params)
- Estimated: ~15 files modified, ~4 new files created
- Will be implemented batch-by-batch in sequence

