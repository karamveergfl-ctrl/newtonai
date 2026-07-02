import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

// Fetches a YouTube Data API URL, automatically falling back to a secondary
// API key when the primary hits quota (403 quotaExceeded / dailyLimitExceeded).
async function fetchYouTube(urlWithoutKey: string): Promise<Response> {
  const primary = Deno.env.get("YOUTUBE_API_KEY");
  const secondary = Deno.env.get("YOUTUBE_API_KEY_2");
  if (!primary && !secondary) throw new Error("YOUTUBE_API_KEY not configured");
  const sep = urlWithoutKey.includes("?") ? "&" : "?";
  const call = (k: string) => fetch(`${urlWithoutKey}${sep}key=${k}`);
  const keys = [primary, secondary].filter(Boolean) as string[];
  let last: Response | null = null;
  for (let i = 0; i < keys.length; i++) {
    const res = await call(keys[i]);
    if (res.ok) return res;
    if ((res.status === 403 || res.status === 429) && i < keys.length - 1) {
      const body = await res.clone().text();
      if (/quota|rateLimit|dailyLimit/i.test(body)) {
        console.warn(`[youtube] key #${i + 1} quota hit, falling back`);
        last = res;
        continue;
      }
    }
    return res;
  }
  return last as Response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Check rate limit (200 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'search-youtube',
      p_max_requests: 200,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { query, type = "all", pageToken } = await req.json();
    if (!Deno.env.get("YOUTUBE_API_KEY") && !Deno.env.get("YOUTUBE_API_KEY_2")) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    // Service-role client for cache table access (bypasses RLS)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const normalizedQuery = String(query || '').trim().toLowerCase();
    const cacheKey = `${normalizedQuery}|${type}|${pageToken || 'none'}`;

    // 1) Cache lookup
    const { data: cached } = await adminClient
      .from('youtube_search_cache')
      .select('videos, next_page_token, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
      return new Response(
        JSON.stringify({ videos: cached.videos, nextPageToken: cached.next_page_token, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchQuery = type === "animation" ? `"${query}" animated explanation -shorts` : type === "explanation" ? `"${query}" lecture explained -shorts` : `"${query}" educational -shorts`;
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${encodeURIComponent(searchQuery)}&type=video&videoDefinition=high&videoDuration=medium`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const searchResponse = await fetchYouTube(url);

    // Quota exceeded — fall back to stale cache if available
    if (searchResponse.status === 403) {
      const errText = await searchResponse.text();
      const isQuota = errText.includes('quotaExceeded') || errText.includes('quota');
      if (isQuota && cached) {
        return new Response(
          JSON.stringify({ videos: cached.videos, nextPageToken: cached.next_page_token, cached: true, stale: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (isQuota) {
        return new Response(
          JSON.stringify({ videos: [], nextPageToken: null, quotaExceeded: true, error: 'YouTube search is temporarily unavailable. Please try again in a few hours.' }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`YouTube API error: 403 ${errText}`);
    }

    if (!searchResponse.ok) throw new Error(`YouTube API error: ${searchResponse.status}`);
    const searchData = await searchResponse.json();

    const filteredItems = (searchData.items || []).filter((item: any) => { const t = item.snippet.title.toLowerCase(); return !t.includes('#shorts') && !t.includes('| shorts'); });
    const videoIds = filteredItems.map((item: any) => item.id.videoId).join(',');
    if (!videoIds) {
      const empty = { videos: [], nextPageToken: searchData.nextPageToken || null };
      await adminClient.from('youtube_search_cache').upsert({
        cache_key: cacheKey,
        videos: [],
        next_page_token: empty.nextPageToken,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });
      return new Response(JSON.stringify(empty), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const detailsResponse = await fetchYouTube(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}`);
    const detailsMap = new Map();
    if (detailsResponse.ok) { (await detailsResponse.json()).items?.forEach((i: any) => detailsMap.set(i.id, { duration: i.contentDetails?.duration, viewCount: i.statistics?.viewCount })); }

    const videos = filteredItems.map((item: any) => ({ id: item.id.videoId, videoId: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.medium?.url, channelTitle: item.snippet.channelTitle, ...detailsMap.get(item.id.videoId) }));
    const nextPageToken = searchData.nextPageToken || null;

    // Write to cache (fire-and-forget-ish)
    await adminClient.from('youtube_search_cache').upsert({
      cache_key: cacheKey,
      videos,
      next_page_token: nextPageToken,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify({ videos, nextPageToken }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) { console.error("Error:", error); return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
});
