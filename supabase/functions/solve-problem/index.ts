import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LATEX_HYGIENE } from "../_shared/latex-hygiene.ts";

interface Step {
  stepNumber: number;
  title: string;
  content: string;
  explanation: string;
}

const SOLVE_PROMPT = `You are an expert tutor writing a clear, teach-me-like-I'm-a-student solution to a homework problem.
Your reader is a student who wants to LEARN, not just get an answer. Explain like a patient teacher at a whiteboard.

YOU MUST RETURN VALID JSON ONLY. No markdown fences. No text before or after the JSON.

Return this exact JSON structure:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Short action title (4-8 words) e.g. 'Identify Forces and Set Up Axes'",
      "content": "The actual teaching content for this step (see CONTENT FORMAT below).",
      "explanation": "One or two plain-English sentences: WHY this step matters and what concept it uses. No math."
    }
  ],
  "finalAnswer": "See FINAL ANSWER FORMAT below."
}

═══════════════ CONTENT FORMAT (per step) ═══════════════
Each step's "content" must follow this teaching pattern in plain sentences + LaTeX math:

1. **Setup line** — one sentence in plain English saying what you are about to do.
2. **Equation** — the general (symbolic) equation on its own line in display math $$...$$
3. **Substitution** — plug in numbers, also in display math $$...$$
4. **Result** — the numerical answer with units, on its own line in display math $$...$$
5. **One-line takeaway** — a short sentence naming what this result physically means (only if useful).

Do NOT dump a wall of equations. Break into short paragraphs. Use blank lines between the setup sentence, the equations, and the takeaway.

═══════════════ MATH & FORMATTING RULES ═══════════════
- Use $...$ for inline math inside a sentence. Use $$...$$ for standalone equations on their own line.
- Never use \\\\[ \\\\] or \\\\( \\\\) delimiters.
- Every numerical value MUST have units wrapped as \\\\,\\\\text{kN}, \\\\,\\\\text{m}, \\\\,\\\\text{kN}\\\\cdot\\\\text{m}, etc.
- Fractions: \\\\frac{a}{b}. Powers: x^{2}. Square roots: \\\\sqrt{x}. Greek: \\\\alpha, \\\\theta.
- Sums for equilibrium: \\\\sum F_x = 0, \\\\sum F_y = 0, \\\\sum M_A = 0.
- Directions inline with math: \\\\leftarrow, \\\\rightarrow, \\\\uparrow, \\\\downarrow, \\\\circlearrowright (CW), \\\\circlearrowleft (CCW).
- Balance every $ and $$. Never mix markdown bold/italic INSIDE math delimiters.
- Show numerical substitution explicitly BEFORE giving the result — never skip to the answer.
- Reuse the exact same numeric values across steps (don't re-round differently).

═══════════════ HOW TO STRUCTURE THE STEPS ═══════════════
Choose the step layout that best fits the problem. For a typical statics/mechanics problem use roughly:
  Step 1 — Restate the problem and list every given (with units) and what is required.
  Step 2 — Draw the free-body diagram in words (list every force and its direction) and choose axes / sign convention.
  Step 3 — Work out the geometry needed (angles, lengths, moment arms) before applying equilibrium.
  Step 4 — Apply $\\\\sum F_x = 0$ symbolically, then substitute, then solve.
  Step 5 — Apply $\\\\sum F_y = 0$ symbolically, then substitute, then solve.
  Step 6 — Apply $\\\\sum M_{point} = 0$ about the fixed/pin point, with correct moment arms for EVERY force.
  Step 7 — Interpret the signs: state each result with its physical direction (leftward, upward, clockwise, etc.).

For non-mechanics problems (algebra, calculus, chemistry, physics), adapt but keep the same teaching pattern:
setup → equation → substitution → result → takeaway.

═══════════════ FINAL ANSWER FORMAT ═══════════════
"finalAnswer" is a single LaTeX string. Present each result on its own line as a boxed equation with units and direction:
$$\\\\boxed{E_x = 90\\\\,\\\\text{kN} \\\\;(\\\\leftarrow)}$$
$$\\\\boxed{E_y = 200\\\\,\\\\text{kN} \\\\;(\\\\uparrow)}$$
$$\\\\boxed{M_E = 180\\\\,\\\\text{kN}\\\\cdot\\\\text{m} \\\\;(\\\\text{clockwise})}$$
No prose before or after — just the boxed equations, one per line.

═══════════════ QUALITY BAR ═══════════════
- Never invent numbers. Use only values from the provided context.
- If a value is missing or unclear, state that explicitly in Step 1 and continue with the symbolic answer.
- Be thorough but not chatty. Aim for 5–8 steps for most problems.
- Every step must independently make sense — a student reading only that step should understand what and why.

Problem to solve:`;

function parseSolveResponse(rawText: string): { steps: Step[]; finalAnswer: string } {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.steps || !Array.isArray(parsed.steps)) throw new Error('Missing steps array');
    if (!parsed.finalAnswer || typeof parsed.finalAnswer !== 'string') throw new Error('Missing finalAnswer');
    const validatedSteps: Step[] = parsed.steps.map((step: Partial<Step>, index: number) => ({
      stepNumber: Number(step?.stepNumber ?? index + 1),
      title: String(step?.title ?? `Step ${index + 1}`),
      content: String(step?.content ?? ''),
      explanation: String(step?.explanation ?? ''),
    }));
    return { steps: validatedSteps, finalAnswer: parsed.finalAnswer };
  } catch (parseError) {
    console.error('JSON parse failed, attempting recovery:', parseError);
    return {
      steps: [{ stepNumber: 1, title: 'Solution', content: cleaned, explanation: 'Full solution provided above.' }],
      finalAnswer: 'See solution above.',
    };
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Check rate limit (50 requests per hour for solve - more expensive)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: 'solve-problem',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { structuredProblem, extractedText } = await req.json();
    
    if (!structuredProblem && !extractedText) {
      throw new Error('No problem data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Solving problem...');

    const problemContext = structuredProblem
      ? `Problem: ${structuredProblem.problemStatement}
Given: ${structuredProblem.given || 'N/A'}
Find: ${structuredProblem.find || 'N/A'}
Topic: ${structuredProblem.topic || 'General'}

RAW VISION EXTRACTION (authoritative — includes figure elements, dimensions, forces):
${extractedText || 'N/A'}`
      : extractedText;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: SOLVE_PROMPT + '\n\n' + LATEX_HYGIENE
        }, {
          role: 'user',
          content: problemContext
        }],
        max_tokens: 8192,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const solution = parseSolveResponse(content);

    console.log('Problem solved successfully, steps:', solution.steps.length);

    return new Response(
      JSON.stringify({
        success: true,
        steps: solution.steps,
        finalAnswer: solution.finalAnswer || ''
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Solve problem error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
