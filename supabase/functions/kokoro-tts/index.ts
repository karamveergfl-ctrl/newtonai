// Direct Kokoro TTS endpoint (OpenRouter-backed), with deterministic caching.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DEFAULT_KOKORO_VOICE, KOKORO_MODEL, KokoroError, kokoroSynthesize } from "../_shared/kokoro.ts";
import { cacheHashes, chunkText, lookupCachedAudio, serviceClient, storeAudio, trackTTSUsage } from "../_shared/tts-cache.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CHARS = 20_000;
// OpenRouter's Kokoro endpoint delivers mp3 or pcm; "wav" requests are served as mp3.
const ALLOWED_FORMATS = ["wav", "mp3", "pcm"] as const;

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

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const rawText = typeof body.text === "string" ? body.text : "";
    const voice = typeof body.voice === "string" && body.voice.trim() ? body.voice.trim() : DEFAULT_KOKORO_VOICE;
    const speed = typeof body.speed === "number" ? Math.min(2, Math.max(0.5, body.speed)) : 1;
    const requestedFormat = ALLOWED_FORMATS.includes(body.response_format) ? body.response_format : "wav";
    const format: "mp3" | "pcm" = requestedFormat === "pcm" ? "pcm" : "mp3";

    if (!rawText.trim()) return json({ error: "No text provided." }, 400);
    if (rawText.length > MAX_CHARS) {
      return json({ error: `Text too long (${rawText.length}). Maximum is ${MAX_CHARS} characters.` }, 400);
    }

    // Rate limit through the existing shared limiter.
    const { data: allowed } = await userClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "kokoro-tts",
    });
    if (allowed === false) return json({ error: "Rate limit exceeded. Please try again shortly." }, 429);

    const db = serviceClient();

    // Whole-request cache first (one hash per exact request).
    const { contentHash, textHash, normalized } = await cacheHashes({
      text: rawText,
      voice,
      speed,
      model: `${KOKORO_MODEL}:${format}`,
    });

    const cached = await lookupCachedAudio(db, contentHash);
    if (cached) {
      await trackTTSUsage(db, {
        userId: user.id,
        feature: typeof body.feature === "string" ? body.feature : "tts",
        provider: "openrouter",
        model: KOKORO_MODEL,
        voice,
        characters: normalized.length,
        cacheHit: true,
      });
      return json({
        audioUrl: cached.audioUrl,
        engine: "cache",
        provider: cached.provider,
        model: KOKORO_MODEL,
        voice,
        cached: true,
        chunks: 1,
      });
    }

    // Long input is chunked on sentence boundaries; chunks concatenate cleanly for wav/mp3 playback.
    const chunks = chunkText(normalized);
    const parts: Uint8Array[] = [];
    let contentType = format === "pcm" ? "audio/pcm" : "audio/mpeg";

    for (const chunk of chunks) {
      const result = await kokoroSynthesize({ text: chunk, voice, speed, format });
      parts.push(result.bytes);
      contentType = result.contentType;
    }

    const total = parts.reduce((n, p) => n + p.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) { merged.set(p, offset); offset += p.byteLength; }

    const { audioUrl } = await storeAudio(db, {
      contentHash,
      textHash,
      voice,
      speed,
      model: `${KOKORO_MODEL}:${format}`,
      provider: "openrouter",
      bytes: merged,
      contentType,
      charCount: normalized.length,
      extension: format,
    });

    await trackTTSUsage(db, {
      userId: user.id,
      feature: typeof body.feature === "string" ? body.feature : "tts",
      provider: "openrouter",
      model: KOKORO_MODEL,
      voice,
      characters: normalized.length,
      cacheHit: false,
      requests: chunks.length,
    });

    return json({
      audioUrl,
      engine: "kokoro",
      provider: "openrouter",
      model: KOKORO_MODEL,
      voice,
      cached: false,
      chunks: chunks.length,
    });
  } catch (error) {
    if (error instanceof KokoroError) {
      console.error("kokoro-tts error:", error.message);
      return json({ error: error.userMessage }, error.status >= 400 && error.status < 600 ? error.status : 500);
    }
    console.error("kokoro-tts error:", error);
    return json({ error: "Voice generation failed. Please try again." }, 500);
  }
});
