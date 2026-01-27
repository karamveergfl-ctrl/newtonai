
Goal
- Fix flashcards not flipping everywhere (Dashboard PDF flashcards, Search-bar video flashcards, tool pages flashcards).
- Fix “Notes” from PDF: generated content opens a blank “Study Guide” screen.
- Fix PDF toolbar tools (Quiz/Flashcards/Notes/Mind Map) so the Newton processing animation video always appears (Overlay → Result), matching the search-bar video tools behavior.

What’s causing the issues (based on code review)
1) Flashcards not flipping
- `src/components/Flashcard.tsx` uses Tailwind/CSS classes (`rotate-y-180`) to apply a 3D `transform`, but the same element is a `motion.div` with `whileTap={{ scale: 0.98 }}`.
- Framer Motion writes to the `transform` style, which can override the class-based `transform` (so rotateY never actually applies), making cards “not flip” even though state changes.

2) Notes from PDF opens a blank “Study Guide”
- In `src/pages/Index.tsx`, `handleGenerateSummary()` sets `showVideoSummaryScreen = true` (which renders the video-summary screen), but it writes the response into `summary` state, while the rendered screen reads from `videoSummary`.
- Result: UI opens, but content is empty → blank page (matches your screenshot).

3) Newton animation video not showing for PDF toolbar tools
- PDF toolbar buttons call document-level handlers:
  - `handleGenerateQuizFromContent`
  - `handleGenerateFlashcardsFromContent`
  - `handleGenerateSummary`
  - `handleGenerateMindMap`
- These handlers still use the older “instant UI” flow (open result screen immediately) and do NOT consistently call `startVideoThinking()/startVideoWriting()/completeVideoProcessing()`.
- So the overlay never appears for those actions.

Implementation plan (what I will change)
A) Fix flip animation globally (Flashcard component)
Files
- `src/components/Flashcard.tsx`

Changes
- Move the flip transform fully into Framer Motion so rotateY and scale are composed correctly.
- Replace:
  - class toggling `rotate-y-180`
  - with `animate={{ rotateY: isFlipped ? 180 : 0 }}` and a proper transition.
- Keep 3D settings:
  - keep `.perspective-1000` on wrapper
  - keep `transformStyle: "preserve-3d"`
  - keep back face with `transform: "rotateY(180deg)"`

Acceptance
- Clicking on the card flips.
- Clicking “Flip Card” button flips.
- Works in:
  - `/dashboard` PDF flashcards (FlashcardDeck)
  - `/tools/flashcards` (AIFlashcards)
  - Anywhere else Flashcard is used.

B) Fix Notes (PDF) blank screen + unify document tools to Overlay → Result
Files
- `src/pages/Index.tsx`

Changes (core)
1) Replace the “instant UI” document-level handlers with the same Newton workflow used by search-bar video tools:
- Update these functions:
  - `handleGenerateQuizFromContent`
  - `handleGenerateFlashcardsFromContent`
  - `handleGenerateSummary`
  - `handleGenerateMindMap`
- New standard flow for each:
  1. Validate content exists
  2. `trySpendCredits(...)`
  3. Set message: `setVideoProcessingMessage("...")`
  4. `startVideoThinking()`
  5. Call backend function
  6. `startVideoWriting()`
  7. On success: `setPendingVideoResult({ type, data, title })`
  8. `completeVideoProcessing()`
  9. On error: `resetVideoProcessing()`, clear relevant `isGenerating*`, `activeGenerating`, show toast

2) Specifically fix Notes blank screen
- Stop writing document notes into `summary` while rendering from `videoSummary`.
- With the unified flow, we will always set:
  - `pendingVideoResult.type = "summary"`
  - `pendingVideoResult.data = { summary: ... }`
  - `pendingVideoResult.title = fileData.name`
- The existing “pending result” effect already populates `videoSummary` and opens the full-screen notes UI, so the Study Guide won’t be blank anymore.

3) Ensure the overlay is truly “Overlay → Result”
- Keep the logic that only opens the result UI after the processing phase returns to `idle` (your existing `useEffect` on `videoProcessingPhase` already does that).
- Optionally (recommended): switch ProcessingOverlay usage to `variant="overlay"` (full-screen) and remove the extra wrapper div so the overlay presentation matches your desired behavior more closely.

Acceptance
- Clicking Notes in the PDF toolbar:
  - shows Newton processing animation video
  - then opens Study Guide with real generated content (not blank)
- Clicking Quiz/Flashcards/Mind Map in PDF toolbar:
  - shows Newton processing animation video
  - then opens the correct result view
- If generation fails:
  - overlay closes
  - no blank result screen remains open
  - user sees a clear error toast.

C) Quick validation checklist (manual test steps)
1) Dashboard PDF toolbar
- Upload a PDF
- Click Notes → should show Newton overlay → then Study Guide populated
- Click Flashcards → Newton overlay → flashcards open → flip works
- Click Quiz → Newton overlay → quiz questions show
- Click Mind Map → Newton overlay → mind map shows

2) Selected text tools (within PDF)
- Select text → open selection toolbar → choose Flashcards → overlay → deck opens → flip works

3) Tool pages
- Go to `/tools/flashcards` and generate → flip works

Risk / edge cases to handle in code
- Ensure all document-level handlers set/clear:
  - `setActiveGenerating(...)`
  - `setIsGeneratingFlashcards/Quiz/Summary/MindMap(...)`
  - `resetVideoProcessing()` on error
- Make sure “Notes” keeps using the same backend function (`generate-summary`) and reads `data.summary`.

Files to change (summary)
- `src/components/Flashcard.tsx` (fix flipping everywhere)
- `src/pages/Index.tsx` (fix notes blank screen + enable Newton overlay for PDF toolbar tools)

After you approve this plan, I’ll switch to implementation mode and apply the fixes.
