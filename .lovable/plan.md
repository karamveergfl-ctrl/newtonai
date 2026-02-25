
# Smartboard Teaching Mode -- Full Implementation Plan

## Overview
Extend the existing `SmartBoardPanel` into a comprehensive teaching platform with 6 new subsystems: enhanced UI mode, whiteboard canvas, AI handwriting recognition, document annotation, voice commands, and automatic lecture capture. All features integrate into the existing live session architecture.

---

## 1. Smartboard UI Mode Enhancement

**What changes:** Upgrade the existing fullscreen `SmartBoardPanel` into a dedicated teaching cockpit with large touch-friendly controls, minimal chrome, and a classroom theme toggle.

**Files to modify:**
- `src/components/live-session/SmartBoardPanel.tsx` -- Add a `teachingMode` state that restructures the layout into a toolbar-based design with large icon buttons (min 48px touch targets), bottom toolbar dock, and a classroom light/dark theme toggle (separate from app theme, stored as `newton_classroom_theme` in localStorage)

**Files to create:**
- `src/components/smartboard/SmartBoardToolbar.tsx` -- Bottom-docked toolbar with large icon buttons for: Whiteboard, Document View, Voice Command, Record toggle, Theme toggle, End Session
- `src/components/smartboard/ClassroomThemeProvider.tsx` -- Context that applies a `classroom-light` or `classroom-dark` CSS class to the smartboard container (high-contrast colors optimized for projectors: pure white/deep navy backgrounds, larger base font 20px+)

**CSS approach:** Add smartboard-specific utility classes in `src/index.css` under a `.classroom-light` / `.classroom-dark` scope. No new CSS files.

---

## 2. Whiteboard Writing Engine

**What changes:** Add a full drawing canvas that supports stylus (pressure-sensitive), mouse, and touch input with undo/redo, color picker, eraser, and pen-size controls.

**Files to create:**
- `src/components/smartboard/WhiteboardCanvas.tsx` -- HTML5 Canvas component using PointerEvents API for unified stylus/mouse/touch handling. Features:
  - Pressure-sensitive line width (via `event.pressure`)
  - Tools: pen, highlighter, eraser, text insertion
  - Color palette (8 preset colors + custom)
  - Undo/redo stack (stores canvas image snapshots, max 50)
  - Clear all button
  - Canvas resizes to fill the main content area
- `src/hooks/useWhiteboardState.ts` -- Manages drawing state, tool selection, undo/redo stack, and auto-save logic
- `src/hooks/useWhiteboardAutoSave.ts` -- Auto-saves canvas as PNG blob to `whiteboard-notes` storage bucket every 30 seconds (debounced) and on session end. Saves with path: `{sessionId}/{slideIndex}_{timestamp}.png`

**Storage:** New `whiteboard-notes` storage bucket (private, RLS: teacher who owns the session can read/write)

**Export PDF:** Uses existing `html2canvas` + `jsPDF` pattern (already in project). Button in toolbar captures all saved whiteboard images for the session and compiles into a multi-page PDF.

**Database:** Add column to `live_sessions`:
```sql
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS whiteboard_data jsonb DEFAULT '[]'::jsonb;
```
Stores array of `{ slide_index, storage_path, created_at }` references.

---

## 3. AI Handwriting Recognition

**What changes:** When the teacher finishes writing on the whiteboard (detected via 3-second inactivity), capture the canvas, send to the existing `ocr-handwriting` edge function, and generate structured notes in the background.

**Files to create:**
- `src/hooks/useHandwritingRecognition.ts` -- Watches for drawing inactivity (3s debounce after last stroke), captures canvas as base64 PNG, calls `ocr-handwriting` edge function, and stores recognized text. Triggers `generate-slide-notes` edge function with the recognized text as context to produce structured notes automatically.

**Integration:** The recognized text feeds into the existing `LiveSessionContext.setCurrentSlideContent()` so all downstream systems (notes, concept checks, spotlight) automatically receive the whiteboard content.

**No new edge functions needed** -- reuses `ocr-handwriting` and `generate-slide-notes`.

---

## 4. Document Teaching Mode

**What changes:** Allow the teacher to open a PDF/PPT/DOCX inside the smartboard, annotate it live with drawing tools, and sync highlighted content to students.

**Files to create:**
- `src/components/smartboard/DocumentTeachingView.tsx` -- Renders documents using the existing `react-pdf` library (already installed). Features:
  - Page navigation with large prev/next buttons
  - Annotation overlay canvas (same drawing engine as whiteboard, layered on top of PDF pages)
  - Highlight tool (semi-transparent yellow/green/blue rectangles)
  - Text selection + highlight
- `src/components/smartboard/AnnotationLayer.tsx` -- Transparent canvas overlay positioned absolutely over the document page. Captures annotations as serializable objects `{ type, points, color, pageIndex }`
- `src/hooks/useDocumentAnnotations.ts` -- Manages annotation state per page, serialization, and syncs highlight data to the `spotlight_session_state` table's `current_slide_content` field so students receive it via existing Spotlight sync

