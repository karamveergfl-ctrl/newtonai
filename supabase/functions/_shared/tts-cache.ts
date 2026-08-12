// Deterministic audio cache + usage tracking shared by every TTS entry point.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const TTS_CACHE_BUCKET = "tts-cache";
export const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year — podcast episodes are persisted

// Kokoro via OpenRouter is billed per character; keep a conservative estimate.
const USD_PER_1K_CHARS: Record<string, number> = {
  openrouter: 0.00008,
  elevenlabs: 0.00018,
};

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function normalizeText(text: string): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface CacheKey {
  text: string;
  voice: string;
  speed: number;
  model: string;
}

export async function cacheHashes(key: CacheKey) {
  const norm = normalizeText(key.text);
  const textHash = await sha256(norm);
  const contentHash = await sha256(`${key.model}|${key.voice}|${key.speed}|${norm}`);
  return { textHash, contentHash, normalized: norm };
}

export interface CachedAudio {
  audioUrl: string;
  storagePath: string;
  provider: string;
}

/** Returns a signed URL when this exact text+voice+speed+model was already generated. */
export async function lookupCachedAudio(
  db: SupabaseClient,
  contentHash: string,
): Promise<CachedAudio | null> {
  const { data } = await db
    .from("tts_audio_cache")
    .select("storage_path, provider, hit_count")
    .eq("content_hash", contentHash)
    .eq("status", "ready")
    .maybeSingle();

  if (!data?.storage_path) return null;

  const { data: signed } = await db.storage
    .from(TTS_CACHE_BUCKET)
    .createSignedUrl(data.storage_path, SIGNED_URL_TTL);
  if (!signed?.signedUrl) return null;

  await db
    .from("tts_audio_cache")
    .update({ hit_count: (data.hit_count ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq("content_hash", contentHash);

  return { audioUrl: signed.signedUrl, storagePath: data.storage_path, provider: data.provider };
}

export interface StoreArgs {
  contentHash: string;
  textHash: string;
  voice: string;
  speed: number;
  model: string;
  provider: string;
  bytes: Uint8Array;
  contentType: string;
  charCount: number;
  extension: string;
}

/** Uploads generated audio and records it in tts_audio_cache. Returns a signed URL. */
export async function storeAudio(db: SupabaseClient, args: StoreArgs): Promise<string> {
  const path = `${args.contentHash}.${args.extension}`;

  const { error: uploadError } = await db.storage
    .from(TTS_CACHE_BUCKET)
    .upload(path, args.bytes, { contentType: args.contentType, upsert: true });
  if (uploadError) throw new Error(`Audio cache upload failed: ${uploadError.message}`);

  await db.from("tts_audio_cache").upsert(
    {
      content_hash: args.contentHash,
      text_hash: args.textHash,
      voice: args.voice,
      speed: args.speed,
      model: args.model,
      storage_path: path,
      provider: args.provider,
      status: "ready",
      char_count: args.charCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "content_hash" },
  );

  const { data: signed, error: signError } = await db.storage
    .from(TTS_CACHE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !signed?.signedUrl) {
    throw new Error(`Could not sign audio URL: ${signError?.message ?? "unknown error"}`);
  }
  return signed.signedUrl;
}

export interface UsageArgs {
  userId: string;
  feature: string;
  provider: string;
  model?: string;
  voice?: string;
  characters: number;
  cacheHit: boolean;
  requests?: number;
}

/** Fire-and-forget usage log. Never blocks or fails audio delivery. */
export async function trackTTSUsage(db: SupabaseClient, args: UsageArgs): Promise<void> {
  try {
    const rate = USD_PER_1K_CHARS[args.provider] ?? 0;
    await db.from("tts_usage_events").insert({
      user_id: args.userId,
      feature: args.feature,
      provider: args.provider,
      model: args.model ?? null,
      voice: args.voice ?? null,
      characters: args.characters,
      requests: args.requests ?? 1,
      cache_hit: args.cacheHit,
      estimated_cost_usd: args.cacheHit ? 0 : (args.characters / 1000) * rate,
    });
  } catch (err) {
    console.error("[tts] usage tracking failed:", err);
  }
}

/**
 * Split long text into provider-safe chunks without ever cutting a word.
 * Sentence boundaries first, then word boundaries as a last resort.
 */
export function chunkText(text: string, maxChars = 1800): string[] {
  const clean = normalizeText(text);
  if (clean.length <= maxChars) return clean ? [clean] : [];

  const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) ?? [clean];
  const chunks: string[] = [];
  let current = "";

  const pushWords = (sentence: string) => {
    let line = "";
    for (const word of sentence.split(" ")) {
      if ((line + " " + word).trim().length > maxChars) {
        if (line) chunks.push(line.trim());
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) current = line;
  };

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current) { chunks.push(current.trim()); current = ""; }
      pushWords(sentence);
      continue;
    }
    if ((current + sentence).length > maxChars) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}
