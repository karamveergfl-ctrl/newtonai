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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { content, type, title, settings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = settings?.count || 8;
    const difficulty = settings?.difficulty || "medium";
    console.log(`Generating ${count} ${difficulty} quiz questions for ${type}: ${title || 'content'}`);

    const difficultyGuide = { easy: "Focus on basic definitions, simple facts.", medium: "Include factual recall and application questions.", hard: "Focus on analysis, synthesis, and edge cases." };
    const systemPrompt = `You are an expert educator that creates engaging multiple choice quizzes. Generate quiz questions that test understanding. Each question should have 4 options with exactly one correct answer. Use LaTeX: $formula$ for inline. Difficulty: ${difficulty.toUpperCase()} ${difficultyGuide[difficulty as keyof typeof difficultyGuide]}`;
    const userPrompt = `Based on this ${type === 'video' ? 'educational video transcript' : 'content'}:\n\n${type === 'video' ? `"${title}"\n\n${content?.slice(0, 6000) || ''}` : content?.slice(0, 6000) || ''}\n\nGenerate exactly ${count} multiple choice quiz questions at ${difficulty} difficulty. Return ONLY a JSON array: [{"question": "?", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..."}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }) });
    if (!response.ok) { const errorText = await response.text(); console.error("AI error:", response.status, errorText); if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }); if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }); throw new Error("AI gateway error"); }

    const data = await response.json();
    let responseText = data.choices?.[0]?.message?.content || '';
    console.log("AI Response preview:", responseText.slice(0, 300));
    
    let questions: any[] = [];
    
    // Robust extraction
    const extractQuestions = (text: string): any[] => {
      const items: any[] = [];
      
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
      
      // Method 2: Extract question objects individually
      const qPattern = /"question"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      const oPattern = /"options"\s*:\s*\[((?:[^\]]*?))\]/g;
      const cPattern = /"correctIndex"\s*:\s*(\d+)/g;
      
      let qMatch, oMatch, cMatch;
      const questions: string[] = [];
      const options: string[][] = [];
      const correctIndices: number[] = [];
      
      while ((qMatch = qPattern.exec(text)) !== null) questions.push(qMatch[1]);
      while ((oMatch = oPattern.exec(text)) !== null) {
        const opts = oMatch[1].match(/"((?:[^"\\]|\\.)*)"/g)?.map(s => s.replace(/^"|"$/g, '')) || [];
        options.push(opts);
      }
      while ((cMatch = cPattern.exec(text)) !== null) correctIndices.push(parseInt(cMatch[1]));
      
      for (let i = 0; i < questions.length; i++) {
        if (options[i]?.length >= 4) {
          items.push({
            question: questions[i],
            options: options[i].slice(0, 4),
            correctIndex: correctIndices[i] || 0,
            explanation: "Based on the content provided."
          });
        }
      }
      
      return items;
    };
    
    // Clean and extract
    let cleanText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    questions = extractQuestions(cleanText);
    
    console.log(`Extracted ${questions.length} questions`);
    
    // Validate questions
    questions = questions.filter(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length >= 4 &&
      typeof q.correctIndex === 'number'
    ).map(q => ({
      question: q.question,
      options: q.options.slice(0, 4),
      correctIndex: Math.min(Math.max(0, q.correctIndex), 3),
      explanation: q.explanation || "This is the correct answer based on the content."
    }));
    
    if (questions.length === 0) {
      throw new Error("Could not generate quiz questions. Please try with different content.");
    }
    
    const questionsWithIds = questions.slice(0, count).map((q: any, i: number) => ({ 
      id: `q-${Date.now()}-${i}`, 
      question: q.question, 
      options: q.options, 
      correctIndex: q.correctIndex, 
      explanation: q.explanation 
    }));
    
    return new Response(JSON.stringify({ questions: questionsWithIds, source: type, title: title || 'Content Quiz', difficulty }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) { 
    console.error("Error generating quiz:", error); 
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate quiz" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); 
  }
});
