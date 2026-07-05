import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LATEX_HYGIENE } from "../_shared/latex-hygiene.ts";

interface Step {
  stepNumber: number;
  title: string;
  content: string;
  explanation: string;
}

const SOLVE_PROMPT = `You are an expert tutor solving a student's homework problem step by step.
You will be given a structured problem description. Solve it completely.

YOU MUST RETURN VALID JSON ONLY. No markdown outside the JSON. No code fences. No preamble. No explanation outside the JSON structure.

Return this exact JSON structure:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title describing what this step does",
      "content": "Full step content with all math in LaTeX. Use $...$ for inline math and $$...$$ for display math equations. Show ALL working.",
      "explanation": "Why this step is needed and what concept it uses."
    }
  ],
  "finalAnswer": "The complete final answer with all results in LaTeX. Example: $$E_x = 90\\\\,\\\\text{kN} \\\\leftarrow$$ $$E_y = 200\\\\,\\\\text{kN} \\\\uparrow$$ $$M_E = 180\\\\,\\\\text{kN}\\\\cdot\\\\text{m (clockwise)}$$"
}

REQUIREMENTS FOR EACH STEP:
1. Number steps sequentially starting from 1
2. Each step title must be a clear action: "Calculate Cable Angle", "Apply Moment Equilibrium", etc.
3. Write ALL mathematical expressions in LaTeX enclosed in $...$ or $$...$$
4. For display equations (standalone on their own line), use $$...$$
5. For inline equations within text sentences, use $...$
6. Show numerical substitution explicitly before giving the result
7. State the sign convention clearly in the step where you set up equilibrium
8. For the final answer: box each reaction component separately using $$\\\\boxed{...}$$
9. Include units in EVERY numerical result using \\\\text{kN} or \\\\text{kN}\\\\cdot\\\\text{m}
10. DO NOT use \\\\[ \\\\] or \\\\( \\\\) — use ONLY $$ and $ delimiters

CRITICAL FOR STATICS/MECHANICS PROBLEMS:
- Step 1: Always identify ALL external forces and their directions
- Step 2: Determine geometry (cable angles, distances) before applying equilibrium
- Step 3: Set up coordinate system and sign convention explicitly
- Step 4: Apply ΣFx = 0
- Step 5: Apply ΣFy = 0
- Step 6: Apply ΣMpoint = 0 with correct moment arms for EVERY force
- Step 7: State final answers with directions (leftward/rightward, upward/downward, CW/CCW)

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
        max_tokens: 4096,
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
