import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("Invalid or expired token:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (60 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'analyze-text',
      p_max_requests: 60,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { imageData, text, stream, language } = await req.json();
    
    // Image validation
    if (imageData) {
      // Check size limit (10MB for base64, which is ~7.5MB actual image)
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
      if (imageData.length > MAX_IMAGE_SIZE) {
        return new Response(
          JSON.stringify({ error: 'Image size exceeds 10MB limit. Please use a smaller image.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Validate base64 image format
      const validImagePattern = /^data:image\/(png|jpeg|jpg|webp|gif|bmp);base64,/i;
      if (!validImagePattern.test(imageData)) {
        return new Response(
          JSON.stringify({ error: 'Invalid image format. Supported formats: PNG, JPEG, WebP, GIF, BMP.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const hasImage = !!imageData;
    const hasText = !!text?.trim();
    
    console.log("Analyzing content with Gemini 2.5 Flash, streaming:", stream, "hasImage:", hasImage, "hasText:", hasText);

    if (!hasImage && !hasText) {
      throw new Error("No content provided - please provide text or an image");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const langInstruction = language && language !== "en" 
      ? `\nIMPORTANT: Respond in ${language} language.` 
      : "";

    const systemPrompt = `Solve this problem step by step.${langInstruction}

INSTRUCTIONS:
1. First line MUST be: "TOPIC: [specific topic for YouTube, e.g., "projectile motion", "RC circuit"]"

2. Provide a SHORT, CONCISE solution:

## 📊 Problem
Brief 1-2 line description of the problem.

## 📝 Quick Solution

**Given:** List key values only

**Find:** What to calculate

**Solution:**
Key formula and steps with clear substitution

**✅ Answer:** Use \\boxed{} for final answer

RULES:
- Keep solution SHORT (max 10 lines of math)
- Only show essential steps, skip obvious algebra
- Use $...$ for inline, $$...$$ for display math
- Use \\boxed{} for final answer`;

    // Build message content based on available inputs
    const messageContent: any[] = [{ type: "text", text: systemPrompt }];
    
    if (hasText) {
      messageContent.push({ type: "text", text: `\n\nProblem:\n${text}` });
    }
    
    if (hasImage) {
      messageContent.push({ type: "image_url", image_url: { url: imageData } });
    }

    // Streaming response
    if (stream) {
      console.log("Sending streaming request to Gemini...");
      const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            {
              role: "user",
              content: messageContent
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

      // Stream the response directly back to the client
      return new Response(analysisResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Non-streaming response (for video search after streaming completes)
    console.log("Sending image to Gemini 2.5 Pro for analysis...");
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: messageContent
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
    
    // Filter out YouTube Shorts
    const explanationVideos = (youtubeData.items || [])
      .filter((item: any) => {
        const title = item.snippet.title.toLowerCase();
        const topicWords = topic.toLowerCase().split(' ');
        const matchesTopic = topicWords.some((word: string) => word.length > 3 && title.includes(word));
        // Filter out shorts
        const isShort = title.includes('#shorts') || 
                       title.includes('#short') || 
                       title.includes('| shorts') ||
                       title.includes('(shorts)') ||
                       title.endsWith(' shorts') ||
                       title.includes('youtube shorts');
        return matchesTopic && !isShort;
      })
      .slice(0, 6)
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
