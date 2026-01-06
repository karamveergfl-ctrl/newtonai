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
Topic: ${structuredProblem.topic || 'General'}`
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
          content: `You are an expert tutor solving mathematical and scientific problems. Provide clear, step-by-step solutions.

FORMATTING RULES:
1. Use LaTeX notation for ALL mathematical expressions:
   - Inline math: $expression$
   - Display math: $$expression$$
   - Fractions: $\\frac{numerator}{denominator}$
   - Powers: $x^{2}$
   - Square roots: $\\sqrt{x}$
   - Greek letters: $\\alpha$, $\\beta$, $\\theta$

2. Structure your response as JSON with:
   - steps: Array of solution steps, each with:
     - stepNumber: Number
     - title: Brief step title
     - content: Detailed explanation with LaTeX math
     - explanation: Optional deeper explanation
   - finalAnswer: The boxed final answer using LaTeX

3. Be thorough but concise. Show all work.
4. Include units where applicable.
5. Explain the reasoning behind each step.`
        }, {
          role: 'user',
          content: `Solve this problem step by step:\n\n${problemContext}`
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
    
    let solution;
    try {
      solution = JSON.parse(content);
    } catch {
      // If JSON parsing fails, create a single-step solution
      solution = {
        steps: [{
          stepNumber: 1,
          title: 'Solution',
          content: content,
          explanation: ''
        }],
        finalAnswer: 'See solution above'
      };
    }

    // Ensure steps array exists
    if (!solution.steps || !Array.isArray(solution.steps)) {
      solution.steps = [{
        stepNumber: 1,
        title: 'Solution',
        content: solution.solution || content,
        explanation: ''
      }];
    }

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
