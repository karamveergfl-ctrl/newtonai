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

function buildSystemPrompt(targetLanguage: string, difficulty: string, questionTypes: string[], includeExplanations: boolean) {
  const difficultyGuide: Record<string, string> = {
    easy: "Focus on basic definitions, simple facts.",
    medium: "Include factual recall and application questions.",
    hard: "Focus on analysis, synthesis, and edge cases.",
    adaptive: "Generate a mix: 30% easy, 40% medium, 30% hard. Tag each question with its difficulty level.",
  };

  const typeInstructions: Record<string, string> = {
    mcq: `"mcq" — 4 options (A–D), one correct. Format: { "type": "mcq", "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "difficulty": "medium" }`,
    true_false: `"true_false" — a statement that is true or false. Format: { "type": "true_false", "question": "Statement...", "correctAnswer": true, "difficulty": "easy" }`,
    fill_blank: `"fill_blank" — a sentence with a blank (use "___"). Format: { "type": "fill_blank", "sentence": "The ___ is...", "correctAnswer": "mitochondria", "difficulty": "medium" }`,
    short_answer: `"short_answer" — an open-ended question with a short expected answer. Format: { "type": "short_answer", "question": "...", "correctAnswer": "expected answer", "rubric": "key points to look for", "difficulty": "hard" }`,
    match: `"match" — 4-5 pairs to match. Format: { "type": "match", "instruction": "Match the following:", "pairs": [{"left":"term","right":"definition"}], "difficulty": "medium" }`,
  };

  const activeTypes = questionTypes.map(t => typeInstructions[t]).filter(Boolean).join("\n");
  const explanationNote = includeExplanations
    ? 'Add "explanation": "one sentence explanation" to every question.'
    : 'Do NOT include explanations.';

  return `You are an expert educator that creates engaging quizzes with multiple question types.

CRITICAL: Generate ALL quiz content in ${targetLanguage}.

Question types to generate (distribute evenly):
${activeTypes}

${explanationNote}

Difficulty: ${difficulty.toUpperCase()}
${difficultyGuide[difficulty] || difficultyGuide.medium}

Use LaTeX: $formula$ for inline math.
Return ONLY a JSON array of question objects. No markdown fences.`;
}

function buildUserPrompt(content: string, type: string, title: string | undefined, count: number, difficulty: string, targetLanguage: string, questionTypes: string[]) {
  const typesStr = questionTypes.join(", ");
  return `Based on this ${type === 'video' ? 'educational video transcript' : 'content'}:

${type === 'video' ? `"${title}"\n\n${content?.slice(0, 6000) || ''}` : content?.slice(0, 6000) || ''}

Generate exactly ${count} quiz questions at ${difficulty} difficulty IN ${targetLanguage}.
Distribute among these types: ${typesStr}.
ALL content must be in ${targetLanguage}.

Return ONLY a JSON array.`;
}

function extractQuestions(text: string): any[] {
  // Method 1: Find JSON array
  const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      let jsonStr = arrayMatch[0].replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.log("Array parse failed:", e);
    }
  }

  // Method 2: Extract question objects individually (MCQ fallback)
  const items: any[] = [];
  const qPattern = /"question"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  const oPattern = /"options"\s*:\s*\[((?:[^\]]*?))\]/g;
  const cPattern = /"correctIndex"\s*:\s*(\d+)/g;

  let qMatch, oMatch, cMatch;
  const questionTexts: string[] = [];
  const options: string[][] = [];
  const correctIndices: number[] = [];

  while ((qMatch = qPattern.exec(text)) !== null) questionTexts.push(qMatch[1]);
  while ((oMatch = oPattern.exec(text)) !== null) {
    const opts = oMatch[1].match(/"((?:[^"\\]|\\.)*)"/g)?.map(s => s.replace(/^"|"$/g, '')) || [];
    options.push(opts);
  }
  while ((cMatch = cPattern.exec(text)) !== null) correctIndices.push(parseInt(cMatch[1]));

  for (let i = 0; i < questionTexts.length; i++) {
    if (options[i]?.length >= 4) {
      items.push({
        type: "mcq",
        question: questionTexts[i],
        options: options[i].slice(0, 4),
        correctIndex: correctIndices[i] || 0,
        explanation: "Based on the content provided.",
      });
    }
  }
  return items;
}

