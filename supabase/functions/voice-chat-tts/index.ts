import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tutor voice configuration - calm, clear, teacher-like
const TUTOR_VOICE_ID = "onwK4e9ZLuTAKqWW03F9"; // Daniel - calm and clear

const VOICE_SETTINGS = {
  stability: 0.65,           // More stable for clear teaching
  similarity_boost: 0.75,    // Good voice similarity
  style: 0.15,               // Minimal style exaggeration for clarity
  use_speaker_boost: true,   // Enhanced clarity
  speed: 0.9,                // Slightly slower for comprehension
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const { text, language = "en" } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit text length for voice responses (keep them concise)
    const truncatedText = text.length > 1500 
      ? text.slice(0, 1500) + "... For more details, please ask a follow-up question."
      : text;

    // Add natural pauses for better speech flow
    const processedText = truncatedText
      // Add pauses after sentences
      .replace(/\.\s+/g, '. ... ')
      // Add pauses after colons (like "Page 7:")
      .replace(/:\s+/g, ': ... ')
      // Clean up excessive pauses
      .replace(/\.\.\.\s*\.\.\./g, '...');

    console.log(`Generating TTS for ${processedText.length} chars in language: ${language}`);

    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${TUTOR_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: processedText,
          model_id: "eleven_multilingual_v2", // Supports multiple languages
          voice_settings: VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Return the audio directly
    const audioBuffer = await response.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error: any) {
    console.error("Voice chat TTS error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "TTS generation failed" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
