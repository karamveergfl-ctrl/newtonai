import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RetrievedChunk {
  chunkId: string;
  pageNumber: number;
  content: string;
  heading: string | null;
  similarity: number;
}

interface ScoredChunk extends RetrievedChunk {
  fuzzyScore: number;
  keywordScore: number;
  structureScore: number;
  combinedScore: number;
}

interface NormalizedQuery {
  original: string;
  normalized: string;
  correctedTerms: Map<string, string>;
  expandedTerms: string[];
}

type ConfidenceTier = 'high' | 'medium' | 'low' | 'clarify' | 'not_found';

interface RetrievalResult {
  chunks: ScoredChunk[];
  confidence: ConfidenceTier;
  suggestedTopics?: string[];
  correctedQuery?: string;
  responsePrefix?: string;
}

// ============= CORE ALGORITHMS =============

// Levenshtein distance - edit distance between two strings
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
    }
  }
  return matrix[b.length][a.length];
}

// Soundex phonetic encoding for matching similar-sounding words
function soundex(word: string): string {
  if (!word || word.length === 0) return '0000';
  
  const codes: Record<string, number> = {
    b: 1, f: 1, p: 1, v: 1,
    c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
    d: 3, t: 3,
    l: 4,
    m: 5, n: 5,
    r: 6
  };
  
  const first = word[0].toUpperCase();
  let result = first;
  let prev = codes[first.toLowerCase()];
  
  for (let i = 1; i < word.length && result.length < 4; i++) {
    const code = codes[word[i].toLowerCase()];
    if (code && code !== prev) {
      result += code;
      prev = code;
    } else if (!code) {
      prev = 0;
    }
  }
  
  return result.padEnd(4, '0');
}

// Check if query is a general/summarization query
function isGeneralQuery(query: string): boolean {
  const generalPatterns = [
    /summariz/i, /summar[yi]/i, /overview/i,
    /explain\s+(the\s+)?document/i,
    /what\s+is\s+this\s+(document|pdf|file)\s+(about|regarding)/i,
    /tell\s+me\s+about/i,
    /main\s+(points?|ideas?|topics?)/i,
    /key\s+(points?|concepts?|takeaways?)/i,
    /describe/i, /outline/i,
  ];
  return generalPatterns.some(pattern => pattern.test(query));
}

// ============= VOCABULARY & QUERY PROCESSING =============

interface DocumentVocabulary {
  allTerms: Set<string>;
  termFrequency: Map<string, number>;
  headingTerms: Set<string>;
  technicalTerms: Set<string>;
  soundexIndex: Map<string, string[]>; // soundex code → words
}

// Build vocabulary from document chunks
function buildDocumentVocabulary(chunks: { content: string; heading: string | null }[]): DocumentVocabulary {
  const allTerms = new Set<string>();
  const termFrequency = new Map<string, number>();
  const headingTerms = new Set<string>();
  const technicalTerms = new Set<string>();
  const soundexIndex = new Map<string, string[]>();
  
  for (const chunk of chunks) {
    // Extract words from content
    const words = chunk.content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    for (const word of words) {
      allTerms.add(word);
      termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
      
      // Build soundex index for phonetic matching
      const sx = soundex(word);
      const existing = soundexIndex.get(sx) || [];
      if (!existing.includes(word)) {
        existing.push(word);
        soundexIndex.set(sx, existing);
      }
    }
    
    // Extract heading terms (higher priority)
    if (chunk.heading) {
      const headingWords = chunk.heading.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
      headingWords.forEach(w => headingTerms.add(w));
    }
    
    // Detect technical terms (capitalized multi-word phrases)
    const techPatterns = chunk.content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
    techPatterns.forEach(term => technicalTerms.add(term.toLowerCase()));
  }
  
  return { allTerms, termFrequency, headingTerms, technicalTerms, soundexIndex };
}

