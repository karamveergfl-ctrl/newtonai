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
    const { selectedText } = await req.json();
    console.log("Analyzing selected text:", selectedText);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use AI to extract the main topic from selected text
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert at identifying key topics and concepts. Extract the main topic or concept from the given text in 2-4 words. Return only the topic name, nothing else."
          },
          {
            role: "user",
            content: `Extract the main topic from this text: "${selectedText}"`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const topic = aiData.choices[0].message.content.trim();
    console.log("Extracted topic:", topic);

    // Search YouTube for the topic
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    // Search for animation videos - More specific query
    const animationQuery = `${topic} animated explanation visual learning`;
    const animationResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(animationQuery)}&type=video&key=${YOUTUBE_API_KEY}&videoDefinition=high&relevanceLanguage=en&safeSearch=strict&order=relevance`
    );

    if (!animationResponse.ok) {
      const errorText = await animationResponse.text();
      console.error("YouTube API error (animation):", animationResponse.status, errorText);
      throw new Error(`YouTube API error: ${animationResponse.status}`);
    }

    const animationData = await animationResponse.json();
    
    // Filter out unrelated videos by checking title relevance
    const animationVideos = (animationData.items || [])
      .filter((item: any) => {
        const title = item.snippet.title.toLowerCase();
        const topicWords = topic.toLowerCase().split(' ');
        // Ensure at least one topic word appears in the title
        return topicWords.some((word: string) => word.length > 3 && title.includes(word));
      })
      .map((item: any) => ({
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      }));

    // Search for explanation/theory videos - Focus on lectures and in-depth content
    const explanationQuery = `${topic} lecture professor theory explained tutorial course`;
    const explanationResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(explanationQuery)}&type=video&key=${YOUTUBE_API_KEY}&videoDefinition=high&videoDuration=medium&relevanceLanguage=en&safeSearch=strict&order=relevance`
    );

    if (!explanationResponse.ok) {
      const errorText = await explanationResponse.text();
      console.error("YouTube API error (explanation):", explanationResponse.status, errorText);
      throw new Error(`YouTube API error: ${explanationResponse.status}`);
    }

    const explanationData = await explanationResponse.json();
    
    // Filter for relevant explanation videos
    const explanationVideos = (explanationData.items || [])
      .filter((item: any) => {
        const title = item.snippet.title.toLowerCase();
        const topicWords = topic.toLowerCase().split(' ');
        // Ensure at least one topic word appears in the title
        return topicWords.some((word: string) => word.length > 3 && title.includes(word));
      })
      .map((item: any) => ({
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      }));

    console.log("Found animation videos:", animationVideos.length);
    console.log("Found explanation videos:", explanationVideos.length);

    return new Response(
      JSON.stringify({ 
        topic, 
        animationVideos,
        explanationVideos
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing text:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
