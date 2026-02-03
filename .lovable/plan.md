
# Real-Time Voice Chat with Document: Implementation Plan

## Executive Summary

This plan adds a **Voice Chat** feature to the existing PDF Chat system, enabling students to speak questions naturally and receive spoken answers - all strictly grounded in the uploaded document content. Voice is implemented as an input/output layer on top of the already-approved smart retrieval engine.

---

## Current State Analysis

### What Already Exists

| Component | Description |
|-----------|-------------|
| **Smart Retrieval Engine** | Multi-stage pipeline with Levenshtein + Soundex + hybrid scoring |
| **STT (transcribe-audio)** | Edge function using Gemini 2.5 Flash for transcription |
| **TTS (text-to-speech)** | OpenAI TTS API for voice synthesis |
| **ElevenLabs TTS** | High-quality voices for podcast generation |
| **Web Speech API** | Browser-based fallback TTS in `useWebSpeechTTS.ts` |
| **AudioRecorder** | Frontend utility for mic recording |
| **ChatPanel** | Already has a mic button for voice input (push-to-talk) |

### Current Voice Flow (Push-to-Talk)
```
User clicks mic → Records audio → Stops → Sends to transcribe-audio 
→ Returns text → Sends as chat message → Text response only
```

### Required Voice Flow (Real-Time Talkback)
```
User speaks → Streaming STT → Normalize query (spell/phonetic) 
→ Smart retrieval (document-grounded) → Generate spoken answer 
→ Stream TTS audio back → Highlight PDF section
```

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        VOICE CHAT INTERFACE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ Mic Button  │  │ Voice Wave  │  │ Speaking    │                  │
│  │ (Push/Hold) │  │ Visualizer  │  │ Indicator   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: VOICE INPUT (Speech → Text)                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Web Speech API (streaming, real-time)                        │   │
│  │ OR transcribe-audio Edge Function (batch, higher accuracy)   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  Features:                                                           │
│  • Indian accent support (via multilingual Gemini model)             │
│  • Continuous listening mode (optional toggle)                       │
│  • Language selection (Hindi, English, regional)                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: QUERY PROCESSING (Same as Text Chat)                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ normalizeQuery() → levenshtein() → soundex()                 │   │
│  │ buildDocumentVocabulary() → expandWithDocumentContext()      │   │
│  │ hybridScore() → determineConfidence()                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  Reuses: rag-chat-pdf & chat-with-content edge functions            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: DOCUMENT-GROUNDED ANSWER                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Strict grounding: Answer ONLY from document excerpts         │   │
│  │ Confidence check: If low → spoken clarification              │   │
│  │ Citation extraction: Page numbers for PDF highlighting       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  Spoken refusal: "I couldn't find this in your document."          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 4: VOICE OUTPUT (Text → Speech)                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Primary: ElevenLabs TTS (high quality, teacher-like)         │   │
│  │ Fallback: Web Speech API (browser native)                    │   │
│  │ Streaming: Play audio as chunks arrive (low latency)         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  Voice style: Calm, slow pace, step-by-step, student-friendly       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 5: PDF VISUAL SYNC                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Auto-scroll to cited page                                    │   │
│  │ Highlight matched text section                               │   │
│  │ Show page badge in UI                                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Create Voice Chat Hook

**File: `src/hooks/useVoiceChat.ts`**

A custom hook that manages the complete voice interaction lifecycle:

```typescript
interface UseVoiceChatOptions {
  documentId: string | null;
  sessionId: string | null;
  language?: string;
  onCitationFound?: (pageNumber: number, quote: string) => void;
}

interface UseVoiceChatReturn {
  // State
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  currentAnswer: string;
  error: string | null;
  
  // Actions
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  stopSpeaking: () => void;
  setLanguage: (lang: string) => void;
}
```

**Core Features:**
- Real-time speech recognition (Web Speech API with fallback to transcribe-audio)
- Audio playback with speaking state management
- Integration with existing `usePDFChat` for document retrieval
- Follow-up question support (inherits last context)

---

### Phase 2: Create Voice TTS Edge Function

**File: `supabase/functions/voice-chat-tts/index.ts`**

A dedicated TTS function optimized for conversational voice output:

