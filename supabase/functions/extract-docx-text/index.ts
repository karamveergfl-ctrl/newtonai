import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// DOCX file structure constants
const CONTENT_TYPES_XML = "[Content_Types].xml";
const DOCUMENT_XML = "word/document.xml";

// Extract text from DOCX using JSZip and XML parsing
async function extractTextFromDocx(base64Content: string): Promise<string> {
  // Import JSZip dynamically
  const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
  
  // Decode base64
  const binaryString = atob(base64Content.split(',').pop() || base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Load the DOCX file (which is a ZIP archive)
  const zip = await JSZip.loadAsync(bytes);
  
  // Get the main document XML
  const documentXml = await zip.file(DOCUMENT_XML)?.async("string");
  
  if (!documentXml) {
    throw new Error("Invalid DOCX file: missing document.xml");
  }
  
  // Parse XML and extract text content
  const textContent = extractTextFromXml(documentXml);
  
  return textContent;
}

// Parse DOCX XML and extract text with basic structure preservation
function extractTextFromXml(xml: string): string {
  const textParts: string[] = [];
  
  // Match paragraph elements
  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  let paragraphMatch;
  
  while ((paragraphMatch = paragraphRegex.exec(xml)) !== null) {
    const paragraphContent = paragraphMatch[1];
    
    // Check if this is a heading
    const isHeading = /<w:pStyle[^>]*w:val="Heading\d"/i.test(paragraphContent);
    
    // Extract text runs within the paragraph
    const textRunRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let textRunMatch;
    const runTexts: string[] = [];
    
    while ((textRunMatch = textRunRegex.exec(paragraphContent)) !== null) {
      runTexts.push(textRunMatch[1]);
    }
    
    if (runTexts.length > 0) {
      const paragraphText = runTexts.join('');
      
      if (isHeading) {
        // Add extra spacing for headings
        textParts.push(`\n\n## ${paragraphText}\n`);
      } else if (paragraphText.trim()) {
        textParts.push(paragraphText);
      }
    }
    
    // Add paragraph break
    textParts.push('\n');
  }
  
  // Clean up multiple newlines
  let result = textParts.join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return result;
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

    const { docxContent } = await req.json();

    if (!docxContent) {
      return new Response(
        JSON.stringify({ error: 'Missing docxContent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 size (max 20MB)
    const base64Size = docxContent.length * 0.75;
    if (base64Size > 20 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 20MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Extracting text from DOCX...");
    
    const text = await extractTextFromDocx(docxContent);
    
    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text content found in document' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Extracted ${text.length} characters from DOCX`);

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error extracting DOCX text:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to extract text from document",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
