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
        input: text.slice(0, 8000), // Limit input size
        dimensions: 768,
      }),
    });

    if (!response.ok) {
      console.error("Embedding API error:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
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

    // Generate embeddings and insert chunks in batches
    const BATCH_SIZE = 10;
    let processedCount = 0;

    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      
      // Generate embeddings for batch
      const embeddings = await Promise.all(
        batch.map(chunk => generateEmbedding(chunk.content, LOVABLE_API_KEY))
      );

      // Prepare insert data
      const insertData = batch.map((chunk, idx) => ({
        document_id: documentId,
        page_number: chunk.pageNumber,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        heading: chunk.heading,
        embedding: embeddings[idx] ? `[${embeddings[idx]!.join(',')}]` : null,
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
