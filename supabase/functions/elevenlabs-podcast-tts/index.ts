import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  synthesizeSpeech,
  kokoroAvailable,
  kokoroSupportsLanguage,
  elevenLabsHealthy,
  elevenLabsBreakerReason,
  TTSUnavailableError,
} from "../_shared/tts-router.ts";
import { KOKORO_MODEL } from "../_shared/kokoro.ts";
import {
  cacheHashes,
  chunkText,
  lookupCachedAudio,
  serviceClient,
  storeAudio,
  trackTTSUsage,
} from "../_shared/tts-cache.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice mappings by language - using ElevenLabs multilingual voices
const VOICES_BY_LANGUAGE: Record<string, { host1: string; host2: string }> = {
  en: {
    host1: "CwhRBWXzGAHq8TQ4Fs17", // Roger - male, warm, conversational
    host2: "EXAVITQu4vr4xnSDxMaL", // Sarah - female, clear, engaging
  },
  hi: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel - supports Hindi via multilingual
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda - supports Hindi via multilingual
  },
  es: {
    host1: "TX3LPaxmHKxFdv7VOQHJ", // Liam
    host2: "cgSgspJ2msm6clMCkdW9", // Jessica
  },
  fr: {
    host1: "TX3LPaxmHKxFdv7VOQHJ", // Liam
    host2: "EXAVITQu4vr4xnSDxMaL", // Sarah
  },
  de: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  pt: {
    host1: "TX3LPaxmHKxFdv7VOQHJ", // Liam
    host2: "cgSgspJ2msm6clMCkdW9", // Jessica
  },
  ja: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  zh: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  ko: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  ar: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  ta: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  te: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  bn: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
};

interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
}

interface TTSRequest {
  segments: PodcastSegment[];
  batchSize?: number;
  language?: string;
  host1VoiceId?: string; // Custom voice ID for host1
  host2VoiceId?: string; // Custom voice ID for host2
  host1KokoroVoice?: string; // Optional Kokoro voice pack override
  host2KokoroVoice?: string;
}

// Hard caps: one request must stay well inside the edge function time budget.
const MAX_SEGMENTS_PER_REQUEST = 8;
const ELEVENLABS_CONCURRENCY = 2;
const ELEVENLABS_BATCH_GAP_MS = 350;
// Kokoro is our own box — it can take more parallel work than the ElevenLabs plan allows.
const KOKORO_CONCURRENCY = 4;
const KOKORO_BATCH_GAP_MS = 50;

// Get model based on language - use multilingual for non-English
// Clean emotion tags from text before sending to TTS
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\s*\([a-zA-Z]+\)\s*$/g, '')     // End: " (enthusiastic)"
    .replace(/\s*\([a-zA-Z]+\)\s*/g, ' ')     // Middle: "(curious) "
    .replace(/\s+/g, ' ')                      // Normalize whitespace
    .trim();
}

function getModelForLanguage(language: string): string {
  return language === "en" ? "eleven_turbo_v2_5" : "eleven_multilingual_v2";
}

/**
 * Scripts have shipped speaker values like "Host 1", "host_2", or a host name.
 * Anything unrecognised must still resolve to a real voice — an undefined voice id
 * is what produced the ElevenLabs 404 "voice_not_found" failures.
 */
function normalizeSpeaker(raw: unknown): "host1" | "host2" {
  const value = String(raw ?? "").toLowerCase();
  return /(^|[^0-9])2([^0-9]|$)|host_?b|guest/.test(value) ? "host2" : "host1";
}

