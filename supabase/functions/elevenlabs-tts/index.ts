import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice IDs for the two hosts
const VOICE_IDS = {
  host1: "JBFqnCBsd6RMkjVDRZzb", // George - male
  host2: "EXAVITQu4vr4xnSDxMaL", // Sarah - female
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, speaker, emotion } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const voiceId = VOICE_IDS[speaker as keyof typeof VOICE_IDS] || VOICE_IDS.host1;

    // Adjust voice settings based on emotion
    let stability = 0.5;
    let similarityBoost = 0.75;
    let style = 0.4;

    switch (emotion) {
      case "enthusiastic":
      case "excited":
        stability = 0.35;
        style = 0.6;
        break;
      case "curious":
        stability = 0.45;
        style = 0.5;
        break;
      case "thoughtful":
      case "serious":
        stability = 0.6;
        style = 0.3;
        break;
      case "surprised":
        stability = 0.3;
        style = 0.7;
        break;
      case "amused":
        stability = 0.4;
        style = 0.55;
        break;
      case "warm":
        stability = 0.55;
        style = 0.45;
        break;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    return new Response(
      JSON.stringify({ audio: base64Audio }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating TTS:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate audio" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