function validateQuestion(q: any): any | null {
  if (!q || !q.type) {
    // Legacy MCQ format without type
    if (q?.question && Array.isArray(q?.options) && q.options.length >= 4 && typeof q?.correctIndex === 'number') {
      return {
        type: "mcq",
        question: q.question,
        options: q.options.slice(0, 4),
        correctIndex: Math.min(Math.max(0, q.correctIndex), 3),
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
      };
    }
    return null;
  }

  switch (q.type) {
    case "mcq":
      if (!q.question || !Array.isArray(q.options) || q.options.length < 4 || typeof q.correctIndex !== 'number') return null;
      return {
        type: "mcq",
        question: q.question,
        options: q.options.slice(0, 4),
        correctIndex: Math.min(Math.max(0, q.correctIndex), 3),
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
      };
    case "true_false":
      if (!q.question || typeof q.correctAnswer !== 'boolean') return null;
      return {
        type: "true_false",
        question: q.question,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
      };
    case "fill_blank":
      if (!q.sentence || !q.correctAnswer) return null;
      return {
        type: "fill_blank",
        sentence: q.sentence,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
      };
    case "short_answer":
      if (!q.question || !q.correctAnswer) return null;
      return {
        type: "short_answer",
        question: q.question,
        correctAnswer: q.correctAnswer,
        rubric: q.rubric || "",
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
      };
    case "match":
      if (!Array.isArray(q.pairs) || q.pairs.length < 2) return null;
      return {
        type: "match",
        instruction: q.instruction || "Match the following:",
        pairs: q.pairs.filter((p: any) => p.left && p.right),
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
      };
    default:
      return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check rate limit (50 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'generate-quiz',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { content, type, title, settings, language = "en", stream = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = settings?.count || 8;
    const difficulty = settings?.difficulty || "medium";
    const questionTypes: string[] = settings?.questionTypes || ["mcq"];
    const includeExplanations = settings?.includeExplanations !== false;
    const targetLanguage = languageNames[language] || "English";

    console.log(`Generating ${count} ${difficulty} quiz questions (types: ${questionTypes.join(",")}) in ${targetLanguage} for ${type}: ${title || 'content'}`);

    const systemPrompt = buildSystemPrompt(targetLanguage, difficulty, questionTypes, includeExplanations);
    const userPrompt = buildUserPrompt(content, type, title, count, difficulty, targetLanguage, questionTypes);

    const aiBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    };

    // SSE streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const sendProgress = (controller: ReadableStreamDefaultController, data: { stage: string; progress: number; message?: string }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", ...data })}\n\n`));
      };

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            sendProgress(controller, { stage: "analyzing", progress: 15, message: "Analyzing content..." });
            sendProgress(controller, { stage: "generating", progress: 40, message: "Newton is creating quiz questions..." });

            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify(aiBody)
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("AI error:", response.status, errorText);
              throw new Error(response.status === 429 ? "Rate limit exceeded." : response.status === 402 ? "Payment required." : "AI gateway error");
            }

            sendProgress(controller, { stage: "processing", progress: 75, message: "Processing quiz questions..." });

            const data = await response.json();
            let responseText = data.choices?.[0]?.message?.content || '';
            let cleanText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            let questions = extractQuestions(cleanText);
            questions = questions.map(validateQuestion).filter(Boolean);

            if (questions.length === 0) {
              throw new Error("Could not generate quiz questions. Please try with different content.");
            }

            const questionsWithIds = questions.slice(0, count).map((q: any, i: number) => ({
              id: `q-${Date.now()}-${i}`,
              ...q,
            }));

            sendProgress(controller, { stage: "complete", progress: 100, message: "Quiz ready!" });

            const result = { questions: questionsWithIds, source: type, title: title || 'Content Quiz', difficulty };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", data: result })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Error generating quiz:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Failed to generate quiz" })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Non-streaming response
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(aiBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let responseText = data.choices?.[0]?.message?.content || '';
    console.log("AI Response preview:", responseText.slice(0, 300));

    let cleanText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let questions = extractQuestions(cleanText);
    questions = questions.map(validateQuestion).filter(Boolean);

    console.log(`Extracted ${questions.length} valid questions`);

    if (questions.length === 0) {
      throw new Error("Could not generate quiz questions. Please try with different content.");
    }

    const questionsWithIds = questions.slice(0, count).map((q: any, i: number) => ({
      id: `q-${Date.now()}-${i}`,
      ...q,
    }));

    return new Response(JSON.stringify({ questions: questionsWithIds, source: type, title: title || 'Content Quiz', difficulty }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate quiz" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
