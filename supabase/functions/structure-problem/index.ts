import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRUCTURE_PROMPT = `You are an expert at reading physics and engineering problem descriptions and extracting structured data.
Read the following problem description (which was extracted from an image or typed by a student) and return a JSON object.

YOU MUST RETURN VALID JSON ONLY. No markdown. No code fences. No explanation outside the JSON.

Return this exact structure:
{
  "subject": "The academic subject. Examples: Engineering Mechanics, Physics, Mathematics, Chemistry, Biology",
  "topic": "The specific topic. Examples: Statics - Frame Analysis, Kinematics, Integration, Thermodynamics",
  "difficulty": "Easy, Medium, or Hard",
  "given": ["List each given value as a string", "T = 150 kN", "Four loads of 20 kN each"],
  "find": "A single sentence describing what must be found. Example: Find the reaction forces Ex, Ey and moment ME at fixed support E.",
  "problemStatement": "A complete 2-3 sentence description of the problem in plain English that a student can understand.",
  "assumptions": ["List any assumptions", "Static equilibrium", "2D planar problem", "Rigid body"]
}

Input problem description:`;

function parseStructureResponse(rawText: string, fallback: string): any {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  try {
    const parsed = JSON.parse(cleaned);
    // Normalize given to string for the existing UI which uses <MixedContent content={given} />
    if (Array.isArray(parsed.given)) {
      parsed.given = parsed.given.map((g: string) => `- ${g}`).join('\n');
    }
    return {
      subject: parsed.subject || 'General',
      topic: parsed.topic || parsed.subject || 'General',
      difficulty: (parsed.difficulty || 'Medium').toString(),
      given: parsed.given || '',
      find: parsed.find || '',
      problemStatement: parsed.problemStatement || fallback,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      type: parsed.type || 'calculation',
    };
  } catch (err) {
    console.error('Structure JSON parse failed:', err);
    return {
      subject: 'General',
      topic: 'General',
      difficulty: 'Medium',
      given: '',
      find: '',
      problemStatement: fallback,
      assumptions: [],
      type: 'calculation',
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

    // Check rate limit (100 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: 'structure-problem',
      p_max_requests: 100,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { extractedText } = await req.json();
    
    if (!extractedText) {
      throw new Error('No text provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Structuring problem from text...');

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
          content: STRUCTURE_PROMPT
        }, {
          role: 'user',
          content: extractedText
        }],
        max_tokens: 2048,
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
    const structuredProblem = parseStructureResponse(content, extractedText.slice(0, 500));

    console.log('Problem structured successfully:', structuredProblem.topic);

    return new Response(
      JSON.stringify({
        success: true,
        structuredProblem
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Structure problem error:', error);
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
