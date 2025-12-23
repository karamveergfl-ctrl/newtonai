import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = "all", pageToken } = await req.json();
    console.log("Searching YouTube for:", query, "type:", type, "pageToken:", pageToken);

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    // Build search query based on type - more specific to get relevant results
    let searchQuery = query;
    if (type === "animation") {
      // Focus on animated educational content for the specific topic
      searchQuery = `"${query}" animated explanation OR "${query}" animation tutorial OR "${query}" visual learning -shorts -music -gameplay -vlog`;
    } else if (type === "explanation") {
      // Focus on lecture/explanation content for the specific topic
      searchQuery = `"${query}" lecture OR "${query}" explained OR "${query}" tutorial full course -shorts -music -gameplay -vlog -animation`;
    } else {
      searchQuery = `"${query}" educational tutorial -shorts`;
    }

    // Fetch 15 results to have buffer after filtering shorts
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}&videoDefinition=high&videoDuration=medium&relevanceLanguage=en`;
    
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const searchResponse = await fetch(url);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("YouTube Search API error:", searchResponse.status, errorText);
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    // Filter out YouTube Shorts by title
    const filteredItems = (searchData.items || []).filter((item: any) => {
      const title = item.snippet.title.toLowerCase();
      const isShort = title.includes('#shorts') || 
                     title.includes('#short') || 
                     title.includes('| shorts') ||
                     title.includes('(shorts)') ||
                     title.endsWith(' shorts') ||
                     title.includes('youtube shorts');
      return !isShort;
    }).slice(0, 10); // Take top 10

    // Get video IDs for detailed info (duration, view count)
    const videoIds = filteredItems.map((item: any) => item.id.videoId).join(',');
    
    if (!videoIds) {
      return new Response(
        JSON.stringify({ 
          videos: [], 
          nextPageToken: searchData.nextPageToken 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch video details (duration, view count)
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!detailsResponse.ok) {
      console.error("YouTube Videos API error:", detailsResponse.status);
      // Return videos without duration/views if details fetch fails
      const videos = filteredItems.map((item: any) => ({
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
      }));

      return new Response(
        JSON.stringify({ 
          videos, 
          nextPageToken: searchData.nextPageToken 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const detailsData = await detailsResponse.json();
    
    // Create a map of video details
    const detailsMap = new Map();
    (detailsData.items || []).forEach((item: any) => {
      detailsMap.set(item.id, {
        duration: item.contentDetails?.duration,
        viewCount: item.statistics?.viewCount,
      });
    });

    // Merge search results with details
    const videos = filteredItems.map((item: any) => {
      const details = detailsMap.get(item.id.videoId) || {};
      return {
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        duration: details.duration,
        viewCount: details.viewCount,
      };
    });

    console.log("Found videos:", videos.length, "with details");

    return new Response(
      JSON.stringify({ 
        videos, 
        nextPageToken: searchData.nextPageToken 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error searching YouTube:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
