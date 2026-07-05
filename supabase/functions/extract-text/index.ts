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
      p_function_name: 'extract-text',
      p_max_requests: 100,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64, mimeType } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Extracting text from image using Gemini 2.5 Flash Vision...');

    const VISION_PROMPT = `You are an expert at reading engineering and physics diagrams.
Carefully examine this image and extract ALL information you can see.

Return your response in plain text using this EXACT format — do not use JSON, do not use markdown headers:

PROBLEM STATEMENT:
Write the complete problem statement as given in the image, word for word.

FIGURE ELEMENTS:
- List every labeled point (A, B, C, D, E, F, etc.) and describe their position and role
- List every force arrow: direction, magnitude, and where it is applied
- List every support: type (fixed, pin, roller, cable) and location
- List every structural member and how they connect
- List every dimension line with its numerical value and unit

GIVEN VALUES:
- List every numerical value with its unit and what it represents
- Example: T = 150 kN (tension in cable DF)
- Example: Spacing between loads = 1.8 m

GEOMETRY:
- Describe the coordinate layout (which direction is horizontal, vertical)
- Describe how members are connected
- Describe the path of any cables, ropes, or strings

WHAT TO FIND:
State clearly what the problem is asking to calculate.

Be extremely precise with numbers. Do not guess any value — only report what is visible in the image.
If a value is unclear, write "unclear" rather than guessing.`;

    const callVision = async (extraInstruction = '') => {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: VISION_PROMPT + (extraInstruction ? `\n\nADDITIONAL INSTRUCTION: ${extraInstruction}` : '') },
              { type: 'image_url', image_url: { url: `data:${mimeType || 'image/png'};base64,${imageBase64}` } }
            ]
          }],
          max_tokens: 4096
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${res.status}`);
      }
      const json = await res.json();
      return (json.choices?.[0]?.message?.content || '') as string;
    };

    const extractedText = await callVision();

    console.log('Text extraction successful, length:', extractedText.length);

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: extractedText.trim(),
        confidence: 0.95
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Extract text error:', error);
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