**Key Differences from Podcast TTS:**
- Single voice (tutor voice, not host1/host2)
- Slower speaking rate for clarity
- Optimized for shorter responses (answers, not scripts)
- Streaming support for low latency

**Voice Configuration:**
```typescript
const TUTOR_VOICE = "onwK4e9ZLuTAKqWW03F9"; // Daniel - calm, clear
const VOICE_SETTINGS = {
  stability: 0.65,        // More stable for clear teaching
  similarity_boost: 0.7,
  style: 0.2,             // Minimal style exaggeration
  use_speaker_boost: true,
  speed: 0.9,             // Slightly slower for comprehension
};
```

---

### Phase 3: Update ChatPanel for Voice Mode

**File: `src/components/pdf-chat/ChatPanel.tsx`**

Add a dedicated voice mode toggle and visual feedback:

**New UI Elements:**
1. **Voice Mode Toggle** - Switch between text and voice mode
2. **Listening Indicator** - Animated waveform while recording
3. **Speaking Indicator** - Visual feedback while AI speaks
4. **Voice Controls** - Stop speaking, replay answer

**Voice Mode Behavior:**
- When voice mode is ON:
  - Mic button becomes push-to-talk (hold to speak)
  - Answers are automatically spoken
  - Text input is hidden
- When voice mode is OFF:
  - Current behavior (text chat with optional voice input)

---

### Phase 4: Create Voice Chat Component

**File: `src/components/pdf-chat/VoiceChatInterface.tsx`**

A dedicated interface for voice-first interaction:

```typescript
interface VoiceChatInterfaceProps {
  documentId: string;
  sessionId: string;
  language?: string;
  onCitationClick: (pageNumber: number, quote: string) => void;
  onTranscript: (text: string) => void;
}
```

**Features:**
- Large central mic button (press and hold)
- Real-time transcript display
- Speaking avatar/animation (Newton character)
- Answer text with page references
- Voice waveform visualizer

---

### Phase 5: Speech Recognition Implementation

**Primary: Web Speech API (Low Latency)**
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = languageCode; // "hi-IN", "en-IN", etc.
```

**Fallback: transcribe-audio Edge Function (Higher Accuracy)**
- Used when Web Speech API unavailable
- Better for Indian accents and technical vocabulary
- Batch mode (record → transcribe)

**Query Normalization (Post-STT):**
Voice transcripts go through the same `normalizeQuery()` pipeline:
- Spell correction via Levenshtein
- Phonetic matching via Soundex
- Document vocabulary expansion

---

### Phase 6: Spoken Answer Generation

**Answer Format for TTS:**
The AI prompt is modified to generate TTS-friendly responses:

```typescript
const voiceChatPrompt = `
You are a calm, patient tutor helping a student understand their document.

SPEAKING STYLE:
1. Use simple, clear language
2. Explain step by step
3. Reference page numbers naturally: "On page 7..."
4. Acknowledge the question: "Great question about..."
5. Keep answers concise (under 150 words for voice)

GROUNDING RULES (UNCHANGED):
1. Answer ONLY from document excerpts
2. If not found: "I couldn't find this in your document. 
   Please ask about a topic that's covered here."
3. Never use external knowledge
`;
```

**Response Processing:**
1. Generate text answer (with citations)
2. Clean for TTS (remove markdown, format page refs)
3. Send to ElevenLabs TTS
4. Stream audio back to client
5. Sync PDF highlight with spoken content

---

### Phase 7: PDF Visual Synchronization

**Auto-Scroll on Citation:**
When AI mentions a page, automatically:
1. Navigate PDF to that page
2. Highlight the relevant text section
3. Show visual indicator

**Implementation:**
```typescript
// In answer parsing, detect page references
const pageRegex = /(?:page|pg\.?)\s*(\d+)/gi;
const matches = answer.matchAll(pageRegex);

