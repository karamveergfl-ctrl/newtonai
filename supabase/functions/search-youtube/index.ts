import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

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
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY not configured");

    let searchQuery = type === "animation" ? `"${query}" animated explanation -shorts` : type === "explanation" ? `"${query}" lecture explained -shorts` : `"${query}" educational -shorts`;
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}&videoDefinition=high&videoDuration=medium`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const searchResponse = await fetch(url);
    if (!searchResponse.ok) throw new Error(`YouTube API error: ${searchResponse.status}`);
    const searchData = await searchResponse.json();
    
    const filteredItems = (searchData.items || []).filter((item: any) => { const t = item.snippet.title.toLowerCase(); return !t.includes('#shorts') && !t.includes('| shorts'); }).slice(0, 10);
    const videoIds = filteredItems.map((item: any) => item.id.videoId).join(',');
    if (!videoIds) return new Response(JSON.stringify({ videos: [], nextPageToken: searchData.nextPageToken }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const detailsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`);
    const detailsMap = new Map();
    if (detailsResponse.ok) { (await detailsResponse.json()).items?.forEach((i: any) => detailsMap.set(i.id, { duration: i.contentDetails?.duration, viewCount: i.statistics?.viewCount })); }

    const videos = filteredItems.map((item: any) => ({ id: item.id.videoId, videoId: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.medium?.url, channelTitle: item.snippet.channelTitle, ...detailsMap.get(item.id.videoId) }));
    return new Response(JSON.stringify({ videos, nextPageToken: searchData.nextPageToken }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) { console.error("Error:", error); return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
});
