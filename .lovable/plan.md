
Goal
- Stop the recurring “Setting up fake worker failed: Failed to fetch dynamically imported module …cdnjs…pdf.worker.min.mjs?import” error permanently.
- Ensure the PDF worker is always loaded from the same origin (your app), never from a CDN, across:
  - PDF upload text extraction (pdfjs-dist)
  - PDF rendering (react-pdf)

What’s actually happening (root cause)
- The error message indicates PDF.js is still trying to load its worker from the default CDN URL (cdnjs).
- Even though we updated some components to use a “local worker” with `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`, in Vite this pattern can still fail depending on how the module is bundled/loaded and when the assignment executes.
- When worker loading fails or the workerSrc isn’t set early enough, PDF.js falls back to its default workerSrc (cdnjs), which then fails due to dynamic ESM import + CORS/MIME constraints, producing the exact error you see.

High-confidence fix strategy
1) Configure the PDF.js worker once, globally, at app startup
- Create a single “pdf worker config” module that:
  - imports the worker as a URL using Vite’s `?url` asset handling (most reliable)
  - sets workerSrc for both:
    - `pdfjs-dist` (used for extraction)
    - `react-pdf`’s `pdfjs` (used for rendering)
- Import this module in `src/main.tsx` (or the earliest possible entry) so it runs before any PDF code executes.

Why `?url` instead of `new URL(..., import.meta.url)` everywhere
- `?url` forces Vite to treat the worker file as a static asset URL, which avoids edge cases where PDF.js treats the worker as an externally imported ESM module.
- This removes the “dynamic import from cdnjs” path entirely and makes worker loading deterministic in dev + production.

2) Remove all scattered workerSrc assignments
- Delete (or replace) the repeated `GlobalWorkerOptions.workerSrc = ...` lines in:
  - `src/components/PDFReader.tsx`
  - `src/components/pdf-chat/PDFViewerWithHighlight.tsx`
  - `src/components/pdf-chat/PDFChatUploadView.tsx`
  - `src/components/OCRSplitView.tsx`
- This prevents “last imported file wins” order issues and guarantees the workerSrc isn’t accidentally changed later.

3) Add a runtime “safety reset” (belt-and-suspenders)
- In `PDFChatUploadView.extractTextFromPDF` (right before `getDocument(...)`), add a tiny guard:
  - If `pdfjsLib.GlobalWorkerOptions.workerSrc` is empty or contains “cdnjs”, reset it to the correct local URL.
- This makes the upload flow resilient even if something unexpected changes workerSrc.

4) Make Vite target modern enough for PDF.js v4 ESM worker
- Update `vite.config.ts`:
  - `build.target = "es2022"`
  - `optimizeDeps.esbuildOptions.target = "es2022"`
- This aligns with PDF.js v4’s ESM expectations and prevents bundling/downleveling edge cases.

Files that will be changed
- Add:
  - `src/lib/pdfjsWorker.ts` (or similarly named) to centralize worker setup
- Edit:
  - `src/main.tsx` to import the worker config once at startup
  - `src/components/PDFReader.tsx` remove local workerSrc assignment
  - `src/components/pdf-chat/PDFViewerWithHighlight.tsx` remove local workerSrc assignment
  - `src/components/pdf-chat/PDFChatUploadView.tsx` remove local workerSrc assignment + add safety reset
  - `src/components/OCRSplitView.tsx` remove local workerSrc assignment
  - `vite.config.ts` set targets to es2022

Validation checklist (end-to-end)
- In the preview:
  1. Hard refresh once (to ensure the latest bundle is loaded).
  2. Go to /pdf-chat upload screen.
  3. Upload a PDF.
  4. Confirm:
     - Newton processing overlay appears
     - No “fake worker failed” toast
     - Chat opens only after processing completes
  5. Open browser DevTools → Network:
     - Verify the worker file is requested from your app’s domain (not cdnjs/unpkg).

Edge cases covered
- Mobile + desktop routes: global setup guarantees worker is ready regardless of which PDF component loads first.
- If any dependency resets workerSrc later: the safety reset in upload flow prevents regressions for the most visible failing path.

If you approve this plan, I’ll implement it and the worker error should stop completely (no CDN fallback, no dynamic-import failure).
