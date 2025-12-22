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
    const { content, type, title, settings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract settings with defaults
    const count = settings?.count || 8;
    const difficulty = settings?.difficulty || "medium";
    
    console.log(`Generating ${count} ${difficulty} quiz questions for ${type}: ${title || 'content'}`);

    const difficultyGuide = {
      easy: "Focus on basic definitions, simple facts, and straightforward concepts. Questions should be answerable by someone with basic familiarity.",
      medium: "Include a mix of factual recall and application questions. Require understanding of relationships between concepts.",
      hard: "Focus on analysis, synthesis, and edge cases. Include tricky questions that require deep understanding and critical thinking."
    };

    const systemPrompt = `You are an expert educator that creates engaging multiple choice quizzes.
Generate quiz questions that test understanding of key concepts.
Each question should have 4 options with exactly one correct answer.
Use LaTeX formatting for mathematical expressions: $formula$ for inline, $$formula$$ for display.

Difficulty level: ${difficulty.toUpperCase()}
${difficultyGuide[difficulty as keyof typeof difficultyGuide]}`;

    const userPrompt = `Based on this ${type === 'video' ? 'educational video transcript' : 'content'}:

${type === 'video' ? `"${title}"\n\n${content?.slice(0, 6000) || ''}` : content?.slice(0, 6000) || ''}

Generate exactly ${count} multiple choice quiz questions at ${difficulty} difficulty. Each question should:
- Test understanding of a key concept
- Have 4 answer options (A, B, C, D)
- Have exactly one correct answer
- Include a brief explanation for why the correct answer is right
- Use LaTeX for any math: $x^2$ or $$\\int f(x)dx$$

Return ONLY a JSON array with this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]`;

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

    let questions = [];
    try {
      // Remove markdown code blocks if present
      let jsonStr = responseText;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      questions = JSON.parse(jsonStr.trim());
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Failed to generate quiz");
    }

    const questionsWithIds = questions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    }));

    console.log(`Generated ${questionsWithIds.length} quiz questions`);

    return new Response(JSON.stringify({ 
      questions: questionsWithIds,
      source: type,
      title: title || 'Content Quiz',
      difficulty
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating quiz:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate quiz" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
