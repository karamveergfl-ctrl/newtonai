import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    console.log("Authenticated user:", user.id);

    const { content, type, videoTitle, settings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract settings with defaults
    const count = settings?.count || 10;
    const difficulty = settings?.difficulty || "medium";

    console.log(`Generating ${count} ${difficulty} flashcards for ${type}: ${videoTitle || 'content'}`);

    const difficultyGuide = {
      easy: "Focus on basic definitions and simple facts. Cards should be straightforward to memorize.",
      medium: "Include key concepts and their relationships. Require understanding, not just memorization.",
      hard: "Focus on complex concepts, edge cases, and deeper analysis. Cards should challenge deep understanding."
    };

    let systemPrompt = `You are an expert educator that creates effective flashcards for studying. 
Generate flashcards that help students memorize and understand key concepts.
Each flashcard should have a clear question on the front and a concise answer on the back.
Use LaTeX formatting for mathematical expressions: $formula$ for inline.

Difficulty level: ${difficulty.toUpperCase()}
${difficultyGuide[difficulty as keyof typeof difficultyGuide]}`;

    let userPrompt = '';
    
    if (type === 'video') {
      userPrompt = `Based on this educational video: "${videoTitle}"
      
Content/Transcript:
${content?.slice(0, 6000) || ''}

Generate exactly ${count} flashcards at ${difficulty} difficulty. Each flashcard should:
- Have a clear, focused question
- Have a concise but complete answer (use LaTeX for math: $formula$)
- Cover key concepts, definitions, formulas, or facts

Return ONLY a JSON array with this exact format:
[
  {"front": "Question here?", "back": "Answer here"},
  {"front": "Question here?", "back": "Answer here"}
]`;
    } else if (type === 'pdf' || type === 'image') {
      userPrompt = `Based on this content:
      
${content?.slice(0, 6000) || ''}

Generate exactly ${count} flashcards at ${difficulty} difficulty covering the main concepts. Each flashcard should:
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
    
    console.log("AI Response:", responseText.slice(0, 500));

    // Extract JSON from response
    let flashcards = [];
    try {
      // Remove markdown code blocks if present
      let jsonStr = responseText;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      
      // Fix common escape sequence issues before parsing
      jsonStr = jsonStr.trim();
      // Fix unescaped backslashes (common in LaTeX)
      jsonStr = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      
      flashcards = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log("Initial parse failed, trying fallback extraction");
      // Try to extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          let extracted = jsonMatch[0];
          // Fix escape sequences in extracted JSON
          extracted = extracted.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
          flashcards = JSON.parse(extracted);
        } catch (extractError) {
          // Last resort: try to manually parse the structure
          console.log("Fallback extraction failed, trying manual parse");
          const cardMatches = responseText.matchAll(/"front"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"back"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g);
          for (const match of cardMatches) {
            flashcards.push({
              front: match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
              back: match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            });
          }
        }
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
      title: videoTitle || 'Content Flashcards',
      difficulty
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