/** "en-US" and unknown codes both resolve to a supported voice pack. */
function normalizeLanguage(raw: unknown): string {
  const base = String(raw ?? "en").toLowerCase().split(/[-_]/)[0];
  return VOICES_BY_LANGUAGE[base] ? base : "en";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const { data: allowed, error: rateLimitError } = await supabase.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "elevenlabs-podcast-tts",
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Deno.env.get("OPENROUTER_API_KEY") && !Deno.env.get("ELEVENLABS_API_KEY")) {
      throw new Error("No TTS engine configured (set OPENROUTER_API_KEY or ELEVENLABS_API_KEY)");
    }

    const {
      segments,
      language: rawLanguage = "en",
      host1VoiceId,
      host2VoiceId,
      host1KokoroVoice,
      host2KokoroVoice,
    }: TTSRequest = await req.json();

    const language = normalizeLanguage(rawLanguage);

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Segments array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (segments.length > MAX_SEGMENTS_PER_REQUEST) {
      return new Response(
        JSON.stringify({
          error: `Too many segments in one request (${segments.length}). Send at most ${MAX_SEGMENTS_PER_REQUEST} per call.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service-role client for uploading generated audio to storage
    const storageClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Generating audio for ${segments.length} segments in language: ${language}`);

    // Get voice mapping for the language (fallback defaults)
    const defaultVoices = VOICES_BY_LANGUAGE[language] || VOICES_BY_LANGUAGE.en;
    
    // Use custom voice IDs if provided, otherwise use language defaults
    const voices = {
      host1: host1VoiceId || defaultVoices.host1,
      host2: host2VoiceId || defaultVoices.host2,
    };
    
    const modelId = getModelForLanguage(language);

    console.log(`Using model: ${modelId}, voices: host1=${voices.host1}, host2=${voices.host2}`);

    // Process segments in small batches to respect ElevenLabs concurrency limits
    const results: {
      index: number;
      audioUrl: string | null;
      storagePath?: string | null;
      status?: "completed" | "failed" | "unsupported";
      errorCode?: string;
      engine?: "kokoro" | "elevenlabs" | "cache";
      fallbackReason?: string;
      error?: string;
    }[] = [];

    const useKokoro = kokoroSupportsLanguage(language) && (await kokoroAvailable());
    // Neither provider can serve this language/config — fail fast with a clear reason
    // instead of burning one doomed provider call per segment.
    if (!useKokoro && !elevenLabsHealthy()) {
      const reason = elevenLabsBreakerReason();
      return new Response(
        JSON.stringify({
          error: kokoroSupportsLanguage(language)
            ? "Professional voice generation is temporarily unavailable."
            : "Professional voice generation is currently unavailable for this language.",
          errorCode: kokoroSupportsLanguage(language) ? "no_provider_available" : "language_unsupported",
          providerDetail: reason || "No healthy provider for this language",
          segments: segments.map((s) => ({
            ...s,
            audioUrl: null,
            storagePath: null,
            status: "unsupported",
            audioError: "No configured voice provider supports this language.",
          })),
          stats: { total: segments.length, success: 0, failed: segments.length },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const concurrency = useKokoro ? KOKORO_CONCURRENCY : ELEVENLABS_CONCURRENCY;
    const batchGapMs = useKokoro ? KOKORO_BATCH_GAP_MS : ELEVENLABS_BATCH_GAP_MS;

    for (let i = 0; i < segments.length; i += concurrency) {
      const batch = segments.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (segment, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const speaker = normalizeSpeaker(segment.speaker);
          const voiceId = voices[speaker] || VOICES_BY_LANGUAGE.en[speaker];
          const cleanedText = cleanTextForSpeech(segment.text);
          if (!cleanedText) {
            return { index: globalIndex, audioUrl: null, error: "Empty segment text" };
          }

          const kokoroVoice = speaker === "host1" ? host1KokoroVoice : host2KokoroVoice;
          const { contentHash, textHash, normalized } = await cacheHashes({
            text: cleanedText,
            voice: `${speaker}:${kokoroVoice ?? "default"}:${voiceId}`,
            speed: 1,
            model: `podcast:${language}`,
          });

          // Identical narration is never regenerated.
          const cachedAudio = await lookupCachedAudio(storageClient, contentHash);
          if (cachedAudio) {
            await trackTTSUsage(storageClient, {
              userId: user.id,
              feature: "podcast",
              provider: cachedAudio.provider,
              characters: normalized.length,
              cacheHit: true,
            });
            return {
              index: globalIndex,
              audioUrl: cachedAudio.audioUrl,
              storagePath: cachedAudio.storagePath,
              status: "completed" as const,
              engine: "cache" as const,
            };
          }

          // Long turns are split on sentence boundaries so no word is ever cut.
          const parts = chunkText(normalized, 1800);
          const buffers: Uint8Array[] = [];
          let engine: "kokoro" | "elevenlabs" = "kokoro";
          let fallbackReason: string | undefined;
          let model = "";

          for (const part of parts) {
            const tts = await synthesizeSpeech({
              text: part,
              role: speaker,
              language,
              elevenLabsVoiceId: voiceId,
              elevenLabsModelId: modelId,
              kokoroVoice,
              kokoroFormat: "mp3",
              // Keep the whole batch inside the edge function's wall clock.
              kokoroTimeoutMs: 20_000,
            });
            buffers.push(tts.bytes);
            engine = tts.engine;
            model = tts.model;
            if (tts.fallbackReason) fallbackReason = tts.fallbackReason;
          }

          const totalBytes = buffers.reduce((n, b) => n + b.byteLength, 0);
          const audioBytes = new Uint8Array(totalBytes);
          let offset = 0;
          for (const b of buffers) { audioBytes.set(b, offset); offset += b.byteLength; }

          const { audioUrl, storagePath } = await storeAudio(storageClient, {
            contentHash,
            textHash,
            voice: engine === "kokoro" ? (kokoroVoice ?? segment.speaker) : voiceId,
            speed: 1,
            model: `podcast:${language}`,
            provider: engine === "kokoro" ? "openrouter" : "elevenlabs",
            bytes: audioBytes,
            contentType: "audio/mpeg",
            charCount: normalized.length,
            extension: "mp3",
          });

          await trackTTSUsage(storageClient, {
            userId: user.id,
            feature: "podcast",
            provider: engine === "kokoro" ? "openrouter" : "elevenlabs",
            model: engine === "kokoro" ? KOKORO_MODEL : model,
            voice: engine === "kokoro" ? (kokoroVoice ?? segment.speaker) : voiceId,
            characters: normalized.length,
            cacheHit: false,
            requests: parts.length,
          });

          return {
            index: globalIndex,
            audioUrl,
            storagePath,
            status: "completed" as const,
            engine,
            fallbackReason,
          };
        } catch (error) {
          console.error(`Error generating audio for segment ${globalIndex}:`, error);
          const structured = error instanceof TTSUnavailableError ? error : null;
          return {
            index: globalIndex,
            audioUrl: null,
            storagePath: null,
            status: (structured?.code === "language_unsupported" ? "unsupported" : "failed") as
              | "failed"
              | "unsupported",
            errorCode: structured?.code ?? "tts_failed",
            error: structured?.userMessage ?? (error instanceof Error ? error.message : "Unknown error"),
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + concurrency < segments.length) {
        await new Promise(resolve => setTimeout(resolve, batchGapMs));
      }
    }

    // Sort results by index to maintain order
    results.sort((a, b) => a.index - b.index);

    // Build response with audio data
    const audioSegments = segments.map((segment, index) => {
      const result = results.find(r => r.index === index);
      return {
        ...segment,
        audioUrl: result?.audioUrl || null,
        storagePath: result?.storagePath || null,
        status: result?.status || "failed",
        errorCode: result?.errorCode || null,
        audioError: result?.error || null,
        engine: result?.engine || null,
        engineFallbackReason: result?.fallbackReason || null,
      };
    });

    const successCount = audioSegments.filter(s => s.audioUrl).length;
    console.log(`Generated ${successCount}/${segments.length} audio segments successfully`);

    return new Response(
      JSON.stringify({ 
        segments: audioSegments,
        stats: {
          total: segments.length,
          success: successCount,
          failed: segments.length - successCount,
          kokoro: audioSegments.filter(s => s.engine === "kokoro").length,
          cached: audioSegments.filter(s => s.engine === "cache").length,
          elevenlabs: audioSegments.filter(s => s.engine === "elevenlabs").length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in elevenlabs-podcast-tts:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate podcast audio" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
