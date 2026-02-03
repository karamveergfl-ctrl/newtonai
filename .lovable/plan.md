
# Production-Ready "Chat with Content" Feature Implementation Plan

## Executive Summary
This plan addresses building a comprehensive, content-restricted chat system that supports multiple input types (PDF, DOCX, TXT, Images, Audio, YouTube) with strict grounding to prevent AI hallucinations.

---

## Current State Analysis

### What Already Exists
1. **PDF Chat Flow**: `PDFChatUploadView` → `PDFChatSplitView` → `ChatPanel` with RAG-based retrieval
2. **Text Chat Flow**: `TextChatView` for non-PDF content (YouTube transcripts, audio, text)
3. **Content Input**: `ContentInputTabs` supporting Upload, Recording, YouTube, Text
4. **Backend Functions**: 
   - `rag-chat-pdf` - RAG-based chat with keyword scoring
   - `chat-with-pdf` - Simple context-based chat
   - `process-pdf-chunks` - Text chunking
   - `transcribe-audio` - Audio transcription
   - `fetch-transcript` - YouTube transcript fetching
   - `ocr-handwriting` - Image OCR

### Current Issues Identified
1. **PDF.js Version**: Already fixed - `pdfjs-dist@4.8.69` pinned to match `react-pdf@9.2.1`
2. **Text Chat Uses Wrong Function**: `TextChatView` uses `chat-with-pdf` which lacks strict grounding
3. **No DOCX Support**: Missing DOCX text extraction
4. **Inconsistent Grounding**: Non-PDF chat doesn't enforce content-only responses
5. **Missing Confidence Feedback**: Text chat doesn't show confidence indicators

---

## Implementation Plan

### Phase 1: Unify Chat Backend with Strict Content Grounding

#### 1.1 Create New Edge Function: `chat-with-content`
A unified chat function that works for ALL content types with strict grounding rules.

**File**: `supabase/functions/chat-with-content/index.ts`

```typescript
// Core improvements:
// 1. Strict system prompt enforcing content-only answers
// 2. Keyword-based relevance scoring (same as rag-chat-pdf)
// 3. Confidence scoring in responses
// 4. Citation support for all content types
// 5. General query detection for summarization requests
```

**Key Features**:
- Accepts either `documentId` (for chunked PDFs) or `textContent` (for direct text)
- Returns `{ answer, citations, confidence }` for all content types
- Uses identical grounding prompt: "Answer ONLY from the provided context. If not present, say so."

#### 1.2 Update System Prompt for Maximum Strictness
```text
CRITICAL RULES:
1. Answer ONLY from the provided document excerpts below
2. If the answer is NOT clearly present, respond: "This information is not present in the uploaded content."
3. NEVER add external knowledge, infer beyond the text, or make assumptions
4. Always cite page numbers or section markers when referencing content
5. If asked about something completely unrelated to the document, politely redirect to document topics
```

---

### Phase 2: Add DOCX Support

#### 2.1 Create Edge Function: `extract-docx-text`
**File**: `supabase/functions/extract-docx-text/index.ts`

Uses `mammoth` library (via CDN import for Deno) to extract text while preserving:
- Headings structure
- Paragraph breaks
- List formatting

#### 2.2 Update `contentProcessing.ts`
Add `extractTextFromDOCX()` function that calls the edge function.

#### 2.3 Update `ContentInputTabs`
Add `.doc`, `.docx` to accepted file types:
```typescript
acceptedFileTypes = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  // ...existing types
}
```

---

### Phase 3: Enhance Text Chat View

#### 3.1 Update `TextChatView` to Use Unified Backend
- Switch from `chat-with-pdf` to `chat-with-content`
- Add confidence indicators
- Add citation display (section-based for text content)
- Implement chunking on frontend for large text content

#### 3.2 Add Processing Pipeline for Text Content
```typescript
// For text content > 3000 chars, chunk into sections
// Store in session for retrieval
// Enable keyword-based search within chunks
```

---

### Phase 4: Improve Error Handling

#### 4.1 Graceful PDF Error Handling
Add try-catch wrapper in `PDFChatUploadView.handlePDFUpload`:
```typescript
catch (error) {
  if (error.message.includes('version')) {
    // Version mismatch - suggest refresh
    toast({
      title: "PDF Processing Error",
      description: "Please refresh the page and try again. If the issue persists, try a different PDF.",
      variant: "destructive",
    });
  } else if (error.message.includes('password')) {
    // Password protected
    toast({
      title: "Protected PDF",
      description: "This PDF is password protected. Please upload an unlocked version.",
      variant: "destructive",
    });
  } else {
    // Generic error with helpful guidance
    toast({
      title: "Processing Error",
      description: "We couldn't read this file. Please try a different document or paste the text directly.",
      variant: "destructive",
    });
  }
}
```

