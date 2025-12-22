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
    const { selectedText, imageData } = await req.json();
    console.log("Analyzing request - Text:", selectedText, "Image:", imageData ? "present" : "none");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let textToAnalyze = selectedText;
    
    // If image data is provided, use vision AI to extract text
    if (imageData) {
      console.log("Processing image with vision AI...");
      const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: [
                {
                  type: "text",
                  text: "Extract all text, formulas, and describe any diagrams or figures from this image. If it contains mathematical equations or scientific notation, preserve them exactly."
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

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        console.error("Vision AI error:", visionResponse.status, errorText);
        
        if (visionResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (visionResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Vision AI error: ${visionResponse.status}`);
      }
      
      const visionData = await visionResponse.json();
      textToAnalyze = visionData.choices[0].message.content;
      console.log("Extracted text from image:", textToAnalyze);
    }
    
    if (!textToAnalyze) {
      throw new Error("No text to analyze");
    }

    // Detect if this is a question or numerical problem
    const isQuestion = /\?|how|what|why|when|where|calculate|find|solve|determine|derive|prove|compute|evaluate|show that|given|velocity field|fluid|equation/i.test(textToAnalyze);
    const isNumerical = /\d+.*[+\-*/=]|\bfind\b|\bcalculate\b|\bsolve\b|\bcompute\b|\bevaluate\b|\bderive\b|\bvelocity field\b|\bgiven.*=|magnitude|direction/i.test(textToAnalyze);
    console.log("Is question:", isQuestion);
    console.log("Is numerical:", isNumerical);

    // Use AI to extract the main topic from selected text
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert at identifying key topics and concepts. Extract the main topic or concept from the given text in 2-4 words. Return only the topic name, nothing else."
          },
          {
            role: "user",
            content: `Extract the main topic from this text: "${textToAnalyze}"`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const topic = aiData.choices[0].message.content.trim();
    console.log("Extracted topic:", topic);

    // Generate solution or description
    let solution = null;
    let description = null;
    
    if (isQuestion) {
      console.log("Generating solution for question...");
      const solutionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert tutor specializing in providing clear, well-formatted solutions. Format your response exactly like ChatGPT using:

## Step-by-Step Solution

**Given:** List what's provided clearly
**Find:** What needs to be determined

### Step 1: [Descriptive Title]
Explain the approach and show calculations with proper formatting.

### Step 2: [Descriptive Title]
Continue with detailed work, showing all intermediate steps.

**Final Answer:** 
Highlight the result clearly with units if applicable.

Use ** for bold, \` for inline math/variables, ### for section headers, and proper line breaks. Be thorough, pedagogical, and mathematically precise.`
            },
            {
              role: "user",
              content: `Provide a comprehensive solution to this question:\n\n${textToAnalyze}`
            }
          ],
        }),
      });

      if (solutionResponse.ok) {
        const solutionData = await solutionResponse.json();
        solution = solutionData.choices[0].message.content;
        console.log("Generated solution");
      }
    } else {
      console.log("Generating topic description...");
      const descResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are an educational assistant. Provide brief, clear descriptions of topics in 2-3 sentences. Be concise and informative."
            },
            {
              role: "user",
              content: `Provide a brief description of: ${textToAnalyze}`
            }
          ],
        }),
      });

      if (descResponse.ok) {
        const descData = await descResponse.json();
        description = descData.choices[0].message.content;
        console.log("Generated description");
      }
    }

    // Search YouTube for the topic
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    // Search for animation videos (skip if numerical)
    let animationVideos: any[] = [];
    if (!isNumerical) {
      const animationQuery = `${topic} animated explanation visual learning`;
      const animationResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(animationQuery)}&type=video&key=${YOUTUBE_API_KEY}&videoDefinition=high&relevanceLanguage=en&safeSearch=strict&order=relevance`
      );

      if (!animationResponse.ok) {
        const errorText = await animationResponse.text();
        console.error("YouTube API error (animation):", animationResponse.status, errorText);
        throw new Error(`YouTube API error: ${animationResponse.status}`);
      }

      const animationData = await animationResponse.json();
      
      // Filter out unrelated videos by checking title relevance
      animationVideos = (animationData.items || [])
        .filter((item: any) => {
          const title = item.snippet.title.toLowerCase();
          const topicWords = topic.toLowerCase().split(' ');
          // Ensure at least one topic word appears in the title
          return topicWords.some((word: string) => word.length > 3 && title.includes(word));
        })
        .map((item: any) => ({
          id: item.id.videoId,
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle,
        }));
      
      console.log("Found animation videos:", animationVideos.length);
    } else {
      console.log("Skipping animation videos for numerical problem");
    }

    // Search for explanation/theory videos - Focus on problem-solving for numericals
    let explanationQuery = isNumerical
      ? `${topic} solved example problem solution step by step calculation numerical`
      : isQuestion 
        ? `${topic} answer solution explanation tutorial step by step how to solve`
        : `${topic} lecture professor theory explained tutorial course`;
    
    const explanationResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(explanationQuery)}&type=video&key=${YOUTUBE_API_KEY}&videoDefinition=high&videoDuration=medium&relevanceLanguage=en&safeSearch=strict&order=relevance`
    );

    if (!explanationResponse.ok) {
      const errorText = await explanationResponse.text();
      console.error("YouTube API error (explanation):", explanationResponse.status, errorText);
      throw new Error(`YouTube API error: ${explanationResponse.status}`);
    }

    const explanationData = await explanationResponse.json();
    
    // Filter for relevant explanation videos
    const explanationVideos = (explanationData.items || [])
      .filter((item: any) => {
        const title = item.snippet.title.toLowerCase();
        const topicWords = topic.toLowerCase().split(' ');
        // Ensure at least one topic word appears in the title
        return topicWords.some((word: string) => word.length > 3 && title.includes(word));
      })
      .map((item: any) => ({
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      }));

    console.log("Found explanation videos:", explanationVideos.length);

    return new Response(
      JSON.stringify({ 
        topic, 
        animationVideos,
        explanationVideos,
        solution,
        description,
        isQuestion
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing text:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
