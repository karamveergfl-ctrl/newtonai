import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to extract transcript from YouTube using multiple strategies
async function getYouTubeTranscript(videoId: string): Promise<{ transcript: string; hasRealTranscript: boolean }> {
  // Try multiple user agents to avoid blocking
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  ];
  
  let html = '';
  let lastError: Error | null = null;
  
  // Try fetching with different user agents
  for (const userAgent of userAgents) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `https://www.youtube.com/watch?v=${videoId}`,
        {
          headers: {
            'User-Agent': userAgent,
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        html = await response.text();
        if (html.length > 1000) {
          console.log(`Successfully fetched page with user agent: ${userAgent.substring(0, 50)}...`);
          break;
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.log(`Fetch attempt failed: ${lastError.message}`);
    }
  }
  
  // If no HTML fetched, try oEmbed API for at least title/description
  if (!html || html.length < 1000) {
    console.log("Direct fetch failed, trying oEmbed API...");
    try {
      const oEmbedResponse = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (oEmbedResponse.ok) {
        const oEmbedData = await oEmbedResponse.json();
        const title = oEmbedData.title || '';
        
        if (title) {
          console.log(`Got title from oEmbed: ${title}`);
          return {
            transcript: `Video Title: ${title}\n\nNote: This video's captions are not available. The AI will generate content based on the title.`,
            hasRealTranscript: false
          };
        }
      }
    } catch (e) {
      console.log("oEmbed API also failed:", e);
    }
    
    throw new Error("Failed to fetch video page");
  }
  
  // Extract video title - try multiple patterns
  let videoTitle = "";
  const titlePatterns = [
    /"title":\s*{"runs":\s*\[{"text":\s*"([^"]+)"/,
    /"title":\s*"([^"]+)"/,
    /<meta\s+name="title"\s+content="([^"]+)"/,
    /<title>([^<]+)\s*-\s*YouTube<\/title>/,
    /"videoDetails".*?"title":\s*"([^"]+)"/,
  ];
  
  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].length > 5 && !match[1].match(/^\d+[KMB]?$/)) {
      videoTitle = match[1]
        .replace(/\\u[\dA-Fa-f]{4}/gi, m => String.fromCharCode(parseInt(m.slice(2), 16)))
        .replace(/\\n/g, ' ')
        .replace(/\+/g, ' ');
      break;
    }
  }
  
  // Extract video description - try multiple patterns
  let description = "";
  const descPatterns = [
    /"shortDescription":\s*"([^"]{20,})"/,
    /"description":\s*{"simpleText":\s*"([^"]+)"/,
    /<meta\s+name="description"\s+content="([^"]+)"/,
  ];
  
  for (const pattern of descPatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].length > 20) {
      description = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\u[\dA-Fa-f]{4}/gi, m => String.fromCharCode(parseInt(m.slice(2), 16)))
        .slice(0, 3000);
      break;
    }
  }
  
  console.log(`Video title: "${videoTitle}", description length: ${description.length}`);
  
  // Extract captions track URL from the page - try multiple patterns
  const captionPatterns = [
    /"captionTracks":\s*(\[.*?\])/,
    /"captions":\s*\{[^}]*"playerCaptionsTracklistRenderer":\s*\{[^}]*"captionTracks":\s*(\[.*?\])/,
  ];
  
  let captionsJson = null;
  for (const pattern of captionPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        captionsJson = JSON.parse(match[1]);
        break;
      } catch (e) {
        console.log("Failed to parse captions with pattern");
      }
    }
  }
  
  if (captionsJson && Array.isArray(captionsJson) && captionsJson.length > 0) {
    try {
      // Find English captions or first available
      const englishTrack = captionsJson.find((c: any) => 
        c.languageCode === 'en' || c.languageCode?.startsWith('en')
      ) || captionsJson[0];
      
      if (englishTrack?.baseUrl) {
        // Fetch the caption content
        const captionUrl = englishTrack.baseUrl.replace(/\\u0026/g, '&');
        console.log(`Fetching captions from: ${captionUrl.substring(0, 100)}...`);
        
        const captionResponse = await fetch(captionUrl);
        
        if (captionResponse.ok) {
          const captionXml = await captionResponse.text();
          
          // Parse XML and extract text
          const textMatches = captionXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
          const texts: string[] = [];
          
          for (const match of textMatches) {
            let text = match[1];
            // Decode HTML entities
            text = text.replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#39;/g, "'")
                       .replace(/&nbsp;/g, ' ')
                       .replace(/\n/g, ' ')
                       .trim();
            if (text) texts.push(text);
          }
          
          const transcript = texts.join(' ').trim();
          
          if (transcript && transcript.length > 50) {
            console.log(`Successfully extracted transcript: ${transcript.length} characters`);
            return { transcript, hasRealTranscript: true };
          }
        }
      }
    } catch (e) {
      console.log("Error processing captions:", e);
    }
  }
  
  // No captions available - return title and description as fallback
  console.log("No captions found, using video title and description as fallback");
  
  if (!videoTitle && !description) {
    return { 
      transcript: "", 
      hasRealTranscript: false 
    };
  }
  
  // Create content from title and description
  const content = `Video Title: ${videoTitle}\n\nVideo Description:\n${description}`.trim();
  
  // Only return as valid if we have meaningful content
  if (content.length < 50) {
    return { 
      transcript: "", 
      hasRealTranscript: false 
    };
  }
  
  return { 
    transcript: content, 
    hasRealTranscript: false 
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("Invalid or expired token:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (100 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'fetch-transcript',
      p_max_requests: 100,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { videoId, videoTitle } = await req.json();
    
    // Validate YouTube video ID format (11 characters, alphanumeric + - and _)
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid YouTube video ID format',
          success: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Fetching transcript for video: ${videoId}`);
    
    const { transcript, hasRealTranscript } = await getYouTubeTranscript(videoId);
    
    if (!transcript || transcript.length < 20) {
      return new Response(
        JSON.stringify({ 
          error: "This video doesn't have captions or a description available. Please try a video with captions enabled, or paste the content directly.",
          success: false,
          hasRealTranscript: false
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        transcript,
        videoId,
        hasRealTranscript,
        success: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in fetch-transcript:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to fetch transcript",
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
