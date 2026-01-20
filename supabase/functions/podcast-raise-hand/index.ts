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
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    const systemPrompt = `You are writing dialogue for two podcast hosts responding to a listener's question.

Hosts:
- host1 (name: Alex): male, enthusiastic, uses analogies
- host2 (name: Sarah): female, knowledgeable, provides clear explanations

The listener has raised their hand to ask a question during the podcast. Generate a brief, helpful response from the hosts.

Context about what was being discussed: ${currentTopic || "educational content"}
${podcastContext ? `Previous discussion context: ${podcastContext}` : ""}

Rules:
- Return ONLY valid JSON (no markdown).
- segments MUST be an array with 2-4 items.
- Each segment MUST include: speaker ("host1" or "host2"), name ("Alex" or "Sarah"), text (non-empty string).
- Keep each text concise (1-2 sentences).

JSON shape:
{
  "segments": [
    {"speaker":"host1","name":"Alex","text":"..."},
    {"speaker":"host2","name":"Sarah","text":"..."}
  ]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Listener's question: "${question}"` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exceeded. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "";

    // Parse + validate the response
    let script: any;
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

    const rawSegments: any[] = Array.isArray(script?.segments) ? script.segments : [];
    const segments = rawSegments
      .filter((s) => s && typeof s.text === "string" && s.text.trim().length > 0)
      .slice(0, 4)
      .map((s) => {
        const speaker = s.speaker === "host2" ? "host2" : "host1";
        return {
          speaker,
          name: speaker === "host2" ? "Sarah" : "Alex",
          text: String(s.text).trim(),
        };
      });

    if (segments.length < 2) {
      console.error("AI returned no usable segments:", responseText);
      throw new Error("AI returned no usable response segments");
    }

    // Generate audio for each segment
    const audioSegments: Array<{ speaker: string; name: string; text: string; audio?: string; fallbackAudio?: boolean }> = [];

    for (const segment of segments) {
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
        const t = await ttsResponse.text();
        console.error("ElevenLabs TTS error:", ttsResponse.status, t);
        // Mark segment for fallback TTS
        audioSegments.push({
          ...segment,
          fallbackAudio: true,
        });
        continue;
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      audioSegments.push({
        ...segment,
        audio: base64Encode(audioBuffer),
      });
    }

    // Check if all segments need fallback
    const allFallback = audioSegments.every((s) => s.fallbackAudio && !s.audio);
    const ttsError = allFallback
      ? "Voice generation unavailable. Using browser voices as fallback."
      : undefined;

    return new Response(JSON.stringify({ segments: audioSegments, ttsError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling raise hand:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process question" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
