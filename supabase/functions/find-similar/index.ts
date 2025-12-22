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
    const { topic, problemType, currentSolution } = await req.json();
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Finding similar questions for topic:", topic);

    // Generate similar practice problems using AI
    const problemsPrompt = `Based on this topic: "${topic}"

Generate 3 similar practice problems that a student can solve. For each problem:
1. Create a clear problem statement with specific numerical values
2. If the problem involves a diagram/figure, describe it in detail using ASCII art or describe what should be drawn
3. Include all necessary given information

Format your response EXACTLY like this:

## Similar Problem 1
**Problem:** [Clear problem statement with numbers]

**Figure Description:**
\`\`\`
[ASCII diagram or description of what to draw]
\`\`\`

**Given:**
- [List given values]

---

## Similar Problem 2
**Problem:** [Clear problem statement with numbers]

**Figure Description:**
\`\`\`
[ASCII diagram or description]
\`\`\`

**Given:**
- [List given values]

---

## Similar Problem 3
**Problem:** [Clear problem statement with numbers]

**Figure Description:**
\`\`\`
[ASCII diagram or description]
\`\`\`

**Given:**
- [List given values]

Make the problems progressively harder. Use LaTeX for math: $formula$ for inline, $$formula$$ for block.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert physics/math teacher who creates practice problems. Always include clear diagrams described in ASCII art when relevant. Make problems realistic with specific numbers."
          },
          {
            role: "user",
            content: problemsPrompt
          }
        ],
      }),
    });

    let similarProblems = "";
    if (aiResponse.ok) {
      const data = await aiResponse.json();
      similarProblems = data.choices?.[0]?.message?.content || "";
    } else {
      console.error("AI response error:", await aiResponse.text());
    }

    // Generate search query for YouTube
    let searchQuery = `${topic} practice problems solved`;
    
    try {
      const queryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Topic: ${topic}\nProblem type: ${problemType || "general"}\n\nGenerate a search query to find similar practice problems with step-by-step solutions on YouTube.`
            }
          ],
        }),
      });

      if (queryResponse.ok) {
        const data = await queryResponse.json();
        searchQuery = data.choices?.[0]?.message?.content?.trim() || searchQuery;
      }
    } catch (e) {
      console.error("AI search query generation failed:", e);
    }

    // Search YouTube for similar problems
    let videos: { id: string; title: string; thumbnail: string; channelTitle: string; videoId: string }[] = [];
    
    if (YOUTUBE_API_KEY) {
      const youtubeUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      youtubeUrl.searchParams.set("part", "snippet");
      youtubeUrl.searchParams.set("q", searchQuery);
      youtubeUrl.searchParams.set("type", "video");
      youtubeUrl.searchParams.set("maxResults", "6");
      youtubeUrl.searchParams.set("key", YOUTUBE_API_KEY);
      youtubeUrl.searchParams.set("videoDuration", "medium");
      youtubeUrl.searchParams.set("relevanceLanguage", "en");

      const ytResponse = await fetch(youtubeUrl.toString());
      
      if (ytResponse.ok) {
        const ytData = await ytResponse.json();
        videos = ytData.items?.map((item: {
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
      }
    }

    return new Response(JSON.stringify({ 
      videos,
      similarProblems,
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
