import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, resolveBoard, serviceClient } from "../_shared/smartboard-auth.ts";

const CACHE_TTL_HOURS = 48;

async function fetchYouTube(urlWithoutKey: string): Promise<Response> {
  const keys = [
    Deno.env.get("YOUTUBE_API_KEY"),
    Deno.env.get("YOUTUBE_API_KEY_2"),
    Deno.env.get("YOUTUBE_API_KEY_3"),
  ].filter(Boolean) as string[];
  if (keys.length === 0) throw new Error("YOUTUBE_API_KEY not configured");

  const sep = urlWithoutKey.includes("?") ? "&" : "?";
  let last: Response | null = null;
  for (let i = 0; i < keys.length; i++) {
    const res = await fetch(`${urlWithoutKey}${sep}key=${keys[i]}`);
    if (res.ok) return res;
    if ((res.status === 403 || res.status === 429) && i < keys.length - 1) {
      const text = await res.clone().text();
      if (/quota|rateLimit|dailyLimit/i.test(text)) {
        console.warn(`[smartboard-video-search] key #${i + 1} quota hit, falling back`);
        last = res;
        continue;
      }
    }
    return res;
  }
  return last as Response;
}

function formatDuration(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0"), min = parseInt(m[2] || "0"), s = parseInt(m[3] || "0");
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

function formatViewCount(count?: string): string {
  const n = parseInt(count || "0");
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K views`;
  return `${n} views`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawQuery = typeof body.query === "string" ? body.query.trim().slice(0, 200) : "";
    const limit = Math.min(Math.max(Number(body.limit) || 12, 1), 12);
    const action = body.action === "select_text" ? "select_text" : "search";

    if (!rawQuery) {
      return json({ success: false, error: "invalid_query", message: "Please enter a topic to search." }, 400);
    }

    const supabase = serviceClient();
    const auth = await resolveBoard(supabase, body.deviceToken);
    if (!auth.ok) {
      return json({ success: false, error: auth.error, message: auth.message }, auth.status);
    }

    const cacheKey = `sb:${rawQuery.toLowerCase()}:${limit}`;
    const nowIso = new Date().toISOString();

    const { data: cached } = await supabase
      .from("youtube_search_cache")
      .select("videos, expires_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", nowIso)
      .maybeSingle();

    let videos = cached?.videos as unknown[] | undefined;

    if (!videos) {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("q", `${rawQuery} explained animation educational school`);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("videoEmbeddable", "true");
      searchUrl.searchParams.set("safeSearch", "strict");
      searchUrl.searchParams.set("maxResults", String(limit));
      searchUrl.searchParams.set("relevanceLanguage", "en");
      searchUrl.searchParams.set("order", "relevance");

      const searchRes = await fetchYouTube(searchUrl.toString());
      if (!searchRes.ok) {
        console.error("[smartboard-video-search] youtube error", searchRes.status, await searchRes.text());
        return json({
          success: false,
          error: "youtube_unavailable",
          message: "Video search is temporarily unavailable. Please try again in a few minutes.",
          videos: [],
        }, 503);
      }

      const searchData = await searchRes.json();
      // deno-lint-ignore no-explicit-any
      const items: any[] = searchData.items ?? [];

      if (items.length === 0) {
        videos = [];
      } else {
        const ids = items.map((i) => i.id?.videoId).filter(Boolean).join(",");
        const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
        detailsUrl.searchParams.set("part", "contentDetails,statistics");
        detailsUrl.searchParams.set("id", ids);

        // deno-lint-ignore no-explicit-any
        const detailsMap = new Map<string, any>();
        try {
          const detailsRes = await fetchYouTube(detailsUrl.toString());
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            // deno-lint-ignore no-explicit-any
            (detailsData.items ?? []).forEach((d: any) => detailsMap.set(d.id, d));
          }
        } catch (e) {
          console.warn("[smartboard-video-search] details fetch failed", e);
        }

        videos = items.map((item) => {
          const d = detailsMap.get(item.id.videoId);
          return {
            id: item.id.videoId,
            title: item.snippet?.title ?? "",
            channel: item.snippet?.channelTitle ?? "",
            thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? "",
            duration: formatDuration(d?.contentDetails?.duration),
            viewCount: formatViewCount(d?.statistics?.viewCount),
            definition: d?.contentDetails?.definition ?? "",
          };
        });
      }

      await supabase.from("youtube_search_cache").upsert({
        cache_key: cacheKey,
        videos,
        expires_at: new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString(),
      }, { onConflict: "cache_key" });
    }

    await supabase.from("sb_board_usage").insert({
      board_id: auth.board.boardId,
      institution_id: auth.board.institutionId,
      search_query: rawQuery,
      action,
    });

    await supabase
      .from("sb_boards")
      .update({ last_active_at: nowIso })
      .eq("id", auth.board.boardId);

    return json({ success: true, videos: videos ?? [] });
  } catch (e) {
    console.error("[smartboard-video-search] error", e);
    return json({
      success: false,
      error: "server_error",
      message: "Video search is temporarily unavailable. Please try again in a few minutes.",
      videos: [],
    }, 500);
  }
});