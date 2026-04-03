

# NewtonAI — Study Tools & Visual Learning Feature Completion

## What This Plan Covers

The user's prompt describes features across 4 slides (Slide 4: Visual Learning, Slide 6: Study Tools, plus Newton Chat integration). After analyzing the codebase, here is what actually needs building versus what already exists.

## Gap Analysis

| Feature | Status | What's Missing |
|---------|--------|----------------|
| **Quiz Generator** | MCQ only | True/False, Fill-in-Blank, Short Answer, Match-the-Following question types; adaptive difficulty; "Retry Wrong Only"; weak area summary; question type config in settings |
| **Summarizer** | 4 formats + TTS working | Split-panel (source vs summary); "Make Simpler/Longer/Shorter" buttons; key term highlighting; "Send to Notes" |
| **Homework Help** | Direct solution only | Socratic scaffolding mode (step-by-step guided Q&A); "Practice Similar Problems" |
| **PDF Chat** | Fully working | No major gaps |
| **Video Search** | Fully working | No changes needed |
| **Mind Map** | Fully working (React Flow) | No changes needed |
| **Podcast** | Fully working (dual-voice TTS) | No changes needed |
| **OCR Tool** | Fully working (Tesseract.js) | No changes needed |
| **LaTeX** | KaTeX everywhere | Standalone equation editor page missing |
| **One-Tap Explainer** | Referenced in PitchDeck only | Entire component missing — bottom drawer with Video + Text tabs |
| **Newton Chat integration** | Class-scoped chat exists | No changes needed |

## Implementation Plan — 4 Batches

### Batch 1: Multi-Type Quiz Generator

**Edge function** (`supabase/functions/generate-quiz/index.ts`):
- Accept `questionTypes` array in settings: `["mcq", "true_false", "fill_blank", "short_answer", "match"]`
- Update AI prompt to generate mixed question types with a `type` field per question
- True/False: `{ type: "true_false", question, correctAnswer: true|false, explanation }`
- Fill in Blank: `{ type: "fill_blank", sentence: "The ___ is the powerhouse...", correctAnswer: "mitochondria", explanation }`
- Short Answer: `{ type: "short_answer", question, correctAnswer, rubric, explanation }`
- Match the Following: `{ type: "match", pairs: [{left, right}], explanation }`

**Settings dialog** (`UniversalStudySettingsDialog.tsx`):
- Add "Question Types" multi-select checkboxes when `type === "quiz"`
- Add "Adaptive" option to difficulty selector
- Add "Include Explanations" toggle

**New question type components** in `src/components/quiz/`:
- `TrueFalseQuestion.tsx` — two large True/False buttons
- `FillBlankQuestion.tsx` — sentence with inline `<input>` for the blank
- `ShortAnswerQuestion.tsx` — textarea + AI grading via `newton-chat` edge function (returns score 0-1 + feedback)
- `MatchQuestion.tsx` — two columns with HTML5 drag-and-drop matching

**Quiz page** (`AIQuiz.tsx`):
- Route each question to its type-specific component
- Adaptive difficulty engine: track consecutive correct/wrong count, reorder remaining questions dynamically
- Results screen: add "Retry Wrong Only" button, weak area summary grouped by topic
- Export PDF button using jsPDF

### Batch 2: Summarizer Enhancement

**Summarizer page** (`AISummarizer.tsx`):
- Add split-panel layout when summary is generated: scrollable source text on left, summary on right (CSS grid, collapses on mobile)
- Add action buttons below summary: "Make it Simpler" (re-calls AI at lower reading level), "Make it Longer", "Make it Shorter" — each re-invokes the `generate-summary` edge function with a modifier parameter
- Add "Send to Notes" button — inserts summary into student's personal notes via Supabase
- Post-process summary output to detect and wrap key terms in highlighted `<span>` elements with click-to-define tooltips

### Batch 3: Homework Help Socratic Mode

**Homework Help page** (`HomeworkHelp.tsx`):
- Add mode toggle at top: "Guided Mode" (default) vs "Direct Solution"
- **Guided/Socratic flow** (new state machine):
  1. On submit, call `analyze-text` with a Socratic system prompt asking it to identify the concept and provide 3-4 options
  2. Render concept options as clickable buttons
  3. On selection, AI confirms/corrects and reveals Step 1 as a question with options
  4. Continue step-by-step until solution complete, tracking state in a `steps[]` array
  5. Final view shows the complete worked solution
- "Practice Similar Problems" button after solution — calls AI to generate 3 similar problems at same difficulty
- New component `SocraticStepFlow.tsx` to manage the multi-step interactive UI

### Batch 4: One-Tap Explainer + LaTeX Editor

**One-Tap Explainer** (`src/components/OneTapExplainer.tsx` — new):
- Bottom sheet/drawer component triggered by clicking any key term
- Two tabs: "Video" (default) and "Text"
- Video tab: calls `search-videos` edge function with `"[term] explained animation"`, shows top 3 results with embedded YouTube player
- Text tab: calls `newton-chat` with grade-appropriate explanation prompt, streams response
- "Show with Example" button generates a real-world analogy
- "Related Terms" chips that recursively open the explainer
- Dismiss by swiping down, Escape, or clicking outside
- Wire into: `MarkdownRenderer` (for detected key terms), flashcard backs, homework help steps

**LaTeX Editor** (new tool page `src/pages/tools/LaTeXEditor.tsx`):
- Two-panel: textarea input (left) with live KaTeX preview (right), debounced 200ms
- Symbol palette buttons for common math symbols (Σ, ∫, √, π, fractions, matrices)
- "Copy LaTeX", "Copy as Image" (canvas render → clipboard), "Insert into Notes"
- Add route in router config

---

## Technical Notes

- No database migrations needed — all features use existing tables
- Edge function changes are backward-compatible (new optional params)
- ~6 new components, ~4 modified files, 1 new page
- All new components follow existing patterns: `useProcessingOverlay`, `fetchWithTimeout`, `ToolAuthGate`, `useFeatureLimitGate`