**Student sync mechanism:** Annotations are serialized and pushed to `spotlight_session_state.current_slide_content` as structured JSON. The existing `SpotlightSync` hook on the student side picks this up via Realtime. The student view renders a read-only version of the annotated page.

**File upload:** Reuses existing file upload + extraction pipeline (`extract-pdf-text`, `extract-pptx-text`, `extract-docx-text`). Teacher selects a file from class materials or uploads directly.

---

## 5. Voice Command Assistant

**What changes:** Add always-listening voice command detection during smartboard mode. Teacher says trigger phrases that map to AI edge function calls.

**Files to create:**
- `src/hooks/useVoiceCommands.ts` -- Uses the existing `useSpeechRecognition` hook in continuous mode. Listens for wake word "Newton" followed by a command. Command mapping:
  - "Newton generate quiz" --> calls `generate-concept-check` edge function with current slide content
  - "Newton summarize slide" --> calls `generate-summary` with current slide content, displays result in a toast/overlay
  - "Newton explain topic simply" --> calls `newton-chat` with prompt "Explain this simply: {slideContent}"
  - "Newton next slide" --> triggers `SlideAdvanceControls` next
  - "Newton previous slide" --> triggers slide back
  - "Newton start recording" --> toggles lecture capture on
  - "Newton stop recording" --> toggles lecture capture off
- `src/components/smartboard/VoiceCommandIndicator.tsx` -- Small floating indicator showing: mic status (listening/processing), last recognized command, and result preview. Positioned top-right of smartboard.

**Command parsing:** Simple keyword matching after "Newton" trigger word. No additional AI needed for command detection -- just string matching against known commands.

**Edge functions reused:** `generate-concept-check`, `generate-summary`, `newton-chat` (all existing).

---

## 6. Automatic Lecture Capture

**What changes:** Record slides shown, whiteboard notes, and audio transcription during the session. Store all data for post-class intelligence reports.

**Files to create:**
- `src/hooks/useLectureCapture.ts` -- Orchestrates capture of three data streams:
  1. **Slide timeline:** Records `{ slideIndex, timestamp, content }` at each slide change (already tracked via `SlideAdvanceControls`)
  2. **Whiteboard snapshots:** Captures canvas PNG at each slide change (from whiteboard auto-save)
  3. **Audio transcription:** Uses `AudioRecorder` (existing) to record audio in 2-minute chunks, sends each chunk to `transcribe-audio` edge function, accumulates transcript segments with timestamps

**Database changes:**
```sql
CREATE TABLE public.lecture_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  slide_timeline jsonb DEFAULT '[]',
  whiteboard_paths text[] DEFAULT '{}',
  transcript_segments jsonb DEFAULT '[]',
  audio_duration_seconds integer DEFAULT 0,
  status text DEFAULT 'recording',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.lecture_captures ENABLE ROW LEVEL SECURITY;

-- Only the session teacher can access
CREATE POLICY "Teachers own lecture captures"
  ON public.lecture_captures FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);
```

**Integration with post-class reports:** When the session ends, the accumulated `lecture_captures` data (transcript + slide timeline) is passed to the existing `generate-teacher-report` edge function as additional context, enriching the intelligence report with full lecture content.

**Storage:** Audio chunks are processed in-memory and discarded after transcription (only text is stored). Whiteboard PNGs go to the `whiteboard-notes` bucket.

---

## Migration Summary

Single migration file: `supabase/migrations/[timestamp]_smartboard_teaching_mode.sql`
- Add `whiteboard_data` column to `live_sessions`
- Create `lecture_captures` table with RLS
- Create `whiteboard-notes` storage bucket (private)
- Storage RLS policy for whiteboard-notes bucket

---

## Files Summary

### New Files (12)
1. `supabase/migrations/[timestamp]_smartboard_teaching_mode.sql`
2. `src/components/smartboard/SmartBoardToolbar.tsx`
3. `src/components/smartboard/ClassroomThemeProvider.tsx`
4. `src/components/smartboard/WhiteboardCanvas.tsx`
5. `src/components/smartboard/DocumentTeachingView.tsx`
6. `src/components/smartboard/AnnotationLayer.tsx`
7. `src/components/smartboard/VoiceCommandIndicator.tsx`
8. `src/hooks/useWhiteboardState.ts`
9. `src/hooks/useWhiteboardAutoSave.ts`
10. `src/hooks/useHandwritingRecognition.ts`
11. `src/hooks/useDocumentAnnotations.ts`
12. `src/hooks/useVoiceCommands.ts`
13. `src/hooks/useLectureCapture.ts`

### Modified Files (3)
1. `src/components/live-session/SmartBoardPanel.tsx` -- Integrate toolbar, whiteboard, document view, voice commands, and capture toggle
2. `src/index.css` -- Add classroom theme CSS variables
3. `src/integrations/supabase/types.ts` -- Auto-updated by migration

### Zero Breaking Changes
- All new features are additive toolbar buttons within the existing SmartBoardPanel
- Existing session flow unchanged -- whiteboard/document/voice are opt-in tools
- All existing edge functions reused, no new AI backend needed
- Students see synced content via existing Spotlight mechanism
