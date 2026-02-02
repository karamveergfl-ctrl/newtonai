
# Plan: Fix Chat with PDF Input - Not Working

## Problem

The chat input shows "Processing document..." and is disabled even when the PDF is visible and loaded. Looking at the screenshot:
- PDF shows page 1/8 with content visible
- Chat panel shows "Processing document..." placeholder
- Input is disabled, preventing any interaction

## Root Cause

The `isReady` check in `ChatPanel.tsx` is too strict:

```tsx
const isReady = processingStatus === 'completed' || processingProgress > 50;
```

**Timeline of what happens:**
1. User uploads PDF → document created with status `'pending'`
2. PDF viewer starts loading pages one by one
3. User sees the PDF content (page 1/8)
4. Text extraction only triggers `onTextExtracted` after ALL pages load
5. `processPages` is called, updating `processingProgress` in batches
6. Only after processing passes 50% does the input become enabled

**The issue:** Steps 1-3 happen fast, but steps 4-6 take time for large documents. The user is stuck waiting.

## Solution

Make the chat input available earlier by improving the `isReady` logic:

### File 1: `src/components/pdf-chat/ChatPanel.tsx`

**Current (line 123):**
```tsx
const isReady = processingStatus === 'completed' || processingProgress > 50;
```

**Fixed:**
```tsx
// Enable chat when:
// 1. Processing is complete, OR
// 2. Progress > 50%, OR  
// 3. Status is processing (meaning we've started), OR
// 4. Status is pending but progress has started (> 0)
const isReady = 
  processingStatus === 'completed' || 
  processingStatus === 'processing' ||
  processingProgress > 0;
```

This allows the input to be enabled as soon as any processing begins.

### File 2: `src/components/pdf-chat/PDFChatSplitView.tsx`

**Current:** `processingStatus` starts as `'pending'` and jumps to `'completed'`.

**Fix:** Update the document status to `'processing'` when text extraction begins.

Add status update in `handleTextExtracted`:
```tsx
const handleTextExtracted = useCallback(async (pages) => {
  const text = pages.map(p => p.text).join('\n\n');
  setExtractedText(text);
  
  // Update local document state to show processing has started
  // This will enable the chat input immediately
  
  if (document?.id && pages.length > 0) {
    await processPages(document.id, pages);
  }
}, [document?.id, processPages]);
```

### File 3: `src/hooks/usePDFDocument.ts`

**Current:** Status only updates at the very end of processing.

**Fix:** Set status to `'processing'` at the start of `processPages`:

```tsx
const processPages = useCallback(async (documentId: string, pages: PageData[]) => {
  if (!documentId || pages.length === 0) return;

  setIsProcessing(true);
  setProcessingProgress(0);
  
  // Mark as processing immediately so chat can be enabled
  setDocument(prev => prev ? { ...prev, processingStatus: 'processing' } : null);

  try {
    // ... rest of processing
  }
}, [toast]);
```

## Summary of Changes

| File | Change |
|------|--------|
| `ChatPanel.tsx` | Update `isReady` logic to be less restrictive |
| `usePDFDocument.ts` | Set `processingStatus` to `'processing'` at the start |

## Expected Result

After these changes:
1. User uploads PDF
2. PDF viewer loads first page
3. Once `processPages` is called, status becomes `'processing'`
4. Chat input is immediately enabled
5. User can start asking questions while processing continues in background
6. Full RAG answers become available as processing completes
