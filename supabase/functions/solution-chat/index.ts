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
    const { imageData, currentSolution, question } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing follow-up question:", question?.slice(0, 100));

    const systemPrompt = `You are an expert tutor helping a student understand a problem they're working on.

The student has a problem (possibly shown in an image) and has already received a solution. Now they're asking a follow-up question.

Current solution context:
${currentSolution?.slice(0, 4000) || "No solution yet"}

Guidelines:
- Answer their specific question directly
- Use LaTeX notation for any math: inline $...$ and block $$...$$
- Be concise but thorough
- If they ask to solve it differently, show an alternative approach
- If they ask about a specific step, explain it in more detail
- Keep your response focused on what they asked`;

    const messages: { role: string; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[] = [
      { role: "system", content: systemPrompt }
    ];

    // If we have image data, include it
    if (imageData) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: question },
          { type: "image_url", image_url: { url: imageData } }
        ]
      });
    } else {
      messages.push({ role: "user", content: question });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: unknown) {
    console.error("Error in solution-chat:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
