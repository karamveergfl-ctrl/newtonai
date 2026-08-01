## Goal

Let SmartBoard classrooms open DOCX and PPTX files (not just PDF/images), keeping select-text → find-video working, without requiring a user login on the board.

## Why it doesn't work today

The existing `extract-docx-text` and `extract-pptx-text` edge functions require an `Authorization` header and call `auth.getUser()`. A SmartBoard has no Supabase user — it authenticates with a device token issued at activation — so those calls would fail. `DocumentStage` therefore rejects anything that isn't a PDF or image.

## Plan

### 1. Shared Office text extraction module
Create `supabase/functions/_shared/office-extract.ts` containing the JSZip-based parsers already proven in the two existing functions:
- `extractDocxSections(bytes)` → array of `{ heading, text }` blocks derived from `word/document.xml` paragraphs.
- `extractPptxSlides(bytes)` → array of `{ slideNumber, title, lines }` from `ppt/slides/slideN.xml`.

The existing user-facing functions stay untouched (no regression risk).

### 2. New device-token-gated edge function
`supabase/functions/smartboard-extract-document/index.ts`:
- Accepts `POST { deviceToken, fileName, fileBase64 }`.
- Resolves the board through the existing `resolveBoard()` helper in `_shared/smartboard-auth.ts` (same gate used by search/log-play), returning the same structured error codes for inactive board / inactive school / expired plan.
- Rejects payloads over ~15 MB of base64 and any extension other than `.docx` / `.pptx`.
- Returns `{ kind: "docx" | "pptx", pages: [{ title, blocks: string[] }] }`.
- Nothing is written to storage or the database; extraction is in-memory and stateless. Optionally logs a `document_open` row in `sb_board_usage` for the school's usage report.

### 3. Frontend wiring
- `src/lib/smartboardSession.ts`: add `extractBoardDocument(deviceToken, file)` that base64-encodes the file and calls the new function, returning the same `{ data, message, errorCode }` shape used by the other SmartBoard API wrappers.
- `src/components/smartboard/DocumentStage.tsx`:
  - Widen the accepted types to `.pdf`, images, `.docx`, `.pptx`; keep 50 MB for PDF/images and cap Office files at 15 MB with a clear message.
  - Add an `extracting` state showing "Reading your document…".
  - New `kind: "text"` render mode: large, high-contrast, selectable typography on the dark slate stage — slide/section title as a heading, body blocks as paragraphs — with the same Prev/Next paging (one slide or section per page) and zoom controls that PDFs use.
  - Text selection and the existing "Find animation videos" bar work unchanged, since it reads `window.getSelection()`.
  - On extraction failure, show the server message plus a fallback hint to export the file as PDF.

### 4. Verify
- Typecheck.
- Call the new function through the edge-function tester with an invalid token (expect 401) and with a small real `.pptx` payload (expect parsed slides).

## Technical notes
- Deliberately text-only for Office files: rendering true DOCX/PPTX layout in the browser needs a converter service; extracted text is what the video-search feature actually consumes, and it renders far better on a large classroom display.
- No schema change is required; if the usage log entry is included it reuses the existing `sb_board_usage` table via the service role, consistent with the other SmartBoard functions.
