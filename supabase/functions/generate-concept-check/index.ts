import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;
const VALID_ANSWERS = ["a", "b", "c", "d"] as const;

interface ConceptCheckQuestion {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

function buildSystemPrompt(): string {
  return `You are an expert teacher creating a quick understanding check question. Generate exactly ONE multiple choice question based on the provided content. The question should test genuine understanding, not just recall. Make all 4 options plausible — wrong answers should be common misconceptions, not obviously wrong. Keep the question concise (max 20 words). Keep each option concise (max 10 words each).`;
}

function buildUserPrompt(slideContext: string, difficulty: string): string {
  return `Content being taught right now:
${slideContext}

Difficulty: ${difficulty}

Return ONLY valid JSON in this exact format:
{"question": "string", "option_a": "string", "option_b": "string", "option_c": "string", "option_d": "string", "correct_answer": "a" | "b" | "c" | "d", "explanation": "string (1-2 sentences explaining why correct answer is right)"}`;
}

function buildRetryPrompt(slideContext: string, difficulty: string): string {
  return `Generate ONE multiple choice question about this content. Difficulty: ${difficulty}.

Content: ${slideContext.slice(0, 2000)}

Respond with ONLY this JSON (no markdown, no backticks):
{"question":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"a","explanation":"..."}`;
}

function parseQuestionJson(text: string): ConceptCheckQuestion | null {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (validateQuestion(parsed)) return parsed;
  } catch { /* fallthrough */ }

  // Try extracting JSON object
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]);
      if (validateQuestion(parsed)) return parsed;
    } catch { /* fallthrough */ }
  }

  return null;
}

function validateQuestion(q: Record<string, unknown>): q is ConceptCheckQuestion {
  return (
    typeof q.question === "string" &&
    typeof q.option_a === "string" &&
    typeof q.option_b === "string" &&
    typeof q.option_c === "string" &&
    typeof q.option_d === "string" &&
    typeof q.correct_answer === "string" &&
    (VALID_ANSWERS as readonly string[]).includes(q.correct_answer) &&
    typeof q.explanation === "string"
  );
}

async function callAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    if (response.status === 429)
      throw Object.assign(new Error("AI rate limit exceeded"), { status: 429 });
    if (response.status === 402)
      throw Object.assign(new Error("Payment required"), { status: 402 });
    throw new Error("AI gateway error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse body ──
    const body = await req.json();
    const sessionId: string | undefined = body.session_id;
    const slideContext: string | undefined = body.slide_context;
    const difficulty: string = body.difficulty || "medium";

    if (!sessionId || !slideContext || slideContext.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "session_id and slide_context are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!(VALID_DIFFICULTIES as readonly string[]).includes(difficulty)) {
      return new Response(
        JSON.stringify({ error: "difficulty must be easy, medium, or hard" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Verify teacher owns the session ──
    const { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select("id, class_id, teacher_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.teacher_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Only the session teacher can generate concept checks" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Rate limit: 1 concept check per session per 60s ──
    const { data: recentChecks } = await supabaseAdmin
      .from("concept_checks")
      .select("created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentChecks && recentChecks.length > 0) {
      const lastCreated = new Date(recentChecks[0].created_at).getTime();
      const elapsed = Date.now() - lastCreated;
      const cooldownMs = 60_000;
      if (elapsed < cooldownMs) {
        const retryAfter = Math.ceil((cooldownMs - elapsed) / 1000);
        return new Response(
          JSON.stringify({
            error: "Please wait before starting another check",
            retry_after_seconds: retryAfter,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Generate question via AI (with 1 retry) ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt();
    let question: ConceptCheckQuestion | null = null;

    // Attempt 1
    const attempt1 = await callAI(
      LOVABLE_API_KEY,
      systemPrompt,
      buildUserPrompt(slideContext.slice(0, 4000), difficulty)
    );
    question = parseQuestionJson(attempt1);

    // Attempt 2 (retry with simpler prompt)
    if (!question) {
      console.log("First attempt failed, retrying with simpler prompt");
      const attempt2 = await callAI(
        LOVABLE_API_KEY,
        "You generate quiz questions. Respond with ONLY valid JSON.",
        buildRetryPrompt(slideContext, difficulty)
      );
      question = parseQuestionJson(attempt2);
    }

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Failed to generate a valid question after 2 attempts" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Insert into concept_checks ──
    const { data: conceptCheck, error: insertError } = await supabaseAdmin
      .from("concept_checks")
      .insert({
        session_id: sessionId,
        question: question.question,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        slide_context: slideContext.slice(0, 4000),
        status: "active",
        duration_seconds: 30,
      })
      .select()
      .single();

    if (insertError || !conceptCheck) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save concept check");
    }

    return new Response(
      JSON.stringify({ success: true, concept_check: conceptCheck }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("generate-concept-check error:", error);
    const err = error as { status?: number; message?: string };
    const status = err.status || 500;
    return new Response(
      JSON.stringify({
        error: err.message || "An unexpected error occurred",
      }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
