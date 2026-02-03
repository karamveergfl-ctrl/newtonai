
# Fix Voice Listening & Add Full-Screen Buttons

## Problem Analysis

### Issue 1: Voice Recognition Not Working Properly

Based on code analysis, the voice recording flow has these issues:

1. **Web Speech API `continuous: false`** - In `useVoiceChat.ts` line 109, the speech recognition is configured to stop after speech ends. This can cause the recognition to stop prematurely on brief pauses.

2. **Missing auto-restart on silence** - When the browser's Web Speech API times out due to no speech detected (event.error = 'no-speech'), there's no auto-restart mechanism while the user still intends to speak.

3. **Transcript not being sent** - The flow is:
   - User clicks mic → `startListening()` → recognition starts
   - User stops → `stopListening()` → returns `finalTranscript`
   - `processVoiceQuery(finalTranscript)` → calls `onTranscript(query)`
   - `ChatPanel` receives via `onTranscript` callback → calls `onSendMessage(text)`
   
   **The problem**: If `finalTranscriptRef.current` is empty when `stopListening` is called (because Web Speech API didn't finalize speech), the message is never sent.

### Issue 2: No Full-Screen Buttons

Neither Newton Chat nor PDF Chat have buttons to open in full-screen mode.

---

## Solution Plan

### Fix 1: Improve Voice Recognition Reliability

**File: `src/hooks/useSpeechRecognition.ts`**

1. Keep `continuous: true` to allow continuous listening
2. Add auto-restart on timeout (when recognition ends due to silence but user hasn't clicked stop)
3. Track user intent with a ref: `isIntentionallyListening`
4. Implement the recommended pattern from the Stack Overflow solution:

```typescript
// Add auto-restart when browser stops due to silence
recognition.onend = () => {
  // Auto-restart if user is still intending to listen
  if (isListeningRef.current && !recognitionStopped.current) {
    try {
      recognition.start();
    } catch (e) {
      // Already started or can't restart
      setIsListening(false);
    }
  } else {
    setIsListening(false);
  }
};

recognition.onerror = (event) => {
  if (event.error === 'no-speech') {
    // This is normal timeout, will auto-restart via onend
    return;
  }
  // Handle other errors...
};
```

**File: `src/hooks/useVoiceChat.ts`**

1. Change `continuous: true` to allow natural speech pauses
2. Ensure transcript is accumulated properly before sending

### Fix 2: Add Full-Screen Button to Newton Chat

**File: `src/components/GlobalNewtonAssistant.tsx`**

Add a fullscreen toggle button and state:
- Add `isFullScreen` state
- When fullscreen, change the panel container from `w-[380px] h-[520px]` to `fixed inset-4 w-auto h-auto`
- Add a Maximize2/Minimize2 button in the header of NewtonChatPanel

**File: `src/components/newton-assistant/NewtonChatPanel.tsx`**

Add props and button for fullscreen toggle:
```tsx
interface NewtonChatPanelProps {
  // ... existing props
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}
```

Add button in header:
```tsx
{onToggleFullScreen && (
  <Button variant="ghost" size="icon" onClick={onToggleFullScreen}>
    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
  </Button>
)}
```

### Fix 3: Add Full-Screen Button to PDF Chat Panel

**File: `src/components/pdf-chat/ChatPanel.tsx`**

Add fullscreen props:
```tsx
interface ChatPanelProps {
  // ... existing props
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}
```

Add button in header next to the context mode selector.

**File: `src/components/pdf-chat/PDFChatSplitView.tsx`**

Add fullscreen state and pass to ChatPanel:
```tsx
const [isChatFullScreen, setIsChatFullScreen] = useState(false);
```

When fullscreen, show only the ChatPanel, hide the PDF viewer panel.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSpeechRecognition.ts` | Add auto-restart on silence timeout, improve reliability |
| `src/hooks/useVoiceChat.ts` | Set `continuous: true`, ensure transcript accumulates |
| `src/components/GlobalNewtonAssistant.tsx` | Add fullscreen state and toggle |
| `src/components/newton-assistant/NewtonChatPanel.tsx` | Add fullscreen button to header |
| `src/components/pdf-chat/ChatPanel.tsx` | Add fullscreen button to header |
| `src/components/pdf-chat/PDFChatSplitView.tsx` | Handle fullscreen state for chat panel |

---

## Technical Implementation Details

### Voice Recognition Fix

The key change is to use a proper auto-restart pattern:

```typescript
// In useSpeechRecognition.ts
const isIntentionallyListeningRef = useRef(false);

const startListening = useCallback(async () => {
  isIntentionallyListeningRef.current = true;
  // ... start recognition
}, []);

const stopListening = useCallback(async (): Promise<string> => {
  isIntentionallyListeningRef.current = false;
  // ... stop and return transcript
}, []);

// In initWebSpeech:
recognition.onend = () => {
  if (isIntentionallyListeningRef.current) {
    // Browser stopped recognition due to silence - restart
    try {
      recognition.start();
      return; // Don't set isListening to false
    } catch (e) {
      // Can't restart
    }
  }
  
  setIsListening(false);
  // Resolve promise with transcript
};
```

### Full-Screen Newton Chat

```tsx
// GlobalNewtonAssistant.tsx
const [isFullScreen, setIsFullScreen] = useState(false);

const panelClass = isFullScreen 
  ? "fixed inset-4 w-auto h-auto z-50"
  : "w-[380px] h-[520px]";

<motion.div className={panelClass}>
  <NewtonChatPanel
    ...
    isFullScreen={isFullScreen}
    onToggleFullScreen={() => setIsFullScreen(prev => !prev)}
  />
</motion.div>
```

### Full-Screen PDF Chat

```tsx
// PDFChatSplitView.tsx
const [isChatFullScreen, setIsChatFullScreen] = useState(false);

{isChatFullScreen ? (
  // Show only chat panel
  <div className="h-full">
    <ChatPanel
      ...
      isFullScreen={true}
      onToggleFullScreen={() => setIsChatFullScreen(false)}
    />
  </div>
) : (
  // Normal split view
  <ResizablePanelGroup>
    ...
  </ResizablePanelGroup>
)}
```

---

## Testing Checklist

1. **Voice Recording:**
   - Click mic button → should show "Listening..."
   - Speak a question → should show interim transcript
   - Click mic again to stop → transcript should be sent to chat
   - Wait silently → recognition should auto-restart (not stop)

2. **Newton Chat Full Screen:**
   - Click Newton trigger button
   - Click maximize button → panel expands to near full screen
   - Click minimize → returns to normal size

3. **PDF Chat Full Screen:**
   - Upload PDF
   - Click maximize button on chat panel → PDF viewer hides, chat takes full width
   - Click minimize → returns to split view
