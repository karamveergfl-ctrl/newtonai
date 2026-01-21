import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PoseType = "thinking" | "writing" | "completed";

const POSE_PROMPTS: Record<PoseType, string> = {
  thinking: `Cute chibi kawaii Isaac Newton character, curly cream-colored powdered wig, round black dot eyes, rosy pink cheeks, red velvet coat with gold buttons, white cravat neck scarf, blue vest underneath, dark navy pants, brown boots. 
POSE: One hand on chin thinking deeply with contemplative expression, other hand holding a pencil near face, head tilted slightly to one side, eyes looking upward in thought, small lightbulb floating above head glowing softly.
Style: Soft pastel colors, plush toy aesthetic like a stuffed doll, clean white background, cute chibi proportions with big head small body, digital illustration, high quality render.`,

  writing: `Cute chibi kawaii Isaac Newton character, curly cream-colored powdered wig, round black dot eyes, rosy pink cheeks, red velvet coat with gold buttons, white cravat neck scarf, blue vest underneath, dark navy pants, brown boots.
POSE: Actively writing with pencil in right hand, arm extended forward making writing motion on paper, focused determined expression looking down at work, slight forward lean posture, sheets of paper with mathematical equations visible nearby.
Style: Soft pastel colors, plush toy aesthetic like a stuffed doll, clean white background, cute chibi proportions with big head small body, digital illustration, high quality render.`,

  completed: `Cute chibi kawaii Isaac Newton character, curly cream-colored powdered wig, round black dot eyes closed in happy squint expression, rosy pink cheeks, big cheerful open smile showing happiness, red velvet coat with gold buttons, white cravat neck scarf, blue vest underneath, dark navy pants, brown boots.
POSE: Right arm raised high giving enthusiastic thumbs up gesture, left hand on hip confidently, triumphant victorious celebratory pose, sparkles and stars floating around, radiating joy and success.
Style: Soft pastel colors, plush toy aesthetic like a stuffed doll, clean white background, cute chibi proportions with big head small body, digital illustration, high quality render.`
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        model: "google/gemini-2.5-flash-image-preview",
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
