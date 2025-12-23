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
    const { content, selectedText, detailLevel = "standard" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToSummarize = selectedText || content;
    
    if (!textToSummarize) {
      throw new Error("No content provided");
    }

    console.log(`Generating ${detailLevel} summary for ${textToSummarize.length} characters`);

    const detailGuide = {
      brief: "Create a very concise summary with only the most essential points. Keep it short - max 3-4 bullet points per section.",
      standard: "Create a balanced summary covering main ideas with supporting details. Include 5-6 bullet points per section.",
      detailed: "Create a comprehensive summary with thorough coverage of all concepts, examples, and nuances. Include 8-10 bullet points per section."
    };

    const systemPrompt = `You are an expert educator that creates clear, concise summaries.
Your summaries should:
- Capture the main ideas and key concepts
- Be organized with clear sections
- Use bullet points for clarity
- Highlight important terms
- Be easy to review for studying

Detail level: ${detailLevel.toUpperCase()}
${detailGuide[detailLevel as keyof typeof detailGuide]}`;

    const userPrompt = `Create a comprehensive study summary of the following content:

${textToSummarize.slice(0, 10000)}

Format the summary with:
1. **Main Topic** - A one-line overview
2. **Key Concepts** - Bullet points of the main ideas
3. **Important Details** - Supporting information
4. **Key Terms** - Important vocabulary or formulas
5. **Quick Review** - 2-3 sentences to remember`;

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
    const summary = data.choices?.[0]?.message?.content || '';
    
    console.log("Summary generated successfully");

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating summary:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate summary" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
