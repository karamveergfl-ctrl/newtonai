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

    console.log(`Generating ${detailLevel} mind map for ${textToMap.length} characters`);

    const systemPrompt = `You are an expert at creating educational mind maps following Google NotebookLM's clean, organized style.

Create a hierarchical mind map that is:
- Well-balanced with 5-6 main branches
- Each main branch has 2-4 sub-nodes
- Each sub-node can have 1-3 leaf nodes
- Uses SHORT, CLEAR labels (2-5 words max per node)
- INCLUDES a definition/explanation for EVERY node

Return ONLY valid JSON with this structure:
{
  "id": "root",
  "text": "Main Topic (2-4 words)",
  "definition": "A comprehensive 1-2 sentence definition explaining this topic",
  "children": [
    {
      "id": "b1",
      "text": "Branch 1 Label",
      "definition": "Clear explanation of this branch concept in 1-2 sentences",
      "children": [
        {
          "id": "b1_s1",
          "text": "Sub-topic",
          "definition": "Brief explanation of this sub-topic",
          "children": [
            { 
              "id": "b1_s1_l1", 
              "text": "Detail point",
              "definition": "Explanation of this detail"
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL RULES:
- EXACTLY 5-6 main branches for balance
- Each node text: 2-5 words MAXIMUM
- EVERY node MUST have a "definition" field with a helpful 1-2 sentence explanation
- Use action words and clear nouns
- Create logical groupings
- Include key concepts, definitions, relationships
- Make definitions educational, clear, and informative
- Use unique IDs (b1, b1_s1, b1_s1_l1 pattern)
- Return ONLY the JSON, no markdown or explanation`;

    const userPrompt = `Create a balanced, educational mind map for this content:

${textToMap.slice(0, 6000)}

Return ONLY the JSON object.`;

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
      console.error("Failed to parse JSON, creating fallback structure:", parseError);
      mindMapData = {
        id: "root",
        text: "Main Topic",
        children: rawContent.split('\n')
          .filter((line: string) => line.trim())
          .slice(0, 6)
          .map((line: string, i: number) => ({
            id: `b${i + 1}`,
            text: line.replace(/^[-*•]\s*/, '').slice(0, 40),
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
