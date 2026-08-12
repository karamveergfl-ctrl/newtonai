// Kokoro TTS client — routed through OpenRouter's audio/speech endpoint.
// The OPENROUTER_API_KEY only ever lives here, server-side.

export const KOKORO_MODEL = "hexgrad/kokoro-82m";
export const OPENROUTER_TTS_URL = "https://openrouter.ai/api/v1/audio/speech";

export const DEFAULT_KOKORO_VOICE = "af_heart";

export type KokoroFormat = "wav" | "mp3" | "opus" | "flac" | "aac" | "pcm";

export interface KokoroRequest {
  text: string;
  voice?: string;
  speed?: number;
  format?: KokoroFormat;
  signal?: AbortSignal;
}

export interface KokoroResult {
  bytes: Uint8Array;
  contentType: string;
  model: string;
  voice: string;
}

/** Thrown for any Kokoro/OpenRouter failure. Never carries credentials. */
export class KokoroError extends Error {
  status: number;
  transient: boolean;
  userMessage: string;
  constructor(message: string, status: number, userMessage: string, transient: boolean) {
    super(message);
    this.name = "KokoroError";
    this.status = status;
    this.userMessage = userMessage;
    this.transient = transient;
  }
}

const CONTENT_TYPES: Record<KokoroFormat, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  opus: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  pcm: "audio/pcm",
};

export function kokoroConfigured(): boolean {
  return !!Deno.env.get("OPENROUTER_API_KEY");
}

function describe(status: number, body: string): { msg: string; transient: boolean } {
  // Never echo the raw body to the client — it can contain request headers.
  switch (status) {
    case 400:
      return { msg: "The voice request was rejected as invalid.", transient: false };
    case 401:
    case 403:
      return { msg: "Voice provider authentication failed. Please contact support.", transient: false };
    case 402:
      return { msg: "The voice provider account is out of credits.", transient: false };
    case 404:
      return { msg: "The Kokoro voice model is currently unavailable.", transient: true };
    case 408:
      return { msg: "The voice provider timed out. Please try again.", transient: true };
    case 429:
      return { msg: "Voice generation is rate limited right now. Please retry shortly.", transient: true };
    default:
      if (status >= 500) return { msg: "The voice provider is temporarily unavailable.", transient: true };
      return { msg: `Voice generation failed (${status}).`, transient: false };
  }
}

async function callOnce(req: KokoroRequest, timeoutMs: number): Promise<KokoroResult> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new KokoroError("OPENROUTER_API_KEY is not configured", 500, "Voice generation is not configured.", false);
  }

  const voice = req.voice || DEFAULT_KOKORO_VOICE;
  const format: KokoroFormat = req.format ?? "wav";
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  if (req.signal) req.signal.addEventListener("abort", () => ctl.abort(), { once: true });

  try {
    const res = await fetch(OPENROUTER_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://newtonai.site",
        "X-Title": "NewtonAI",
      },
      body: JSON.stringify({
        model: KOKORO_MODEL,
        input: req.text,
        voice,
        speed: req.speed ?? 1,
        response_format: format,
      }),
      signal: ctl.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const { msg, transient } = describe(res.status, body);
      console.error(`[kokoro] OpenRouter ${res.status}: ${body.slice(0, 300)}`);
      throw new KokoroError(`OpenRouter TTS ${res.status}`, res.status, msg, transient);
    }

    const contentType = res.headers.get("content-type") ?? CONTENT_TYPES[format];
    if (contentType.includes("application/json")) {
      const json = await res.text().catch(() => "");
      console.error(`[kokoro] JSON instead of audio: ${json.slice(0, 300)}`);
      throw new KokoroError("Malformed provider response", 502, "The voice provider returned no audio.", true);
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength < 512) {
      throw new KokoroError("Empty audio payload", 502, "The voice provider returned empty audio.", true);
    }
    return { bytes, contentType, model: KOKORO_MODEL, voice };
  } catch (err) {
    if (err instanceof KokoroError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new KokoroError("Kokoro request timed out", 408, "Voice generation timed out. Please try again.", true);
    }
    throw new KokoroError(
      err instanceof Error ? err.message : "Kokoro request failed",
      503,
      "Could not reach the voice provider.",
      true,
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Generate Kokoro audio with exponential backoff on transient errors only. */
export async function kokoroSynthesize(
  req: KokoroRequest,
  { timeoutMs = 45_000, retries = 2 }: { timeoutMs?: number; retries?: number } = {},
): Promise<KokoroResult> {
  const text = (req.text ?? "").trim();
  if (!text) {
    throw new KokoroError("Empty text", 400, "There is no text to read aloud.", false);
  }

  let lastError: KokoroError | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callOnce({ ...req, text }, timeoutMs);
    } catch (err) {
      lastError = err instanceof KokoroError
        ? err
        : new KokoroError(String(err), 500, "Voice generation failed.", false);
      if (!lastError.transient || attempt === retries) break;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt) + Math.random() * 200));
    }
  }
  throw lastError ?? new KokoroError("Kokoro TTS failed", 500, "Voice generation failed.", false);
}
