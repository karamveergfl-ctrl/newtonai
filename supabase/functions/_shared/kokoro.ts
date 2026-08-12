// Kokoro TTS client — talks to the self-hosted Kokoro FastAPI server.
// The app never runs the model itself; it only calls this HTTP API.

export interface KokoroRequest {
  text: string;
  voice: string;
  speed?: number;
  format?: "mp3" | "wav";
  signal?: AbortSignal;
}

export interface KokoroResult {
  bytes: Uint8Array;
  contentType: string;
}

const DEFAULT_PATHS = ["/v1/tts", "/api/v1/tts"];

export function kokoroConfigured(): boolean {
  return !!Deno.env.get("KOKORO_TTS_URL");
}

function baseUrl(): string {
  const raw = Deno.env.get("KOKORO_TTS_URL") ?? "";
  return raw.replace(/\/+$/, "");
}

function authHeaders(): Record<string, string> {
  const token = Deno.env.get("KOKORO_TTS_TOKEN");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Simple reachability probe so a dead box fails over instantly instead of per-request. */
export async function kokoroHealthy(timeoutMs = 2500): Promise<boolean> {
  if (!kokoroConfigured()) return false;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl()}/health`, {
      headers: authHeaders(),
      signal: ctl.signal,
    });
    return res.ok;
  } catch {
    // No /health route is not fatal — let the actual TTS call decide.
    return true;
  } finally {
    clearTimeout(timer);
  }
}

async function callOnce(path: string, req: KokoroRequest, timeoutMs: number): Promise<KokoroResult> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  if (req.signal) {
    req.signal.addEventListener("abort", () => ctl.abort(), { once: true });
  }
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg, audio/wav",
        ...authHeaders(),
      },
      body: JSON.stringify({
        text: req.text,
        voice: req.voice,
        speed: req.speed ?? 1.0,
        format: req.format ?? "mp3",
      }),
      signal: ctl.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Kokoro TTS error ${res.status}: ${body.slice(0, 200)}`);
    }

    const contentType = res.headers.get("content-type") ?? "audio/mpeg";
    if (contentType.includes("application/json")) {
      throw new Error("Kokoro returned JSON instead of audio bytes");
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 512) {
      throw new Error("Kokoro returned an empty audio payload");
    }
    return { bytes: buf, contentType };
  } finally {
    clearTimeout(timer);
  }
}

/** Generate audio from Kokoro, trying the common endpoint paths and retrying once. */
export async function kokoroSynthesize(
  req: KokoroRequest,
  { timeoutMs = 45_000, retries = 1 }: { timeoutMs?: number; retries?: number } = {},
): Promise<KokoroResult> {
  if (!kokoroConfigured()) {
    throw new Error("KOKORO_TTS_URL is not configured");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const path of DEFAULT_PATHS) {
      try {
        return await callOnce(path, req, timeoutMs);
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        // A 404 means the path is wrong — try the next known path immediately.
        if (!msg.includes("404")) break;
      }
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, 400));
  }
  throw lastError instanceof Error ? lastError : new Error("Kokoro TTS failed");
}

/** Streaming variant for latency-sensitive callers (voice tutor). */
export async function kokoroStream(
  req: KokoroRequest,
  timeoutMs = 8000,
): Promise<Response> {
  if (!kokoroConfigured()) throw new Error("KOKORO_TTS_URL is not configured");
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl()}/v1/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        ...authHeaders(),
      },
      body: JSON.stringify({
        text: req.text,
        voice: req.voice,
        speed: req.speed ?? 1.0,
        format: req.format ?? "mp3",
        stream: true,
      }),
      signal: ctl.signal,
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      throw new Error(`Kokoro stream error ${res.status}: ${body.slice(0, 200)}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}