// Find concept expansions from document vocabulary
function expandWithDocumentContext(terms: string[], vocabulary: DocumentVocabulary): string[] {
  const expanded: string[] = [];
  
  for (const term of terms) {
    // Look for words in vocab that start with or contain the term
    for (const vocabWord of vocabulary.allTerms) {
      // Skip if same word or already in expanded
      if (vocabWord === term || expanded.includes(vocabWord)) continue;
      
      // Check for common suffixes (biasing, biased → bias)
      const suffixes = ['ing', 'ed', 'tion', 'sion', 'ment', 'ness', 's', 'es'];
      for (const suffix of suffixes) {
        if (vocabWord === term + suffix || term === vocabWord + suffix) {
          expanded.push(vocabWord);
          break;
        }
      }
      
      // Check if term is part of compound word
      if (vocabWord.includes(term) && vocabWord.length <= term.length + 5) {
        expanded.push(vocabWord);
      }
    }
    
    // Add heading terms that match
    for (const headingTerm of vocabulary.headingTerms) {
      if (headingTerm.includes(term) && !expanded.includes(headingTerm)) {
        expanded.push(headingTerm);
      }
    }
  }
  
  return expanded.slice(0, 10); // Limit expansions
}

// Normalize and correct query using document vocabulary
function normalizeQuery(query: string, vocabulary: DocumentVocabulary): NormalizedQuery {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'was', 'her',
    'were', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'what',
    'when', 'where', 'which', 'with', 'from', 'document', 'pdf', 'file', 'how',
    'does', 'explain', 'tell', 'about', 'please', 'could', 'would', 'mean', 'means'
  ]);
  
  // Lowercase and split
  const words = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  const correctedTerms = new Map<string, string>();
  const normalizedWords: string[] = [];
  
  for (const word of words) {
    // If word exists in vocabulary, use it directly
    if (vocabulary.allTerms.has(word)) {
      normalizedWords.push(word);
      continue;
    }
    
    // Try to find closest match
    let bestMatch = word;
    let bestScore = Infinity;
    
    // Method 1: Levenshtein distance (max 2 edits)
    for (const vocabWord of vocabulary.allTerms) {
      // Skip very different length words
      if (Math.abs(vocabWord.length - word.length) > 2) continue;
      
      const editDist = levenshtein(word, vocabWord);
      const phoneticMatch = soundex(word) === soundex(vocabWord);
      
      // Combined score: lower edit distance + phonetic bonus
      const score = editDist - (phoneticMatch ? 1 : 0);
      
      if (editDist <= 2 && score < bestScore) {
        bestScore = score;
        bestMatch = vocabWord;
      }
    }
    
    // Method 2: Soundex phonetic matching (if no Levenshtein match)
    if (bestMatch === word) {
      const wordSoundex = soundex(word);
      const phoneticMatches = vocabulary.soundexIndex.get(wordSoundex) || [];
      
      if (phoneticMatches.length > 0) {
        // Pick the most frequent match
        let maxFreq = 0;
        for (const match of phoneticMatches) {
          const freq = vocabulary.termFrequency.get(match) || 0;
          if (freq > maxFreq) {
            maxFreq = freq;
            bestMatch = match;
          }
        }
        
        if (bestMatch !== word) {
          bestScore = 1; // Mark as corrected
        }
      }
    }
    
    if (bestMatch !== word && bestScore < Infinity) {
      correctedTerms.set(word, bestMatch);
    }
    normalizedWords.push(bestMatch);
  }
  
  // Expand query with document context
  const expandedTerms = expandWithDocumentContext(normalizedWords, vocabulary);
  
  return {
    original: query,
    normalized: normalizedWords.join(' '),
    correctedTerms,
    expandedTerms,
  };
}

// ============= HYBRID SCORING =============

