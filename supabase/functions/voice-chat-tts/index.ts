import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { kokoroConfigured, kokoroSynthesize } from "../_shared/kokoro.ts";
import { kokoroAvailable, kokoroSupportsLanguage, kokoroVoiceFor } from "../_shared/tts-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "x-tts-engine, x-tts-fallback-reason",
};

// Tutor voice configuration - calm, clear, teacher-like
const TUTOR_VOICE_ID = "onwK4e9ZLuTAKqWW03F9"; // Daniel - calm and clear

const VOICE_SETTINGS = {
  stability: 0.5,            // Balanced for turbo model
  similarity_boost: 0.75,
  style: 0.0,                // No style processing → lower latency
  use_speaker_boost: false,  // Faster generation
  speed: 1.0,
};

// If Kokoro can't start sending audio within this budget, fail over so the tutor never goes silent.
const KOKORO_TTFB_BUDGET_MS = 12000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language = "en" } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Keep voice answers short for low latency
    const processedText = text.length > 800 ? text.slice(0, 800) + "..." : text;

    console.log(`Streaming TTS for ${processedText.length} chars (${language})`);

    let fallbackReason: string | undefined;

    // --- 1. Kokoro first ---
    if (!kokoroConfigured()) {
      fallbackReason = "Kokoro server is not configured";
    } else if (!kokoroSupportsLanguage(language)) {
      fallbackReason = `Kokoro has no voice pack for "${language}"`;
    } else if (!(await kokoroAvailable())) {
      fallbackReason = "Kokoro server health check failed";
    } else {
      try {
        const kokoroRes = await kokoroSynthesize(
          { text: processedText, voice: kokoroVoiceFor("tutor"), speed: 1.0, format: "mp3" },
          { timeoutMs: KOKORO_TTFB_BUDGET_MS, retries: 0 },
        );
        return new Response(kokoroRes.bytes, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-cache",
            "x-tts-engine": "kokoro",
          },
        });
      } catch (err) {
        fallbackReason = err instanceof Error ? err.message : "Kokoro request failed";
        console.error("Kokoro tutor TTS failed, falling back to ElevenLabs:", fallbackReason);
      }
    }

    // --- 2. ElevenLabs fallback ---
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error(`No TTS engine available. ${fallbackReason ?? ""}`.trim());
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${TUTOR_VOICE_ID}/stream?output_format=mp3_22050_32&optimize_streaming_latency=3`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: processedText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
        "x-tts-engine": "elevenlabs",
        "x-tts-fallback-reason": (fallbackReason ?? "").slice(0, 200),
      },
    });

  } catch (error: any) {
    console.error("Voice chat TTS error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "TTS generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
