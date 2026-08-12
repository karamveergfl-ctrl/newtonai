// Shared TTS router: Kokoro (via OpenRouter) first, ElevenLabs as optional fallback.
import { KOKORO_MODEL, KokoroError, kokoroConfigured, kokoroSynthesize } from "./kokoro.ts";

export type TTSEngine = "kokoro" | "elevenlabs";
export type TTSRole = "host1" | "host2" | "tutor";

export interface TTSResult {
  bytes: Uint8Array;
  contentType: string;
  engine: TTSEngine;
  model: string;
  voice: string;
  /** Present when Kokoro was skipped or failed and ElevenLabs handled the request. */
  fallbackReason?: string;
}

/** Structured, non-secret failure info surfaced to callers and the UI. */
export class TTSUnavailableError extends Error {
  code: string;
  permanent: boolean;
  userMessage: string;
  constructor(code: string, userMessage: string, permanent: boolean, detail?: string) {
    super(detail ?? userMessage);
    this.name = "TTSUnavailableError";
    this.code = code;
    this.permanent = permanent;
    this.userMessage = userMessage;
  }
}

// ElevenLabs circuit breaker: a permanent 401/402/404/422 must not be retried
// on every segment of a 44-segment podcast.
let elevenLabsBrokenUntil = 0;
let elevenLabsBrokenReason = "";
const ELEVENLABS_BREAK_MS = 10 * 60 * 1000;

// Kokoro (OpenRouter) is far cheaper but can be very slow to respond. If it blows the
// latency budget we route the rest of the batch to ElevenLabs instead of stalling.
let kokoroSlowUntil = 0;
let kokoroSlowReason = "";
const KOKORO_SLOW_BREAK_MS = 10 * 60 * 1000;

export function kokoroFast(): boolean {
  return Date.now() >= kokoroSlowUntil;
}

export function kokoroSlowReasonText(): string {
  return Date.now() < kokoroSlowUntil ? kokoroSlowReason : "";
}

export function elevenLabsHealthy(): boolean {
  return elevenLabsConfigured() && Date.now() >= elevenLabsBrokenUntil;
}

export function elevenLabsBreakerReason(): string {
  return Date.now() < elevenLabsBrokenUntil ? elevenLabsBrokenReason : "";
}

function tripElevenLabsBreaker(reason: string) {
  elevenLabsBrokenUntil = Date.now() + ELEVENLABS_BREAK_MS;
  elevenLabsBrokenReason = reason;
  console.error(`[tts] ElevenLabs marked unavailable for 10min: ${reason}`);
}

/** Permanent config faults — key, voice id, model, quota. */
function isPermanentElevenLabsStatus(status: number): boolean {
  return status === 400 || status === 401 || status === 402 || status === 403 ||
    status === 404 || status === 422;
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

/** Kokoro is available whenever the OpenRouter key is present — no server to health check. */
export async function kokoroAvailable(): Promise<boolean> {
  return kokoroConfigured();
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

export function elevenLabsConfigured(): boolean {
  return !!Deno.env.get("ELEVENLABS_API_KEY");
}

export async function elevenLabsSynthesize(opts: {
  text: string;
  voiceId: string;
  modelId: string;
  outputFormat?: string;
  voiceSettings?: Record<string, unknown>;
}): Promise<Uint8Array> {
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) {
    throw new TTSUnavailableError("elevenlabs_not_configured", "No professional voice provider is configured.", true);
  }

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
    const detail = describeElevenLabsError(res.status, body);
    const permanent = isPermanentElevenLabsStatus(res.status);
    if (permanent) tripElevenLabsBreaker(detail);
    throw new TTSUnavailableError(
      `elevenlabs_${res.status}`,
      permanent
        ? "The backup voice provider is misconfigured (invalid key or voice)."
        : "The backup voice provider is temporarily unavailable.",
      permanent,
      detail,
    );
  }
  return new Uint8Array(await res.arrayBuffer());
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
  /** Audio format requested from Kokoro. mp3 keeps the existing players happy. */
  kokoroFormat?: "mp3" | "wav";
  /** Latency budget for Kokoro before falling back (ms). */
  kokoroTimeoutMs?: number;
}

/** Kokoro-first synthesis with automatic ElevenLabs fallback on transient failures. */
export async function synthesizeSpeech(opts: SynthesizeOptions): Promise<TTSResult> {
  const language = opts.language ?? "en";
  const kokoroVoice = kokoroVoiceFor(opts.role, opts.kokoroVoice);
  let fallbackReason: string | undefined;

  if (!kokoroConfigured()) {
    fallbackReason = "Kokoro (OpenRouter) is not configured";
  } else if (!kokoroSupportsLanguage(language)) {
    fallbackReason = `Kokoro has no voice pack for "${language}"`;
  } else if (!kokoroFast() && elevenLabsHealthy()) {
    fallbackReason = kokoroSlowReasonText();
  } else {
    const started = Date.now();
    const budget = opts.kokoroTimeoutMs ?? 45_000;
    try {
      const result = await kokoroSynthesize({
        text: opts.text,
        voice: kokoroVoice,
        speed: opts.speed ?? 1,
        format: opts.kokoroFormat ?? "mp3",
      }, { timeoutMs: budget, retries: elevenLabsHealthy() ? 0 : 2 });
      console.log(`[tts] kokoro ok role=${opts.role} ${result.bytes.byteLength}B in ${Date.now() - started}ms`);
      if (Date.now() - started > budget * 0.8 && elevenLabsHealthy()) {
        kokoroSlowUntil = Date.now() + KOKORO_SLOW_BREAK_MS;
        kokoroSlowReason = `Kokoro responded in ${Date.now() - started}ms (over budget) — using ElevenLabs`;
        console.warn(`[tts] ${kokoroSlowReason}`);
      }
      return {
        bytes: result.bytes,
        contentType: result.contentType,
        engine: "kokoro",
        model: result.model,
        voice: result.voice,
      };
    } catch (err) {
      const kErr = err instanceof KokoroError ? err : null;
      fallbackReason = kErr?.userMessage ?? (err instanceof Error ? err.message : "Kokoro request failed");
      console.error(`[tts] kokoro failed: ${fallbackReason}`);
      if (kErr?.status === 408 && elevenLabsHealthy()) {
        kokoroSlowUntil = Date.now() + KOKORO_SLOW_BREAK_MS;
        kokoroSlowReason = "Kokoro timed out — using ElevenLabs for now";
      }
      // Non-transient config/input errors won't be fixed by ElevenLabs either,
      // but a provider outage should still produce audio.
      if (kErr && !kErr.transient && !elevenLabsConfigured()) throw kErr;
    }
  }

  if (!elevenLabsConfigured()) {
    throw new KokoroError(
      `No TTS engine available: ${fallbackReason}`,
      503,
      fallbackReason ?? "Voice generation is unavailable right now.",
      true,
    );
  }

  if (!elevenLabsHealthy()) {
    throw new TTSUnavailableError(
      "no_provider_available",
      kokoroSupportsLanguage(language)
        ? "Professional voice generation is temporarily unavailable."
        : `Professional voice generation is currently unavailable for this language.`,
      false,
      `kokoro: ${fallbackReason}; elevenlabs: ${elevenLabsBreakerReason()}`,
    );
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
  return {
    bytes,
    contentType: "audio/mpeg",
    engine: "elevenlabs",
    model: opts.elevenLabsModelId,
    voice: opts.elevenLabsVoiceId,
    fallbackReason,
  };
}

export { KOKORO_MODEL };
