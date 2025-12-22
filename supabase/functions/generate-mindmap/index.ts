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
    const { content, selectedText, structure = "horizontal" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToMap = selectedText || content;
    
    if (!textToMap) {
      throw new Error("No content provided");
    }

    console.log(`Generating mind map for ${textToMap.length} characters with structure: ${structure}`);

    const systemPrompt = `You are an expert at creating structured mind maps. You MUST return valid JSON only.
Return a JSON object representing a mind map with this exact structure:
{
  "id": "root",
  "text": "Main Topic",
  "children": [
    {
      "id": "branch1",
      "text": "Branch 1",
      "children": [
        { "id": "leaf1", "text": "Detail 1" },
        { "id": "leaf2", "text": "Detail 2" }
      ]
    }
  ]
}

Rules:
- Keep text concise (2-5 words per node)
- Create 3-6 main branches from the root
- Each branch can have 2-4 sub-items
- Use unique IDs for each node
- Return ONLY valid JSON, no markdown, no explanation`;

    const userPrompt = `Create a mind map JSON for this content:

${textToMap.slice(0, 6000)}

Return ONLY the JSON object, nothing else.`;

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
    let rawContent = data.choices?.[0]?.message?.content || '';
    
    console.log("Raw AI response:", rawContent.slice(0, 500));

    // Parse JSON from response
    let mindMapData;
    try {
      // Remove markdown code blocks if present
      let jsonStr = rawContent;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      jsonStr = jsonStr.trim();
      
      mindMapData = JSON.parse(jsonStr);
      console.log("Successfully parsed mind map JSON");
    } catch (parseError) {
      console.error("Failed to parse JSON, returning text format:", parseError);
      // Fallback: create a simple structure from the text
      mindMapData = {
        id: "root",
        text: "Main Topic",
        children: rawContent.split('\n')
          .filter((line: string) => line.trim())
          .slice(0, 5)
          .map((line: string, i: number) => ({
            id: `branch${i}`,
            text: line.replace(/^[-*•]\s*/, '').slice(0, 50),
            children: []
          }))
      };
    }

    return new Response(JSON.stringify({ 
      mindMap: rawContent,
      mindMapData,
      structure 
    }), {
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
