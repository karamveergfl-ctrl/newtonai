import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PoseType = "thinking" | "writing" | "completed";

const BASE_STYLE = `Plush toy style character inspired by Isaac Newton, soft felt fabric texture, stitched plush seams, rounded proportions, curly light beige hair, rosy cheeks, simple black dot eyes, friendly academic look, red 18th-century coat with white cravat, cozy and calming aesthetic, clean white or soft pastel background, mobile app friendly, no text, no watermark, 512x512 size.`;

const POSE_PROMPTS: Record<PoseType, string> = {
  thinking: `${BASE_STYLE}
POSE: One hand on chin thinking deeply with contemplative expression, other hand holding a pencil near face, head tilted slightly to one side, eyes looking upward in thought, small lightbulb floating softly above head, floating dots rising gently around the character.
Animation-ready pose with clear separation between: Head, Hair_Front, Hair_Back, Eyes, Mouth, Arm_Right, Hand_Right, Pencil, Lightbulb, Glow, Floating_Dots layers.`,

  writing: `${BASE_STYLE}
POSE: Actively writing with pencil in right hand, arm extended forward making writing motion, focused determined expression looking down at work, slight forward lean posture, sheets of paper visible nearby, writing action pose.
Animation-ready pose with clear separation between: Head, Hair_Front, Hair_Back, Eyes, Mouth, Arm_Right, Hand_Right, Pencil, Paper_1, Paper_2 layers.`,

  completed: `${BASE_STYLE}
POSE: Right arm raised high giving enthusiastic thumbs up gesture, eyes closed in happy squint expression, big cheerful open smile showing joy, triumphant victorious celebratory pose, glowing lightbulb above head, sparkles and stars floating around, radiating success.
Animation-ready pose with clear separation between: Head, Hair_Front, Hair_Back, Eyes, Mouth, Arm_Right, Hand_Right, Lightbulb, Glow layers.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const { data: allowed, error: rateLimitError } = await supabase.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "generate-newton-pose",
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { pose } = await req.json() as { pose: PoseType };

    if (!pose || !POSE_PROMPTS[pose]) {
      return new Response(
        JSON.stringify({ error: 'Invalid pose type. Use: thinking, writing, or completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating Newton pose: ${pose}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: POSE_PROMPTS[pose]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    console.log(`Successfully generated ${pose} pose`);

    return new Response(
      JSON.stringify({ 
        success: true,
        pose,
        image: imageUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating Newton pose:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate pose',
        details: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