#### 4.2 Add File Validation
- Check for empty documents before processing
- Validate file is not corrupted
- Check for scanned PDFs and suggest OCR option

---

### Phase 5: Performance Optimizations

#### 5.1 Lazy Loading
- Dynamically import PDF.js components only when needed
- Use React.lazy for PDFViewerWithHighlight

#### 5.2 Session Caching
- Cache extracted text in sessionStorage for quick re-access
- Clear cache when new document uploaded

#### 5.3 Cancel Processing
Already implemented - ensure abort controller works for all operations.

---

## Technical Implementation Details

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/chat-with-content/index.ts` | Unified content-grounded chat |
| `supabase/functions/extract-docx-text/index.ts` | DOCX text extraction |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/pdf-chat/TextChatView.tsx` | Use new unified backend, add confidence/citations |
| `src/utils/contentProcessing.ts` | Add DOCX extraction function |
| `src/components/ContentInputTabs.tsx` | Add DOCX to accepted types |
| `src/components/pdf-chat/PDFChatUploadView.tsx` | Improve error handling |
| `src/components/pdf-chat/ChatPanel.tsx` | Minor UI refinements |
| `supabase/functions/rag-chat-pdf/index.ts` | Strengthen grounding prompt |
| `supabase/functions/chat-with-pdf/index.ts` | Strengthen grounding prompt |

---

## Grounding Strategy (Anti-Hallucination)

### System Prompt Template
```text
You are an AI tutor helping a student understand content from a document titled "{documentName}".

ABSOLUTE RULES - VIOLATING THESE IS FORBIDDEN:
1. Answer ONLY using information from the DOCUMENT EXCERPTS provided below
2. If the requested information is NOT in the excerpts, respond exactly: 
   "This information is not present in the uploaded content."
3. NEVER use your training knowledge, external facts, or assumptions
4. NEVER say "based on my knowledge" or similar phrases
5. Always cite [Page X] or [Section: Name] when referencing content
6. If the question is completely off-topic, respond:
   "This question is not related to the uploaded content. Please ask about the document."

DOCUMENT EXCERPTS:
{context}
```

### Confidence Scoring Logic
```typescript
function calculateConfidence(retrievedChunks, answer): ConfidenceLevel {
  if (answer.includes("not present in the uploaded content")) return 'not_found';
  if (retrievedChunks.length === 0) return 'low';
  if (retrievedChunks[0].similarity < 0.3) return 'low';
  if (retrievedChunks[0].similarity < 0.5) return 'medium';
  return 'high';
}
```

---

## AdSense Compliance Checklist

- No ads inside chat interface
- No ads during processing states
- No auto-generated content pages
- Clear Privacy Policy and Terms of Service pages (already exist)
- Original educational content on landing pages (already exists)
- No scraped or copied content
- User-generated content (chat) not indexed by search engines

---

## Testing Acceptance Criteria

| Test Case | Expected Result |
|-----------|-----------------|
| Upload PDF → Ask question in document | Accurate answer with page citation |
| Ask question NOT in document | "This information is not present..." response |
| Upload DOCX → Chat works | Same as PDF behavior |
| Upload image → OCR + Chat | Text extracted, chat works |
| YouTube URL → Transcript + Chat | Transcript fetched, chat grounded |
| Audio recording → Transcribe + Chat | Audio transcribed, chat grounded |
| Paste text → Chat works | Direct text chat with grounding |
| Large document (50+ pages) | Processes without timeout, chat responsive |
| Cancel processing mid-way | Processing stops cleanly |
| Corrupted/empty file | Clear error message, no crash |

---

## Implementation Priority

1. **Critical**: Strengthen grounding prompts in existing functions
2. **High**: Create unified `chat-with-content` function
3. **High**: Update `TextChatView` to use unified backend
4. **Medium**: Add DOCX support
5. **Medium**: Improve error handling
6. **Low**: Performance optimizations (lazy loading, caching)

---

## Summary

This plan creates a production-ready "Chat with Content" system by:

1. **Unifying** the backend with a single grounded chat function
2. **Strengthening** anti-hallucination prompts
3. **Expanding** file support (adding DOCX)
4. **Improving** error handling for graceful failures
5. **Maintaining** AdSense compliance throughout

The existing architecture is solid - this plan builds on it to address the identified gaps while keeping the codebase maintainable and performant.
