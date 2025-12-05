import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type, videoTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating flashcards for ${type}: ${videoTitle || 'content'}`);

    let systemPrompt = `You are an expert educator that creates effective flashcards for studying. 
Generate flashcards that help students memorize and understand key concepts.
Each flashcard should have a clear question on the front and a concise answer on the back.
Use simple language and make the content memorable.`;

    let userPrompt = '';
    
    if (type === 'video') {
      userPrompt = `Based on this educational video title: "${videoTitle}"
      
Generate 5-8 flashcards about the likely content of this video. Each flashcard should:
- Have a clear, focused question
- Have a concise but complete answer
- Cover key concepts, definitions, formulas, or facts

Return ONLY a JSON array with this exact format:
[
  {"front": "Question here?", "back": "Answer here"},
  {"front": "Question here?", "back": "Answer here"}
]`;
    } else if (type === 'pdf' || type === 'image') {
      userPrompt = `Based on this content:
      
${content}

Generate 8-12 flashcards covering the main concepts. Each flashcard should:
- Have a clear, focused question
- Have a concise but complete answer (use LaTeX for math: $formula$)
- Cover key concepts, definitions, formulas, or facts

Return ONLY a JSON array with this exact format:
[
  {"front": "Question here?", "back": "Answer here"},
  {"front": "Question here?", "back": "Answer here"}
]`;
    }

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    
    console.log("AI Response:", responseText);

    // Extract JSON from response
    let flashcards = [];
    try {
      // Try to parse the entire response as JSON
      flashcards = JSON.parse(responseText);
    } catch {
      // Try to extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      }
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("Failed to generate flashcards");
    }

    // Add IDs to flashcards
    const flashcardsWithIds = flashcards.map((card: { front: string; back: string }, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      front: card.front,
      back: card.back,
    }));

    console.log(`Generated ${flashcardsWithIds.length} flashcards`);

    return new Response(JSON.stringify({ 
      flashcards: flashcardsWithIds,
      source: type,
      title: videoTitle || 'Content Flashcards'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating flashcards:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate flashcards" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
