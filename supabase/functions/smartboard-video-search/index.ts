import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, resolveBoard, serviceClient } from "../_shared/smartboard-auth.ts";

const CACHE_TTL_HOURS = 48;

const ANIMATION_TERMS = [
  "animation", "animated", "3d", "2d", "visual", "visualized", "visualisation", "visualization",
  "simulation", "graphics", "motion", "explainer", "how it works", "working of",
];
const ANIMATION_CHANNELS = [
  "learn engineering", "lesics", "the engineers post", "kurzgesagt", "ted-ed", "amoeba sisters",
  "manocha academy", "sabin civil", "smart learning", "bozeman", "makemegenius", "peekaboo",
  "extraclass", "byju", "infinity learn", "vedantu", "magnet brains",
];
const STOP_WORDS = new Set(["the", "of", "and", "for", "with", "a", "an", "to", "in", "on", "is", "are"]);

const STOP_TERMS = ["#shorts", "full lecture", "one shot", "live class", "unacademy live", "webinar"];
// Strong signals that a result is a talking-head / handwritten lecture, not an animation.
const NON_ANIMATION_TERMS = [
  "full lecture", "numerical", "solved example", "question paper", "previous year",
  "handwritten", "notes pdf", "syllabus", "revision", "crash course", "doubt session",
];
const STRONG_ANIMATION_TERMS = [
  "animation", "animated", "3d", "2d", "simulation", "visualization", "visualisation",
  "motion graphics", "how it works", "working of",
];

function parseIsoSeconds(iso?: string): number {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] || "0") * 3600 + parseInt(m[2] || "0") * 60 + parseInt(m[3] || "0");
}

