import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOICE_IDS = {
  host1: "JBFqnCBsd6RMkjVDRZzb", // George - male (Alex)
  host2: "EXAVITQu4vr4xnSDxMaL", // Sarah - female
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, podcastContext, currentTopic } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    // Generate response script using AI
    const systemPrompt = `You are writing dialogue for two podcast hosts responding to a listener's question:
- **Alex** (Host 1): Male, enthusiastic, uses analogies
- **Sarah** (Host 2): Female, knowledgeable, provides clear explanations

The listener has raised their hand to ask a question during the podcast. Generate a brief, helpful response from the hosts.

Context about what was being discussed: ${currentTopic || "educational content"}
${podcastContext ? `Previous discussion context: ${podcastContext}` : ""}

Return ONLY valid JSON:
{
  "segments": [
    {"speaker": "host1", "name": "Alex", "text": "response acknowledging question"},
    {"speaker": "host2", "name": "Sarah", "text": "helpful explanation"},
    {"speaker": "host1", "name": "Alex", "text": "optional follow-up or transition back"}
  ]
}

Keep responses concise (2-4 segments total). Be conversational and helpful.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Listener's question: "${question}"` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "";

    // Parse the response
    let script;
    try {
      script = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        script = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response script");
      }
    }

    // Generate audio for each segment
    const audioSegments = [];
    for (const segment of script.segments) {
      const voiceId = VOICE_IDS[segment.speaker as keyof typeof VOICE_IDS] || VOICE_IDS.host1;

      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: segment.text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.4,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!ttsResponse.ok) {
        console.error("ElevenLabs TTS error:", ttsResponse.status);
        continue;
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      audioSegments.push({
        ...segment,
        audio: base64Encode(audioBuffer),
      });
    }

    return new Response(
      JSON.stringify({ segments: audioSegments }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error handling raise hand:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process question" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
