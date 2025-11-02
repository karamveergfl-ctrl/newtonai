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
    const { pdfContent, fileName } = await req.json();
    console.log("Processing PDF:", fileName);

    // Decode base64 PDF content
    const pdfBytes = Uint8Array.from(atob(pdfContent), c => c.charCodeAt(0));
    
    // Extract text from PDF (simple extraction)
    const text = await extractTextFromPDF(pdfBytes);
    console.log("Extracted text length:", text.length);

    // Use Lovable AI to extract topics
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

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
            content: "You are an expert at analyzing educational documents and extracting key topics. Extract 5-8 main topics with brief summaries. Return JSON only."
          },
          {
            role: "user",
            content: `Analyze this document and extract 5-8 main topics. For each topic provide: heading (concise topic name) and summary (2-3 sentences). Return as JSON array: [{"heading": "...", "summary": "..."}]\n\nDocument text:\n${text.slice(0, 15000)}`
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
    console.log("AI response received");
    
    let topics = [];
    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      topics = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error("Error parsing AI response:", e);
      topics = [{ heading: "Main Topic", summary: "AI extraction failed, using default topic" }];
    }

    console.log("Extracted topics:", topics.length);

    // Get YouTube API key
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    // Search YouTube for each topic
    const topicsWithVideos = await Promise.all(
      topics.map(async (topic: any) => {
        const videos = await searchYouTube(topic.heading, YOUTUBE_API_KEY);
        return { ...topic, videos };
      })
    );

    return new Response(
      JSON.stringify({ topics: topicsWithVideos }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  // Simple text extraction from PDF
  const text = new TextDecoder().decode(pdfBytes);
  
  // Extract readable text between stream objects
  const textMatches = text.match(/\(([^)]+)\)/g);
  if (textMatches) {
    return textMatches.map(match => match.slice(1, -1)).join(' ').slice(0, 20000);
  }
  
  // Fallback: extract any readable ASCII text
  return text.replace(/[^\x20-\x7E\n]/g, '').slice(0, 20000);
}

async function searchYouTube(query: string, apiKey: string) {
  const educationalChannels = [
    "Khan Academy",
    "CrashCourse", 
    "TED-Ed",
    "Kurzgesagt",
    "3Blue1Brown",
    "Veritasium",
    "VSauce",
  ].join("|");

  try {
    const searchQuery = `${query} educational animation`;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(searchQuery)}&type=video&key=${apiKey}&videoDefinition=high`
    );

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return [];
    }

    const data = await response.json();
    
    return (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return [];
  }
}
