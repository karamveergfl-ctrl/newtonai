import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { synthesizeSpeech } from "../_shared/tts-router.ts";
import { KokoroError } from "../_shared/kokoro.ts";
import { cacheHashes, lookupCachedAudio, serviceClient, storeAudio, trackTTSUsage } from "../_shared/tts-cache.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CHARS = 5000;

// ElevenLabs fallback voices per role
const EL_VOICES = {
  host1: "EXAVITQu4vr4xnSDxMaL", // Sarah
  host2: "CwhRBWXzGAHq8TQ4Fs17", // Roger
  tutor: "onwK4e9ZLuTAKqWW03F9", // Daniel
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const text: string = typeof body.text === "string" ? body.text.trim() : "";
    const language: string = typeof body.language === "string" ? body.language : "en";
    const role: "host1" | "host2" | "tutor" = ["host1", "host2", "tutor"].includes(body.role)
      ? body.role
      : "tutor";
    const speed: number = typeof body.speed === "number" ? Math.min(1.5, Math.max(0.6, body.speed)) : 1.0;

    if (!text) return json({ error: "No text provided" }, 400);
    if (text.length > MAX_CHARS) {
      return json({ error: `Text too long (${text.length}). Max ${MAX_CHARS} characters per request.` }, 400);
    }

    const db = serviceClient();

    // Content-addressed cache: identical text + voice + speed is never regenerated.
    const { contentHash, textHash, normalized } = await cacheHashes({
      text,
      voice: role,
      speed,
      model: `read-aloud:${language}`,
    });

    const cached = await lookupCachedAudio(db, contentHash);
    if (cached) {
      await trackTTSUsage(db, {
        userId: user.id,
        feature: "read-aloud",
        provider: cached.provider,
        voice: role,
        characters: normalized.length,
        cacheHit: true,
      });
      return json({ audioUrl: cached.audioUrl, engine: "cache", cached: true });
    }

    const tts = await synthesizeSpeech({
      text: normalized,
      role,
      language,
      speed,
      kokoroFormat: "mp3",
      elevenLabsVoiceId: EL_VOICES[role],
      elevenLabsModelId: language === "en" ? "eleven_turbo_v2_5" : "eleven_multilingual_v2",
    });

    const audioUrl = await storeAudio(db, {
      contentHash,
      textHash,
      voice: role,
      speed,
      model: `read-aloud:${language}`,
      provider: tts.engine === "kokoro" ? "openrouter" : "elevenlabs",
      bytes: tts.bytes,
      contentType: "audio/mpeg",
      charCount: normalized.length,
      extension: "mp3",
    });

    await trackTTSUsage(db, {
      userId: user.id,
      feature: "read-aloud",
      provider: tts.engine === "kokoro" ? "openrouter" : "elevenlabs",
      model: tts.model,
      voice: tts.voice,
      characters: normalized.length,
      cacheHit: false,
    });

    return json({
      audioUrl,
      engine: tts.engine,
      fallbackReason: tts.fallbackReason ?? null,
      cached: false,
    });
  } catch (error) {
    if (error instanceof KokoroError) {
      console.error("read-aloud-tts error:", error.message);
      return json({ error: error.userMessage }, 502);
    }
    console.error("read-aloud-tts error:", error);
    return json({ error: "Read-aloud audio could not be generated." }, 500);
  }
});
