
Problem restatement (what’s happening)
- User selects text in the PDF/video slide view (first image).
- The “Selected text” toolbar (second image) appears and correctly shows the selected text.
- Clicking Quiz / Flashcards / Notes / Map appears to do nothing (no settings dialog, no Newton processing, no network call).

Do I know what the issue is?
- Yes. The selection toolbar click handler is firing (we see `[TextSelectionToolbar] Captured text for quiz : Zener Diode`), but the generation flow is getting interrupted immediately after because the PDF viewer uses a global `document.addEventListener("mouseup"/"touchend")` selection handler that can clear `selectedText` and hide the toolbar when the selection collapses during button clicks. When the toolbar gets unmounted, the settings dialog (rendered inside the toolbar component) also gets unmounted before it can appear, so the user perceives “nothing happens”.

Root cause (code-level)
- In `src/components/PDFReader.tsx`, there is a document-level handler:

  - On every mouseup/touchend anywhere, it reads `window.getSelection()` and:
    - If selection text exists → shows the toolbar
    - Else (no selection) → hides toolbar and clears `selectedText`

- When a user clicks a tool button:
  - The browser often collapses/clears the selection on that mouseup/touchend
  - The document-level handler runs and hides the toolbar
  - The toolbar component (and its `UniversalStudySettingsDialog`) gets unmounted immediately
  - Result: no dialog, no generation, “nothing happens”

Solution overview
- Make the selection handler in `PDFReader` ignore mouseup/touchend events that are not originating from the PDF text layer itself (i.e., clicks on the floating toolbar or dialogs should not clear selection state).
- Apply the same protection in `ImageViewer` as well (it also listens on `document`), to prevent the same class of bug in image OCR mode.
- Optional hardening: stop propagation on mouseup/pointerup inside the toolbar card so other parent listeners don’t fire even if they exist.

Implementation steps (what I will change)
1) Fix selection handler scope in `src/components/PDFReader.tsx`
   - Update `handleTextSelection` to accept the event argument (`MouseEvent | TouchEvent`)
   - Add a guard:
     - If the event target is outside `containerRef.current` (the PDF viewing area), return early and do nothing.
     - This ensures clicks on the floating toolbar (which is outside the PDF container) do not trigger the “clear selection” path.
   - Keep existing behavior when user clicks inside the PDF area (selection changes should still show/hide the toolbar normally).

   Pseudocode:
   ```ts
   const handleTextSelection = (e: MouseEvent | TouchEvent) => {
     if (isScreenshotMode || isCapturing) return;

     const container = containerRef.current;
     const target = e.target as Node | null;

     // Only react to selections inside the PDF container
     if (container && target && !container.contains(target)) return;

     const text = window.getSelection()?.toString().trim();
     if (text && text.length >= 5) { ... } else { ...clear... }
   };
   ```

2) Apply the same guard in `src/components/ImageViewer.tsx`
   - It also uses `document.addEventListener("mouseup"/"touchend")` for text selection.
   - Add the same “only handle events originating from inside the image/text overlay container” rule using its existing `containerRef`.
   - This prevents toolbar clicks from interfering with selection state in OCR image mode as well.

3) Hardening in `src/components/TextSelectionToolbar.tsx`
   - Add `onMouseUp` and `onPointerUp` stopPropagation to the root Card (similar to what’s already done for `onMouseDown` / `onPointerDown`).
   - This reduces chances of other selection/listeners reacting to toolbar interactions.
   - Keep existing explicit text capture (`capturedTextRef`) and explicit callback text passing (already correct).

4) Verify that generation uses the selected text and follows the same “Text mode” pipeline
   - Confirm that after the settings dialog stays open:
     - Clicking Generate triggers `handleGenerateWithSettings`
     - Which calls `onGenerateQuiz(textToUse, settings)` / etc.
     - Which reaches `src/pages/Index.tsx` handlers:
       - `handleGenerateQuizFromText`
       - `handleGenerateFlashcardsFromText`
       - `handleGenerateSummaryFromText` (Notes)
       - `handleGenerateMindMapFromText`
     - Which starts Newton processing and calls the backend generation functions.

Testing checklist (what you’ll be able to confirm in Preview)
- On /dashboard, open a PDF slide (like the Zener Diode slide).
- Select a multi-line chunk of text.
- Toolbar appears.
- Click “Quiz”:
  - Settings dialog should now reliably appear and stay open.
  - Click “Generate” → Newton animation should run → quiz result should appear.
- Repeat for Flashcards, Notes, Map.
- Ensure clicking inside toolbar no longer dismisses the toolbar prematurely.

Files that will be changed
- src/components/PDFReader.tsx  (main fix: scope selection listener to PDF container)
- src/components/ImageViewer.tsx (same class of fix for OCR image mode)
- src/components/TextSelectionToolbar.tsx (hardening: stop propagation on mouseup/pointerup)

Expected outcome
- The toolbar in the second image will work consistently: clicking Quiz/Flashcards/Notes/Map will use the already-displayed selected text and generate content using the same backend + Newton workflow as “Text mode”.
