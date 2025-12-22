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
    const { imageData } = await req.json();
    console.log("Analyzing screenshot with Gemini 2.5 Pro");

    if (!imageData) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Analyze screenshot directly with Gemini 2.5 Pro - single call for solution and topic
    console.log("Sending image to Gemini 2.5 Pro for analysis...");
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Solve this numerical problem by carefully analyzing the diagram, figure, and text given in the image.

INSTRUCTIONS:
1. First line of your response MUST be: "TOPIC: [specific topic name for YouTube search, e.g., "projectile motion problem", "RC circuit analysis", "beam bending calculation"]"

2. Then provide your response in this EXACT format:

## 📊 Figure Analysis

Describe the diagram/figure in detail:
- What physical setup is shown (e.g., inclined plane, circuit, beam, projectile path)
- Label and identify all objects, forces, angles, dimensions visible
- Explain what each symbol/arrow/line represents
- Note any initial conditions or constraints shown

## 📝 Step-by-Step Solution

**Given:** Extract ALL values using LaTeX notation:
- $v_0 = 20 \\, \\text{m/s}$ (initial velocity)
- $\\theta = 30°$ (angle of projection)
- List every value from the image

**Find:** What exactly needs to be calculated

### Step 1: Understanding & Setup
Explain the physics/math concept. Write the relevant formulas:
$$F = ma$$
$$v = u + at$$

### Step 2: Substituting Values
Show substitution with LaTeX:
$$v_x = v_0 \\cos\\theta = 20 \\times \\cos(30°)$$
$$v_x = 20 \\times 0.866 = 17.32 \\, \\text{m/s}$$

### Step 3: Calculations
Continue with detailed mathematical working. Show ALL intermediate steps:
$$s = ut + \\frac{1}{2}at^2$$

### Step 4: [Additional Steps as needed]
Continue solving until you reach the answer.

---

**✅ Final Answer:**
$$\\boxed{x = 35.3 \\, \\text{m}}$$

State the result clearly with proper units and significant figures.

IMPORTANT FORMATTING RULES:
- Use $...$ for inline math (e.g., $v = 20 \\, \\text{m/s}$)
- Use $$...$$ for display equations on their own line
- Use \\frac{a}{b} for fractions, \\sqrt{x} for roots
- Use \\text{} for units inside math: $F = 10 \\, \\text{N}$
- Use \\boxed{} for final answers
- Be extremely thorough - analyze every detail in the diagram`
              },
              {
                type: "image_url",
                image_url: { url: imageData }
              }
            ]
          }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Gemini API error:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const fullResponse = analysisData.choices[0].message.content;
    console.log("Received analysis from Gemini");

    // Extract topic from first line and solution from rest
    const lines = fullResponse.split('\n');
    let topic = "Problem Solution";
    let solution = fullResponse;
    
    if (lines[0].startsWith("TOPIC:")) {
      topic = lines[0].replace("TOPIC:", "").trim();
      solution = lines.slice(1).join('\n').trim();
    }
    
    console.log("Extracted topic:", topic);

    // Search YouTube for related videos
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    // Search for exact video solutions matching the problem type
    const searchQuery = `${topic} solved numerical problem step by step solution`;
    console.log("Searching YouTube for exact video solution:", searchQuery);
    
    const youtubeResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}&videoDefinition=high&relevanceLanguage=en&safeSearch=strict&order=relevance`
    );

    if (!youtubeResponse.ok) {
      const errorText = await youtubeResponse.text();
      console.error("YouTube API error:", youtubeResponse.status, errorText);
      throw new Error(`YouTube API error: ${youtubeResponse.status}`);
    }

    const youtubeData = await youtubeResponse.json();
    
    const explanationVideos = (youtubeData.items || [])
      .filter((item: any) => {
        const title = item.snippet.title.toLowerCase();
        const topicWords = topic.toLowerCase().split(' ');
        return topicWords.some((word: string) => word.length > 3 && title.includes(word));
      })
      .map((item: any) => ({
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      }));

    console.log("Found videos:", explanationVideos.length);

    return new Response(
      JSON.stringify({ 
        topic, 
        animationVideos: [],
        explanationVideos,
        solution,
        description: null,
        isQuestion: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
