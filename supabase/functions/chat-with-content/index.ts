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

interface TextChunk {
  index: number;
  content: string;
  heading?: string;
}

interface ScoredChunk extends TextChunk {
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

interface DocumentVocabulary {
  allTerms: Set<string>;
  termFrequency: Map<string, number>;
  soundexIndex: Map<string, string[]>;
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

function isGeneralQuery(query: string): boolean {
  const generalPatterns = [
    /summariz/i, /summar[yi]/i, /overview/i,
    /explain\s+(the\s+)?document/i,
    /what\s+is\s+this\s+(document|pdf|file|content|text)\s*(about|regarding)?/i,
    /tell\s+me\s+about/i,
    /main\s+(points?|ideas?|topics?|themes?)/i,
    /key\s+(points?|concepts?|takeaways?)/i,
    /describe/i, /outline/i,
    /what\s+are\s+the\s+topics/i,
    /what\s+does\s+(this|the)\s+(cover|discuss|explain)/i,
  ];
  return generalPatterns.some(pattern => pattern.test(query));
}

// ============= VOCABULARY & QUERY PROCESSING =============

function buildDocumentVocabulary(chunks: TextChunk[]): DocumentVocabulary {
  const allTerms = new Set<string>();
  const termFrequency = new Map<string, number>();
  const soundexIndex = new Map<string, string[]>();
  
  for (const chunk of chunks) {
    const words = chunk.content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    for (const word of words) {
      allTerms.add(word);
      termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
      
      const sx = soundex(word);
      const existing = soundexIndex.get(sx) || [];
      if (!existing.includes(word)) {
        existing.push(word);
        soundexIndex.set(sx, existing);
      }
    }
  }
  
  return { allTerms, termFrequency, soundexIndex };
}

function expandWithDocumentContext(terms: string[], vocabulary: DocumentVocabulary): string[] {
  const expanded: string[] = [];
  
  for (const term of terms) {
    for (const vocabWord of vocabulary.allTerms) {
      if (vocabWord === term || expanded.includes(vocabWord)) continue;
      
      const suffixes = ['ing', 'ed', 'tion', 'sion', 'ment', 'ness', 's', 'es'];
      for (const suffix of suffixes) {
        if (vocabWord === term + suffix || term === vocabWord + suffix) {
          expanded.push(vocabWord);
          break;
        }
      }
      
      if (vocabWord.includes(term) && vocabWord.length <= term.length + 5) {
        expanded.push(vocabWord);
      }
    }
  }
  
  return expanded.slice(0, 10);
}

function normalizeQuery(query: string, vocabulary: DocumentVocabulary): NormalizedQuery {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'was', 'her',
    'were', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'what',
    'when', 'where', 'which', 'with', 'from', 'document', 'pdf', 'file', 'text',
    'content', 'video', 'audio', 'recording', 'how', 'does', 'explain', 'tell',
    'about', 'please', 'could', 'would', 'mean', 'means'
  ]);
  
  const words = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  const correctedTerms = new Map<string, string>();
  const normalizedWords: string[] = [];
  
  for (const word of words) {
    if (vocabulary.allTerms.has(word)) {
      normalizedWords.push(word);
      continue;
    }
    
    let bestMatch = word;
    let bestScore = Infinity;
    
    for (const vocabWord of vocabulary.allTerms) {
      if (Math.abs(vocabWord.length - word.length) > 2) continue;
      
      const editDist = levenshtein(word, vocabWord);
      const phoneticMatch = soundex(word) === soundex(vocabWord);
      const score = editDist - (phoneticMatch ? 1 : 0);
      
      if (editDist <= 2 && score < bestScore) {
        bestScore = score;
        bestMatch = vocabWord;
      }
    }
    
    if (bestMatch === word) {
      const wordSoundex = soundex(word);
      const phoneticMatches = vocabulary.soundexIndex.get(wordSoundex) || [];
      
      if (phoneticMatches.length > 0) {
        let maxFreq = 0;
        for (const match of phoneticMatches) {
          const freq = vocabulary.termFrequency.get(match) || 0;
          if (freq > maxFreq) {
            maxFreq = freq;
            bestMatch = match;
          }
        }
        if (bestMatch !== word) bestScore = 1;
      }
    }
    
    if (bestMatch !== word && bestScore < Infinity) {
      correctedTerms.set(word, bestMatch);
    }
    normalizedWords.push(bestMatch);
  }
  
