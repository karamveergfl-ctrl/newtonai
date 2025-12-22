import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to extract transcript from YouTube
async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    // Try to get transcript using YouTube's timedtext API
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch video page");
    }
    
    const html = await response.text();
    
    // Extract captions track URL from the page
    const captionMatch = html.match(/"captionTracks":\s*\[(.*?)\]/);
    if (!captionMatch) {
      console.log("No captions found, using video title/description instead");
      
      // Extract video title and description as fallback
      const titleMatch = html.match(/"title":"([^"]+)"/);
      const descMatch = html.match(/"shortDescription":"([^"]+)"/);
      
      const title = titleMatch ? titleMatch[1] : "";
      const desc = descMatch ? descMatch[1].replace(/\\n/g, " ").slice(0, 1000) : "";
      
      return `Video Title: ${title}\n\nDescription: ${desc}`;
    }
    
    // Parse caption tracks
    const captionsJson = `[${captionMatch[1]}]`;
    const captions = JSON.parse(captionsJson);
    
    // Find English captions or first available
    const englishTrack = captions.find((c: any) => 
      c.languageCode === 'en' || c.languageCode?.startsWith('en')
    ) || captions[0];
    
    if (!englishTrack?.baseUrl) {
      throw new Error("No caption URL found");
    }
    
    // Fetch the caption content
    const captionUrl = englishTrack.baseUrl.replace(/\\u0026/g, '&');
    const captionResponse = await fetch(captionUrl);
    
    if (!captionResponse.ok) {
      throw new Error("Failed to fetch captions");
    }
    
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
    
    if (!transcript) {
      throw new Error("Empty transcript");
    }
    
    console.log(`Extracted transcript: ${transcript.length} characters`);
    return transcript;
    
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
    const { videoId, videoTitle } = await req.json();
    
    if (!videoId) {
      throw new Error("videoId is required");
    }
    
    console.log(`Fetching transcript for video: ${videoId}`);
    
    let transcript: string;
    
    try {
      transcript = await getYouTubeTranscript(videoId);
    } catch (error) {
      // Fallback: Use video title for generation if transcript not available
      console.log("Transcript not available, using video title as fallback");
      transcript = `Educational video about: ${videoTitle || videoId}. This video covers key concepts and explanations about the topic.`;
    }
    
    return new Response(
      JSON.stringify({ 
        transcript,
        videoId,
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
