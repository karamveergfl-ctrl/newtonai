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

    console.log('Extracting text from image using Gemini 2.5 Pro Vision...');

    const VISION_PROMPT = `You are an expert vision system reading a homework or exam problem image. It may contain engineering/physics diagrams (frames, trusses, beams), figures, force vectors, dimensions, geometry, labels, or plain text.

Return a single response with these sections in order, using EXACT headings:

PROBLEM STATEMENT:
<Transcribe the printed problem text verbatim. Preserve wording, units, and punctuation. If part is unreadable, mark it [unclear].>

FIGURE ELEMENTS:
<If a diagram/figure is present, list every visible element as bullet points. Include:
 - Labeled points (A, B, C, ...)
 - Force arrows with magnitude, direction, and point of application (e.g. "20 kN downward at B")
 - Support types (fixed, pin, roller, cable) and locations
 - All dimensions with units (e.g. "AB = 1.8 m horizontal", "wall height = 2.25 m")
 - Geometry (angles, cables, members between points)
If no figure, write: None.>

GIVEN VALUES:
<Bullet list of every numeric value with symbol and unit, e.g. "T = 150 kN", "L = 7.2 m". Include values from both text and figure.>

FIND:
<What the problem asks to determine, verbatim.>

UNCLEAR ITEMS:
<Bullet list of anything you cannot read with high confidence. If none, write: None.>

CONFIDENCE: high | medium | low

Rules:
- Read digits and units character by character. Do NOT invent values.
- Preserve LaTeX for equations ($x^2$, $\\frac{a}{b}$).
- Do NOT solve the problem. Extraction only.`;

    const callVision = async (extraInstruction = '') => {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
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

    let extractedText = await callVision();

    // Confidence / completeness check → retry once with stricter instruction
    const needsRetry = (() => {
      if (!extractedText || extractedText.trim().length < 20) return true;
      if (/CONFIDENCE:\s*low/i.test(extractedText)) return true;
      const unclearMatch = extractedText.match(/UNCLEAR ITEMS:\s*([\s\S]*?)(?:\n[A-Z ]+:|$)/);
      if (unclearMatch && !/^\s*none\.?\s*$/i.test(unclearMatch[1].trim())) return true;
      const hasFigureMention = /FIGURE ELEMENTS:\s*(?!\s*None)/i.test(extractedText);
      const hasGivens = /GIVEN VALUES:\s*[-*•]/i.test(extractedText);
      if (hasFigureMention && !hasGivens) return true;
      return false;
    })();

    if (needsRetry) {
      console.log('Extraction flagged as low-confidence, retrying with stricter prompt...');
      try {
        const retryText = await callVision(
          'Re-read the image extremely carefully. Zoom in on every label, digit, and unit. For each ambiguous character, list both interpretations. Ensure every dimension, force, and label from the figure is captured.'
        );
        if (retryText && retryText.length > extractedText.length * 0.7) {
          extractedText = retryText;
        }
      } catch (retryErr) {
        console.warn('Retry failed, keeping first pass:', retryErr);
      }
    }

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