function hybridScore(
  chunk: RetrievedChunk,
  normalizedQuery: NormalizedQuery,
  vocabulary: DocumentVocabulary
): ScoredChunk {
  const chunkLower = chunk.content.toLowerCase();
  const queryTerms = normalizedQuery.normalized.split(/\s+/).filter(w => w.length > 2);
  const expandedTerms = normalizedQuery.expandedTerms;
  const allSearchTerms = [...new Set([...queryTerms, ...expandedTerms])];
  
  // A) FUZZY MATCH SCORE (0-1)
  let fuzzyScore = 0;
  const chunkWords = chunkLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  
  for (const term of queryTerms) {
    let termMatched = false;
    for (const word of chunkWords) {
      const dist = levenshtein(term, word);
      if (dist <= 2) {
        fuzzyScore += (3 - dist) / 3; // Higher score for closer match
        termMatched = true;
        break;
      }
    }
    // Phonetic fallback
    if (!termMatched) {
      const termSoundex = soundex(term);
      for (const word of chunkWords) {
        if (soundex(word) === termSoundex) {
          fuzzyScore += 0.5;
          break;
        }
      }
    }
  }
  fuzzyScore = queryTerms.length > 0 ? Math.min(1, fuzzyScore / queryTerms.length) : 0;
  
  // B) KEYWORD MATCH SCORE (0-1)
  let keywordScore = 0;
  for (const term of allSearchTerms) {
    if (chunkLower.includes(term)) {
      // Boost for exact word boundary match
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      keywordScore += regex.test(chunk.content) ? 1.2 : 0.8;
    }
  }
  keywordScore = allSearchTerms.length > 0 ? Math.min(1, keywordScore / allSearchTerms.length) : 0;
  
  // C) STRUCTURE BOOST (0-1)
  let structureScore = 0;
  
  // Heading match (big boost)
  if (chunk.heading) {
    const headingLower = chunk.heading.toLowerCase();
    for (const term of allSearchTerms) {
      if (headingLower.includes(term)) {
        structureScore += 0.4;
      }
    }
  }
  
  // First sentence match (likely a definition)
  const firstSentence = chunkLower.split(/[.!?]/)[0] || '';
  for (const term of allSearchTerms) {
    if (firstSentence.includes(term)) {
      structureScore += 0.2;
    }
  }
  
  // Technical term match
  for (const techTerm of vocabulary.technicalTerms) {
    if (chunkLower.includes(techTerm) && allSearchTerms.some(t => techTerm.includes(t))) {
      structureScore += 0.3;
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
    ...chunk,
    fuzzyScore,
    keywordScore,
    structureScore,
    combinedScore,
  };
}

// ============= CONFIDENCE TIERING =============

function determineConfidence(
  scoredChunks: ScoredChunk[],
  normalizedQuery: NormalizedQuery
): RetrievalResult {
  const topChunk = scoredChunks[0];
  
  // No relevant content
  if (!topChunk || topChunk.combinedScore < 0.10) {
    return { chunks: [], confidence: 'not_found' };
  }
  
  // Very low match - ask for clarification
  if (topChunk.combinedScore < 0.25) {
    const possibleTopics = scoredChunks
      .slice(0, 5)
      .filter(c => c.heading)
      .map(c => c.heading!)
      .filter((h, i, arr) => arr.indexOf(h) === i) // unique
      .slice(0, 3);
    
    return {
      chunks: scoredChunks.slice(0, 3),
      confidence: 'clarify',
      suggestedTopics: possibleTopics.length > 0 ? possibleTopics : undefined,
    };
  }
  
  // Medium confidence - answer but mention context
  if (topChunk.combinedScore < 0.50) {
    let prefix = '';
    
    if (normalizedQuery.correctedTerms.size > 0) {
      const corrections = Array.from(normalizedQuery.correctedTerms.entries())
        .map(([from, to]) => `"${from}" → "${to}"`)
        .join(', ');
      prefix = `I interpreted your query as "${normalizedQuery.normalized}" (corrected: ${corrections}). `;
    } else {
      prefix = 'I found a related topic in your document. ';
    }
    
    return {
      chunks: scoredChunks.slice(0, 6),
      confidence: 'medium',
      correctedQuery: normalizedQuery.normalized,
      responsePrefix: prefix,
    };
  }
  
  // High confidence
  let prefix = '';
  if (normalizedQuery.correctedTerms.size > 0) {
    prefix = `Showing results for "${normalizedQuery.normalized}". `;
  }
  
  return {
    chunks: scoredChunks.slice(0, 6),
    confidence: 'high',
    correctedQuery: normalizedQuery.correctedTerms.size > 0 ? normalizedQuery.normalized : undefined,
    responsePrefix: prefix || undefined,
  };
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      documentId, 
      sessionId,
      question, 
      conversationHistory = [],
      contextMode = 'entire_document',
      currentPage = null,
      selectedText = null,
    } = await req.json();

    if (!documentId || !question) {
      return new Response(
        JSON.stringify({ error: 'Missing documentId or question' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Check rate limit
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'rag-chat-pdf',
      p_max_requests: 100,
      p_window_minutes: 60
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('pdf_documents')
      .select('id, file_name')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let retrievedChunks: ScoredChunk[] = [];
    let retrievalResult: RetrievalResult;

    // Handle selected text mode
    if (contextMode === 'selected_text' && selectedText) {
      const chunk: ScoredChunk = {
        chunkId: 'selected',
        pageNumber: currentPage || 1,
        content: selectedText,
        heading: null,
        similarity: 1.0,
        fuzzyScore: 1.0,
        keywordScore: 1.0,
        structureScore: 1.0,
        combinedScore: 1.0,
      };
      retrievalResult = { chunks: [chunk], confidence: 'high' };
    } else {
      // Fetch all chunks for this document
      let query = supabase
        .from('document_chunks')
        .select('id, page_number, content, heading')
        .eq('document_id', documentId)
        .order('page_number', { ascending: true })
        .order('chunk_index', { ascending: true });

      if (contextMode === 'current_page' && currentPage) {
        query = query.eq('page_number', currentPage);
      }

      const { data: chunks, error: fetchError } = await query;

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch document chunks' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!chunks || chunks.length === 0) {
        return new Response(
          JSON.stringify({ 
            answer: "I don't have any content from this document yet. Please wait for the document to finish processing.",
            citations: [],
            confidence: 'not_found',
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if this is a general/summarization query
      const isGeneral = isGeneralQuery(question);

      if (isGeneral) {
        // For summarization, take evenly distributed chunks
        const maxChunks = 10;
        const scoredChunks: ScoredChunk[] = chunks.map(chunk => ({
          chunkId: chunk.id,
          pageNumber: chunk.page_number,
          content: chunk.content,
          heading: chunk.heading,
          similarity: 0.5,
          fuzzyScore: 0.5,
          keywordScore: 0.5,
          structureScore: 0.5,
          combinedScore: 0.5,
        }));

        if (chunks.length <= maxChunks) {
          retrievalResult = { chunks: scoredChunks, confidence: 'high' };
        } else {
          const step = Math.floor(chunks.length / maxChunks);
          const distributed: ScoredChunk[] = [];
          for (let i = 0; i < chunks.length && distributed.length < maxChunks; i += step) {
            distributed.push(scoredChunks[i]);
          }
          retrievalResult = { chunks: distributed, confidence: 'high' };
        }
      } else {
        // Build document vocabulary for intelligent matching
        const vocabulary = buildDocumentVocabulary(chunks);
        
        // Normalize and correct query
        const normalizedQuery = normalizeQuery(question, vocabulary);
        console.log("Query normalization:", {
          original: question,
          normalized: normalizedQuery.normalized,
          corrections: Object.fromEntries(normalizedQuery.correctedTerms),
          expansions: normalizedQuery.expandedTerms,
        });

        // Score all chunks with hybrid matching
        const scoredChunks = chunks.map(chunk => hybridScore(
          {
            chunkId: chunk.id,
            pageNumber: chunk.page_number,
            content: chunk.content,
            heading: chunk.heading,
            similarity: 0,
          },
          normalizedQuery,
          vocabulary
        ));

        // Sort by combined score
        scoredChunks.sort((a, b) => b.combinedScore - a.combinedScore);

        // Determine confidence and get final result
        retrievalResult = determineConfidence(scoredChunks, normalizedQuery);
        
        console.log("Retrieval result:", {
          confidence: retrievalResult.confidence,
          topScore: scoredChunks[0]?.combinedScore,
          correctedQuery: retrievalResult.correctedQuery,
          suggestedTopics: retrievalResult.suggestedTopics,
        });
      }
    }

    // Build context from retrieved chunks
    const contextParts = retrievalResult.chunks.map((chunk) => 
      `[Page ${chunk.pageNumber}]${chunk.heading ? ` (${chunk.heading})` : ''}\n${chunk.content}`
    );
    const context = contextParts.join('\n\n---\n\n');

    // Build system prompt based on confidence
    let systemPrompt = `You are an AI tutor helping a student understand content from a PDF document titled "${document.file_name}".

STUDENT-FRIENDLY COMMUNICATION:
1. Use simple, clear language a student would understand
2. Break complex concepts into steps when helpful
3. Highlight key terms in **bold**
4. Reference page numbers using [Page X] format
5. If concepts relate to diagrams or figures, mention them

GROUNDING RULES (ABSOLUTE - NEVER VIOLATE):
1. Answer ONLY using information from the DOCUMENT EXCERPTS below
2. If the requested information is NOT in the excerpts, respond EXACTLY with: "This information is not present in the uploaded document."
3. NEVER use your training knowledge, external facts, or assumptions
4. NEVER say "based on my knowledge" or similar phrases
5. Use LaTeX formatting for math: $formula$ for inline, $$formula$$ for block
6. Use bullet points for clarity when listing multiple items
`;

    // Add confidence-based instructions
    if (retrievalResult.responsePrefix) {
      systemPrompt += `\nIMPORTANT: Start your response with: "${retrievalResult.responsePrefix}"\n`;
    }

    if (retrievalResult.confidence === 'clarify' && retrievalResult.suggestedTopics) {
      systemPrompt += `
The query was unclear or had low match confidence. Ask the student to clarify by suggesting these topics from the document:
${retrievalResult.suggestedTopics.map(t => `- ${t}`).join('\n')}

Say something like: "I'm not sure exactly what you're looking for. Did you mean one of these topics: [list topics]? Please clarify so I can help you better."
`;
    }

    systemPrompt += `
DOCUMENT EXCERPTS:
${retrievalResult.chunks.length > 0 ? context : '(No relevant content found for this question)'}`;

    // Build messages array
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: "user", content: question },
    ];

    // Call AI API
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      throw new Error("AI API error");
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    // Extract citations from the answer
    const pageRegex = /\[Page (\d+)\]/g;
    const citedPages = new Set<number>();
    let match;
    while ((match = pageRegex.exec(answer)) !== null) {
      citedPages.add(parseInt(match[1]));
    }

    // Build citations array
    const citations = retrievalResult.chunks
      .filter(chunk => citedPages.has(chunk.pageNumber))
      .map(chunk => ({
        pageNumber: chunk.pageNumber,
        chunkId: chunk.chunkId,
        quote: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '...' : ''),
      }));

    // If no explicit citations but we used chunks, add top ones
    if (citations.length === 0 && retrievalResult.chunks.length > 0) {
      retrievalResult.chunks.slice(0, 3).forEach(chunk => {
        citations.push({
          pageNumber: chunk.pageNumber,
          chunkId: chunk.chunkId,
          quote: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '...' : ''),
        });
      });
    }

    // Save messages to database if session exists
    if (sessionId) {
      await supabase.from('pdf_chat_messages').insert([
        { session_id: sessionId, role: 'user', content: question },
        { session_id: sessionId, role: 'assistant', content: answer, citations },
      ]);
    }

    return new Response(
      JSON.stringify({ 
        answer,
        citations,
        confidence: retrievalResult.confidence,
        correctedQuery: retrievalResult.correctedQuery,
        suggestedTopics: retrievalResult.suggestedTopics,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in RAG chat:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // CRITICAL: Always return a valid response with status 200
    // This ensures the frontend can display the error message in the chat
    // rather than having a silent failure
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
  }
});
