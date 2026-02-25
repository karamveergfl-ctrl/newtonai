import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TopicScore {
  slide_index: number;
  slide_title: string | null;
  score: number | null;
  indicators: {
    pulse_status: string | null;
    concept_check_correct: boolean | null;
    has_annotations: boolean;
  };
}

interface KnowledgeGap {
  topic: string;
  slide_index: number;
  gap_reason: string;
  severity: "high" | "medium" | "low";
}

interface Flashcard {
  front: string;
  back: string;
  topic: string;
  slide_index: number;
}

interface VideoSuggestion {
  topic: string;
  query: string;
  slide_index: number;
}

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJsonArray(text: string): unknown[] | null {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch { /* fallthrough */ }
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fallthrough */ }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Accept service role key or validate user token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { session_id, student_id } = await req.json();
    if (!session_id || !student_id) {
      return new Response(JSON.stringify({ error: "session_id and student_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If called by a user (not service role), validate they are the student or the teacher
    if (user) {
      const { data: session } = await supabase
        .from("live_sessions")
        .select("teacher_id")
        .eq("id", session_id)
        .single();

      if (user.id !== student_id && user.id !== session?.teacher_id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ════════════════════════════════════════════
    // DATA COLLECTION
    // ════════════════════════════════════════════

    // 1. All session slides
    const { data: slideNotes } = await supabaseAdmin
      .from("session_slide_notes")
      .select("id, slide_index, slide_title, slide_context, ai_notes")
      .eq("session_id", session_id)
      .order("slide_index", { ascending: true });

    if (!slideNotes || slideNotes.length === 0) {
      // No slides — set minimal report
      await supabaseAdmin
        .from("student_intelligence_reports")
        .update({
          understanding_score: 0,
          topic_scores: [],
          knowledge_gaps: [],
          revision_flashcards: [],
          video_suggestions: [],
          status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", session_id)
        .eq("student_id", student_id);

      return new Response(JSON.stringify({ success: true, understanding_score: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Student's pulse response
    const { data: pulseResponse } = await supabaseAdmin
      .from("live_pulse_responses")
      .select("status")
      .eq("session_id", session_id)
      .eq("student_id", student_id)
      .maybeSingle();

    const pulseStatus = pulseResponse?.status ?? null;

    // 3. Student's concept check responses
    const conceptCheckIds = await (async () => {
      const { data: checks } = await supabaseAdmin
        .from("concept_checks")
        .select("id, question, correct_answer, option_a, option_b, option_c, option_d, explanation, slide_context")
        .eq("session_id", session_id);
      return checks || [];
    })();

    const ccResponseMap: Record<string, { selected_answer: string; is_correct: boolean }> = {};
    if (conceptCheckIds.length > 0) {
      const checkIds = conceptCheckIds.map(c => c.id);
      const { data: responses } = await supabaseAdmin
        .from("concept_check_responses")
        .select("check_id, selected_answer, is_correct")
        .in("check_id", checkIds)
        .eq("student_id", student_id);

      if (responses) {
        for (const r of responses) {
          ccResponseMap[r.check_id] = { selected_answer: r.selected_answer, is_correct: r.is_correct };
        }
      }
    }

    // 4. Student's annotations
    const slideNoteIds = slideNotes.map(s => s.id);
    const annotatedNoteIds = new Set<string>();
    if (slideNoteIds.length > 0) {
      const { data: annotations } = await supabaseAdmin
        .from("student_note_annotations")
        .select("slide_note_id")
        .in("slide_note_id", slideNoteIds)
        .eq("student_id", student_id);

      if (annotations) {
        for (const a of annotations) {
          annotatedNoteIds.add(a.slide_note_id);
        }
      }
    }

    // ════════════════════════════════════════════
    // SCORE CALCULATION
    // ════════════════════════════════════════════
    const topicScores: TopicScore[] = [];
    const knowledgeGaps: KnowledgeGap[] = [];

    for (const slide of slideNotes) {
      let score: number | null = null;
      let hasData = false;

      const indicators = {
        pulse_status: pulseStatus, // Session-wide pulse (not per-slide)
        concept_check_correct: null as boolean | null,
        has_annotations: annotatedNoteIds.has(slide.id),
      };

      // Start with base 50 if any data exists
      let baseScore = 50;

      // Pulse adjustment (session-wide, applied once per slide equally)
      if (pulseStatus) {
        hasData = true;
        if (pulseStatus === "got_it") baseScore += 30;
        else if (pulseStatus === "slightly_lost") baseScore += 10;
        else if (pulseStatus === "lost") baseScore -= 20;
      }

      // Concept check adjustment — find a check related to this slide
      // Match by slide_context similarity or just use all checks
      for (const cc of conceptCheckIds) {
        const response = ccResponseMap[cc.id];
        if (response) {
          hasData = true;
          indicators.concept_check_correct = response.is_correct;
          if (response.is_correct) baseScore += 20;
          else baseScore -= 20;
          break; // One check per slide max for scoring
        }
      }

      // Annotation adjustment
      if (indicators.has_annotations) {
        hasData = true;
        baseScore += 10;
      }

      if (hasData) {
        score = Math.max(0, Math.min(100, baseScore));
      }

      topicScores.push({
        slide_index: slide.slide_index,
        slide_title: slide.slide_title,
        score,
        indicators,
      });

      // Knowledge gap detection
      if (score !== null && score < 50) {
        const reasons: string[] = [];
        if (pulseStatus === "lost") reasons.push("Signaled confusion during this topic");
        if (indicators.concept_check_correct === false) reasons.push("Answered concept check incorrectly");
        const gapReason = reasons.length > 1
          ? "Both confusion signal and wrong answer"
          : reasons[0] || "Low understanding score";

        let severity: "high" | "medium" | "low" = "medium";
        if (score < 30 || (pulseStatus === "lost" && indicators.concept_check_correct === false)) {
          severity = "high";
        } else if (score >= 50) {
          severity = "low";
        }

        knowledgeGaps.push({
          topic: slide.slide_title || `Slide ${slide.slide_index + 1}`,
          slide_index: slide.slide_index,
          gap_reason: gapReason,
          severity,
        });
      } else if (indicators.concept_check_correct === false) {
        knowledgeGaps.push({
          topic: slide.slide_title || `Slide ${slide.slide_index + 1}`,
          slide_index: slide.slide_index,
          gap_reason: "Answered concept check incorrectly",
          severity: "medium",
        });
      } else if (pulseStatus === "slightly_lost" && score !== null && score < 65) {
        knowledgeGaps.push({
          topic: slide.slide_title || `Slide ${slide.slide_index + 1}`,
          slide_index: slide.slide_index,
          gap_reason: "Signaled partial confusion",
          severity: "low",
        });
      }
    }

    // Overall understanding score
    const scoredTopics = topicScores.filter(t => t.score !== null);
    const understandingScore = scoredTopics.length > 0
      ? Math.round(scoredTopics.reduce((sum, t) => sum + (t.score ?? 0), 0) / scoredTopics.length)
      : 0;

    // ════════════════════════════════════════════
    // AI GENERATION — Flashcards & Video Queries
    // ════════════════════════════════════════════
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const revisionFlashcards: Flashcard[] = [];
    const videoSuggestions: VideoSuggestion[] = [];

    const gapsToProcess = knowledgeGaps.slice(0, 5);

    if (LOVABLE_API_KEY && gapsToProcess.length > 0) {
      // Generate flashcards for all gaps in one call
      const slideContextMap: Record<number, string> = {};
      for (const sn of slideNotes) {
        slideContextMap[sn.slide_index] = (sn.slide_context || "").slice(0, 500);
      }

      const flashcardPrompt = gapsToProcess.map(g =>
        `Topic: "${g.topic}" (Slide ${g.slide_index + 1})\nContent: ${slideContextMap[g.slide_index] || "N/A"}`
      ).join("\n\n---\n\n");

      try {
        const flashcardResult = await callAI(
          LOVABLE_API_KEY,
          "You create study flashcards. For each topic provided, create exactly 2 flashcard pairs. Keep front max 15 words, back max 25 words. Return ONLY a JSON array of objects with keys: front, back, topic, slide_index.",
          `Create revision flashcards for these weak topics:\n\n${flashcardPrompt}\n\nReturn JSON array: [{"front":"...","back":"...","topic":"...","slide_index":N}, ...]`
        );

        const parsed = parseJsonArray(flashcardResult);
        if (parsed) {
          for (const card of parsed) {
            const c = card as Record<string, unknown>;
            if (c.front && c.back) {
              revisionFlashcards.push({
                front: String(c.front),
                back: String(c.back),
                topic: String(c.topic || ""),
                slide_index: Number(c.slide_index || 0),
              });
            }
          }
        }
      } catch (e) {
        console.error("Flashcard generation failed:", e);
        // Continue without flashcards
      }

      // Generate video search queries
      for (const gap of gapsToProcess) {
        try {
          const queryResult = await callAI(
            LOVABLE_API_KEY,
            "You write YouTube search queries. Return ONLY the search query string, nothing else. Max 8 words. Target educational channels.",
            `For a student who struggled with "${gap.topic}", write the best YouTube search query to find a clear educational explanation.`
          );

          const query = queryResult.replace(/"/g, "").trim().slice(0, 100);
          if (query.length > 3) {
            videoSuggestions.push({
              topic: gap.topic,
              query,
              slide_index: gap.slide_index,
            });
          }
        } catch (e) {
          console.error("Video query generation failed for", gap.topic, e);
          // Still add the suggestion with a basic query
          videoSuggestions.push({
            topic: gap.topic,
            query: `${gap.topic} explained simply`,
            slide_index: gap.slide_index,
          });
        }
      }
    }

    // ════════════════════════════════════════════
    // SAVE REPORT
    // ════════════════════════════════════════════
    const { data: reportRow, error: updateErr } = await supabaseAdmin
      .from("student_intelligence_reports")
      .update({
        understanding_score: understandingScore,
        topic_scores: topicScores,
        knowledge_gaps: knowledgeGaps,
        revision_flashcards: revisionFlashcards,
        video_suggestions: videoSuggestions,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", session_id)
      .eq("student_id", student_id)
      .select("id")
      .single();

    if (updateErr) {
      console.error("Failed to save student report:", updateErr);
      throw new Error("Failed to save report");
    }

    // ── Fetch YouTube videos for each suggestion ──
    if (reportRow && videoSuggestions.length > 0) {
      const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
      if (YOUTUBE_API_KEY) {
        const videoResults: Array<{
          topic: string;
          video_id: string;
          video_title: string;
          channel_name: string;
          thumbnail_url: string;
          duration: string;
        }> = [];

        for (const vs of videoSuggestions) {
          try {
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(vs.query)}&type=video&key=${YOUTUBE_API_KEY}&videoDefinition=high&videoDuration=medium`;
            const searchResp = await fetch(searchUrl);
            if (searchResp.ok) {
              const searchData = await searchResp.json();
              const item = searchData.items?.[0];
              if (item) {
                videoResults.push({
                  topic: vs.topic,
                  video_id: item.id.videoId,
                  video_title: item.snippet.title,
                  channel_name: item.snippet.channelTitle,
                  thumbnail_url: item.snippet.thumbnails?.medium?.url || "",
                  duration: "", // Would need another API call for duration
                });
              }
            }
          } catch (e) {
            console.error("YouTube search failed for", vs.query, e);
          }
        }

        if (videoResults.length > 0) {
          await supabaseAdmin.rpc("save_report_video_results", {
            p_student_report_id: reportRow.id,
            p_videos: videoResults,
          });
        }
      }
    }

    // ── Send notification to student ──
    try {
      const supabaseAdmin2 = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: sessionInfo } = await supabaseAdmin2
        .from("live_sessions")
        .select("title")
        .eq("id", session_id)
        .single();
      const className = sessionInfo?.title || "Class session";
      await supabaseAdmin2.from("user_notifications").insert({
        user_id: student_id,
        title: "Your class report is ready",
        message: `Your understanding score for ${className}: ${understandingScore}/100`,
        type: "report_ready",
        metadata: { action_url: `/report/student/${session_id}` },
      });
    } catch (notifErr) {
      console.error("Student notification failed:", notifErr);
    }

    return new Response(JSON.stringify({ success: true, understanding_score: understandingScore }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-student-report error:", error);
    const err = error as { status?: number; message?: string };

    // Try to mark report as ready with available data on error
    try {
      const { session_id, student_id } = await req.clone().json();
      if (session_id && student_id) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabaseAdmin
          .from("student_intelligence_reports")
          .update({ status: "ready", updated_at: new Date().toISOString() })
          .eq("session_id", session_id)
          .eq("student_id", student_id);
      }
    } catch { /* best effort */ }

    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: err.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
