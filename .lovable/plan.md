

# Fix PDF Chat - Messages Not Appearing on Screen

## Problem Identified

When users type and send questions in the PDF Chat mode, nothing appears on screen. Through code analysis, I found the root cause is in the `usePDFChat` hook's `sendMessage` function which **silently returns** when conditions aren't met.

## Root Causes

### Primary Issue: Silent Failure in `sendMessage`

In `src/hooks/usePDFChat.ts` line 77:

```typescript
if (!documentId || !question.trim() || isLoading) return;
```

When `documentId` is null/undefined (e.g., before document processing completes), the function returns silently without:
- Adding the user's message to the chat
- Showing any error feedback
- Indicating what went wrong

### Secondary Issue: Missing `processingProgress` Prop

In `src/components/pdf-chat/PDFChatSplitView.tsx`, the `processingProgress` value from `usePDFDocument()` is never destructured or passed to `ChatPanel`. This means the progress bar and "isReady" logic may not work correctly in some edge cases.

### Tertiary Issue: Duplicate RAG Calls in Voice Chat

The `useVoiceChat` hook has its own separate `processVoiceQuery` function that calls the RAG endpoint directly, but also triggers `onTranscript` which calls the parent's `sendMessage`. This can cause confusion and duplicate API calls.

---

## Solution Plan

### Fix 1: Add User Feedback for Failed Message Sends (Critical)

**File:** `src/hooks/usePDFChat.ts`

Instead of silently returning, show helpful feedback and still display the user's attempted message:

```typescript
const sendMessage = useCallback(async (question: string) => {
  // Validate question
  if (!question.trim()) return;
  
  // Check if already loading
  if (isLoading) {
    toast({
      title: 'Please wait',
      description: 'Processing your previous question...',
    });
    return;
  }
  
  // Add user message immediately (even if we can't process it yet)
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: question,
    createdAt: new Date(),
  };
  setMessages(prev => [...prev, userMessage]);
  
  // Check if document is ready
  if (!documentId) {
    // Add system message explaining the issue
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: "I'm still processing your document. Please wait a moment and try again.",
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
    return;
  }
  
  setIsLoading(true);
  // ... rest of the function
}, [...]);
```

### Fix 2: Pass `processingProgress` to ChatPanel

**File:** `src/components/pdf-chat/PDFChatSplitView.tsx`

Destructure and pass the progress value:

```typescript
const {
  document,
  sessionId,
  isProcessing,
  processingProgress,  // Add this
  createDocument,
  processPages,
  loadExistingDocument,
} = usePDFDocument();

// Later in ChatPanel (both mobile and desktop):
<ChatPanel
  // ... existing props
  processingProgress={processingProgress}  // Add this line
/>
```

### Fix 3: Simplify Voice Chat Integration

**File:** `src/components/pdf-chat/ChatPanel.tsx`

Remove the `onTranscript` callback since `processVoiceQuery` already handles the full flow:

```typescript
const {
  // ... other values
} = useVoiceChat({
  documentId: documentId || null,
  sessionId: sessionId || null,
  onCitationFound: (pageNumber, quote) => {
    onCitationClick(pageNumber, quote);
  },
  // Remove onTranscript - voice chat handles its own flow
  onAnswer: (answer) => {
    // Optionally sync the answer with the main messages array
    // This will be handled in useVoiceChat directly
  },
});
```

**File:** `src/hooks/useVoiceChat.ts`

Update to add messages to a callback instead of managing separate state, OR remove the duplicate `processVoiceQuery` and just use `onTranscript` to trigger the parent's `sendMessage`.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/usePDFChat.ts` | Add user feedback when sendMessage fails, always show user message |
| `src/components/pdf-chat/PDFChatSplitView.tsx` | Pass `processingProgress` prop to ChatPanel in both mobile and desktop views |
| `src/components/pdf-chat/ChatPanel.tsx` | Simplify voice chat integration |
| `src/hooks/useVoiceChat.ts` | Remove duplicate RAG call OR sync with parent messages |

---

## Testing Checklist

After implementation, verify:

1. User types question → message appears immediately in chat
2. If document not ready → helpful "processing" message shown
3. Processing progress bar shows correct percentage
4. Voice chat works and messages appear in the chat panel
5. No duplicate API calls when using voice

---

## Summary

The main fix is ensuring users **always see feedback** when they send a message, even if the system can't process it yet. Currently, the code silently fails which makes users think the feature is broken. The fix adds user messages immediately and provides helpful system responses when the document isn't ready.

