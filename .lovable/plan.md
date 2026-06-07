## What’s actually broken
The failure is not the PDF itself — the frontend is aborting long-running requests too early.

I confirmed:
- `src/utils/contentProcessing.ts` still uses `timeoutMs: 30000` for PDF/image/DOCX/PPTX/audio extraction.
- `src/pages/tools/AIFlashcards.tsx` still uses `timeoutMs: 30000` for `generate-flashcards`.
- `src/pages/tools/AIQuiz.tsx` still uses `timeoutMs: 45000` for `generate-quiz`.
- `src/pages/tools/MindMap.tsx` still uses `timeoutMs: 30000`.
- Backend logs show `extract-pdf-text` successfully finished after the request had already been cut off on the client side.

So the exact problem is: upload-based tools are timing out in the browser before the backend finishes extraction/generation.

## Plan
1. **Raise timeouts in the shared upload-processing layer**
   - Update `src/utils/contentProcessing.ts` so long-running extraction routes have realistic limits:
     - PDF: much higher timeout
     - DOCX/PPTX/audio/image OCR: higher timeouts as needed
   - Keep fast endpoints like YouTube transcript shorter.

2. **Raise generation timeouts in the affected tools**
   - Update:
     - `src/pages/tools/AIFlashcards.tsx`
     - `src/pages/tools/AIQuiz.tsx`
     - `src/pages/tools/MindMap.tsx`
   - Increase request limits so generation can complete after extraction finishes.

3. **Fix the timeout messaging so it’s actionable**
   - Update `src/lib/fetchWithTimeout.ts` to clearly distinguish slow backend processing from other failures.
   - Show a better user-facing message that explains the server is still processing and suggests retrying only if the file is unusually large.

4. **Audit related tool flows using the same processing path**
   - Check `AISummarizer` and any other upload-driven tools that rely on `processUploadedFile` or long AI generation paths.
   - Standardize timeouts so the same bug does not keep appearing in “other tools”.

5. **Validate the end-to-end path**
   - Re-test upload → extract → generate flows for flashcards and quiz.
   - Confirm the old `Request timed out after 30s` path is gone and that successful backend completions are no longer aborted by the client.

## Technical details
- Root cause: client-side `AbortController` timeout values are shorter than real-world AI extraction/generation latency.
- Primary files to change:
  - `src/utils/contentProcessing.ts`
  - `src/lib/fetchWithTimeout.ts`
  - `src/pages/tools/AIFlashcards.tsx`
  - `src/pages/tools/AIQuiz.tsx`
  - `src/pages/tools/MindMap.tsx`
  - possibly `src/pages/tools/AISummarizer.tsx` if the same pattern is present there.
- No database/auth changes are needed for this fix.