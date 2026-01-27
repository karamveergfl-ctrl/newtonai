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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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

    const { content, type, videoTitle, settings, language = "en", stream = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const count = settings?.count || 10;
    const difficulty = settings?.difficulty || "medium";
    const targetLanguage = languageNames[language] || "English";

    console.log(`Generating ${count} ${difficulty} flashcards in ${targetLanguage} for ${type}: ${videoTitle || 'content'}`);

    const difficultyGuide = {
      easy: "Focus on basic definitions and simple facts. Cards should be straightforward to memorize.",
      medium: "Include key concepts and their relationships. Require understanding, not just memorization.",
      hard: "Focus on complex concepts, edge cases, and deeper analysis. Cards should challenge deep understanding."
    };

    // Detect if we have a real transcript or just title/description
    const hasRealContent = content && content.length > 300 && 
      !content.includes("Enjoy the videos and music you love");
    
    // Extract the actual subject from the video title (e.g., "Zener Diode" from "Lec 5 | Zener Diode...")
    const extractSubject = (title: string): string => {
      if (!title) return '';
      // Remove common prefixes like "Lec 5 |", "Lecture 5:", etc.
      let subject = title
        .replace(/^(Lec|Lecture|Class|Session|Part|Chapter|Unit|Module)\s*\d+\s*[:||\-\s]*/gi, '')
        .replace(/\|\s*(Engineering|Physics|Chemistry|Biology|Math|Computer|Science).*$/gi, '')
        .replace(/\s*\|.*B\.?Tech.*$/gi, '')
        .replace(/\s*\|.*Year.*$/gi, '')
        .trim();
      // Take the first meaningful part before any pipe or parenthesis
      const parts = subject.split(/[|]/);
      return parts[0]?.trim() || title;
    };

    const subjectTopic = type === 'video' && videoTitle ? extractSubject(videoTitle) : '';

    const systemPrompt = `You are an expert educator that creates effective flashcards for studying.

CRITICAL RULES:
1. Generate ALL flashcards in ${targetLanguage}. Both front (question) and back (answer) MUST be in ${targetLanguage}.
2. Create flashcards about the ACTUAL SUBJECT MATTER being taught, NOT about the video/document metadata.
3. NEVER create flashcards asking about:
   - Which lecture number this is (Lec 5, Lecture 3, etc.)
   - What year/semester the course is for
   - The video title or description structure
   - YouTube functionality
   - General information about the course structure
4. DO create flashcards about:
   - Core concepts and definitions of the topic
   - Important formulas and equations
   - Real-world applications
   - Key principles and mechanisms
   - Practical examples and use cases

You MUST respond with ONLY a valid JSON array. No explanations, no markdown, no extra text.
Each flashcard should have a clear question on the front and a concise answer on the back.
For math, use simple notation like x^2, sqrt(x), etc. Avoid LaTeX backslashes.

Difficulty level: ${difficulty.toUpperCase()}
${difficultyGuide[difficulty as keyof typeof difficultyGuide]}`;

    let userPrompt = '';
    
    if (type === 'video') {
      if (hasRealContent) {
        // We have actual transcript content
        userPrompt = `Based on the following educational video content about "${subjectTopic || videoTitle}":

Transcript:
---
${content?.slice(0, 6000) || ''}
---

Generate exactly ${count} flashcards at ${difficulty} difficulty IN ${targetLanguage}.
Focus ONLY on the educational content about ${subjectTopic || 'the topic'}.
Both the front (question) and back (answer) must be written in ${targetLanguage}.

Return ONLY a JSON array with this exact format:
[
  {"front": "Question about ${subjectTopic || 'the topic'} in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"},
  {"front": "Question about ${subjectTopic || 'the topic'} in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"}
]`;
      } else {
        // No real transcript - generate educational flashcards about the subject from the title
        userPrompt = `The video is about: "${subjectTopic || videoTitle}"

Since no transcript is available, generate ${count} educational flashcards at ${difficulty} difficulty about the topic "${subjectTopic || videoTitle}" IN ${targetLanguage}.

IMPORTANT: Create useful study flashcards about the ACTUAL SUBJECT (${subjectTopic || videoTitle}).
- Include definitions, key concepts, formulas, applications
- DO NOT ask about lecture numbers, course years, or video structure
- Make cards that would genuinely help someone learn about ${subjectTopic || videoTitle}

Return ONLY a JSON array with this exact format:
[
  {"front": "Question about ${subjectTopic || videoTitle} in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"},
  {"front": "Question about ${subjectTopic || videoTitle} in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"}
]`;
      }
    } else {
      userPrompt = `Based on the following document content:

Document Content:
---
${content?.slice(0, 6000) || ''}
---

Generate exactly ${count} flashcards at ${difficulty} difficulty IN ${targetLanguage}.
Focus on the actual educational content, not document metadata.
Both the front (question) and back (answer) must be written in ${targetLanguage}.

Return ONLY a JSON array with this exact format:
[
  {"front": "Question in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"},
  {"front": "Question in ${targetLanguage}?", "back": "Answer in ${targetLanguage}"}
]`;
    }

    // SSE streaming response
    if (stream) {
      const encoder = new TextEncoder();
      
      const sendProgress = (controller: ReadableStreamDefaultController, data: { stage: string; progress: number; message?: string }) => {
        const event = `data: ${JSON.stringify({ type: "progress", ...data })}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            // Stage 1: Analyzing
            sendProgress(controller, { stage: "analyzing", progress: 15, message: "Analyzing content..." });

            // Stage 2: Generating
            sendProgress(controller, { stage: "generating", progress: 40, message: "Newton is creating flashcards..." });

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
              throw new Error(response.status === 429 ? "Rate limit exceeded." : response.status === 402 ? "Payment required." : "AI gateway error");
            }

            // Stage 3: Processing
            sendProgress(controller, { stage: "processing", progress: 75, message: "Processing flashcards..." });

            const data = await response.json();
            const responseText = data.choices?.[0]?.message?.content || '';

            // Extract flashcards
            const extractFlashcards = (text: string): any[] => {
              const cards: any[] = [];
              
              const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
              if (arrayMatch) {
                try {
                  let jsonStr = arrayMatch[0].replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
                  const parsed = JSON.parse(jsonStr);
                  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                } catch {}
              }
              
              const cardPattern = /\{\s*"front"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"back"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
              let match;
              while ((match = cardPattern.exec(text)) !== null) {
                cards.push({
                  front: match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n'),
                  back: match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n')
                });
              }
              
              return cards;
            };

            let cleanText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            let flashcards = extractFlashcards(cleanText);

            if (flashcards.length === 0) {
              throw new Error("Could not generate flashcards. Please try with different content.");
            }

            const flashcardsWithIds = flashcards.slice(0, count).map((card: { front: string; back: string }, index: number) => ({
              id: `card-${Date.now()}-${index}`,
              front: card.front || "Question",
              back: card.back || "Answer",
            }));

            // Stage 4: Complete
            sendProgress(controller, { stage: "complete", progress: 100, message: "Flashcards ready!" });

            // Send final result
            const result = { 
              flashcards: flashcardsWithIds,
              source: type,
              title: videoTitle || 'Content Flashcards',
              difficulty
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", data: result })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Error generating flashcards:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Failed to generate flashcards" })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Non-streaming response (original behavior)
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

    // Extract JSON from response
    let flashcards: any[] = [];
    
    const extractFlashcards = (text: string): any[] => {
      const cards: any[] = [];
      
      const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          let jsonStr = arrayMatch[0].replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
      
      const cardPattern = /\{\s*"front"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"back"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
      let match;
      while ((match = cardPattern.exec(text)) !== null) {
        cards.push({
          front: match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n'),
          back: match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n')
        });
      }
      
      return cards;
    };

    let cleanText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    flashcards = extractFlashcards(cleanText);

    if (flashcards.length === 0 && content) {
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

    const flashcardsWithIds = flashcards.slice(0, count).map((card: { front: string; back: string }, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      front: card.front || "Question",
      back: card.back || "Answer",
    }));

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