  const expandedTerms = expandWithDocumentContext(normalizedWords, vocabulary);
  
  return {
    original: query,
    normalized: normalizedWords.join(' '),
    correctedTerms,
    expandedTerms,
  };
}

// ============= HYBRID SCORING =============

function hybridScore(chunk: TextChunk, normalizedQuery: NormalizedQuery): ScoredChunk {
  const chunkLower = chunk.content.toLowerCase();
  const queryTerms = normalizedQuery.normalized.split(/\s+/).filter(w => w.length > 2);
  const expandedTerms = normalizedQuery.expandedTerms;
  const allSearchTerms = [...new Set([...queryTerms, ...expandedTerms])];
  
  // FUZZY MATCH SCORE
  let fuzzyScore = 0;
  const chunkWords = chunkLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  
  for (const term of queryTerms) {
    let termMatched = false;
    for (const word of chunkWords) {
      const dist = levenshtein(term, word);
      if (dist <= 2) {
        fuzzyScore += (3 - dist) / 3;
        termMatched = true;
        break;
      }
    }
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
  
  // KEYWORD MATCH SCORE
  let keywordScore = 0;
  for (const term of allSearchTerms) {
    if (chunkLower.includes(term)) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      keywordScore += regex.test(chunk.content) ? 1.2 : 0.8;
    }
  }
  keywordScore = allSearchTerms.length > 0 ? Math.min(1, keywordScore / allSearchTerms.length) : 0;
  
  // STRUCTURE BOOST
  let structureScore = 0;
  const firstSentence = chunkLower.split(/[.!?]/)[0] || '';
  for (const term of allSearchTerms) {
    if (firstSentence.includes(term)) {
      structureScore += 0.3;
    }
  }
  structureScore = Math.min(1, structureScore);
  
  const combinedScore = (
    fuzzyScore * 0.35 +
    keywordScore * 0.40 +
    structureScore * 0.25
  );
  
  return { ...chunk, fuzzyScore, keywordScore, structureScore, combinedScore };
}

// ============= CONFIDENCE TIERING =============

