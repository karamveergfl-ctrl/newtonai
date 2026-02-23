

# Fix PDF Worker Loading Error

## Problem
The PDF viewer shows "Failed to load PDF file" with the console error:
```
Setting up fake worker failed: "Failed to resolve module specifier 'pdf.worker.mjs'"
```

The current worker configuration uses `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` which works in Vite dev mode but fails in production. Since `pdfjs-dist` is bundled into a `vendor-pdf` chunk by Vite's `manualChunks` config, the worker file path cannot be resolved at runtime.

## Solution
Switch the worker source to use the unpkg CDN pinned to the exact installed version (4.8.69). This is the most reliable approach for production builds and avoids worker/API version mismatches.

## Changes

### `src/lib/pdfjsWorker.ts`
- Replace the `new URL(...)` worker source with a CDN URL: `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`
- Remove the condition that skips setting `workerSrc` if it already contains `unpkg` -- the CDN URL is now the correct source
- Always set `workerSrc` on first call to ensure consistency

This is a single-file fix that resolves the issue for both the main dashboard PDF viewer (`PDFReader`) and the PDF Chat viewer (`PDFViewerWithHighlight`), since they all use the same centralized worker config.

