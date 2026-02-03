
# Smart Document-Aware Chat: Fuzzy + Semantic + Student-Grade Intelligence

## Problem Statement

The current retrieval system uses strict keyword matching that fails when students make:
- **Spelling mistakes**: "reverse vise" → "reverse biasing"
- **Phonetic errors**: "zenar diode" → "zener diode"  
- **Partial terms**: "battery connection reverse" → "reverse bias"
- **Informal queries**: Short, incomplete questions

**Current Flow (Broken)**:
```
User: "reverse vise"
→ Keyword search for "reverse", "vise"
→ No match for "vise" in document
→ Low similarity score (<0.15)
→ "This question is not related to the uploaded document"
```

**Required Flow**:
```
User: "reverse vise"
→ Spell check: "vise" → "bias" (edit distance 2)
→ Phonetic: vise sounds like bias
→ Expand: "reverse bias" → "reverse biasing"
→ Find chunks with "Reverse Biasing"
→ Helpful answer with page citation
```

---

## Architecture Overview

### Multi-Stage Retrieval Pipeline

```text
┌─────────────────────────────────────────────────────────────────────┐
│                      USER QUERY: "reverse vise"                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 1: QUERY PREPROCESSING                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Lowercase +  │  │ Spell Check  │  │ Phonetic     │               │
│  │ Normalize    │  │ (Levenshtein)│  │ (Soundex)    │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│         │                  │                  │                      │
│         └────────────────┬─┴─────────────────┘                      │
│                          ▼                                           │
│                 "reverse bias" (corrected)                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 2: DOCUMENT VOCABULARY EXTRACTION                             │
│  • Extract unique terms from all chunks                              │
│  • Build term frequency index                                        │
│  • Identify headings, key terms, technical vocabulary                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 3: CONCEPT EXPANSION (Document-Aware Only)                    │
│  • "reverse bias" → ["reverse biasing", "reverse bias mode"]         │
│  • Only terms that EXIST in document vocabulary                      │
│  • No external knowledge injection                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 4: HYBRID RETRIEVAL (3 Signals)                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ A) FUZZY MATCH     │ B) KEYWORD MATCH    │ C) STRUCTURE BOOST│   │
│  │ Levenshtein ≤ 2    │ Exact + Partial     │ Heading = 2x      │   │
│  │ weight: 0.35       │ weight: 0.40        │ weight: 0.25      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                         Combined Score                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 5: CONFIDENCE TIERING                                         │
│  ┌────────┬────────────────────────────────────────────────────┐    │
│  │ HIGH   │ Score > 0.6 → Answer directly                      │    │
│  │ MEDIUM │ 0.3-0.6 → "I found a related topic..."            │    │
│  │ LOW    │ 0.15-0.3 → "Did you mean...?" clarification       │    │
│  │ ZERO   │ < 0.15 → "Not found in document"                  │    │
│  └────────┴────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Create Intelligent Query Processor

#### 1.1 Core Algorithms (Inside Edge Function)

**Levenshtein Distance** - Pure TypeScript implementation:
```typescript
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1]
        ? matrix[i-1][j-1]
        : Math.min(matrix[i-1][j-1], matrix[i][j-1], matrix[i-1][j]) + 1;
    }
  }
  return matrix[b.length][a.length];
}
```

**Soundex Phonetic Encoding** - Zero dependency:
```typescript
function soundex(word: string): string {
  const codes = { b:1, f:1, p:1, v:1, c:2, g:2, j:2, k:2, q:2, s:2, 
                  x:2, z:2, d:3, t:3, l:4, m:5, n:5, r:6 };
  const first = word[0].toUpperCase();
  let result = first;
  let prev = codes[first.toLowerCase() as keyof typeof codes];
  
  for (let i = 1; i < word.length && result.length < 4; i++) {
    const code = codes[word[i].toLowerCase() as keyof typeof codes];
    if (code && code !== prev) {
      result += code;
      prev = code;
    } else if (!code) prev = 0;
  }
  return result.padEnd(4, '0');
}
```

#### 1.2 Query Normalization Pipeline

```typescript
interface NormalizedQuery {
  original: string;
  normalized: string;
  correctedTerms: Map<string, string>;  // misspelled → corrected
  expandedTerms: string[];              // document-aware expansions
}

