import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const languageNames: Record<string, string> = {
  "en": "English", "hi": "Hindi", "es": "Spanish", "fr": "French",
  "de": "German", "zh": "Chinese", "ja": "Japanese", "ko": "Korean",
  "ar": "Arabic", "pt": "Portuguese", "ru": "Russian", "it": "Italian",
  "bn": "Bengali", "ta": "Tamil", "te": "Telugu", "mr": "Marathi",
  "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam", "pa": "Punjabi"
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

    // Check rate limit (50 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'generate-flashcards',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { content, type, videoTitle, settings, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract settings with defaults
    const count = settings?.count || 10;
    const difficulty = settings?.difficulty || "medium";
    const targetLanguage = languageNames[language] || "English";

    console.log(`Generating ${count} ${difficulty} flashcards in ${targetLanguage} for ${type}: ${videoTitle || 'content'}`);

    const difficultyGuide = {
      easy: "Focus on basic definitions and simple facts. Cards should be straightforward to memorize.",
      medium: "Include key concepts and their relationships. Require understanding, not just memorization.",
      hard: "Focus on complex concepts, edge cases, and deeper analysis. Cards should challenge deep understanding."
    };

    let systemPrompt = `You are an expert educator that creates effective flashcards for studying.

CRITICAL RULES - YOU MUST FOLLOW ALL OF THESE:
1. Generate ALL flashcards in ${targetLanguage}. Both front (question) and back (answer) MUST be in ${targetLanguage}.
2. ONLY use information that is EXPLICITLY stated in the provided content below.
3. DO NOT add any external knowledge, facts, or information not present in the source material.
4. If the content is about a specific topic (e.g., Zener Diodes, Newton's Laws, etc.), ALL flashcards must be about that EXACT topic.
5. Do NOT generalize or expand beyond what is directly mentioned in the content.
6. Every flashcard MUST be directly traceable to a sentence or concept in the provided text.

You MUST respond with ONLY a valid JSON array. No explanations, no markdown, no extra text.
Each flashcard should have a clear question on the front and a concise answer on the back.
For math, use simple notation like x^2, sqrt(x), etc. Avoid LaTeX backslashes.

Difficulty level: ${difficulty.toUpperCase()}
${difficultyGuide[difficulty as keyof typeof difficultyGuide]}`;

    let userPrompt = '';
    
    if (type === 'video') {
      userPrompt = `Based ONLY on the following educational video content. DO NOT use any external knowledge:

Title: "${videoTitle}"

Content/Transcript (use ONLY this information - every flashcard must come from this text):
---
${content?.slice(0, 6000) || ''}
---

IMPORTANT: Generate flashcards ONLY from the information provided above. Do NOT include any facts, concepts, or definitions not explicitly mentioned in this transcript.

Generate exactly ${count} flashcards at ${difficulty} difficulty IN ${targetLanguage}.
Both the front (question) and back (answer) must be written in ${targetLanguage}.

Each flashcard MUST:
- Be directly based on content from the transcript above
- Have a clear, focused question in ${targetLanguage}
- Have a concise but complete answer in ${targetLanguage} (use LaTeX for math: $formula$)
- NOT include any external information or general knowledge

Return ONLY a JSON array with this exact format:
[
  {"front": "Question in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"},
  {"front": "Question in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"}
]`;
    } else if (type === 'pdf' || type === 'image') {
      userPrompt = `Based ONLY on the following document content. DO NOT use any external knowledge:

Document Content (use ONLY this information - every flashcard must come from this text):
---
${content?.slice(0, 6000) || ''}
---

IMPORTANT: Generate flashcards ONLY from the information provided above. Do NOT add external knowledge, general facts, or concepts not present in this content.

Generate exactly ${count} flashcards at ${difficulty} difficulty IN ${targetLanguage}.
Both the front (question) and back (answer) must be written in ${targetLanguage}.

Each flashcard MUST:
- Be directly based on content from the document above
- Have a clear, focused question in ${targetLanguage}
- Have a concise but complete answer in ${targetLanguage} (use LaTeX for math: $formula$)
- NOT include any external information or general knowledge

Return ONLY a JSON array with this exact format:
[
  {"front": "Question in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"},
  {"front": "Question in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"}
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

    // Extract JSON from response - robust parsing
    let flashcards: any[] = [];
    
    const extractFlashcards = (text: string): any[] => {
      const cards: any[] = [];
      
      // Method 1: Find JSON array pattern
      const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          let jsonStr = arrayMatch[0];
          jsonStr = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.log("Array match parse failed:", e);
        }
      }
      
      // Method 2: Extract individual card objects using regex
      const cardPattern = /\{\s*"front"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"back"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
      let match;
      while ((match = cardPattern.exec(text)) !== null) {
        cards.push({
          front: match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n'),
          back: match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n')
        });
      }
      if (cards.length > 0) return cards;
      
      // Method 3: Parse markdown-style flashcards
      const mdPattern = /\*\*Front[:\s]*\*\*\s*(.+?)[\n\r]+\*\*Back[:\s]*\*\*\s*(.+?)(?=\*\*Front|$)/gis;
      while ((match = mdPattern.exec(text)) !== null) {
        cards.push({
          front: match[1].trim(),
          back: match[2].trim()
        });
      }
      
      // Method 4: Parse Q: A: format
      const qaPattern = /(?:Q:|Question:)\s*(.+?)[\n\r]+(?:A:|Answer:)\s*(.+?)(?=(?:Q:|Question:)|$)/gis;
      while ((match = qaPattern.exec(text)) !== null) {
        cards.push({
          front: match[1].trim(),
          back: match[2].trim()
        });
      }
      
      return cards;
    };

    // Clean and extract
    let cleanText = responseText;
    cleanText = cleanText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    flashcards = extractFlashcards(cleanText);
    
    console.log(`Extracted ${flashcards.length} flashcards from AI response`);

    // Generate fallback flashcards if extraction failed
    if (flashcards.length === 0 && content) {
      console.log("Generating fallback flashcards from content");
      const sentences = content.split(/[.!?]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 20 && s.length < 300);
      
      for (let i = 0; i < Math.min(sentences.length, count); i++) {
        const sentence = sentences[i];
        flashcards.push({
          front: `What is the key concept: "${sentence.slice(0, 50)}..."?`,
          back: sentence
        });
      }
    }

    if (flashcards.length === 0) {
      throw new Error("Could not generate flashcards. Please try with different content.");
    }

    // Add IDs to flashcards
    const flashcardsWithIds = flashcards.slice(0, count).map((card: { front: string; back: string }, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      front: card.front || "Question",
      back: card.back || "Answer",
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
