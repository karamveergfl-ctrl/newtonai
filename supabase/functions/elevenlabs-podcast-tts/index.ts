import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice mappings by language - using ElevenLabs multilingual voices
const VOICES_BY_LANGUAGE: Record<string, { host1: string; host2: string }> = {
  en: {
    host1: "CwhRBWXzGAHq8TQ4Fs17", // Roger - male, warm, conversational
    host2: "EXAVITQu4vr4xnSDxMaL", // Sarah - female, clear, engaging
  },
  hi: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel - supports Hindi via multilingual
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda - supports Hindi via multilingual
  },
  es: {
    host1: "TX3LPaxmHKxFdv7VOQHJ", // Liam
    host2: "cgSgspJ2msm6clMCkdW9", // Jessica
  },
  fr: {
    host1: "TX3LPaxmHKxFdv7VOQHJ", // Liam
    host2: "EXAVITQu4vr4xnSDxMaL", // Sarah
  },
  de: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  pt: {
    host1: "TX3LPaxmHKxFdv7VOQHJ", // Liam
    host2: "cgSgspJ2msm6clMCkdW9", // Jessica
  },
  ja: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  zh: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  ko: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  ar: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  ta: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  te: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
  bn: {
    host1: "onwK4e9ZLuTAKqWW03F9", // Daniel
    host2: "XrExE9yKIg1WjnnlVkGX", // Matilda
  },
};

interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
}

interface TTSRequest {
  segments: PodcastSegment[];
  batchSize?: number;
  language?: string;
}

// Get model based on language - use multilingual for non-English
function getModelForLanguage(language: string): string {
  return language === "en" ? "eleven_turbo_v2_5" : "eleven_multilingual_v2";
}

async function generateAudioForSegment(
  text: string,
  voiceId: string,
  apiKey: string,
  modelId: string
): Promise<string> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ElevenLabs API error: ${response.status}`, errorText);
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return base64Encode(audioBuffer);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const { segments, batchSize = 3, language = "en" }: TTSRequest = await req.json();

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Segments array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating audio for ${segments.length} segments in language: ${language}`);

    // Get voice mapping for the language
    const voices = VOICES_BY_LANGUAGE[language] || VOICES_BY_LANGUAGE.en;
    const modelId = getModelForLanguage(language);

    console.log(`Using model: ${modelId}, voices: host1=${voices.host1}, host2=${voices.host2}`);

    // Process segments in batches to avoid rate limits
    const results: { index: number; audio: string | null; error?: string }[] = [];
    
    for (let i = 0; i < segments.length; i += batchSize) {
      const batch = segments.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (segment, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const voiceId = voices[segment.speaker];
          const audio = await generateAudioForSegment(
            segment.text,
            voiceId,
            ELEVENLABS_API_KEY,
            modelId
          );
          return { index: globalIndex, audio };
        } catch (error) {
          console.error(`Error generating audio for segment ${globalIndex}:`, error);
          return { 
            index: globalIndex, 
            audio: null, 
            error: error instanceof Error ? error.message : "Unknown error" 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < segments.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Sort results by index to maintain order
    results.sort((a, b) => a.index - b.index);

    // Build response with audio data
    const audioSegments = segments.map((segment, index) => {
      const result = results.find(r => r.index === index);
      return {
        ...segment,
        audio: result?.audio || null,
        audioError: result?.error || null,
      };
    });

    const successCount = audioSegments.filter(s => s.audio).length;
    console.log(`Generated ${successCount}/${segments.length} audio segments successfully`);

    return new Response(
      JSON.stringify({ 
        segments: audioSegments,
        stats: {
          total: segments.length,
          success: successCount,
          failed: segments.length - successCount,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in elevenlabs-podcast-tts:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate podcast audio" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
