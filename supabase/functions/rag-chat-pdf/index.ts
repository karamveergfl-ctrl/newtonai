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

// Simple keyword-based relevance scoring
function scoreChunk(chunk: string, query: string): number {
  const chunkLower = chunk.toLowerCase();
  const queryWords = query.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'was', 'her', 'were', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'what', 'when', 'where', 'which', 'with', 'from'].includes(w));
  
  if (queryWords.length === 0) return 0;
  
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

    let retrievedChunks: RetrievedChunk[] = [];

    // Handle different context modes
    if (contextMode === 'selected_text' && selectedText) {
      // Use selected text directly as context
      retrievedChunks = [{
        chunkId: 'selected',
        pageNumber: currentPage || 1,
        content: selectedText,
        heading: null,
        similarity: 1.0,
      }];
    } else {
      // Fetch chunks and use keyword-based search
      let query = supabase
        .from('document_chunks')
        .select('id, page_number, content, heading')
        .eq('document_id', documentId)
        .order('page_number', { ascending: true })
        .order('chunk_index', { ascending: true });

      // Filter by page if current_page mode
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
        // No chunks found, but we can still try to answer if we have extractedText
        return new Response(
          JSON.stringify({ 
            answer: "I don't have any content from this document yet. Please wait for the document to finish processing.",
            citations: [],
            confidence: 'not_found',
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Score chunks by keyword relevance
      const scoredChunks = chunks.map(chunk => ({
        chunkId: chunk.id,
        pageNumber: chunk.page_number,
        content: chunk.content,
        heading: chunk.heading,
        similarity: scoreChunk(chunk.content, question),
      }));

      // Sort by score and take top chunks
      scoredChunks.sort((a, b) => b.similarity - a.similarity);
      retrievedChunks = scoredChunks.slice(0, 6);
    }

    // Check if we found relevant content
    const hasRelevantContent = retrievedChunks.length > 0 && 
      (contextMode === 'selected_text' || retrievedChunks[0].similarity > 0.2);

    // Build context from retrieved chunks
    const contextParts = retrievedChunks.map((chunk) => 
      `[Page ${chunk.pageNumber}]${chunk.heading ? ` (${chunk.heading})` : ''}\n${chunk.content}`
    );
    const context = contextParts.join('\n\n---\n\n');

    // Build the prompt
    const systemPrompt = `You are an AI tutor helping a student understand content from a PDF document titled "${document.file_name}".

CRITICAL RULES:
1. Answer ONLY from the provided document excerpts below
2. If the answer is NOT clearly present in the excerpts, respond with: "This information is not present in the uploaded document."
3. NEVER add external knowledge, infer beyond the text, or make assumptions
4. Always cite page numbers using [Page X] format when referencing content
5. Use LaTeX formatting for any mathematical formulas: $formula$ for inline, $$formula$$ for block
6. Use bullet points for clarity when listing multiple items
7. Keep explanations simple and student-friendly

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
    const pageRegex = /\[Page (\d+)\]/g;
    const citedPages = new Set<number>();
    let match;
    while ((match = pageRegex.exec(answer)) !== null) {
      citedPages.add(parseInt(match[1]));
    }

    // Build citations array with quotes
    const citations = retrievedChunks
      .filter(chunk => citedPages.has(chunk.pageNumber))
      .map(chunk => ({
        pageNumber: chunk.pageNumber,
        chunkId: chunk.chunkId,
        quote: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '...' : ''),
      }));

    // If no explicit citations but we used chunks, add them
    if (citations.length === 0 && hasRelevantContent) {
      retrievedChunks.slice(0, 3).forEach(chunk => {
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
        confidence: hasRelevantContent ? 'high' : 'not_found',
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in RAG chat:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});