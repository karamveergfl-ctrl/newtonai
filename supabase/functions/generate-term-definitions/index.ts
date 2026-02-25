import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { session_id, slide_index, slide_content, slide_title } = await req.json();

    if (!session_id || slide_index === undefined || slide_index === null || !slide_content) {
      return new Response(JSON.stringify({ error: "Missing required fields: session_id, slide_index, slide_content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (slide_content.length < 15) {
      return new Response(JSON.stringify({ error: "Slide content too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate teacher owns the session
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session, error: sessionError } = await adminClient
      .from("live_sessions")
      .select("id, teacher_id, class_id")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.teacher_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden: not the session teacher" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-generation check
    const { data: existing } = await adminClient
      .from("slide_term_definitions")
      .select("*")
      .eq("session_id", session_id)
      .eq("slide_index", slide_index)
      .maybeSingle();

    if (existing) {
      if (existing.status === "ready") {
        return new Response(JSON.stringify({ success: true, definitions: existing }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (existing.status === "generating") {
        return new Response(JSON.stringify({ message: "Already generating" }), {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Insert or reset to generating
    if (!existing) {
      await adminClient.from("slide_term_definitions").insert({
        session_id,
        slide_index,
        status: "generating",
      });
    } else {
      await adminClient
        .from("slide_term_definitions")
        .update({ status: "generating", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    // AI Generation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert educational content creator. Your job is to identify the most important technical or subject-specific terms in a slide and provide clear, simple definitions that a student can understand at a glance. Definitions must be concise and use simple language. Avoid circular definitions. Always explain how the term is specifically used in the context of this slide.`;

    const userPrompt = `Identify the key terms from this slide content and define each one clearly.

Slide title: ${slide_title || "Untitled"}
Slide content: ${slide_content}

Rules:
- Extract 3 to 6 key terms maximum
- Only include subject-specific or technical terms (skip common words like 'the', 'and', 'because')
- Each definition: max 30 words, plain language
- Each context: max 20 words, specific to this slide
- If slide has fewer than 3 meaningful terms: extract as many as exist (minimum 1)
- If slide content is too generic or has no technical terms: return empty array

Return ONLY valid JSON array:
[
  {
    "term": "Photosynthesis",
    "definition": "The process by which plants use sunlight, water and CO2 to produce glucose and oxygen.",
    "context": "Used here to explain how plants make their own food during daylight hours."
  }
]`;

    let terms: Array<{ term: string; definition: string; context?: string }> | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: attempt === 0
                  ? userPrompt
                  : `Extract key terms from this text as a JSON array of objects with "term" and "definition" fields. Return ONLY JSON.\n\n${slide_content}`,
              },
            ],
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            console.error("Rate limited by AI gateway");
            continue;
          }
          console.error("AI gateway error:", aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const raw = aiData.choices?.[0]?.message?.content || "";

        // Extract JSON from response
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (!jsonMatch) continue;

        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) continue;

        // Filter valid items
        terms = parsed.filter(
          (item: Record<string, unknown>) =>
            typeof item.term === "string" &&
            item.term.length > 0 &&
            typeof item.definition === "string" &&
            item.definition.length > 0
        );
        break;
      } catch (e) {
        console.error(`AI attempt ${attempt + 1} failed:`, e);
      }
    }

    if (!terms) {
      await adminClient
        .from("slide_term_definitions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("session_id", session_id)
        .eq("slide_index", slide_index);

      return new Response(JSON.stringify({ error: "AI generation failed after 2 attempts" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save results
    const { data: updated, error: updateError } = await adminClient
      .from("slide_term_definitions")
      .update({
        terms: JSON.stringify(terms),
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", session_id)
      .eq("slide_index", slide_index)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to save definitions:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, definitions: updated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-term-definitions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
