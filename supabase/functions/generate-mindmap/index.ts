import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, selectedText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToMap = selectedText || content;
    
    if (!textToMap) {
      throw new Error("No content provided");
    }

    console.log(`Generating mind map for ${textToMap.length} characters`);

    const systemPrompt = `You are an expert at creating visual mind maps using ASCII/text art.
Create mind maps that:
- Have a clear central topic
- Branch out to main concepts
- Use consistent visual hierarchy
- Are easy to read and understand
- Use simple ASCII characters for connections`;

    const userPrompt = `Create a text-based mind map for the following content:

${textToMap.slice(0, 8000)}

Format the mind map using this structure:
- Central topic in the middle
- Use ├──, │, └──, ─── for branches
- Main branches for key concepts
- Sub-branches for details
- Keep it organized and visually clear

Example format:
                    ┌── Sub-concept 1
        ┌── Main 1 ─┤
        │           └── Sub-concept 2
        │
TOPIC ──┼── Main 2 ─── Detail
        │
        │           ┌── Sub-concept A
        └── Main 3 ─┤
                    └── Sub-concept B

Generate the mind map now:`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const mindMap = data.choices?.[0]?.message?.content || '';
    
    console.log("Mind map generated successfully");

    return new Response(JSON.stringify({ mindMap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating mind map:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate mind map" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
