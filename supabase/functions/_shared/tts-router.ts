// Shared TTS router: Kokoro first (self-hosted, free), ElevenLabs as automatic fallback.
import { kokoroConfigured, kokoroHealthy, kokoroSynthesize } from "./kokoro.ts";

export type TTSEngine = "kokoro" | "elevenlabs";
export type TTSRole = "host1" | "host2" | "tutor";

export interface TTSResult {
  bytes: Uint8Array;
  contentType: string;
  engine: TTSEngine;
  /** Present when Kokoro was skipped or failed and ElevenLabs handled the request. */
  fallbackReason?: string;
}

// Kokoro voice packs. host1 = warm female, host2 = male, tutor = calm male.
const KOKORO_VOICES: Record<TTSRole, string> = {
  host1: "af_heart",
  host2: "am_michael",
  tutor: "am_michael",
};

// Kokoro's public voice packs are English-first; other languages stay on ElevenLabs multilingual.
const KOKORO_LANGUAGES = new Set(["en"]);

export function kokoroVoiceFor(role: TTSRole, override?: string): string {
  return override || KOKORO_VOICES[role];
}

export function kokoroSupportsLanguage(language: string): boolean {
  return KOKORO_LANGUAGES.has((language || "en").toLowerCase().split("-")[0]);
}

export function describeElevenLabsError(status: number, body: string): string {
  switch (status) {
    case 401:
      return "ElevenLabs authentication failed (401) — the API key is invalid, revoked, or the connector was unlinked.";
    case 402:
      return "ElevenLabs quota exhausted (402) — the account is out of character credits.";
    case 422:
      return `ElevenLabs rejected the request (422) — likely an invalid voice ID or empty text. ${body.slice(0, 200)}`;
    case 429:
      return "ElevenLabs rate/concurrency limit hit (429) — too many simultaneous requests for this plan.";
    default:
      return `ElevenLabs API error ${status}: ${body.slice(0, 200)}`;
  }
}

export async function elevenLabsSynthesize(opts: {
  text: string;
  voiceId: string;
  modelId: string;
  outputFormat?: string;
  voiceSettings?: Record<string, unknown>;
}): Promise<Uint8Array> {
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${opts.voiceId}?output_format=${opts.outputFormat ?? "mp3_44100_128"}`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: opts.text,
        model_id: opts.modelId,
        voice_settings: opts.voiceSettings ?? {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(describeElevenLabsError(res.status, body));
  }
  return new Uint8Array(await res.arrayBuffer());
}

// Cached health probe so one dead box doesn't cost every segment a timeout.
let healthCheckedAt = 0;
let healthy = false;
const HEALTH_TTL_MS = 60_000;

export async function kokoroAvailable(): Promise<boolean> {
  if (!kokoroConfigured()) return false;
  const now = Date.now();
  if (now - healthCheckedAt < HEALTH_TTL_MS) return healthy;
  healthy = await kokoroHealthy();
  healthCheckedAt = now;
  return healthy;
}

export function markKokoroDown() {
  healthy = false;
  healthCheckedAt = Date.now();
}

export interface SynthesizeOptions {
  text: string;
  role: TTSRole;
  language?: string;
  /** ElevenLabs fallback voice for this role. */
  elevenLabsVoiceId: string;
  elevenLabsModelId: string;
  kokoroVoice?: string;
  speed?: number;
  outputFormat?: string;
  voiceSettings?: Record<string, unknown>;
}

/** Kokoro-first synthesis with automatic ElevenLabs fallback. */
export async function synthesizeSpeech(opts: SynthesizeOptions): Promise<TTSResult> {
  const language = opts.language ?? "en";
  let fallbackReason: string | undefined;

  if (!kokoroConfigured()) {
    fallbackReason = "Kokoro server is not configured";
  } else if (!kokoroSupportsLanguage(language)) {
    fallbackReason = `Kokoro has no voice pack for "${language}"`;
  } else if (!(await kokoroAvailable())) {
    fallbackReason = "Kokoro server health check failed";
  } else {
    const started = Date.now();
    try {
      const result = await kokoroSynthesize({
        text: opts.text,
        voice: kokoroVoiceFor(opts.role, opts.kokoroVoice),
        speed: opts.speed ?? 1.0,
        format: "mp3",
      });
      console.log(`[tts] kokoro ok role=${opts.role} ${result.bytes.byteLength}B in ${Date.now() - started}ms`);
      return { bytes: result.bytes, contentType: result.contentType, engine: "kokoro" };
    } catch (err) {
      markKokoroDown();
      fallbackReason = err instanceof Error ? err.message : "Kokoro request failed";
      console.error(`[tts] kokoro failed, falling back: ${fallbackReason}`);
    }
  }

  const started = Date.now();
  const bytes = await elevenLabsSynthesize({
    text: opts.text,
    voiceId: opts.elevenLabsVoiceId,
    modelId: opts.elevenLabsModelId,
    outputFormat: opts.outputFormat,
    voiceSettings: opts.voiceSettings,
  });
  console.log(`[tts] elevenlabs ok role=${opts.role} ${bytes.byteLength}B in ${Date.now() - started}ms (${fallbackReason})`);
  return { bytes, contentType: "audio/mpeg", engine: "elevenlabs", fallbackReason };
}
