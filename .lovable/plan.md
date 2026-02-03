
# Fix Voice Chat: "Listening but Not Responding" (PDF Chat & Newton AI)

## Problem Summary

The voice chat feature appears stuck in "Listening..." state because:
1. Speech is captured as interim results but never finalized
2. When user stops, the system returns an empty transcript
3. No message is sent to the chat

## Root Causes Identified

| Issue | Location | Problem |
|-------|----------|---------|
| Interim results not committed | `useSpeechRecognition.ts` line 64-86 | Only `isFinal` results are saved; interim speech is lost |
| Empty transcript on stop | `useSpeechRecognition.ts` line 192-214 | Promise resolves with empty string if no final speech detected |
| No auto-stop on silence | Missing feature | Users must manually click to stop; no timeout |
| No fallback transcript | `useSpeechRecognition.ts` | Should use interim transcript if final is empty |

## Solution Overview

Implement a robust voice state machine with:
1. Auto-stop after 2 seconds of silence
2. Force finalization of interim transcript on stop
3. Auto-send transcript to chat without manual intervention
4. Visual feedback during all states
5. Error handling with user-visible messages

## Implementation Details

### File 1: `src/hooks/useSpeechRecognition.ts`

**Changes:**

1. **Add silence detection timer** - Track when last speech was detected and auto-stop after 2 seconds of silence

2. **Force commit interim transcript on stop** - If `finalTranscriptRef` is empty but `interimTranscript` has content, use that

3. **Add pending transcript ref** - Keep track of the latest interim result to use as fallback

```typescript
// New refs to add
const lastSpeechTimeRef = useRef<number>(Date.now());
const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
const pendingInterimRef = useRef<string>('');

// In onresult handler - track last speech time
recognition.onresult = (event) => {
  lastSpeechTimeRef.current = Date.now();
  // ... existing logic
  
  // Save interim as pending (fallback)
  if (interim) {
    pendingInterimRef.current = interim;
  }
};

// Start silence detection in startListening
const checkSilence = () => {
  const silenceDuration = Date.now() - lastSpeechTimeRef.current;
  if (silenceDuration > 2000 && isIntentionallyListeningRef.current) {
    // Auto-stop after 2s silence
    autoStopListening();
  }
};
silenceTimerRef.current = setInterval(checkSilence, 500);

// In stopListening - commit pending interim if final is empty
const stopListening = async (): Promise<string> => {
  // If no final transcript, use pending interim
  if (!finalTranscriptRef.current && pendingInterimRef.current) {
    finalTranscriptRef.current = pendingInterimRef.current;
  }
  // ... rest of existing logic
};
```

4. **Add auto-stop callback** - New optional callback prop `onAutoStop` to notify parent when voice auto-stops

### File 2: `src/hooks/useVoiceChat.ts`

**Changes:**

1. **Handle auto-stop event** - When speech recognition auto-stops, automatically send the transcript

2. **Add processing timeout** - If processing takes >4s, show feedback; if >6s, show error

3. **Validate minimum transcript length** - If transcript is <3 characters, show "Didn't catch that" message

```typescript
// Add onAutoStop handler to useSpeechRecognition call
const {
  // ... existing
} = useSpeechRecognition({
  // ... existing options
  onAutoStop: (transcript) => {
    // Auto-send when voice stops due to silence
    if (transcript.trim().length >= 3) {
      processVoiceQuery(transcript);
    } else {
      toast({
        title: "Didn't catch that",
        description: "Please try speaking again.",
      });
    }
  },
});
```

### File 3: `src/components/pdf-chat/ChatPanel.tsx`

**Changes:**

1. **Update voice transcript preview** - Show both interim and final transcript in real-time

2. **Add processing state indicator** - Show "Processing your question..." when voice is being converted

3. **Show error states visibly** - Display voice errors in the chat, not just console

```typescript
// Enhanced voice transcript display
{(isListening || isVoiceProcessing) && (
  <div className="px-3 py-2 bg-primary/5 border-t">
    <div className="flex items-center gap-2">
      <VoiceWaveform isActive={isListening} type="listening" className="w-12" />
      <span className="text-sm">
        {isVoiceProcessing 
          ? "Processing your question..." 
          : interimTranscript || transcript || "Listening..."}
      </span>
    </div>
  </div>
)}
```

### File 4: `src/components/newton-assistant/NewtonChatPanel.tsx`

**Changes:**

1. **Add auto-stop handling** - Same as PDF Chat, handle auto-stop and auto-send

2. **Show processing feedback** - Visual indicator during transcript processing

3. **Validate transcript before sending** - Check minimum length

## Voice State Machine

```text
+-------+     click mic     +-----------+
| IDLE  | ----------------> | LISTENING |
+-------+                   +-----------+
    ^                            |
    |                            | (silence 2s OR click mic OR 10s max)
    |                            v
    |                     +------------+
    |                     | PROCESSING |
    |                     +------------+
    |                            |
    |                            | (send to chat)
    |                            v
    |                     +------------+
    +---------------------| RESPONDING |
                          +------------+
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSpeechRecognition.ts` | Add silence detection, force interim commit, auto-stop callback |
| `src/hooks/useVoiceChat.ts` | Handle auto-stop, add processing timeout, validate transcript |
| `src/components/pdf-chat/ChatPanel.tsx` | Enhanced voice UI feedback, error display |
| `src/components/newton-assistant/NewtonChatPanel.tsx` | Add auto-stop handling, processing feedback |

## Testing Checklist

1. **Normal flow**: Click mic → speak → click mic → message sent automatically
2. **Silence auto-stop**: Click mic → speak → stop talking → auto-sends after 2s
3. **No speech**: Click mic → don't speak → auto-stops with "Didn't catch that"
4. **Short phrase**: Click mic → say "Hi" → click mic → validates and sends
5. **Long speech**: Click mic → speak for 10s → auto-stops and sends
6. **Error handling**: Deny mic permission → shows visible error message

## Edge Cases Handled

- **Empty transcript**: Falls back to interim transcript
- **Very short speech**: Shows "Didn't catch that" message
- **Long silence**: Auto-stops after 2 seconds
- **Max duration**: Force-stops after 10 seconds
- **API errors**: Visible error messages in UI
- **Browser compatibility**: Fallback to audio recorder transcription
