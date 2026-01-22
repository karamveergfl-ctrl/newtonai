import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" 
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
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

    // Check rate limit (30 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'transcribe-audio',
      p_max_requests: 30,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audio, mimeType = "audio/webm", language } = await req.json();
    
    if (!audio) {
      return new Response(
        JSON.stringify({ error: 'No audio data provided' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Extract clean audio format from mimeType (e.g., "audio/webm;codecs=opus" -> "webm")
    const audioFormat = mimeType.split('/')[1]?.split(';')[0] || "webm";
    
    // Build language-aware system prompt
    const languageNames: Record<string, string> = {
      en: "English", es: "Spanish", fr: "French", de: "German",
      it: "Italian", pt: "Portuguese", zh: "Chinese", ja: "Japanese",
      ko: "Korean", ar: "Arabic", hi: "Hindi", ru: "Russian",
      nl: "Dutch", pl: "Polish", tr: "Turkish", vi: "Vietnamese",
      th: "Thai", id: "Indonesian", bn: "Bengali", ta: "Tamil",
      te: "Telugu", mr: "Marathi", gu: "Gujarati", kn: "Kannada",
      ml: "Malayalam", pa: "Punjabi", or: "Odia", as: "Assamese",
    };
    
    const langName = language && languageNames[language] ? languageNames[language] : null;
    const languageInstruction = langName 
      ? `The audio is in ${langName}. Transcribe in ${langName} language.` 
      : "Detect the language automatically and transcribe in that language.";

    const systemPrompt = `You are a highly accurate audio transcription service. Your ONLY task is to transcribe the spoken words in this audio recording.

CRITICAL RULES:
1. Listen carefully to EVERY word spoken in the audio
2. Transcribe EXACTLY what is said - do not paraphrase, summarize, or interpret
3. If someone says "Newton's third law", write "Newton's third law"
4. If someone discusses physics, write about physics - NOT about unrelated topics
5. Preserve the original topic and subject matter exactly as spoken
6. Use proper punctuation and paragraph breaks
7. Mark unclear parts as [inaudible]
8. ${languageInstruction}
9. Do NOT add any content that was not spoken
10. Do NOT generate content about random topics - only transcribe what was actually said

OUTPUT: Provide ONLY the verbatim transcription. No headers, no labels, no commentary.`;

    console.log("Starting transcription with format:", audioFormat, "language:", language || "auto-detect");
    console.log("Audio data length (base64):", audio?.length || 0);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { 
      method: "POST", 
      headers: { 
        Authorization: `Bearer ${LOVABLE_API_KEY}`, 
        "Content-Type": "application/json" 
      }, 
      body: JSON.stringify({ 
        model: "google/gemini-2.5-flash", 
        messages: [
          { 
            role: "system", 
            content: systemPrompt
          }, 
          { 
            role: "user", 
            content: [
              { 
                type: "text", 
                text: "Listen to this audio recording carefully and transcribe EXACTLY what is spoken. Write only the words that were said, nothing else:" 
              }, 
              { 
                type: "input_audio", 
                input_audio: { 
                  data: audio, 
                  format: audioFormat 
                } 
              }
            ] 
          }
        ], 
        max_tokens: 16000,
        temperature: 0.1  // Lower temperature for more accurate/literal transcription
      }) 
    });
    
    console.log("Transcription API response status:", response.status);
    
    if (!response.ok) { 
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage credits exhausted." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Transcription API error:", response.status, errorText);
      throw new Error(`Transcription failed: ${response.status}`); 
    }
    
    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content;
    
    if (!transcription) {
      throw new Error("No transcription generated");
    }
    
    // Clean up the transcription - remove any accidental prefixes
    const cleanedTranscription = transcription
      .replace(/^(Transcription:|Here is the transcription:|Here's the transcription:)\s*/i, '')
      .trim();
    
    return new Response(
      JSON.stringify({ text: cleanedTranscription }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) { 
    console.error("Transcription error:", error); 
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Transcription failed" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    ); 
  }
});
