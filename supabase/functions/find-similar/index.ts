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

    // Generate ONE similar practice problem with SVG diagram
    const problemsPrompt = `Based on this topic: "${topic}"

Generate exactly 1 similar practice problem with a clean SVG diagram.

FORMAT EXACTLY LIKE THIS:

---

## 🎯 Practice Problem

**Problem:** [Clear problem statement with specific numerical values]

**Diagram:**
<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="currentColor"/>
    </marker>
  </defs>
  <!-- Example: Inclined plane with block -->
  <polygon points="50,240 350,240 350,80" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
  <rect x="200" y="130" width="50" height="35" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" transform="rotate(-25,225,147)"/>
  <line x1="225" y1="147" x2="225" y2="220" stroke="#22c55e" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="235" y="210" fill="#22c55e" font-size="12" font-weight="bold">W</text>
  <line x1="240" y1="140" x2="300" y2="115" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="305" y="112" fill="#ef4444" font-size="12" font-weight="bold">P</text>
  <path d="M310,240 A40,40 0 0,0 335,210" fill="none" stroke="#334155" stroke-width="1.5"/>
  <text x="320" y="225" fill="#334155" font-size="11">θ</text>
</svg>

**Given:**
- List all given values with LaTeX: $m = 10\\,\\text{kg}$
- Include angles, forces, coefficients

**Find:** What to calculate

---

SVG DIAGRAM RULES:
1. Use viewBox="0 0 400 280" for consistent sizing
2. Add style="background:#f8fafc" for light background
3. Include arrow marker in <defs> for force vectors
4. Draw objects:
   - Blocks: <rect> with fill="#3b82f6" (blue)
   - Surfaces: <polygon> or <line> with fill="#e2e8f0"
   - Circles: <circle> with appropriate fill
   - Pulleys: <circle> with stroke only
   - Ropes: <line> or <path> with stroke="#475569"
5. Force arrows with distinct colors:
   - Weight (green): fill="#22c55e"
   - Normal (purple): fill="#a855f7"  
   - Friction (orange): fill="#f97316"
   - Applied force (red): fill="#ef4444"
   - Tension (blue): fill="#0ea5e9"
6. Use <text> for labels with font-size="11" or "12"
7. Use <path> with A (arc) for angle arcs
8. Keep diagram clean and educational
9. Every element from problem MUST appear in SVG`;


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
