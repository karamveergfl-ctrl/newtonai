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
    const { content, title } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a podcast script writer for an educational podcast called "Study Sessions". You create engaging, conversational dialogues between two hosts:

- **Alex** (Host 1): Male host, enthusiastic and curious, asks clarifying questions, uses analogies
- **Sarah** (Host 2): Female host, knowledgeable and warm, explains concepts clearly, provides examples

Guidelines:
1. Create a natural conversation that explains the content in an engaging way
2. Include banter, reactions, and transitions between topics
3. Break down complex concepts into digestible explanations
4. Add interesting facts or real-world applications
5. Keep the tone educational but entertaining
6. Each segment should be 1-3 sentences for natural speech
7. Total podcast should be 8-15 segments
8. Include an intro greeting and outro

Return ONLY valid JSON in this exact format:
{
  "title": "Episode title based on content",
  "segments": [
    {"speaker": "host1", "name": "Alex", "text": "dialogue text here", "emotion": "enthusiastic"},
    {"speaker": "host2", "name": "Sarah", "text": "dialogue text here", "emotion": "thoughtful"}
  ]
}

Emotion options: enthusiastic, curious, thoughtful, surprised, amused, serious, warm, excited`;

    const userPrompt = `Create an educational podcast script about the following content${title ? ` titled "${title}"` : ''}:\n\n${content.substring(0, 8000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const scriptText = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let script;
    try {
      // Try to parse directly
      script = JSON.parse(scriptText);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = scriptText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        script = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the text
        const objectMatch = scriptText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          script = JSON.parse(objectMatch[0]);
        } else {
          throw new Error("Could not parse script from AI response");
        }
      }
    }

    // Validate script structure
    if (!script.segments || !Array.isArray(script.segments)) {
      throw new Error("Invalid script structure: missing segments array");
    }

    return new Response(
      JSON.stringify(script),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating podcast script:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate script" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
