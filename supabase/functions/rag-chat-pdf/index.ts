import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate embedding using Lovable AI
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
        dimensions: 768,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

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
      // Perform semantic search
      const queryEmbedding = await generateEmbedding(question, LOVABLE_API_KEY);
      
      if (!queryEmbedding) {
        return new Response(
          JSON.stringify({ error: 'Failed to process question' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const pageFilter = contextMode === 'current_page' ? currentPage : null;

      const { data: chunks, error: searchError } = await supabase.rpc(
        'search_document_chunks',
        {
          p_document_id: documentId,
          p_query_embedding: `[${queryEmbedding.join(',')}]`,
          p_limit: 6,
          p_page_filter: pageFilter,
        }
      );

      if (searchError) {
        console.error("Search error:", searchError);
        return new Response(
          JSON.stringify({ error: 'Failed to search document' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      retrievedChunks = (chunks || []).map((chunk: any) => ({
        chunkId: chunk.chunk_id,
        pageNumber: chunk.page_number,
        content: chunk.content,
        heading: chunk.heading,
        similarity: chunk.similarity,
      }));
    }

    // Check if we found relevant content
    const hasRelevantContent = retrievedChunks.length > 0 && 
      (contextMode === 'selected_text' || retrievedChunks[0].similarity > 0.3);

    // Build context from retrieved chunks
    const contextParts = retrievedChunks.map((chunk, idx) => 
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
