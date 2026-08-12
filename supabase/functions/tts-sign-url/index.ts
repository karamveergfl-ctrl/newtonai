// Issues fresh signed URLs for audio objects already persisted in the tts-cache bucket.
// The durable identity of podcast audio is the storage path — signed URLs are disposable.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serviceClient, signStoragePath, TTS_CACHE_BUCKET } from "../_shared/tts-cache.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const paths: unknown = body?.paths;
    if (!Array.isArray(paths) || paths.length === 0 || paths.length > 100) {
      return json({ error: "Provide 1-100 storage paths." }, 400);
    }

    // Only flat content-hash object names live in this bucket — reject traversal.
    const safe = paths.filter(
      (p): p is string => typeof p === "string" && /^[a-f0-9]{16,64}\.(mp3|wav|pcm)$/.test(p),
    );

    const db = serviceClient();
    const urls: Record<string, string | null> = {};

    for (const path of safe) {
      const { data: exists } = await db.storage
        .from(TTS_CACHE_BUCKET)
        .list("", { search: path, limit: 1 });
      if (!exists?.length) { urls[path] = null; continue; }
      urls[path] = await signStoragePath(db, path);
    }

    return json({ urls });
  } catch (error) {
    console.error("tts-sign-url error:", error);
    return json({ error: "Could not refresh audio links." }, 500);
  }
});
