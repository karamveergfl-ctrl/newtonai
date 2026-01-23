import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const languageNames: Record<string, string> = {
  "en": "English", "hi": "Hindi", "es": "Spanish", "fr": "French",
  "de": "German", "zh": "Chinese", "ja": "Japanese", "ko": "Korean",
  "ar": "Arabic", "pt": "Portuguese", "ru": "Russian", "it": "Italian",
  "bn": "Bengali", "ta": "Tamil", "te": "Telugu", "mr": "Marathi",
  "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam", "pa": "Punjabi"
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

    // Check rate limit (50 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'generate-mindmap',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { content, selectedText, structure = "horizontal", detailLevel = "standard", language = "en", stream = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToMap = selectedText || content;
    
    if (!textToMap) {
      throw new Error("No content provided");
    }

    const targetLanguage = languageNames[language] || "English";
    console.log(`Generating ${detailLevel} mind map in ${targetLanguage} for ${textToMap.length} characters`);

    // SSE streaming response
    if (stream) {
      const encoder = new TextEncoder();
      
      const sendProgress = (controller: ReadableStreamDefaultController, data: { stage: string; progress: number; message?: string }) => {
        const event = `data: ${JSON.stringify({ type: "progress", ...data })}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            // Stage 1: Validating
            sendProgress(controller, { stage: "validating", progress: 10, message: "Validating input..." });
            await new Promise(r => setTimeout(r, 300));

            // Stage 2: Analyzing
            sendProgress(controller, { stage: "analyzing", progress: 30, message: "Analyzing content..." });
            await new Promise(r => setTimeout(r, 300));

            // Stage 3: Generating
            sendProgress(controller, { stage: "generating", progress: 50, message: "Newton is mapping concepts..." });

            const systemPrompt = `You are an expert at creating educational mind maps following Google NotebookLM's clean, organized style.

CRITICAL: Generate ALL text labels and definitions in ${targetLanguage}. Every node's "text" and "definition" fields must be written in ${targetLanguage}.

Create a hierarchical mind map that is:
- Well-balanced with 5-6 main branches
- Each main branch has 2-4 sub-nodes
- Each sub-node can have 1-3 leaf nodes
- Uses SHORT, CLEAR labels (2-5 words max per node) in ${targetLanguage}
- INCLUDES a definition/explanation for EVERY node in ${targetLanguage}

Return ONLY valid JSON with this structure:
{
  "id": "root",
  "text": "Main Topic in ${targetLanguage} (2-4 words)",
  "definition": "A comprehensive 1-2 sentence definition in ${targetLanguage}",
  "children": [
    {
      "id": "b1",
      "text": "Branch 1 Label in ${targetLanguage}",
      "definition": "Clear explanation in ${targetLanguage}",
      "children": [
        {
          "id": "b1_s1",
          "text": "Sub-topic in ${targetLanguage}",
          "definition": "Brief explanation in ${targetLanguage}",
          "children": [
            { 
              "id": "b1_s1_l1", 
              "text": "Detail point in ${targetLanguage}",
              "definition": "Explanation in ${targetLanguage}"
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL RULES:
- EXACTLY 5-6 main branches for balance
- Each node text: 2-5 words MAXIMUM in ${targetLanguage}
- EVERY node MUST have a "definition" field with a helpful 1-2 sentence explanation in ${targetLanguage}
- Use action words and clear nouns in ${targetLanguage}
- Create logical groupings
- Include key concepts, definitions, relationships
- Make definitions educational, clear, and informative in ${targetLanguage}
- Use unique IDs (b1, b1_s1, b1_s1_l1 pattern)
- Return ONLY the JSON, no markdown or explanation
- ALL TEXT MUST BE IN ${targetLanguage}`;

            const userPrompt = `Create a balanced, educational mind map in ${targetLanguage} for this content:

${textToMap.slice(0, 6000)}

Return ONLY the JSON object with all text in ${targetLanguage}.`;

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
              throw new Error("AI gateway error");
            }

            // Stage 4: Building
            sendProgress(controller, { stage: "building", progress: 80, message: "Building mind map..." });

            const data = await response.json();
            let rawContent = data.choices?.[0]?.message?.content || '';

            // Robust JSON extraction for mind maps
            const extractMindMap = (text: string): any => {
              let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
              
              try {
                const parsed = JSON.parse(cleaned);
                if (parsed.id || parsed.text || parsed.central) return parsed;
              } catch {}
              
              const objMatch = cleaned.match(/\{\s*"(?:id|text|central)"[\s\S]*\}/);
              if (objMatch) {
                try {
                  return JSON.parse(objMatch[0]);
                } catch {}
              }
              
              const lines = text.split('\n')
                .map(l => l.trim())
                .filter(l => l && !l.startsWith('{') && !l.startsWith('['));
              
              const branches = lines.slice(0, 6).map((line, i) => ({
                id: `b${i + 1}`,
                text: line.replace(/^[-*•#]+\s*/, '').replace(/\*\*/g, '').slice(0, 50),
                definition: "Key concept from the content",
                children: []
              }));
              
              return {
                id: "root",
                text: "Content Summary",
                definition: "Overview of the main topics",
                children: branches
              };
            };

            const mindMapData = extractMindMap(rawContent);

            // Stage 5: Complete
            sendProgress(controller, { stage: "complete", progress: 100, message: "Complete!" });

            // Send final result
            const result = JSON.stringify({ mindMap: rawContent, mindMapData, structure });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", data: result })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Error generating mind map:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Failed to generate mind map" })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Non-streaming response (original behavior)
    const systemPrompt = `You are an expert at creating educational mind maps following Google NotebookLM's clean, organized style.

CRITICAL: Generate ALL text labels and definitions in ${targetLanguage}. Every node's "text" and "definition" fields must be written in ${targetLanguage}.

Create a hierarchical mind map that is:
- Well-balanced with 5-6 main branches
- Each main branch has 2-4 sub-nodes
- Each sub-node can have 1-3 leaf nodes
- Uses SHORT, CLEAR labels (2-5 words max per node) in ${targetLanguage}
- INCLUDES a definition/explanation for EVERY node in ${targetLanguage}

Return ONLY valid JSON with this structure:
{
  "id": "root",
  "text": "Main Topic in ${targetLanguage} (2-4 words)",
  "definition": "A comprehensive 1-2 sentence definition in ${targetLanguage}",
  "children": [
    {
      "id": "b1",
      "text": "Branch 1 Label in ${targetLanguage}",
      "definition": "Clear explanation in ${targetLanguage}",
      "children": [
        {
          "id": "b1_s1",
          "text": "Sub-topic in ${targetLanguage}",
          "definition": "Brief explanation in ${targetLanguage}",
          "children": [
            { 
              "id": "b1_s1_l1", 
              "text": "Detail point in ${targetLanguage}",
              "definition": "Explanation in ${targetLanguage}"
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL RULES:
- EXACTLY 5-6 main branches for balance
- Each node text: 2-5 words MAXIMUM in ${targetLanguage}
- EVERY node MUST have a "definition" field with a helpful 1-2 sentence explanation in ${targetLanguage}
- Use action words and clear nouns in ${targetLanguage}
- Create logical groupings
- Include key concepts, definitions, relationships
- Make definitions educational, clear, and informative in ${targetLanguage}
- Use unique IDs (b1, b1_s1, b1_s1_l1 pattern)
- Return ONLY the JSON, no markdown or explanation
- ALL TEXT MUST BE IN ${targetLanguage}`;

    const userPrompt = `Create a balanced, educational mind map in ${targetLanguage} for this content:

${textToMap.slice(0, 6000)}

Return ONLY the JSON object with all text in ${targetLanguage}.`;

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

    // Robust JSON extraction for mind maps
    const extractMindMap = (text: string): any => {
      // Clean the text
      let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      // Method 1: Direct parse
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.id || parsed.text || parsed.central) return parsed;
      } catch {}
      
      // Method 2: Find object with id/text/central
      const objMatch = cleaned.match(/\{\s*"(?:id|text|central)"[\s\S]*\}/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch {}
      }
      
      // Method 3: Create from bullet points
      const lines = text.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('{') && !l.startsWith('['));
      
      const branches = lines.slice(0, 6).map((line, i) => ({
        id: `b${i + 1}`,
        text: line.replace(/^[-*•#]+\s*/, '').replace(/\*\*/g, '').slice(0, 50),
        definition: "Key concept from the content",
        children: []
      }));
      
      return {
        id: "root",
        text: "Content Summary",
        definition: "Overview of the main topics",
        children: branches
      };
    };

    const mindMapData = extractMindMap(rawContent);
    console.log("Parsed mind map with", mindMapData.children?.length || 0, "branches");

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
