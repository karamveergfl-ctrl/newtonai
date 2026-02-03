
# Zero-Silent-Failures Fix for PDF Chat

## Problem Summary

Based on code analysis, I've identified **critical gaps** in the chat pipeline where responses can silently fail without any UI feedback. The current system doesn't enforce a strict response contract.

## Root Cause Analysis

### Issue 1: Frontend Catches Error But Doesn't Display Fallback Message

In `src/hooks/usePDFChat.ts` lines 156-162:
```typescript
} catch (error: any) {
  console.error('Chat error:', error);
  toast({
    title: 'Error',
    description: error.message || 'Failed to get response',
    variant: 'destructive',
  });
  // NO assistant message added to chat! Silent failure in UI
}
```

The error only shows a toast, but NO message appears in the chat. User's message is visible, but no response appears - this looks broken.

### Issue 2: Backend Can Return Error Objects That Frontend Doesn't Handle

When the edge function returns `{ error: "..." }` with status 200 (e.g., in some code paths), the frontend doesn't check for the error property:

```typescript
const { data, error } = await supabase.functions.invoke('rag-chat-pdf', {...});
if (error) throw error; // Only catches Supabase errors, not {error: "..."} in data
```

### Issue 3: No Timeout Handling

If the backend takes too long or hangs, there's no timeout and no fallback message.

### Issue 4: Voice Chat Doesn't Sync With Message State

The `useVoiceChat` hook sends transcript to parent via `onTranscript`, but doesn't add error messages if something fails during processing.

---

## Comprehensive Fix Plan

### Fix 1: Add Error Message to Chat (Never Leave Empty)

**File:** `src/hooks/usePDFChat.ts`

Update the catch block to add a visible error message to the chat:

```typescript
} catch (error: any) {
  console.error('Chat error:', error);
  
  // CRITICAL: Always add a visible error message to the chat
  const errorMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: error.message?.includes('Rate limit') 
      ? 'You\'ve sent too many questions. Please wait a minute and try again.'
      : 'Something went wrong while searching the document. Please try again.',
    confidence: 'not_found' as ConfidenceLevel,
    createdAt: new Date(),
  };
  setMessages(prev => [...prev, errorMessage]);
  
  toast({
    title: 'Error',
    description: error.message || 'Failed to get response',
    variant: 'destructive',
  });
}
```

### Fix 2: Handle Backend Error Responses in Data

**File:** `src/hooks/usePDFChat.ts`

Add validation that checks if `data.error` exists:

```typescript
const { data, error } = await supabase.functions.invoke('rag-chat-pdf', {...});

if (error) throw error;

// Check for error in response body (backend returned error object)
if (data?.error) {
  throw new Error(data.error);
}

// Check for missing answer
if (!data?.answer) {
  throw new Error('No response received from the document. Please try again.');
}
```

### Fix 3: Add Timeout With Fallback Message

**File:** `src/hooks/usePDFChat.ts`

Wrap the API call in a timeout:

```typescript
// Create timeout promise
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Request timed out. Please try again.')), 15000);
});

// Race the API call against timeout
const result = await Promise.race([
  supabase.functions.invoke('rag-chat-pdf', {...}),
  timeoutPromise,
]) as { data: any; error: any };
```

### Fix 4: Backend Must Return Standard Response Contract

**File:** `supabase/functions/rag-chat-pdf/index.ts`

Wrap the entire handler in a try-catch that ALWAYS returns a valid response:

```typescript
// At the very end of the catch block (lines 775-784)
return new Response(
  JSON.stringify({ 
    answer: "Something went wrong while searching the document. Please try again.",
    citations: [],
    confidence: 'not_found',
    status: 'ERROR',
    debug_id: crypto.randomUUID(),
  }),
  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

Note: Return status 200 with error message so frontend can display it, not just HTTP error codes that get swallowed.

### Fix 5: Add "Still Thinking" Fallback UI

**File:** `src/components/pdf-chat/ChatPanel.tsx`

Add a timeout effect that shows a fallback message if loading takes too long:

```typescript
// Add state for delayed loading message
const [loadingTooLong, setLoadingTooLong] = useState(false);

useEffect(() => {
  let timer: NodeJS.Timeout;
  if (isLoading) {
    timer = setTimeout(() => setLoadingTooLong(true), 5000);
  } else {
    setLoadingTooLong(false);
  }
  return () => clearTimeout(timer);
}, [isLoading]);

// In the loading indicator JSX:
{isLoading && !isStreaming && (
  <div className="flex justify-start">
    <div className="bg-muted p-3 rounded-lg flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <LottieNewton state="thinking" size="sm" />
        <span className="text-sm text-muted-foreground">
          {loadingTooLong ? 'Still searching the document...' : 'Thinking...'}
        </span>
        <Button {...} />
      </div>
      {loadingTooLong && (
        <span className="text-xs text-muted-foreground">
          This is taking longer than usual. You can cancel and try again.
        </span>
      )}
    </div>
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/usePDFChat.ts` | Add error message to chat, validate response, add timeout |
| `supabase/functions/rag-chat-pdf/index.ts` | Return proper error response (status 200 with error message) |
| `src/components/pdf-chat/ChatPanel.tsx` | Add "still loading" fallback UI |

---

## Standard Response Contract (Enforced)

Every response from `rag-chat-pdf` will follow this structure:

```typescript
{
  answer: string;          // Always present, even for errors
  citations: Citation[];   // Always array, can be empty
  confidence: ConfidenceLevel; // 'high' | 'medium' | 'low' | 'clarify' | 'not_found'
  status?: 'ANSWERED' | 'NOT_FOUND' | 'ERROR'; // Optional for debugging
  debug_id?: string;       // For debugging
  correctedQuery?: string; // If spell correction was applied
  suggestedTopics?: string[]; // For clarification requests
}
```

---

## Testing Checklist

After implementation, verify:

1. Type question + get answer with sources
2. Type misspelled question + get corrected answer
3. Type unrelated question + get "not found" message (NOT silence)
4. Simulate backend error + get visible error message in chat
5. Simulate slow response + see "still thinking" message
6. Voice question + see response appear in chat
7. Cancel request mid-flight + no UI hang

---

## Summary

The key fix is ensuring the frontend **ALWAYS adds a message to the chat**, even on errors. Currently, errors only show toasts while leaving the chat visually empty. This creates a perception that the app is broken when it's actually just failing silently.
