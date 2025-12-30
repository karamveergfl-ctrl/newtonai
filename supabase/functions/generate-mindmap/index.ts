import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("Invalid or expired token:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { content, selectedText, structure = "horizontal", detailLevel = "standard" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToMap = selectedText || content;
    
    if (!textToMap) {
      throw new Error("No content provided");
    }

    console.log(`Generating ${detailLevel} mind map for ${textToMap.length} characters with structure: ${structure}`);

    const detailGuide = {
      brief: "Create a simpler mind map with 3-4 main branches and 1-2 sub-branches each. Keep it concise.",
      standard: "Create a balanced mind map with 4-5 main branches and 2-3 sub-branches each with detail nodes.",
      detailed: "Create a comprehensive mind map with 5-6 main branches, 3-4 sub-branches each, and detailed leaf nodes with examples."
    };

    const systemPrompt = `You are an expert at creating DETAILED hierarchical mind maps. You MUST return valid JSON only.

Detail level: ${detailLevel.toUpperCase()}
${detailGuide[detailLevel as keyof typeof detailGuide]}

Return a JSON object with this DEEP hierarchical structure (4-5 levels deep):
{
  "id": "root",
  "text": "Main Topic Title",
  "children": [
    {
      "id": "branch1",
      "text": "Category Name",
      "children": [
        {
          "id": "sub1",
          "text": "Sub-Category",
          "children": [
            {
              "id": "detail1",
              "text": "Key Point or Fact",
              "children": [
                { "id": "leaf1", "text": "Specific detail or example" }
              ]
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL RULES:
- Create 4-6 MAIN branches (major categories/topics)
- Each main branch MUST have 2-4 sub-branches
- Each sub-branch MUST have 2-3 detail nodes
- Detail nodes can have 1-2 leaf nodes for specifics
- Keep each node text SHORT: 2-6 words max
- Make it EDUCATIONAL and DETAILED
- Include definitions, examples, characteristics, comparisons
- Use unique IDs (like "b1", "b1_s1", "b1_s1_d1", "b1_s1_d1_l1")
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
