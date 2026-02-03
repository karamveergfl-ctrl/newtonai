
# Plan: Fix PDF.js Version Mismatch Error

## Problem Analysis

The error message is clear:
> **"The API version '4.8.69' does not match the Worker version '4.9.155'"**

### Root Cause

There are **two different versions of pdfjs-dist** in the project:

| Package | pdfjs-dist Version |
|---------|-------------------|
| `react-pdf@9.2.1` (internal dependency) | **4.8.69** (locked) |
| `package.json` (top-level dependency) | **^4.9.155** |

The current worker configuration loads the worker from the top-level `pdfjs-dist` (v4.9.155), but the API code comes from `react-pdf`'s bundled version (v4.8.69).

### How It Happens

1. `src/lib/pdfjsWorker.ts` imports `pdfjs` from `react-pdf` (which uses v4.8.69)
2. The worker URL is set to `pdfjs-dist/build/pdf.worker.min.mjs`
3. Vite/bundler resolves this to the top-level `node_modules/pdfjs-dist` (v4.9.155)
4. Result: API v4.8.69 tries to communicate with Worker v4.9.155 → version mismatch error

---

## Solution

**Pin the top-level pdfjs-dist to match react-pdf's internal version (4.8.69).**

This ensures the worker file version matches the API version exported by react-pdf.

### Files to Modify

#### 1. `package.json` - Pin pdfjs-dist version

Change:
```json
"pdfjs-dist": "^4.9.155",
```

To:
```json
"pdfjs-dist": "4.8.69",
```

This removes the caret (`^`) to lock the exact version that matches react-pdf's internal pdfjs-dist.

---

## Why This Works

- `react-pdf@9.2.1` internally depends on `pdfjs-dist@4.8.69` (exact version, not a range)
- By pinning the top-level `pdfjs-dist` to the same version, the worker file will match
- The worker URL resolves to `node_modules/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`
- Both API and Worker are now v4.8.69 → no version mismatch

---

## Alternative Considered (Not Recommended)

Upgrading react-pdf to a version that uses pdfjs-dist 4.9.x would require checking if a newer react-pdf version exists with that dependency. However, pinning pdfjs-dist is simpler and doesn't risk breaking other react-pdf functionality.

---

## Summary

| Item | Before | After |
|------|--------|-------|
| pdfjs-dist in package.json | ^4.9.155 | 4.8.69 |
| react-pdf internal version | 4.8.69 | 4.8.69 |
| Version match | No (mismatch) | Yes (aligned) |

After this change, the "Chat with PDF" feature will work correctly without version mismatch errors.