function normalizeQuery(query: string, documentVocab: Set<string>): NormalizedQuery {
  // 1. Lowercase and split
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  // 2. For each word, find best match in document vocabulary
  const correctedTerms = new Map<string, string>();
  const normalizedWords: string[] = [];
  
  for (const word of words) {
    if (documentVocab.has(word)) {
      normalizedWords.push(word);
      continue;
    }
    
    // Find closest match by Levenshtein + Soundex
    let bestMatch = word;
    let bestScore = Infinity;
    
    for (const vocabWord of documentVocab) {
      const editDist = levenshtein(word, vocabWord);
      const phoneticMatch = soundex(word) === soundex(vocabWord);
      
      const score = editDist - (phoneticMatch ? 1 : 0);
      if (score < bestScore && editDist <= 2) {
        bestScore = score;
        bestMatch = vocabWord;
      }
    }
    
    if (bestMatch !== word) {
      correctedTerms.set(word, bestMatch);
    }
    normalizedWords.push(bestMatch);
  }
  
  return {
    original: query,
    normalized: normalizedWords.join(' '),
    correctedTerms,
    expandedTerms: expandWithDocumentContext(normalizedWords, documentVocab),
  };
}
```

### Phase 2: Document Vocabulary Extraction

#### 2.1 Extract Vocabulary from Chunks

When chunks are loaded, build a vocabulary index:

```typescript
interface DocumentVocabulary {
  allTerms: Set<string>;
  termFrequency: Map<string, number>;
  headingTerms: Set<string>;        // Higher weight
  technicalTerms: Set<string>;      // Detected patterns like "Zener Diode"
}

function buildDocumentVocabulary(chunks: ChunkData[]): DocumentVocabulary {
  const allTerms = new Set<string>();
  const termFrequency = new Map<string, number>();
  const headingTerms = new Set<string>();
  const technicalTerms = new Set<string>();
  
  for (const chunk of chunks) {
    // Extract words from content
    const words = chunk.content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    for (const word of words) {
      allTerms.add(word);
      termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
    }
    
    // Extract heading terms (higher priority)
    if (chunk.heading) {
      const headingWords = chunk.heading.toLowerCase().split(/\s+/);
      headingWords.forEach(w => {
        if (w.length > 2) headingTerms.add(w);
      });
    }
    
    // Detect technical terms (capitalized multi-word phrases)
    const techPatterns = chunk.content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
    techPatterns.forEach(term => technicalTerms.add(term.toLowerCase()));
  }
  
  return { allTerms, termFrequency, headingTerms, technicalTerms };
}
```

### Phase 3: Hybrid Scoring System

#### 3.1 Combined Scoring Algorithm

```typescript
interface ScoredChunk {
  chunk: ChunkData;
  fuzzyScore: number;      // Levenshtein-based
  keywordScore: number;    // Exact/partial match
  structureScore: number;  // Heading/section boost
  combinedScore: number;   // Weighted total
}

function hybridScore(
  chunk: ChunkData, 
  normalizedQuery: NormalizedQuery,
  vocabulary: DocumentVocabulary
): ScoredChunk {
  const chunkLower = chunk.content.toLowerCase();
  const queryTerms = normalizedQuery.normalized.split(/\s+/);
  const expandedTerms = normalizedQuery.expandedTerms;
  
  // A) FUZZY MATCH SCORE (0-1)
  let fuzzyScore = 0;
  for (const term of queryTerms) {
    // Check for fuzzy presence in chunk
    const words = chunkLower.split(/\s+/);
    for (const word of words) {
      const dist = levenshtein(term, word);
      if (dist <= 2) {
        fuzzyScore += (3 - dist) / 3;  // Higher score for closer match
        break;
      }
    }
  }
  fuzzyScore = Math.min(1, fuzzyScore / queryTerms.length);
  
  // B) KEYWORD MATCH SCORE (0-1)
  let keywordScore = 0;
  const allSearchTerms = [...queryTerms, ...expandedTerms];
  for (const term of allSearchTerms) {
    if (chunkLower.includes(term)) {
      keywordScore += 1;
    }
  }
  keywordScore = Math.min(1, keywordScore / Math.max(1, allSearchTerms.length));
  
  // C) STRUCTURE BOOST (0-1)
  let structureScore = 0;
  if (chunk.heading) {
    const headingLower = chunk.heading.toLowerCase();
    for (const term of allSearchTerms) {
      if (headingLower.includes(term)) {
        structureScore += 0.5;  // Heading match = big boost
      }
    }
  }
  // Check if appears early in chunk (likely a definition)
  const firstSentence = chunkLower.split(/[.!?]/)[0] || '';
  for (const term of allSearchTerms) {
    if (firstSentence.includes(term)) {
      structureScore += 0.25;
    }
  }
  structureScore = Math.min(1, structureScore);
  
  // COMBINED SCORE (weighted average)
  const combinedScore = (
    fuzzyScore * 0.35 +
    keywordScore * 0.40 +
    structureScore * 0.25
  );
  
  return {
    chunk,
    fuzzyScore,
    keywordScore,
    structureScore,
    combinedScore,
  };
}
```

### Phase 4: Confidence Tiering & Smart Responses

#### 4.1 Confidence Level Determination

```typescript
type ConfidenceTier = 'high' | 'medium' | 'low' | 'clarify' | 'not_found';

interface RetrievalResult {
  chunks: ScoredChunk[];
  confidence: ConfidenceTier;
  suggestedTopic?: string;       // For "Did you mean..." responses
  correctedQuery?: string;       // If we corrected spelling
  responsePrefix?: string;       // Smart prefix for answer
}

