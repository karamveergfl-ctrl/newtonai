
# Plan: Fix PDF.js Worker Version Mismatch

## Problem Identified

The console log reveals the root cause:
```
The API version "4.8.69" does not match the Worker version "4.9.155"
```

**What's happening:**
- `react-pdf@9.2.1` bundles and uses `pdfjs-dist@4.8.69` internally for its API
- Your project has `pdfjs-dist@4.9.155` installed as a direct dependency  
- Our worker config loads from `pdfjs-dist@4.9.155` (the worker version)
- But `react-pdf` calls the API from `pdfjs-dist@4.8.69`
- This version mismatch causes "Failed to load PDF"

## Solution

**Use `react-pdf`'s bundled pdfjs-dist for the worker instead of the standalone package.**

`react-pdf` already exports a properly configured `pdfjs` object. We should use that consistently and load the worker from its bundled location to ensure version alignment.

---

## Implementation

### 1. Update `src/lib/pdfjsWorker.ts`

Change from importing from `pdfjs-dist` to using the version bundled with `react-pdf`:

```typescript
/**
 * Centralized PDF.js worker configuration.
 * 
 * CRITICAL: react-pdf bundles its own version of pdfjs-dist internally.
 * We MUST use the worker that matches react-pdf's bundled version,
 * NOT the standalone pdfjs-dist package in node_modules.
 */
import { pdfjs } from 'react-pdf';

// Use react-pdf's bundled pdfjs version for the worker
// This ensures API version matches worker version
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Export for components that need direct pdfjs access
export { pdfjs };

// Safety check function
export function ensurePdfWorkerConfigured(): void {
  if (!pdfjs.GlobalWorkerOptions.workerSrc || 
      pdfjs.GlobalWorkerOptions.workerSrc.includes('cdnjs')) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
}
```

### 2. Update `src/components/pdf-chat/PDFChatUploadView.tsx`

Instead of importing `pdfjs-dist` directly, use the `pdfjs` object from `react-pdf` (via our worker config):

```typescript
// Replace:
import * as pdfjsLib from 'pdfjs-dist';

// With:
import { pdfjs } from '@/lib/pdfjsWorker';
```

Then update the text extraction to use `pdfjs.getDocument()` instead of `pdfjsLib.getDocument()`.

### 3. Update `src/components/OCRSplitView.tsx`

Same pattern - use `pdfjs` from react-pdf instead of standalone `pdfjs-dist`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/pdfjsWorker.ts` | Use `pdfjs` from react-pdf, export it for other components |
| `src/components/pdf-chat/PDFChatUploadView.tsx` | Import `pdfjs` from our worker config instead of `pdfjs-dist` |
| `src/components/OCRSplitView.tsx` | Same - use unified `pdfjs` export |

---

## Why This Works

1. **Single source of truth**: All PDF operations use `react-pdf`'s bundled `pdfjs-dist`
2. **Version alignment**: API version and worker version will always match since they come from the same package
3. **No CDN fallback**: Worker loads from your app's origin via Vite's bundling
4. **Backward compatible**: The `pdfjs` object from `react-pdf` has the same API as `pdfjs-dist`

---

## Technical Note

The standalone `pdfjs-dist@4.9.155` in `package.json` can optionally be removed later since we're using react-pdf's bundled version. However, keeping it doesn't cause harm - we just won't use it for the viewer components.
