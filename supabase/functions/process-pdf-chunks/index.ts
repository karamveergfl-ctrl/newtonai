import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChunkData {
  pageNumber: number;
  chunkIndex: number;
  content: string;
  heading: string | null;
  tokenCount: number;
}

// Semantic chunking by headings and paragraphs
function chunkText(text: string, pageNumber: number): ChunkData[] {
  const chunks: ChunkData[] = [];
  const MAX_CHUNK_TOKENS = 500;
  const APPROX_CHARS_PER_TOKEN = 4;
  const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * APPROX_CHARS_PER_TOKEN;

  // Split by potential headings (lines that look like headers)
  const sections = text.split(/\n(?=[A-Z][^a-z]*$|\d+\.\s|#{1,3}\s)/m);
  
  let chunkIndex = 0;

  for (const section of sections) {
    if (!section.trim()) continue;

    // Try to extract heading from first line
    const lines = section.split('\n');
    let heading: string | null = null;
    let content = section;

    // Check if first line looks like a heading
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.length < 100 && /^[A-Z#\d]/.test(firstLine)) {
      heading = firstLine.replace(/^#+\s*/, '');
      content = lines.slice(1).join('\n').trim();
    }

    // If section is too large, split by paragraphs
    if (content.length > MAX_CHUNK_CHARS) {
      const paragraphs = content.split(/\n\n+/);
      let currentChunk = '';

      for (const para of paragraphs) {
        if ((currentChunk + para).length > MAX_CHUNK_CHARS && currentChunk) {
          chunks.push({
            pageNumber,
            chunkIndex: chunkIndex++,
            content: currentChunk.trim(),
            heading,
            tokenCount: Math.ceil(currentChunk.length / APPROX_CHARS_PER_TOKEN),
          });
          currentChunk = para;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + para;
        }
      }

      if (currentChunk.trim()) {
        chunks.push({
          pageNumber,
          chunkIndex: chunkIndex++,
          content: currentChunk.trim(),
          heading,
          tokenCount: Math.ceil(currentChunk.length / APPROX_CHARS_PER_TOKEN),
        });
      }
    } else if (content.trim()) {
      chunks.push({
        pageNumber,
        chunkIndex: chunkIndex++,
        content: content.trim(),
        heading,
        tokenCount: Math.ceil(content.length / APPROX_CHARS_PER_TOKEN),
      });
    }
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

    const { documentId, pages } = await req.json();

    if (!documentId || !pages || !Array.isArray(pages)) {
      return new Response(
        JSON.stringify({ error: 'Missing documentId or pages array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update document status to processing
    await supabase
      .from('pdf_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId)
      .eq('user_id', user.id);

    const allChunks: ChunkData[] = [];

    // Process each page
    for (const page of pages) {
      const { pageNumber, text } = page;
      if (!text || typeof text !== 'string') continue;

      const pageChunks = chunkText(text, pageNumber);
      allChunks.push(...pageChunks);
    }

    console.log(`Processing ${allChunks.length} chunks for document ${documentId}`);

    // Insert chunks in batches (without embeddings - we'll use keyword search)
    const BATCH_SIZE = 20;
    let processedCount = 0;

    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      
      // Prepare insert data without embeddings
      const insertData = batch.map((chunk) => ({
        document_id: documentId,
        page_number: chunk.pageNumber,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        heading: chunk.heading,
        embedding: null, // Skip embeddings - not supported
        token_count: chunk.tokenCount,
      }));

      // Insert chunks
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(insertData);

      if (insertError) {
        console.error("Error inserting chunks:", insertError);
      } else {
        processedCount += batch.length;
      }
    }

    // Update document status to completed
    await supabase
      .from('pdf_documents')
      .update({ 
        processing_status: 'completed',
        total_pages: pages.length,
      })
      .eq('id', documentId)
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksProcessed: processedCount,
        totalChunks: allChunks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing PDF chunks:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process PDF" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});