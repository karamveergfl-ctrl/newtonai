import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Check rate limit (200 requests per hour for search)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: 'search-videos',
      p_max_requests: 200,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, maxResults = 6, pageToken } = await req.json();
    
    if (!query) {
      throw new Error('No search query provided');
    }

    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    // If no YouTube API key, return educational mock data
    if (!YOUTUBE_API_KEY) {
      console.log('No YouTube API key, returning mock educational videos');
      
      const mockVideos = [
        {
          id: 'dQw4w9WgXcQ',
          title: `${query} - Complete Tutorial`,
          thumbnail: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
          channelTitle: 'Education Channel',
          duration: '15:30',
          viewCount: '1.2M'
        },
        {
          id: 'jNQXAC9IVRw',
          title: `Understanding ${query} Step by Step`,
          thumbnail: `https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg`,
          channelTitle: 'Math & Science',
          duration: '12:45',
          viewCount: '890K'
        },
        {
          id: 'ZZ5LpwO-An4',
          title: `${query} Made Easy`,
          thumbnail: `https://i.ytimg.com/vi/ZZ5LpwO-An4/mqdefault.jpg`,
          channelTitle: 'Quick Learn',
          duration: '8:20',
          viewCount: '2.1M'
        }
      ];

      return new Response(
        JSON.stringify({ success: true, videos: mockVideos, nextPageToken: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching YouTube for:', query);

    // Search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', `${query} tutorial explanation`);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', String(maxResults));
    searchUrl.searchParams.set('relevanceLanguage', 'en');
    searchUrl.searchParams.set('safeSearch', 'strict');
    searchUrl.searchParams.set('videoDuration', 'medium');
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
    
    // Add pageToken for pagination
    if (pageToken) {
      searchUrl.searchParams.set('pageToken', pageToken);
    }

    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('YouTube search error:', errorText);
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    // Store next page token for pagination
    const nextPageToken = searchData.nextPageToken || null;
    
    if (!searchData.items || searchData.items.length === 0) {
      return new Response(
        JSON.stringify({ success: true, videos: [], nextPageToken: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get video details for duration
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.set('part', 'contentDetails,statistics');
    detailsUrl.searchParams.set('id', videoIds);
    detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    // Create a map of video details
    const detailsMap: Record<string, any> = {};
    if (detailsData.items) {
      detailsData.items.forEach((item: any) => {
        detailsMap[item.id] = {
          duration: formatDuration(item.contentDetails?.duration),
          viewCount: formatViewCount(item.statistics?.viewCount)
        };
      });
    }

    // Combine search results with details
    const videos = searchData.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      duration: detailsMap[item.id.videoId]?.duration || '',
      viewCount: detailsMap[item.id.videoId]?.viewCount || ''
    }));

    console.log('Found videos:', videos.length, 'Next page token:', nextPageToken ? 'available' : 'none');

    return new Response(
      JSON.stringify({ success: true, videos, nextPageToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Search videos error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        videos: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatDuration(duration: string): string {
  if (!duration) return '';
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatViewCount(count: string): string {
  if (!count) return '';
  
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return count;
}
