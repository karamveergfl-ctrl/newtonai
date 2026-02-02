
# Plan: Full-Screen Newton Processing Before PDF Chat Opens

## Current Behavior

Right now, when a user uploads a PDF:
1. The PDF viewer immediately opens showing the document
2. A `ProcessingOverlay` appears on top while text is being extracted
3. The chat input is disabled until processing completes

## Requested Behavior

Match the pattern of other study tools (Quiz, Flashcards, etc.):
1. User uploads a PDF on the upload page
2. **Full-screen Newton processing animation** plays while the PDF is being processed
3. Once processing is complete, navigate to the split view with the PDF ready to chat

This provides a cleaner UX where users see a focused animation during processing, then get a fully-ready PDF chat experience.

---

## Technical Implementation

### 1. Update PDFChatUploadView - Handle PDF Processing with Overlay

**File: `src/components/pdf-chat/PDFChatUploadView.tsx`**

Currently, when a PDF is selected, it calls `onFileSelected(file)` immediately, which transitions to the split view. Instead:

1. When PDF is uploaded, show the global `ProcessingOverlay` 
2. Create the document in the database via `usePDFDocument` hook
3. Extract text from PDF pages using `pdfjs-dist`
4. Process pages (store chunks) while showing progress
5. Only call `onFileSelected(file)` after processing completes

```tsx
// New flow in handleContentReady when type === "upload" and file is PDF
const handlePDFUpload = async (file: File) => {
  showProcessing({
    message: "Processing your PDF...",
    subMessage: "Extracting text and preparing for chat",
    variant: "overlay",
    canCancel: true,
    onCancel: handleCancelProcessing,
  });
  
  try {
    // Create document record
    const documentId = await createDocument(file.name);
    
    // Load PDF and extract text from all pages
    const pdfDoc = await pdfjsLib.getDocument(url).promise;
    const pages = [];
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      // Extract text...
      pages.push({ pageNumber: i, text: extractedText });
      
      // Update progress
      updateProgress(Math.round((i / pdfDoc.numPages) * 100));
    }
    
    // Process pages into chunks
    await processPages(documentId, pages);
    
    // Processing complete - now open the split view
    hideProcessing();
    onFileSelected(file);
  } catch (error) {
    hideProcessing();
    toast({ title: "Error", description: "Failed to process PDF" });
  }
};
```

### 2. Update PDFChatSplitView - Remove Internal Processing Overlay

**File: `src/components/pdf-chat/PDFChatSplitView.tsx`**

Since processing now happens BEFORE entering the split view:
- Remove the `ProcessingOverlay` component from both mobile and desktop layouts
- The document will already be processed when this view opens
- Keep the `isDocumentReady` check for edge cases

### 3. Pass Pre-Processed State to Split View

Update the props to accept pre-processed document state:
- Pass `documentId` and `extractedText` from the upload view
- This allows the split view to skip reprocessing

### 4. Fix Edge Function Error Handling

**File: `supabase/functions/rag-chat-pdf/index.ts`**

Add more detailed error logging to help debug:

```typescript
catch (error) {
  console.error("Error in RAG chat:", error);
  console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
  return new Response(
    JSON.stringify({ error: "Failed to process question", details: String(error) }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/pdf-chat/PDFChatUploadView.tsx` | Add PDF processing with global overlay before navigating to split view |
| `src/components/pdf-chat/PDFChatSplitView.tsx` | Remove internal `ProcessingOverlay`, accept pre-processed state |
| `supabase/functions/rag-chat-pdf/index.ts` | Improve error logging |

---

## Summary

1. **Processing happens on upload page** - User sees Newton animation while PDF is being processed
2. **Split view opens when ready** - No more overlay inside the chat view
3. **Matches other tools** - Same UX pattern as Quiz, Flashcards, Summarizer
4. **Better error handling** - Edge function provides more debugging info
