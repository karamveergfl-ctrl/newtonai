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

    // Generate ONE similar practice problem with COMPLETE physics diagram
    const problemsPrompt = `Based on this topic: "${topic}"

Generate exactly 1 similar practice problem. Include:

1. A clear problem statement with specific numerical values
2. A COMPLETE ASCII LINE DIAGRAM showing ALL elements clearly:
   - Objects (blocks, balls, wedges, pulleys, etc.)
   - Surfaces (horizontal, inclined planes, walls, curves)
   - Forces with arrows and labels (P→, W=500N, N↑, f←)
   - Angles with degree marks (30°, 45°, θ)
   - Friction coefficients (μₛ=0.25, μₖ=0.20)
   - Dimensions and measurements
3. Given values and what to find

FORMAT EXACTLY LIKE THIS EXAMPLE:

---

## 🎯 Practice Problem

**Problem:** Determine the range of values of P for which equilibrium of the block shown is maintained.

**Diagram:**
\`\`\`
                              μₛ = 0.25
                              μₖ = 0.20
        _______________          ↘
       /               \\          30°
      /                 \\      ___↘____
     |                   |    /        |
     |    CURVED         |   /   P →   |  ← Block on incline
     |    SURFACE        |  /    ◼     |
      \\                 / /      |     |
       \\_______________ /        |     |
                       ⌞_________|_____|
                                 ↓
                              W = 500 N
\`\`\`

**Given:**
- Weight of block: $W = 500\\,\\text{N}$
- Angle of incline: $\\theta = 30°$
- Static friction coefficient: $\\mu_s = 0.25$
- Kinetic friction coefficient: $\\mu_k = 0.20$

**Find:** Range of force $P$ for equilibrium

---

CRITICAL RULES FOR DIAGRAM:
- Draw COMPLETE shapes (blocks as rectangles ◼ or [===], surfaces as lines)
- Show ALL forces with arrows: → ← ↑ ↓ ↗ ↘ ↙ ↖
- Label forces with values (500 N, P, N, f)
- Show angles clearly with degree symbol (30°, 45°)
- Include friction coefficients near the surface (μₛ=0.25)
- Use box characters: ┌ ┐ └ ┘ │ ─ ┬ ┴ ├ ┤ ┼
- Use special symbols: ◼ ● ○ ▲ ▼ ◀ ▶ ⌐ ⌞ ⌝ ⌜
- Make diagram 10-15 lines for complete representation
- Every element from the problem must appear in diagram`;

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

    // Search YouTube for similar problems (filter out Shorts)
    let videos: { id: string; title: string; thumbnail: string; channelTitle: string; videoId: string }[] = [];
    
    if (YOUTUBE_API_KEY) {
      const youtubeUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      youtubeUrl.searchParams.set("part", "snippet");
      youtubeUrl.searchParams.set("q", searchQuery + " -shorts");
      youtubeUrl.searchParams.set("type", "video");
      youtubeUrl.searchParams.set("maxResults", "12");
      youtubeUrl.searchParams.set("key", YOUTUBE_API_KEY);
      youtubeUrl.searchParams.set("videoDuration", "medium");
      youtubeUrl.searchParams.set("relevanceLanguage", "en");

      const ytResponse = await fetch(youtubeUrl.toString());
      
      if (ytResponse.ok) {
        const ytData = await ytResponse.json();
        videos = (ytData.items || [])
          .filter((item: {
            id: { videoId: string };
            snippet: {
              title: string;
              thumbnails: { medium: { url: string } };
              channelTitle: string;
            };
          }) => {
            const title = item.snippet.title.toLowerCase();
            // Filter out shorts by checking title patterns
            const isShort = title.includes('#shorts') || 
                           title.includes('#short') || 
                           title.includes('| shorts') ||
                           title.includes('(shorts)') ||
                           title.endsWith(' shorts') ||
                           title.includes('youtube shorts');
            return !isShort;
          })
          .slice(0, 6)
          .map((item: {
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
          }));
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
