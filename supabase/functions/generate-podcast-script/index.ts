import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PodcastSettings {
  style: "casual" | "academic" | "deep-dive" | "interview";
  host1Name: string;
  host1Personality: string;
  host2Name: string;
  host2Personality: string;
  tone: "enthusiastic" | "balanced" | "serious";
  depth: number;
  customInstructions: string;
}

const STYLE_PROMPTS: Record<string, string> = {
  casual: `Create a friendly, relaxed conversation like two study buddies chatting over coffee. 
Use casual language, relatable examples, and occasional humor. Keep explanations simple and accessible.`,
  
  academic: `Create a structured, formal discussion like a university seminar or lecture series.
Use precise terminology, cite concepts properly, and maintain an educational tone. 
Explore topics systematically with clear explanations.`,
  
  "deep-dive": `Create a comprehensive, investigative exploration of the topic.
Dig into nuances, examine multiple perspectives, and provide thorough analysis.
Don't shy away from complexity - explain it clearly.`,
  
  interview: `Create a Q&A format where one host interviews the other as a subject matter expert.
The interviewer asks insightful, probing questions while the expert provides authoritative answers.
Include follow-up questions and clarifications.`,
};

const TONE_MODIFIERS: Record<string, string> = {
  enthusiastic: "Be energetic, excited about the topic, and use expressive language. Show genuine enthusiasm!",
  balanced: "Maintain a professional yet approachable tone. Be engaging without being over-the-top.",
  serious: "Keep a thoughtful, measured tone. Focus on substance and avoid excessive levity.",
};

const DEPTH_CONFIGS: Record<number, { segments: string; detail: string }> = {
  1: { segments: "6-8", detail: "Brief overview, hitting only key points" },
  2: { segments: "8-10", detail: "Summary with main concepts explained" },
  3: { segments: "10-14", detail: "Standard depth with examples and explanations" },
  4: { segments: "14-18", detail: "Detailed exploration with nuances and context" },
  5: { segments: "18-24", detail: "Comprehensive deep-dive with thorough analysis" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, settings } = await req.json();

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

    // Use settings or defaults
    const podcastSettings: PodcastSettings = {
      style: settings?.style || "casual",
      host1Name: settings?.host1Name || "Alex",
      host1Personality: settings?.host1Personality || "Enthusiastic and curious, asks clarifying questions, uses analogies",
      host2Name: settings?.host2Name || "Sarah",
      host2Personality: settings?.host2Personality || "Knowledgeable and warm, explains concepts clearly, provides examples",
      tone: settings?.tone || "balanced",
      depth: settings?.depth || 3,
      customInstructions: settings?.customInstructions || "",
    };

    const stylePrompt = STYLE_PROMPTS[podcastSettings.style] || STYLE_PROMPTS.casual;
    const toneModifier = TONE_MODIFIERS[podcastSettings.tone] || TONE_MODIFIERS.balanced;
    const depthConfig = DEPTH_CONFIGS[podcastSettings.depth] || DEPTH_CONFIGS[3];

    const systemPrompt = `You are a podcast script writer for an educational podcast called "Study Sessions". 
You create engaging, conversational dialogues between two hosts.

**PODCAST STYLE: ${podcastSettings.style.toUpperCase()}**
${stylePrompt}

**HOSTS:**
- **${podcastSettings.host1Name}** (Host 1): ${podcastSettings.host1Personality}
- **${podcastSettings.host2Name}** (Host 2): ${podcastSettings.host2Personality}

**TONE:**
${toneModifier}

**DEPTH & LENGTH:**
Create ${depthConfig.segments} segments total.
${depthConfig.detail}

${podcastSettings.customInstructions ? `**SPECIAL INSTRUCTIONS:**\n${podcastSettings.customInstructions}\n` : ""}

**GUIDELINES:**
1. Create a natural conversation that explains the content engagingly
2. Include reactions, transitions, and back-and-forth between hosts
3. Break down complex concepts into digestible explanations
4. Add interesting facts or real-world applications when relevant
5. Each segment should be 1-3 sentences for natural speech
6. Include an intro greeting and a brief outro

**EMOTION HINTS:**
Add emotion hints that will help with voice synthesis:
- enthusiastic, curious, thoughtful, surprised, amused, serious, warm, excited, intrigued, impressed

Return ONLY valid JSON in this exact format:
{
  "title": "Episode title based on content",
  "segments": [
    {"speaker": "host1", "name": "${podcastSettings.host1Name}", "text": "dialogue text here", "emotion": "enthusiastic"},
    {"speaker": "host2", "name": "${podcastSettings.host2Name}", "text": "dialogue text here", "emotion": "thoughtful"}
  ]
}`;

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
