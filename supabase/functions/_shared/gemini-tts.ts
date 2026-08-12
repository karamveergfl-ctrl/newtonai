// Google Gemini text-to-speech through the Lovable AI Gateway.
// No Google Cloud project or provider key is needed — the gateway bills Lovable credits.

export const GEMINI_TTS_MODEL = "google/gemini-2.5-flash-tts";
const GATEWAY_TTS_URL = "https://ai.gateway.lovable.dev/v1/audio/speech";

/** Gemini prebuilt voices used per podcast/tutor role. */
export const GEMINI_VOICES = {
  host1: "Kore",   // warm, firm female host
  host2: "Puck",   // upbeat male co-host
  tutor: "Charon", // calm, informative narrator
} as const;

export type GeminiRole = keyof typeof GEMINI_VOICES;

export interface GeminiTTSResult {
  /** Playable WAV (24kHz, 16-bit, mono). */
  bytes: Uint8Array;
  /** Raw PCM body, so several chunks can be concatenated under one WAV header. */
  pcm: Uint8Array;
  contentType: string;
  model: string;
  voice: string;
}

export class GeminiTTSError extends Error {
  status: number;
  transient: boolean;
  userMessage: string;
  constructor(message: string, status: number, userMessage: string, transient: boolean) {
    super(message);
    this.name = "GeminiTTSError";
    this.status = status;
    this.userMessage = userMessage;
    this.transient = transient;
  }
}

export function geminiTTSConfigured(): boolean {
  return !!Deno.env.get("LOVABLE_API_KEY");
}

export function geminiVoiceFor(role: GeminiRole, override?: string): string {
  return override || GEMINI_VOICES[role] || GEMINI_VOICES.tutor;
}

function describe(status: number): { msg: string; transient: boolean } {
  switch (status) {
    case 400:
      return { msg: "The voice request was rejected as invalid.", transient: false };
    case 402:
      return { msg: "The AI workspace is out of credits.", transient: false };
    case 403:
      return { msg: "AI voice generation is disabled for this workspace.", transient: false };
    case 404:
      return { msg: "Text-to-speech is not enabled for this workspace.", transient: false };
    case 429:
      return { msg: "Voice generation is rate limited right now. Please retry shortly.", transient: true };
    default:
      if (status >= 500) return { msg: "The voice provider is temporarily unavailable.", transient: true };
      return { msg: `Voice generation failed (${status}).`, transient: false };
  }
}

/** 24kHz, 16-bit, mono WAV container around raw PCM. */
export function pcmToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const out = new Uint8Array(44 + pcm.byteLength);
  const view = new DataView(out.buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, 1, true);         // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  out.set(pcm, 44);
  return out;
}

export function concatPcmToWav(chunks: Uint8Array[], sampleRate = 24000): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.byteLength; }
  return pcmToWav(merged, sampleRate);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function callOnce(opts: {
  text: string;
  voice: string;
  instructions?: string;
  signal?: AbortSignal;
}): Promise<GeminiTTSResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new GeminiTTSError("LOVABLE_API_KEY missing", 500, "Voice generation is not configured.", false);
  }

  const prompt = opts.instructions ? `${opts.instructions}: ${opts.text}` : opts.text;

  const res = await fetch(GATEWAY_TTS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GEMINI_TTS_MODEL,
      stream_format: "sse",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: opts.voice } },
        },
      },
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    const { msg, transient } = describe(res.status);
    console.error(`[gemini-tts] gateway ${res.status}: ${body.slice(0, 300)}`);
    throw new GeminiTTSError(`Gemini TTS ${res.status}`, res.status, msg, transient);
  }

  const parts: Uint8Array[] = [];
  let done = false;
  let buffer = "";
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { value, done: finished } = await reader.read();
    if (finished) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payloadText = trimmed.slice(5).trim();
      if (!payloadText || payloadText === "[DONE]") continue;
      let payload: { type?: string; audio?: string };
      try { payload = JSON.parse(payloadText); } catch { continue; }
      if (payload.type === "speech.audio.delta" && payload.audio) parts.push(base64ToBytes(payload.audio));
      if (payload.type === "speech.audio.done") done = true;
    }
  }

  if (!done || parts.length === 0) {
    throw new GeminiTTSError("Incomplete Gemini audio stream", 502, "The voice provider returned no audio.", true);
  }

  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const pcm = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { pcm.set(p, offset); offset += p.byteLength; }

  return {
    bytes: pcmToWav(pcm),
    pcm,
    contentType: "audio/wav",
    model: GEMINI_TTS_MODEL,
    voice: opts.voice,
  };
}

/** Generate Gemini audio, retrying only transient failures. */
export async function geminiSynthesize(
  opts: { text: string; voice: string; instructions?: string; signal?: AbortSignal },
  { retries = 1 }: { retries?: number } = {},
): Promise<GeminiTTSResult> {
  const text = (opts.text ?? "").trim();
  if (!text) throw new GeminiTTSError("Empty text", 400, "There is no text to read aloud.", false);

  let lastError: GeminiTTSError | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callOnce({ ...opts, text });
    } catch (err) {
      lastError = err instanceof GeminiTTSError
        ? err
        : new GeminiTTSError(String(err), 503, "Could not reach the voice provider.", true);
      if (!lastError.transient || attempt === retries) break;
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastError ?? new GeminiTTSError("Gemini TTS failed", 500, "Voice generation failed.", false);
}
