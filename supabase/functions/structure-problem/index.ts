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
          content: `You structure a homework/exam problem from a vision-extracted transcript.

The input may include labelled sections: PROBLEM STATEMENT, FIGURE ELEMENTS, GIVEN VALUES, FIND, UNCLEAR ITEMS, CONFIDENCE. Preserve ALL of that information — never drop figure geometry, dimensions, force vectors, labels, or numeric values.

Return a JSON object with:
- problemStatement: Main problem/question (LaTeX for math). Include a short "Figure:" paragraph summarizing the diagram if FIGURE ELEMENTS is present.
- given: Bullet-style multiline string with EVERY numeric value, label, dimension, force, and geometric relation from GIVEN VALUES and FIGURE ELEMENTS. Use LaTeX (e.g. "- $T = 150\\,\\text{kN}$ (cable DF)"). Do NOT summarize away figure data.
- find: What must be determined, verbatim from FIND.
- topic: Subject area (e.g. "Engineering Mechanics - Statics", "Physics - Kinematics").
- difficulty: "easy" | "medium" | "hard"
- type: "calculation" | "proof" | "word_problem" | "equation_solving"

Rules: never invent numbers. If a value is [unclear], keep it marked. Use LaTeX for all math (e.g. $v = 20\\,\\text{m/s}$).`
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
    
    let structuredProblem;
    try {
      structuredProblem = JSON.parse(content);
    } catch {
      structuredProblem = {
        problemStatement: extractedText,
        given: '',
        find: '',
        topic: 'General',
        difficulty: 'medium',
        type: 'calculation'
      };
    }

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
