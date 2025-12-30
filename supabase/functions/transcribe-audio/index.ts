import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const { audio, mimeType = "audio/webm" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: "Transcribe audio accurately. Mark unclear parts as [inaudible]." }, { role: "user", content: [{ type: "text", text: "Please transcribe this audio:" }, { type: "input_audio", input_audio: { data: audio, format: mimeType.split('/')[1] || "webm" } }] }], max_tokens: 8000 }) });
    if (!response.ok) { if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }); if (response.status === 402) return new Response(JSON.stringify({ error: "Usage credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }); throw new Error(`Transcription failed: ${response.status}`); }
    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content;
    if (!transcription) throw new Error("No transcription generated");
    return new Response(JSON.stringify({ text: transcription }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) { console.error("Error:", error); return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Transcription failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
});
