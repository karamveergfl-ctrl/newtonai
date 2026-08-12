import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { synthesizeSpeech } from "../_shared/tts-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CHARS = 5000;
const CACHE_BUCKET = "tts-cache";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

// ElevenLabs fallback voices per role
const EL_VOICES = {
  host1: "EXAVITQu4vr4xnSDxMaL", // Sarah
  host2: "CwhRBWXzGAHq8TQ4Fs17", // Roger
  tutor: "onwK4e9ZLuTAKqWW03F9", // Daniel
} as const;

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const text: string = typeof body.text === "string" ? body.text.trim() : "";
    const language: string = typeof body.language === "string" ? body.language : "en";
    const role: "host1" | "host2" | "tutor" = ["host1", "host2", "tutor"].includes(body.role)
      ? body.role
      : "tutor";
    const speed: number = typeof body.speed === "number" ? Math.min(1.5, Math.max(0.6, body.speed)) : 1.0;

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > MAX_CHARS) {
      return new Response(
        JSON.stringify({ error: `Text too long (${text.length}). Max ${MAX_CHARS} characters per request.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const storage = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Content-addressed cache: identical text + voice + speed is never regenerated.
    const hash = await sha256(`${role}|${language}|${speed}|${text}`);
    const path = `${hash}.mp3`;

    const { data: cached } = await storage.storage.from(CACHE_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
    if (cached?.signedUrl) {
      return new Response(JSON.stringify({ audioUrl: cached.signedUrl, engine: "cache", cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tts = await synthesizeSpeech({
      text,
      role,
      language,
      speed,
      elevenLabsVoiceId: EL_VOICES[role],
      elevenLabsModelId: language === "en" ? "eleven_turbo_v2_5" : "eleven_multilingual_v2",
    });

    const { error: uploadError } = await storage.storage
      .from(CACHE_BUCKET)
      .upload(path, tts.bytes, { contentType: "audio/mpeg", upsert: true });
    if (uploadError) throw new Error(`Audio cache upload failed: ${uploadError.message}`);

    const { data: signed, error: signError } = await storage.storage
      .from(CACHE_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signError || !signed?.signedUrl) {
      throw new Error(`Could not sign audio URL: ${signError?.message ?? "unknown error"}`);
    }

    return new Response(
      JSON.stringify({
        audioUrl: signed.signedUrl,
        engine: tts.engine,
        fallbackReason: tts.fallbackReason ?? null,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("read-aloud-tts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "TTS generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
