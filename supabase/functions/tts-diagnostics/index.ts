// Admin-only provider health probe. Returns availability/latency, never credentials.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { KOKORO_MODEL, kokoroConfigured, kokoroSynthesize, KokoroError } from "../_shared/kokoro.ts";
import { elevenLabsConfigured, elevenLabsSynthesize, elevenLabsHealthy, elevenLabsBreakerReason } from "../_shared/tts-router.ts";
import { GEMINI_TTS_MODEL, GeminiTTSError, geminiSynthesize, geminiTTSConfigured, geminiVoiceFor } from "../_shared/gemini-tts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PROBE_TEXT = "Voice provider health check.";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  let authorized = token === serviceKey;

  if (!authorized) {
    if (!token) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    authorized = isAdmin === true;
  }
  if (!authorized) return json({ error: "Forbidden" }, 403);

  const providers: Record<string, unknown> = {};

  // Google Gemini TTS via Lovable AI Gateway (primary)
  if (!geminiTTSConfigured()) {
    providers.gemini = { configured: false, available: false, error: "LOVABLE_API_KEY missing" };
  } else {
    const t0 = Date.now();
    try {
      const res = await geminiSynthesize({ text: PROBE_TEXT, voice: geminiVoiceFor("tutor") }, { retries: 0 });
      providers.gemini = {
        configured: true, available: true, model: GEMINI_TTS_MODEL, voice: res.voice,
        bytes: res.bytes.byteLength, contentType: res.contentType, latencyMs: Date.now() - t0,
      };
    } catch (err) {
      const g = err instanceof GeminiTTSError ? err : null;
      providers.gemini = {
        configured: true, available: false, model: GEMINI_TTS_MODEL, latencyMs: Date.now() - t0,
        errorCode: g?.status ?? 500, error: g?.userMessage ?? String(err),
      };
    }
  }

  // Kokoro via OpenRouter
  if (!kokoroConfigured()) {
    providers.kokoro = { configured: false, available: false, error: "OPENROUTER_API_KEY missing" };
  } else {
    const t0 = Date.now();
    try {
      const res = await kokoroSynthesize({ text: PROBE_TEXT, format: "mp3" }, { retries: 0, timeoutMs: 30_000 });
      providers.kokoro = {
        configured: true, available: true, model: KOKORO_MODEL, voice: res.voice,
        bytes: res.bytes.byteLength, contentType: res.contentType, latencyMs: Date.now() - t0,
      };
    } catch (err) {
      const k = err instanceof KokoroError ? err : null;
      providers.kokoro = {
        configured: true, available: false, model: KOKORO_MODEL, latencyMs: Date.now() - t0,
        errorCode: k?.status ?? 500, error: k?.userMessage ?? String(err),
      };
    }
  }

  // ElevenLabs
  if (!elevenLabsConfigured()) {
    providers.elevenlabs = { configured: false, available: false, error: "ELEVENLABS_API_KEY missing" };
  } else {
    const t0 = Date.now();
    try {
      const bytes = await elevenLabsSynthesize({
        text: PROBE_TEXT,
        voiceId: "EXAVITQu4vr4xnSDxMaL",
        modelId: "eleven_turbo_v2_5",
      });
      providers.elevenlabs = { configured: true, available: true, bytes: bytes.byteLength, latencyMs: Date.now() - t0 };
    } catch (err) {
      providers.elevenlabs = {
        configured: true, available: false, latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
        breaker: elevenLabsBreakerReason() || null,
      };
    }
  }

  return json({ providers, elevenLabsHealthy: elevenLabsHealthy(), checkedAt: new Date().toISOString() });
});
