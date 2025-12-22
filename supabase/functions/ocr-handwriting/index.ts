import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Processing handwritten image with OCR...");

    // Use Lovable AI vision model for OCR
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert OCR system specializing in handwritten text recognition with perfect formatting preservation.

CRITICAL INSTRUCTIONS:
1. **Exact Transcription**: Read ALL handwritten text with 100% accuracy - NO mistakes, NO omissions
2. **Preserve Structure**: Maintain EXACT layout, spacing, and hierarchy:
   - Keep heading sizes and emphasis (use Markdown: # ## ### for headings)
   - Preserve indentation and bullet points
   - Maintain paragraph breaks and line spacing
3. **Tables**: If you see ANY tabular data or grid-like content:
   - Convert to proper Markdown table format
   - Use | for columns and --- for header separator
   - Example:
     | Header 1 | Header 2 | Header 3 |
     |----------|----------|----------|
     | Data 1   | Data 2   | Data 3   |
4. **Mathematical Content**: Convert ALL mathematical expressions, equations, and numericals to LaTeX format:
   - Inline math: $expression$
   - Display math: $$expression$$
   - Examples: $x^2 + 2x + 1$, $$\\frac{dy}{dx} = 2x$$, $\\sqrt{16} = 4$
5. **Formatting**:
   - Bold text: **text**
   - Italic: *text*
   - Underlined: __text__
   - Lists: Use - or 1. 2. 3. for ordered lists
6. **Quality**: 
   - Fix obvious spelling/grammar errors
   - Maintain original meaning
   - Organize content clearly
   - Keep text readable and well-structured

OUTPUT FORMAT:
Return ONLY the converted text with preserved formatting using Markdown, tables, and LaTeX.
Do NOT add explanations, comments, or metadata.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    console.log("OCR completed successfully");

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ocr-handwriting:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process handwriting";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
