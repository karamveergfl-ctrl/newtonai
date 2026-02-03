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

interface Citation {
  sectionIndex: number;
  quote: string;
}

// Check if query is a general/summarization query
function isGeneralQuery(query: string): boolean {
  const generalPatterns = [
    /summariz/i,
    /summar[yi]/i,
    /overview/i,
    /explain\s+(the\s+)?document/i,
    /what\s+is\s+this\s+(document|pdf|file|content|text)\s*(about|regarding)?/i,
    /tell\s+me\s+about/i,
    /main\s+(points?|ideas?|topics?|themes?)/i,
    /key\s+(points?|concepts?|takeaways?)/i,
    /describe/i,
    /outline/i,
    /what\s+are\s+the\s+topics/i,
    /what\s+does\s+(this|the)\s+(cover|discuss|explain)/i,
  ];
  return generalPatterns.some(pattern => pattern.test(query));
}

// Simple keyword-based relevance scoring
function scoreChunk(chunk: string, query: string): number {
  const chunkLower = chunk.toLowerCase();
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'was', 'her', 
    'were', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'what', 
    'when', 'where', 'which', 'with', 'from', 'document', 'pdf', 'file', 'text',
    'summarize', 'summary', 'explain', 'tell', 'about', 'few', 'paragraphs', 
    'please', 'could', 'would', 'content', 'video', 'audio', 'recording'
  ]);
  
  const queryWords = query.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !stopWords.has(w));
  
  // For general queries with no meaningful keywords, return a base score
  if (queryWords.length === 0) return 0.5;
  
  let matchCount = 0;
  let exactPhraseBonus = 0;
  
  // Check for exact phrase match
  if (chunkLower.includes(query.toLowerCase().slice(0, 50))) {
    exactPhraseBonus = 0.3;
  }
  
  // Count word matches
  for (const word of queryWords) {
    if (chunkLower.includes(word)) {
      matchCount++;
    }
  }
  
  return (matchCount / queryWords.length) + exactPhraseBonus;
}

// Chunk text content into sections
function chunkTextContent(text: string, maxChunkSize: number = 800): TextChunk[] {
  const chunks: TextChunk[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size, save current chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        index: chunkIndex,
        content: currentChunk.trim(),
      });
      chunkIndex++;
      currentChunk = '';
    }
    
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      index: chunkIndex,
      content: currentChunk.trim(),
    });
  }
  
  return chunks;
}

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
      question, 
      textContent,
      contentName,
      conversationHistory = [],
    } = await req.json();

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

    // Check rate limit
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

    // Chunk the text content
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

    // Check if this is a general/summarization query
    const isGeneral = isGeneralQuery(question);
    
    // Score chunks by keyword relevance
    const scoredChunks = chunks.map(chunk => ({
      ...chunk,
      similarity: scoreChunk(chunk.content, question),
    }));

    let retrievedChunks: TextChunk[];

    // For general queries, take chunks from across the content
    if (isGeneral) {
      const maxChunks = 10;
      if (chunks.length <= maxChunks) {
        retrievedChunks = scoredChunks;
      } else {
        // Take chunks from beginning, middle, and end
        const step = Math.floor(chunks.length / maxChunks);
        retrievedChunks = [];
        for (let i = 0; i < chunks.length && retrievedChunks.length < maxChunks; i += step) {
          retrievedChunks.push(scoredChunks[i]);
        }
      }
    } else {
      // Sort by score and take top chunks
      scoredChunks.sort((a, b) => b.similarity - a.similarity);
      retrievedChunks = scoredChunks.slice(0, 6);
    }

    // Check if we found relevant content
    const hasRelevantContent = retrievedChunks.length > 0 && 
      (isGeneral || (retrievedChunks[0] as any).similarity > 0.15);

    // Build context from retrieved chunks
    const contextParts = retrievedChunks.map((chunk) => 
      `[Section ${chunk.index + 1}]\n${chunk.content}`
    );
    const context = contextParts.join('\n\n---\n\n');

    // Build the strict grounding prompt
    const systemPrompt = `You are an AI tutor helping a student understand content from a document titled "${contentName || 'Uploaded Content'}".

ABSOLUTE RULES - VIOLATING THESE IS FORBIDDEN:
1. Answer ONLY using information from the DOCUMENT EXCERPTS provided below
2. If the requested information is NOT in the excerpts, respond EXACTLY with: "This information is not present in the uploaded content."
3. NEVER use your training knowledge, external facts, or assumptions
4. NEVER say "based on my knowledge" or similar phrases
5. Always cite [Section X] when referencing specific content
6. If the question is completely off-topic, respond: "This question is not related to the uploaded content. Please ask about the document."
7. Use bullet points for clarity when listing multiple items
8. Use LaTeX formatting for any mathematical formulas: $formula$ for inline, $$formula$$ for block
9. Keep explanations simple and student-friendly

DOCUMENT EXCERPTS:
${hasRelevantContent ? context : '(No relevant content found for this question)'}`;

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
    const sectionRegex = /\[Section (\d+)\]/g;
    const citedSections = new Set<number>();
    let match;
    while ((match = sectionRegex.exec(answer)) !== null) {
      citedSections.add(parseInt(match[1]));
    }

    // Build citations array with quotes
    const citations: Citation[] = retrievedChunks
      .filter(chunk => citedSections.has(chunk.index + 1))
      .map(chunk => ({
        sectionIndex: chunk.index + 1,
        quote: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '...' : ''),
      }));

    // If no explicit citations but we used chunks, add them
    if (citations.length === 0 && hasRelevantContent) {
      retrievedChunks.slice(0, 3).forEach(chunk => {
        citations.push({
          sectionIndex: chunk.index + 1,
          quote: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '...' : ''),
        });
      });
    }

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' | 'not_found' = 'high';
    if (answer.includes("not present in the uploaded content") || 
        answer.includes("not related to the uploaded content")) {
      confidence = 'not_found';
    } else if (!hasRelevantContent) {
      confidence = 'low';
    } else if (citations.length <= 1) {
      confidence = 'medium';
    }

    return new Response(
      JSON.stringify({ 
        answer,
        citations,
        confidence,
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
