import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing screenshot with Gemini Pro Vision...");

    // Extract base64 data from data URL
    const base64Data = imageData.includes(",") 
      ? imageData.split(",")[1] 
      : imageData;

    // Use Gemini Pro for vision analysis - best accuracy for problem solving
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert tutor and problem solver. When shown an image:

1. First, carefully analyze what's in the image (text, diagrams, equations, problems, etc.)
2. If it contains a problem, question, or exercise:
   - Solve it step-by-step with complete accuracy
   - Show all your work clearly
   - Explain each step so a student can understand
   - Provide the final answer clearly marked
3. If it's an informational image or diagram:
   - Explain what it shows
   - Highlight key concepts
   - Provide relevant context

Format your response with clear headings and structure. Use mathematical notation where appropriate.
Be thorough, accurate, and educational in your response.

IMPORTANT: At the very end of your response, add a line in this exact format:
[SEARCH_TOPIC]: <short search query for finding related educational videos, max 5 words>

For example:
[SEARCH_TOPIC]: quadratic equation solving methods
[SEARCH_TOPIC]: Newton's laws of motion
[SEARCH_TOPIC]: integration by parts calculus`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Data}`
                }
              },
              {
                type: "text",
                text: "Please analyze this image carefully. If it contains any problems, questions, or exercises, solve them step-by-step with complete accuracy. If it's informational content, explain it thoroughly. Remember to include the [SEARCH_TOPIC] at the end."
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let solution = data.choices?.[0]?.message?.content;

    if (!solution) {
      console.error("No solution in response:", data);
      return new Response(
        JSON.stringify({ error: "No analysis generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract search topic from the response
    let searchTopic = "";
    const searchTopicMatch = solution.match(/\[SEARCH_TOPIC\]:\s*(.+?)(?:\n|$)/i);
    if (searchTopicMatch) {
      searchTopic = searchTopicMatch[1].trim();
      // Remove the search topic line from the solution
      solution = solution.replace(/\[SEARCH_TOPIC\]:\s*.+?(?:\n|$)/gi, "").trim();
    }

    console.log("Successfully analyzed screenshot, search topic:", searchTopic);

    return new Response(
      JSON.stringify({ 
        solution,
        searchTopic,
        success: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-screenshot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