for (const match of matches) {
  const pageNumber = parseInt(match[1]);
  onCitationFound(pageNumber, matchedQuote);
}
```

---

## Technical Implementation Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useVoiceChat.ts` | Voice chat state management hook |
| `src/hooks/useSpeechRecognition.ts` | Speech recognition abstraction |
| `src/components/pdf-chat/VoiceChatInterface.tsx` | Voice-first UI component |
| `src/components/pdf-chat/VoiceWaveform.tsx` | Audio visualization component |
| `src/components/pdf-chat/SpeakingIndicator.tsx` | AI speaking state indicator |
| `supabase/functions/voice-chat-tts/index.ts` | Optimized TTS for voice chat |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/pdf-chat/ChatPanel.tsx` | Add voice mode toggle, speaking indicator |
| `src/components/pdf-chat/PDFChatSplitView.tsx` | Integrate voice chat interface |
| `src/hooks/usePDFChat.ts` | Add voice response handling |
| `supabase/functions/rag-chat-pdf/index.ts` | Add voice mode prompt modifications |

---

## Voice Answer Examples

### User Speaks: "reverse vise"

**Transcript Normalization:**
```
"reverse vise" → "reverse bias" (Levenshtein: 2 edits)
```

**Spoken Answer:**
> "Great question! Let me explain reverse biasing from your document.
> 
> On page 7, it explains that in reverse biasing of a Zener diode, the cathode is connected to the positive terminal and the anode to the negative terminal. This configuration allows the diode to operate in its breakdown mode, which is useful for voltage regulation.
> 
> Would you like me to explain anything else about this topic?"

### User Speaks: "Explain again slowly"

**Follow-up Handling:**
- System remembers last topic (reverse biasing)
- Re-explains with simpler language
- Same page reference maintained

### User Asks Unrelated Topic: "transistor amplifier"

**Spoken Refusal:**
> "I couldn't find any information about transistor amplifiers in your uploaded document. This topic doesn't appear to be covered here.
> 
> Would you like to ask about one of the topics that are in your document, like Zener diodes or reverse biasing?"

---

## Latency Optimization

**Target: Speech end → Answer start < 700ms**

| Stage | Target Time | Optimization |
|-------|-------------|--------------|
| STT (Web Speech) | ~50ms | Browser-native, streaming |
| Query Processing | ~20ms | In-memory vocabulary |
| RAG Retrieval | ~200ms | Pre-indexed chunks |
| AI Response | ~300ms | Streaming response |
| TTS Generation | ~100ms | ElevenLabs streaming |

**Streaming Strategy:**
1. Start TTS as soon as first sentence is generated
2. Play audio in chunks (don't wait for full response)
3. Queue subsequent chunks while playing

---

## Conversation Memory Rules

**Session Memory:**
- Follow-up questions inherit document context
- Last matched section is remembered for "explain again"
- Topic references like "it" and "this" resolve correctly

**Memory Reset Triggers:**
1. New document uploaded
2. User clicks "New Chat"
3. Session timeout (30 min inactivity)
4. Explicit "start over" voice command

---

## Language Support

**Supported Languages:**
- English (en-IN, en-US)
- Hindi (hi-IN)
- Regional: Tamil, Telugu, Bengali, Marathi, Gujarati, etc.

**Implementation:**
- Web Speech API `lang` parameter
- ElevenLabs multilingual model for TTS
- Gemini-based transcription for better accent handling

---

## AdSense Compliance

**Safe Practices:**
- No ads during voice interaction
- Voice feature is a tool, not auto-generated content
- User-initiated actions only
- Clear privacy disclosure for voice data

---

## Acceptance Test Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| User speaks "reverse vise" | Corrects to "reverse bias", speaks explanation from document |
| User speaks "explain again slowly" | Re-explains same section with simpler language |
| User asks unrelated topic | Politely refuses: "Not in your document" |
| User speaks in Hindi | Transcribes correctly, answers in Hindi |
| Low confidence match | AI asks clarifying question via voice |
| Network failure mid-answer | Graceful fallback to text, error toast |
| PDF sync on page mention | Scrolls to mentioned page, highlights text |

---

## Summary

This implementation adds voice chat as a **first-class study feature** by:

1. **Leveraging existing infrastructure** - Reuses smart retrieval, STT, and TTS systems
2. **Maintaining strict grounding** - Voice queries go through same document validation
3. **Optimizing for students** - Spell/phonetic correction, slow speaking, step-by-step
4. **Low latency design** - Streaming at every stage for sub-second response
5. **Visual synchronization** - PDF highlights match spoken content
6. **AdSense compliant** - No ads in voice flow, user-initiated only

The voice layer adds natural interaction without compromising the core document-grounded intelligence.
