import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function extractTextFromPptx(base64Content: string): Promise<string> {
  const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;

  const raw = base64Content.includes(",")
    ? base64Content.split(",").pop()!
    : base64Content;
  const binaryString = atob(raw);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const zip = await JSZip.loadAsync(bytes);

  // Collect slide file names and sort numerically
  const slideFiles: { name: string; num: number }[] = [];
  zip.forEach((relativePath: string) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) {
      slideFiles.push({ name: relativePath, num: parseInt(match[1], 10) });
    }
  });
  slideFiles.sort((a, b) => a.num - b.num);

  if (slideFiles.length === 0) {
    throw new Error("Invalid PPTX file: no slides found");
  }

  const textParts: string[] = [];

  for (const slide of slideFiles) {
    const xml = await zip.file(slide.name)?.async("string");
    if (!xml) continue;

    // Extract text from <a:t> tags
    const textNodes: string[] = [];
    const regex = /<a:t>([^<]*)<\/a:t>/g;
    let m;
    while ((m = regex.exec(xml)) !== null) {
      if (m[1].trim()) textNodes.push(m[1]);
    }

    if (textNodes.length > 0) {
      textParts.push(`## Slide ${slide.num}\n${textNodes.join(" ")}`);
    }
  }

  return textParts.join("\n\n").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { pptxContent } = await req.json();

    if (!pptxContent) {
      return new Response(
        JSON.stringify({ error: "Missing pptxContent" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Max 20MB
    const base64Size = pptxContent.length * 0.75;
    if (base64Size > 20 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 20MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracting text from PPTX...");
    const text = await extractTextFromPptx(pptxContent);

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text content found in presentation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${text.length} characters from PPTX`);

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error extracting PPTX text:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to extract text from presentation",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
