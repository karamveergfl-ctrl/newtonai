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
    const { topic, problemType } = await req.json();
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not configured");
    }

    console.log("Finding similar questions for topic:", topic);

    // Use AI to generate a better search query
    let searchQuery = `${topic} practice problems solved`;
    
    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "Generate a YouTube search query to find similar practice problems. Return ONLY the search query, nothing else."
              },
              {
                role: "user",
                content: `Topic: ${topic}\nProblem type: ${problemType || "general"}\n\nGenerate a search query to find similar practice problems with solutions on YouTube.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          searchQuery = data.choices?.[0]?.message?.content?.trim() || searchQuery;
        }
      } catch (e) {
        console.error("AI search query generation failed:", e);
      }
    }

    // Search YouTube for similar problems
    const youtubeUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    youtubeUrl.searchParams.set("part", "snippet");
    youtubeUrl.searchParams.set("q", searchQuery);
    youtubeUrl.searchParams.set("type", "video");
    youtubeUrl.searchParams.set("maxResults", "8");
    youtubeUrl.searchParams.set("key", YOUTUBE_API_KEY);
    youtubeUrl.searchParams.set("videoDuration", "medium");
    youtubeUrl.searchParams.set("relevanceLanguage", "en");

    const ytResponse = await fetch(youtubeUrl.toString());
    
    if (!ytResponse.ok) {
      throw new Error(`YouTube API error: ${ytResponse.status}`);
    }

    const ytData = await ytResponse.json();
    
    const videos = ytData.items?.map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        thumbnails: { medium: { url: string } };
        channelTitle: string;
      };
    }) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      videoId: item.id.videoId,
    })) || [];

    return new Response(JSON.stringify({ 
      videos,
      searchQuery,
      topic
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in find-similar:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
