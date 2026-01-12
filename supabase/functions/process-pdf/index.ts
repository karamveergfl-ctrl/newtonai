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

    // Check rate limit (30 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'process-pdf',
      p_max_requests: 30,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { pdfContent, fileName } = await req.json();
    const pdfBytes = Uint8Array.from(atob(pdfContent), c => c.charCodeAt(0));
    const text = new TextDecoder().decode(pdfBytes).replace(/[^\x20-\x7E\n]/g, '').slice(0, 20000);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!LOVABLE_API_KEY || !YOUTUBE_API_KEY) throw new Error("API keys not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: "Extract 5-8 main topics with headings and summaries. Return JSON array." }, { role: "user", content: `Analyze and extract topics from:\n${text.slice(0, 15000)}` }] }) });
    let topics = [];
    if (aiResponse.ok) { const data = await aiResponse.json(); try { const content = data.choices[0].message.content; const jsonMatch = content.match(/\[[\s\S]*\]/); topics = jsonMatch ? JSON.parse(jsonMatch[0]) : []; } catch { topics = [{ heading: "Main Topic", summary: "AI extraction failed" }]; } }

    const topicsWithVideos = await Promise.all(topics.map(async (topic: any) => {
      const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(topic.heading + " educational")}&type=video&key=${YOUTUBE_API_KEY}`);
      const videos = ytRes.ok ? (await ytRes.json()).items?.map((i: any) => ({ id: i.id.videoId, videoId: i.id.videoId, title: i.snippet.title, thumbnail: i.snippet.thumbnails.medium.url, channelTitle: i.snippet.channelTitle })) || [] : [];
      return { ...topic, videos };
    }));
    return new Response(JSON.stringify({ topics: topicsWithVideos }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) { console.error("Error:", error); return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
});
