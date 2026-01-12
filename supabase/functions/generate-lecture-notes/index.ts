import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    // Check rate limit (50 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'generate-lecture-notes',
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

    const { transcription, template, templateStructure, language } = await req.json();

    if (!transcription) {
      throw new Error("No transcription provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Generating brief summary from transcription...");
    console.log("Template:", template);
    console.log("Language:", language);

    // Get language name for the prompt
    const languageNames: Record<string, string> = {
      "en-US": "English",
      "es-ES": "Spanish",
      "fr-FR": "French",
      "de-DE": "German",
      "it-IT": "Italian",
      "pt-BR": "Portuguese",
      "zh-CN": "Chinese",
      "ja-JP": "Japanese",
      "ko-KR": "Korean",
      "ar-SA": "Arabic",
      "hi-IN": "Hindi",
      "ru-RU": "Russian",
    };
    const targetLanguage = languageNames[language] || "English";

    // Template-specific prompts
    const templatePrompts: Record<string, string> = {
      "lecture": `Create a brief summary following this structure:
## Key Points
- List 2-3 main points from the content

## Details
- Brief elaboration on the key points (1-2 sentences each)

## Summary
- A concise 2-3 sentence summary of the entire content`,

      "study-guide": `Create a brief study guide following this structure:
## Summary
- A concise 2-3 sentence overview

## Chapters
- Break down the content into 2-3 logical sections with brief descriptions

## Action Items
- List 2-3 actionable takeaways or things to do`,

      "research": `Create a brief research summary following this structure:
## Topics
- List the main topics covered (2-3 topics)

## Review
- Brief analysis of the content (2-3 sentences)

## Progress
- Key insights or findings`,

      "project": `Create a brief project work plan following this structure:
## Summary
- Brief overview of the content (2-3 sentences)

## Issue
- Identify the main problem or challenge discussed

## Solution
- Outline the proposed solution or approach`,
    };

    const selectedTemplatePrompt = templatePrompts[template] || templatePrompts["lecture"];
    const structureInfo = templateStructure?.length > 0 
      ? `Use these sections: ${templateStructure.join(", ")}` 
      : "";

    const systemPrompt = `You are a concise summarizer. Your task is to create BRIEF summaries from transcriptions.

IMPORTANT RULES:
1. Keep it SHORT - if the input is 5 sentences, output should be about 3 sentences worth of content
2. Correct any spelling, grammar, and language errors in the transcription
3. Fix incomplete or unclear sentences
4. Output MUST be in ${targetLanguage}
5. Use proper markdown formatting
6. Do NOT add extra information - only summarize what was actually said
7. Be concise but capture the essential meaning

${structureInfo}

${selectedTemplatePrompt}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please create a brief summary from this transcription. Remember to be concise and output in ${targetLanguage}:\n\n${transcription}` },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const notes = data.choices?.[0]?.message?.content;

    if (!notes) {
      throw new Error("No notes generated");
    }

    // Extract title from the notes (first heading)
    const titleMatch = notes.match(/^#\s*(.+)$/m) || notes.match(/\*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1].trim() : "Lecture Notes";

    console.log("Notes generated successfully");

    return new Response(
      JSON.stringify({ notes, title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating lecture notes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate notes" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