function determineConfidence(scoredChunks: ScoredChunk[], normalizedQuery: NormalizedQuery): RetrievalResult {
  const topChunk = scoredChunks[0];
  
  if (!topChunk || topChunk.combinedScore < 0.10) {
    return { chunks: [], confidence: 'not_found' };
  }
  
  if (topChunk.combinedScore < 0.25) {
    return {
      chunks: scoredChunks.slice(0, 3),
      confidence: 'clarify',
    };
  }
  
  if (topChunk.combinedScore < 0.50) {
    let prefix = '';
    if (normalizedQuery.correctedTerms.size > 0) {
      const corrections = Array.from(normalizedQuery.correctedTerms.entries())
        .map(([from, to]) => `"${from}" → "${to}"`)
        .join(', ');
      prefix = `I interpreted your query as "${normalizedQuery.normalized}" (corrected: ${corrections}). `;
    } else {
      prefix = 'I found a related topic in your content. ';
    }
    
    return {
      chunks: scoredChunks.slice(0, 6),
      confidence: 'medium',
      correctedQuery: normalizedQuery.normalized,
      responsePrefix: prefix,
    };
  }
  
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

// ============= TEXT CHUNKING =============

function chunkTextContent(text: string, maxChunkSize: number = 800): TextChunk[] {
  const chunks: TextChunk[] = [];
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({ index: chunkIndex, content: currentChunk.trim() });
      chunkIndex++;
      currentChunk = '';
    }
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
  }
  
  if (currentChunk.trim()) {
    chunks.push({ index: chunkIndex, content: currentChunk.trim() });
  }
  
  return chunks;
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

    const { question, textContent, contentName, conversationHistory = [] } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Missing question' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!textContent || textContent.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: 'Insufficient content provided. Please provide more text.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'chat-with-content',
      p_max_requests: 100,
      p_window_minutes: 60
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chunks = chunkTextContent(textContent, 1000);
    
    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({ 
          answer: "The provided content appears to be empty or too short to analyze.",
          citations: [],
          confidence: 'not_found',
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isGeneral = isGeneralQuery(question);
    let retrievalResult: RetrievalResult;

    if (isGeneral) {
      const maxChunks = 10;
      const allChunks: ScoredChunk[] = chunks.map(c => ({
        ...c, fuzzyScore: 0.5, keywordScore: 0.5, structureScore: 0.5, combinedScore: 0.5
      }));
      
      if (chunks.length <= maxChunks) {
        retrievalResult = { chunks: allChunks, confidence: 'high' };
      } else {
        const step = Math.floor(chunks.length / maxChunks);
        const distributed: ScoredChunk[] = [];
        for (let i = 0; i < chunks.length && distributed.length < maxChunks; i += step) {
          distributed.push(allChunks[i]);
        }
        retrievalResult = { chunks: distributed, confidence: 'high' };
      }
    } else {
      const vocabulary = buildDocumentVocabulary(chunks);
      const normalizedQuery = normalizeQuery(question, vocabulary);
      
      console.log("Query normalization:", {
        original: question,
        normalized: normalizedQuery.normalized,
        corrections: Object.fromEntries(normalizedQuery.correctedTerms),
        expansions: normalizedQuery.expandedTerms,
      });

      const scoredChunks = chunks.map(chunk => hybridScore(chunk, normalizedQuery));
      scoredChunks.sort((a, b) => b.combinedScore - a.combinedScore);
      
      retrievalResult = determineConfidence(scoredChunks, normalizedQuery);
    }

    const contextParts = retrievalResult.chunks.map((chunk) => 
      `[Section ${chunk.index + 1}]\n${chunk.content}`
    );
    const context = contextParts.join('\n\n---\n\n');

    let systemPrompt = `You are an AI tutor helping a student understand content from a document titled "${contentName || 'Uploaded Content'}".

STUDENT-FRIENDLY COMMUNICATION:
1. Use simple, clear language a student would understand
2. Break complex concepts into steps when helpful
3. Highlight key terms in **bold**
4. Reference [Section X] when citing content

GROUNDING RULES (ABSOLUTE - NEVER VIOLATE):
1. Answer ONLY using information from the DOCUMENT EXCERPTS below
2. If the requested information is NOT in the excerpts, respond EXACTLY with: "This information is not present in the uploaded content."
3. NEVER use your training knowledge, external facts, or assumptions
4. Use LaTeX formatting for math: $formula$ for inline, $$formula$$ for block
5. Use bullet points for clarity when listing multiple items
`;

    if (retrievalResult.responsePrefix) {
      systemPrompt += `\nIMPORTANT: Start your response with: "${retrievalResult.responsePrefix}"\n`;
    }

    if (retrievalResult.confidence === 'clarify') {
      systemPrompt += `
The query was unclear or had low match confidence. Ask the student to clarify their question.
Say something like: "I'm not quite sure what you're looking for. Could you rephrase your question or provide more details?"
`;
    }

    systemPrompt += `
DOCUMENT EXCERPTS:
${retrievalResult.chunks.length > 0 ? context : '(No relevant content found for this question)'}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: "user", content: question },
    ];

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

    const sectionRegex = /\[Section (\d+)\]/g;
    const citedSections = new Set<number>();
    let match;
    while ((match = sectionRegex.exec(answer)) !== null) {
      citedSections.add(parseInt(match[1]));
    }

    const citations = retrievalResult.chunks
      .filter(chunk => citedSections.has(chunk.index + 1))
      .map(chunk => ({
        sectionIndex: chunk.index + 1,
        quote: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '...' : ''),
      }));

    if (citations.length === 0 && retrievalResult.chunks.length > 0) {
      retrievalResult.chunks.slice(0, 3).forEach(chunk => {
        citations.push({
          sectionIndex: chunk.index + 1,
          quote: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '...' : ''),
        });
      });
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
    console.error("Error in chat-with-content:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process chat request", 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