/** Scores a result on how animated and how on-topic it is. */
function scoreVideo(
  v: { title: string; channel: string; description: string; seconds: number },
  queryTerms: string[],
) {
  const title = v.title.toLowerCase();
  const desc = v.description.toLowerCase();
  const channel = v.channel.toLowerCase();
  const haystack = `${title} ${desc} ${channel}`;

  let animation = 0;
  for (const term of ANIMATION_TERMS) {
    if (title.includes(term)) animation += 3;
    else if (haystack.includes(term)) animation += 1;
  }
  if (ANIMATION_CHANNELS.some((c) => channel.includes(c))) animation += 4;

  const matched = queryTerms.filter((t) => haystack.includes(t)).length;
  const relevance = queryTerms.length ? matched / queryTerms.length : 1;

  let penalty = 0;
  if (STOP_TERMS.some((t) => haystack.includes(t))) penalty += 6;
  if (v.seconds > 0 && v.seconds < 60) penalty += 6; // shorts
  if (v.seconds > 45 * 60) penalty += 4; // full lecture recordings

  return { animation, relevance, score: animation * 2 + relevance * 10 - penalty };
}

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
    const limit = Math.min(Math.max(Number(body.limit) || 6, 1), 20);
    const action = body.action === "select_text" ? "select_text" : "search";

    if (!rawQuery) {
      return json({ success: false, error: "invalid_query", message: "Please enter a topic to search." }, 400);
    }

    const supabase = serviceClient();
    const auth = await resolveBoard(supabase, body.deviceToken);
    if (!auth.ok) {
      return json({ success: false, error: auth.error, message: auth.message }, auth.status);
    }

    // Cache a larger ranked pool independent of the requested limit.
    const cacheKey = `sb-anim4:${rawQuery.toLowerCase()}`;
    const nowIso = new Date().toISOString();

    const { data: cached } = await supabase
      .from("youtube_search_cache")
      .select("videos, expires_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", nowIso)
      .maybeSingle();

    let videos = cached?.videos as unknown[] | undefined;

    if (!videos) {
      const buildUrl = (q: string) => {
        const u = new URL("https://www.googleapis.com/youtube/v3/search");
        u.searchParams.set("part", "snippet");
        u.searchParams.set("q", q);
        u.searchParams.set("type", "video");
        u.searchParams.set("videoEmbeddable", "true");
        u.searchParams.set("safeSearch", "strict");
        u.searchParams.set("maxResults", "25");
        u.searchParams.set("relevanceLanguage", "en");
        u.searchParams.set("order", "relevance");
        return u.toString();
      };

      // Two passes so niche topics still surface real animations.
      const [resA, resB, resC] = await Promise.all([
        fetchYouTube(buildUrl(`${rawQuery} animation animated 3d`)),
        fetchYouTube(buildUrl(`${rawQuery} animated explanation video`)),
        fetchYouTube(buildUrl(`${rawQuery} working principle visualization`)),
      ]);

      if (!resA.ok && !resB.ok && !resC.ok) {
        console.error("[smartboard-video-search] youtube error", resA.status, await resA.text());
        return json({
          success: false,
          error: "youtube_unavailable",
          message: "Video search is temporarily unavailable. Please try again in a few minutes.",
          videos: [],
        }, 503);
      }

      // deno-lint-ignore no-explicit-any
      const merged = new Map<string, any>();
      for (const res of [resA, resB, resC]) {
        if (!res.ok) continue;
        const d = await res.json();
        // deno-lint-ignore no-explicit-any
        for (const it of (d.items ?? []) as any[]) {
          const id = it.id?.videoId;
          if (id && !merged.has(id)) merged.set(id, it);
        }
      }
      // deno-lint-ignore no-explicit-any
      const items: any[] = [...merged.values()];

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

        const queryTerms = rawQuery
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

        const scored = items.map((item) => {
          const d = detailsMap.get(item.id.videoId);
          const seconds = parseIsoSeconds(d?.contentDetails?.duration);
          const base = {
            id: item.id.videoId,
            title: item.snippet?.title ?? "",
            channel: item.snippet?.channelTitle ?? "",
            thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? "",
            duration: formatDuration(d?.contentDetails?.duration),
            viewCount: formatViewCount(d?.statistics?.viewCount),
            definition: d?.contentDetails?.definition ?? "",
          };
          const rank = scoreVideo(
            {
              title: base.title,
              channel: base.channel,
              description: item.snippet?.description ?? "",
              seconds,
            },
            queryTerms,
          );
          const hay = `${base.title} ${base.channel}`.toLowerCase();
          const desc = (item.snippet?.description ?? "").toLowerCase();
          const strongAnimation =
            STRONG_ANIMATION_TERMS.some((t) => base.title.toLowerCase().includes(t)) ||
            ANIMATION_CHANNELS.some((c) => base.channel.toLowerCase().includes(c));
          const softAnimation =
            strongAnimation ||
            STRONG_ANIMATION_TERMS.some((t) => desc.includes(t)) ||
            rank.animation >= 2;
          const lectureLike = NON_ANIMATION_TERMS.some((t) => hay.includes(t));
          const tooLong = seconds > 30 * 60;
          return { base, ...rank, strongAnimation, softAnimation, lectureLike, tooLong, seconds };
        });

        // Graded tiers so niche topics still return something useful instead of an empty state.
        const notShort = (s: { seconds: number }) => s.seconds === 0 || s.seconds >= 60;
        const tiers = [
          scored.filter(
            (s) => s.strongAnimation && !s.lectureLike && !s.tooLong && s.relevance >= 0.5 && notShort(s),
          ),
          scored.filter((s) => s.strongAnimation && !s.tooLong && s.relevance >= 0.34 && notShort(s)),
          scored.filter((s) => s.softAnimation && !s.tooLong && s.relevance >= 0.34 && notShort(s)),
          scored.filter((s) => s.softAnimation && s.relevance > 0 && notShort(s)),
          scored.filter((s) => s.relevance >= 0.34 && notShort(s)),
        ];
        const pool = tiers.find((t) => t.length > 0) ?? [];

        videos = pool
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
          .map((s) => s.base);
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

    return json({ success: true, videos: (videos ?? []).slice(0, limit) });
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