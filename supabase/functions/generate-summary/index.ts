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
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (50 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'generate-summary',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { content, selectedText, detailLevel = "standard" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToSummarize = selectedText || content;
    if (!textToSummarize) {
      throw new Error("No content provided");
    }

    console.log(`Generating ${detailLevel} study guide for ${textToSummarize.length} characters`);

    const detailGuide = {
      brief: "Create a concise study guide with 2-3 key points per section.",
      standard: "Create a balanced study guide with 4-5 key points per section.",
      detailed: "Create a comprehensive study guide with 6-8 key points per section, including examples."
    };

    const systemPrompt = `You are an expert study guide creator following Google NotebookLM's format exactly.

Create a comprehensive study guide with these EXACT sections in this order:

## Overview
[2-3 sentences introducing the topic and its importance]

## Key Topics
- **Topic 1**: Clear, concise explanation
- **Topic 2**: Clear, concise explanation
[Continue for 4-6 major topics]

## Key Terms & Definitions
| Term | Definition |
|------|------------|
| Term 1 | Clear, precise definition |
| Term 2 | Clear, precise definition |
[Include 6-10 important terms in table format]

## Quick Review
1. **Question:** [Specific quiz-style question about the content]
   **Answer:** [Concise, accurate answer]

2. **Question:** [Another question]
   **Answer:** [Answer]
[Include 4-6 questions with answers]

## Essay Prompts
1. [Thought-provoking question requiring analysis]
2. [Another deeper thinking question]
[Include 2-3 essay prompts]

## Key Takeaways
- Most important point to remember
- Second key takeaway
- Third key takeaway
[Include 4-6 bullet points]

Detail level: ${detailLevel.toUpperCase()}
${detailGuide[detailLevel as keyof typeof detailGuide]}

FORMATTING RULES:
- Use proper markdown with ## for section headers
- Use tables for Key Terms (| Term | Definition | format)
- Use numbered lists for Quick Review questions
- Use bullet points with **bold** for emphasis
- Keep language clear, educational, and professional
- Do NOT include any introduction or conclusion outside these sections`;

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
          { role: "user", content: `Create a study guide for this content:\n\n${textToSummarize.slice(0, 10000)}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';
    
    console.log("Generated study guide successfully");

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate summary" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
