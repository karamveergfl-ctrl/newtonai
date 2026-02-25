import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_TYPES = new Set([
  "heading",
  "key_point",
  "detail",
  "remember",
  "example",
]);

interface NoteItem {
  type: string;
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Parse body ---
    const {
      session_id,
      slide_index,
      slide_context,
      slide_title,
    } = await req.json();

    if (!session_id || slide_index === undefined || slide_index === null || !slide_context) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: session_id, slide_index, slide_context" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof slide_context !== "string" || slide_context.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Slide content too short to generate notes" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Verify teacher owns session ---
    const { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select("id, teacher_id, class_id")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (session.teacher_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Only the session teacher can generate notes" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Pre-generation check ---
    const { data: existing } = await supabase
      .from("session_slide_notes")
      .select("*")
      .eq("session_id", session_id)
      .eq("slide_index", slide_index)
      .maybeSingle();

    if (existing) {
      if (existing.status === "ready") {
        return new Response(
          JSON.stringify({ success: true, slide_notes: existing }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (existing.status === "generating") {
        return new Response(
          JSON.stringify({
            status: "generating",
            message: "Notes already being generated",
          }),
          {
            status: 202,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      // status = 'failed' → we'll retry, update existing row
    }

    // --- Insert or update placeholder row ---
    let noteRowId: string;

    if (existing) {
      // Re-use failed row
      const { error: updateErr } = await supabase
        .from("session_slide_notes")
        .update({ status: "generating", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updateErr) throw updateErr;
      noteRowId = existing.id;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("session_slide_notes")
        .insert({
          session_id,
          slide_index,
          slide_context: slide_context.trim(),
          slide_title: slide_title || null,
          status: "generating",
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      noteRowId = inserted.id;
    }

    // --- AI Generation ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert educational note-taker. Your job is to convert slide content into clear, structured study notes for students. Notes must be concise, scannable, and genuinely useful for a student reviewing this topic. Focus on understanding, not just copying slide text. Add context and clarity where the slide content is brief.`;

    const userPrompt = `Convert this slide content into structured study notes.

Slide content:
${slide_context.trim()}

Return ONLY valid JSON array. Each item must have 'type' and 'content' fields.

Types to use:
- 'heading': main topic or section title (max 1-2 per slide)
- 'key_point': most important facts (aim for 3-5 per slide)
- 'detail': supporting explanation for a key point
- 'remember': critical fact student must memorize (max 2 per slide)
- 'example': concrete example if helpful (max 1-2 per slide)

Rules:
- Maximum 12 items total per slide
- Each content string max 25 words
- Do not copy slide text verbatim — rephrase for clarity
- If slide content is very short (< 20 words): add helpful context from general knowledge
- Start with exactly one 'heading' item

Example output format:
[
  {"type":"heading","content":"Photosynthesis Overview"},
  {"type":"key_point","content":"Plants convert sunlight to glucose using chlorophyll"},
  {"type":"detail","content":"Occurs in chloroplasts inside leaf cells"},
  {"type":"remember","content":"Formula: 6CO2 + 6H2O + light → C6H12O6 + 6O2"}
]`;

    let parsedNotes: NoteItem[] | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const prompt =
          attempt === 0
            ? userPrompt
            : `Return a JSON array of study notes from this slide content. Each object needs "type" (one of: heading, key_point, detail, remember, example) and "content" (string). Slide: ${slide_context.trim().slice(0, 500)}`;

        const response = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
              max_tokens: 2000,
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI gateway error (attempt ${attempt + 1}):`, response.status, errText);

          if (response.status === 429) {
            await supabase
              .from("session_slide_notes")
              .update({ status: "failed", updated_at: new Date().toISOString() })
              .eq("id", noteRowId);
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 402) {
            await supabase
              .from("session_slide_notes")
              .update({ status: "failed", updated_at: new Date().toISOString() })
              .eq("id", noteRowId);
            return new Response(
              JSON.stringify({ error: "Payment required, please add funds." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          continue; // retry
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content;
        if (!raw) {
          console.error(`Empty AI response (attempt ${attempt + 1})`);
          continue;
        }

        // Extract JSON from potential markdown fences
        let jsonStr = raw.trim();
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) jsonStr = fenceMatch[1].trim();

        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed)) {
          console.error("AI returned non-array");
          continue;
        }

        // Validate and filter
        parsedNotes = parsed
          .filter(
            (item: unknown): item is NoteItem =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as NoteItem).type === "string" &&
              typeof (item as NoteItem).content === "string" &&
              VALID_TYPES.has((item as NoteItem).type)
          )
          .slice(0, 12);

        if (parsedNotes.length > 0) break;
        console.error("No valid items after filtering");
      } catch (parseErr) {
        console.error(`Parse error (attempt ${attempt + 1}):`, parseErr);
      }
    }

    // --- Handle failure ---
    if (!parsedNotes || parsedNotes.length === 0) {
      await supabase
        .from("session_slide_notes")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", noteRowId);

      return new Response(
        JSON.stringify({
          error: "Failed to generate notes after 2 attempts",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Save successful notes ---
    const derivedTitle =
      slide_title ||
      parsedNotes.find((n) => n.type === "heading")?.content ||
      "Slide Notes";

    const { data: updatedRow, error: saveErr } = await supabase
      .from("session_slide_notes")
      .update({
        ai_notes: parsedNotes,
        status: "ready",
        slide_title: derivedTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteRowId)
      .select("*")
      .single();

    if (saveErr) throw saveErr;

    return new Response(
      JSON.stringify({ success: true, slide_notes: updatedRow }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-slide-notes error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
