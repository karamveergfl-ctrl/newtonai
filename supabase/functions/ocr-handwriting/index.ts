import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Check rate limit (50 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'ocr-handwriting',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { imageData } = await req.json();
    
    // Validate image is provided
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'No image provided. Please capture or upload an image.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check size limit (10MB for base64, which is ~7.5MB actual image)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    if (imageData.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Image size exceeds 10MB limit. Please use a smaller image.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate base64 image format
    const validImagePattern = /^data:image\/(png|jpeg|jpg|webp|gif|bmp);base64,/i;
    if (!validImagePattern.test(imageData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Supported formats: PNG, JPEG, WebP, GIF, BMP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: [{ type: "text", text: "Transcribe all handwritten text with 100% accuracy. Preserve structure, use Markdown tables, LaTeX for math ($...$, $$...$$). Return ONLY the converted text." }, { type: "image_url", image_url: { url: imageData } }] }], temperature: 0.3 }) });
    if (!response.ok) { if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }); if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }); throw new Error(`AI API error: ${response.status}`); }
    const data = await response.json();
    return new Response(JSON.stringify({ text: data.choices[0].message.content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) { console.error("Error:", error); return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process handwriting" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
});
