import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to extract transcript from YouTube
async function getYouTubeTranscript(videoId: string): Promise<{ transcript: string; hasRealTranscript: boolean }> {
  try {
    // Try to get transcript using YouTube's timedtext API
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch video page");
    }
    
    const html = await response.text();
    
    // Extract video title
    const titleMatch = html.match(/"title":"([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
    const videoTitle = titleMatch ? titleMatch[1].replace(/\\u[\dA-F]{4}/gi, match => 
      String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
    ) : "";
    
    // Extract video description
    const descMatch = html.match(/"shortDescription":"([^"]+)"/);
    const description = descMatch ? descMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\u[\dA-F]{4}/gi, match => 
        String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
      ).slice(0, 3000) : "";
    
    // Extract captions track URL from the page
    const captionMatch = html.match(/"captionTracks":\s*\[(.*?)\]/);
    
    if (captionMatch) {
      try {
        // Parse caption tracks
        const captionsJson = `[${captionMatch[1]}]`;
        const captions = JSON.parse(captionsJson);
        
        // Find English captions or first available
        const englishTrack = captions.find((c: any) => 
          c.languageCode === 'en' || c.languageCode?.startsWith('en')
        ) || captions[0];
        
        if (englishTrack?.baseUrl) {
          // Fetch the caption content
          const captionUrl = englishTrack.baseUrl.replace(/\\u0026/g, '&');
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
                         .replace(/\n/g, ' ');
              texts.push(text);
            }
            
            const transcript = texts.join(' ').trim();
            
            if (transcript && transcript.length > 50) {
              console.log(`Extracted transcript: ${transcript.length} characters`);
              return { transcript, hasRealTranscript: true };
            }
          }
        }
      } catch (e) {
        console.log("Error parsing captions:", e);
      }
    }
    
    // No captions available - return title and description with a clear message
    console.log("No captions found, using video title and description");
    
    if (!videoTitle && !description) {
      return { 
        transcript: "", 
        hasRealTranscript: false 
      };
    }
    
    // Create a more useful content from title and description
    const content = `Video Title: ${videoTitle}\n\nVideo Description:\n${description}`.trim();
    
    return { 
      transcript: content, 
      hasRealTranscript: false 
    };
    
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
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
    
    if (!videoId) {
      throw new Error("videoId is required");
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