function determineConfidence(
  scoredChunks: ScoredChunk[],
  normalizedQuery: NormalizedQuery
): RetrievalResult {
  const topChunk = scoredChunks[0];
  
  if (!topChunk || topChunk.combinedScore < 0.10) {
    return { chunks: [], confidence: 'not_found' };
  }
  
  if (topChunk.combinedScore < 0.25) {
    // Very low match - ask for clarification
    const possibleTopics = scoredChunks
      .slice(0, 3)
      .filter(c => c.chunk.heading)
      .map(c => c.chunk.heading!);
    
    return {
      chunks: scoredChunks.slice(0, 3),
      confidence: 'clarify',
      suggestedTopic: possibleTopics[0],
    };
  }
  
  if (topChunk.combinedScore < 0.45) {
    // Medium confidence - answer but mention it's inferred
    const prefix = normalizedQuery.correctedTerms.size > 0
      ? `I interpreted your question as "${normalizedQuery.normalized}". `
      : `I found a related topic in your document. `;
    
    return {
      chunks: scoredChunks.slice(0, 6),
      confidence: 'medium',
      correctedQuery: normalizedQuery.normalized,
      responsePrefix: prefix,
    };
  }
  
  // High confidence
  return {
    chunks: scoredChunks.slice(0, 6),
    confidence: 'high',
  };
}
```

#### 4.2 Updated System Prompt

```typescript
function buildSystemPrompt(
  documentName: string,
  retrievalResult: RetrievalResult,
  context: string
): string {
  let prompt = `You are an AI tutor helping a student understand "${documentName}".

STUDENT-FRIENDLY COMMUNICATION:
1. Use simple, clear language a student would understand
2. Break complex concepts into steps
3. Highlight key terms in **bold**
4. Reference page numbers: [Page X]
5. If concepts relate to diagrams, mention them

GROUNDING RULES:
1. Answer ONLY from the DOCUMENT EXCERPTS below
2. If not found, say: "This information is not present in the uploaded document."
3. NEVER use external knowledge or make assumptions
`;

  // Add smart prefix instruction based on confidence
  if (retrievalResult.responsePrefix) {
    prompt += `
IMPORTANT: Start your response with: "${retrievalResult.responsePrefix}"
`;
  }
  
  if (retrievalResult.confidence === 'clarify') {
    prompt += `
The query was unclear. Ask the student to clarify by suggesting:
"Did you mean: ${retrievalResult.suggestedTopic}?"
Provide a brief preview of what that topic covers.
`;
  }

  prompt += `
DOCUMENT EXCERPTS:
${context}`;

  return prompt;
}
```

### Phase 5: Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/rag-chat-pdf/index.ts` | Complete rewrite with multi-stage pipeline |
| `supabase/functions/chat-with-content/index.ts` | Add same intelligent matching for text content |
| `src/components/pdf-chat/ConfidenceIndicator.tsx` | Add 'clarify' tier with new UI |
| `src/hooks/usePDFChat.ts` | Handle new confidence levels and suggested topics |
| `src/components/pdf-chat/ChatPanel.tsx` | Show "Did you mean..." suggestions |

### Phase 6: New UI Components for Smart Responses

#### 6.1 Clarification Prompt Component

When confidence is 'clarify', show:

```text
┌─────────────────────────────────────────────────────────────────┐
│  🤔 I'm not sure what you're asking about.                       │
│                                                                  │
│  Did you mean one of these?                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Reverse Biasing                                       │    │
│  │  • Forward Biasing                                       │    │
│  │  • Zener Diode Operation                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Click a topic or rephrase your question.                        │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.2 Spell Correction Notice

When query was corrected:

```text
┌─────────────────────────────────────────────────────────────────┐
│  ✨ Showing results for "reverse biasing"                        │
│     (searched for "reverse vise")                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Test Cases

| Input Query | Document Contains | Expected Behavior |
|-------------|-------------------|-------------------|
| `reverse vise` | "Reverse Biasing" | Correct spelling → answer about reverse biasing |
| `zenar diode working` | "Zener Diode" | Phonetic match → explain Zener diode |
| `battery connection reverse` | "reverse bias" | Keyword expansion → explain reverse bias |
| `transistor amplifier` | (not in document) | "Not found in document" ✅ |
| `biass` | "bias" | Auto-correct to "bias" → answer |
| `reverse` (vague) | "Reverse Biasing", "Reverse Current" | Ask: "Did you mean...?" |

---

## Summary

This upgrade transforms the retrieval system from a simple keyword matcher into an intelligent, student-aware search engine that:

1. **Corrects spelling** using Levenshtein edit distance
2. **Matches phonetically** using Soundex algorithm
3. **Expands concepts** using document vocabulary only
4. **Scores with 3 signals**: fuzzy match + keywords + structure
5. **Responds intelligently**: high confidence → direct answer, low → clarification
6. **Never hallucinates**: all expansion is document-bound

The implementation requires no external dependencies - all algorithms are implemented in pure TypeScript within the edge functions.
