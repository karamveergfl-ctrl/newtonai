import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SlideConfusion {
  slide_index: number;
  slide_title: string | null;
  confusion_percentage: number;
  pulse_responses: number;
}

interface EngagementHeatmapEntry {
  slide_index: number;
  slide_title: string | null;
  pulse_responses: number;
  annotations: number;
  questions_asked: number;
  engagement_score: number;
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
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    if (response.status === 429) throw Object.assign(new Error("AI rate limit exceeded"), { status: 429 });
    if (response.status === 402) throw Object.assign(new Error("Payment required"), { status: 402 });
    throw new Error("AI gateway error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJsonFromAI(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch { /* fallthrough */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch { /* fallthrough */ }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id, report_id } = await req.json();
    if (!session_id || !report_id) {
      return new Response(JSON.stringify({ error: "session_id and report_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Verify teacher ──
    const { data: session, error: sessionErr } = await supabase
      .from("live_sessions")
      .select("id, class_id, teacher_id, created_at, status, total_slides")
      .eq("id", session_id)
      .single();

    if (sessionErr || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.teacher_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ════════════════════════════════════════════
    // DATA COLLECTION
    // ════════════════════════════════════════════

    // 1. Enrolled student count
    const { count: enrolledCount } = await supabaseAdmin
      .from("class_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", session.class_id)
      .eq("status", "active");
    const totalStudents = enrolledCount ?? 0;

    // 2. Pulse data — per-slide breakdown
    const { data: pulseRows } = await supabaseAdmin
      .from("live_pulse_responses")
      .select("status, session_id")
      .eq("session_id", session_id);

    // Per-slide pulse (join with slide notes for slide_index)
    // We'll query pulse + slide notes separately and correlate
    const { data: slideNotes } = await supabaseAdmin
      .from("session_slide_notes")
      .select("id, slide_index, slide_title")
      .eq("session_id", session_id)
      .order("slide_index", { ascending: true });

    // Overall pulse summary
    const pulseGotIt = pulseRows?.filter(r => r.status === "got_it").length ?? 0;
    const pulseSlightlyLost = pulseRows?.filter(r => r.status === "slightly_lost").length ?? 0;
    const pulseLost = pulseRows?.filter(r => r.status === "lost").length ?? 0;
    const pulseTotal = pulseGotIt + pulseSlightlyLost + pulseLost;
    const overallConfusion = pulseTotal > 0 ? Math.round(((pulseSlightlyLost + pulseLost) / pulseTotal) * 100) : 0;

    // 3. Concept check data
    const { data: conceptChecks } = await supabaseAdmin
      .from("concept_checks")
      .select("id, question, correct_answer, option_a, option_b, option_c, option_d, slide_context, status")
      .eq("session_id", session_id);

    const conceptCheckAnalysis: Array<{
      check_id: string;
      question: string;
      correct_percentage: number;
      most_common_wrong_answer: string;
      needs_review: boolean;
      total_responses: number;
    }> = [];

    if (conceptChecks && conceptChecks.length > 0) {
      for (const cc of conceptChecks) {
        const { data: responses } = await supabaseAdmin
          .from("concept_check_responses")
          .select("selected_answer, is_correct")
          .eq("check_id", cc.id);

        const total = responses?.length ?? 0;
        const correctCount = responses?.filter(r => r.is_correct).length ?? 0;
        const correctPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

        // Find most common wrong answer
        const wrongAnswers = responses?.filter(r => !r.is_correct).map(r => r.selected_answer) ?? [];
        const wrongCounts: Record<string, number> = {};
        for (const a of wrongAnswers) {
          wrongCounts[a] = (wrongCounts[a] || 0) + 1;
        }
        let mostCommonWrong = "";
        let maxWrongCount = 0;
        for (const [answer, count] of Object.entries(wrongCounts)) {
          if (count > maxWrongCount) {
            mostCommonWrong = answer;
            maxWrongCount = count;
          }
        }
        // Map answer letter to actual text
        const optionMap: Record<string, string> = {
          a: cc.option_a, b: cc.option_b, c: cc.option_c, d: cc.option_d,
        };
        const mostCommonWrongText = optionMap[mostCommonWrong] || mostCommonWrong;

        conceptCheckAnalysis.push({
          check_id: cc.id,
          question: cc.question,
          correct_percentage: correctPct,
          most_common_wrong_answer: mostCommonWrongText,
          needs_review: correctPct < 60,
          total_responses: total,
        });
      }
    }

    // 4. Question wall data — top unanswered
    const { data: questions } = await supabaseAdmin
      .from("live_questions")
      .select("id, content, upvotes, is_answered, is_pinned")
      .eq("session_id", session_id)
      .eq("is_answered", false)
      .order("upvotes", { ascending: false })
      .limit(10);

    // 5. Annotation counts per slide note
    const annotationCounts: Record<string, number> = {};
    if (slideNotes && slideNotes.length > 0) {
      const noteIds = slideNotes.map(n => n.id);
      const { data: annotRows } = await supabaseAdmin
        .from("student_note_annotations")
        .select("slide_note_id")
        .in("slide_note_id", noteIds);

      if (annotRows) {
        for (const row of annotRows) {
          annotationCounts[row.slide_note_id] = (annotationCounts[row.slide_note_id] || 0) + 1;
        }
      }
    }

    // 6. Active students = distinct students who did pulse OR concept check OR annotation
    const activeStudentIds = new Set<string>();
    if (pulseRows) {
      // pulse_responses has student_id but we only selected status+session_id above
      // Re-query with student_id
    }
    const { data: pulseStudents } = await supabaseAdmin
      .from("live_pulse_responses")
      .select("student_id")
      .eq("session_id", session_id);
    pulseStudents?.forEach(r => activeStudentIds.add(r.student_id));

    if (conceptChecks && conceptChecks.length > 0) {
      const checkIds = conceptChecks.map(c => c.id);
      const { data: ccRespondents } = await supabaseAdmin
        .from("concept_check_responses")
        .select("student_id")
        .in("check_id", checkIds);
      ccRespondents?.forEach(r => activeStudentIds.add(r.student_id));
    }

    if (slideNotes && slideNotes.length > 0) {
      const noteIds = slideNotes.map(n => n.id);
      const { data: annotStudents } = await supabaseAdmin
        .from("student_note_annotations")
        .select("student_id")
        .in("slide_note_id", noteIds);
      annotStudents?.forEach(r => activeStudentIds.add(r.student_id));
    }

    const activeStudents = activeStudentIds.size;
    const engagementRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

    // Duration
    const startedAt = new Date(session.created_at);
    const durationMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000);

    // ════════════════════════════════════════════
    // ENGAGEMENT HEATMAP (pure calculation)
    // ════════════════════════════════════════════
    const engagementHeatmap: EngagementHeatmapEntry[] = [];

    // Question counts per slide — questions don't have slide_index, so all count globally
    const totalQuestionsAsked = questions?.length ?? 0;

    if (slideNotes) {
      // Find max values for normalization
      let maxPulse = 1, maxAnnot = 1;
      const slideData = slideNotes.map(sn => {
        const annotations = annotationCounts[sn.id] || 0;
        // Pulse responses don't have per-slide tracking in current schema,
        // so distribute evenly or use total
        const pulsePerSlide = slideNotes.length > 0 ? Math.round(pulseTotal / slideNotes.length) : 0;
        if (pulsePerSlide > maxPulse) maxPulse = pulsePerSlide;
        if (annotations > maxAnnot) maxAnnot = annotations;
        return { ...sn, annotations, pulsePerSlide };
      });

      const questionsPerSlide = slideNotes.length > 0 ? Math.round(totalQuestionsAsked / slideNotes.length) : 0;

      for (const sd of slideData) {
        const normPulse = maxPulse > 0 ? (sd.pulsePerSlide / maxPulse) * 100 : 0;
        const normAnnot = maxAnnot > 0 ? (sd.annotations / maxAnnot) * 100 : 0;
        const normQ = totalQuestionsAsked > 0 ? (questionsPerSlide / totalQuestionsAsked) * 100 : 0;
        const score = Math.round(normPulse * 0.4 + normAnnot * 0.4 + normQ * 0.2);

        engagementHeatmap.push({
          slide_index: sd.slide_index,
          slide_title: sd.slide_title,
          pulse_responses: sd.pulsePerSlide,
          annotations: sd.annotations,
          questions_asked: questionsPerSlide,
          engagement_score: Math.min(score, 100),
        });
      }
    }

    // Confusion slides
    const confusionSlides: SlideConfusion[] = [];
    // Since pulse is session-wide (not per-slide), use overall confusion for all slides
    if (overallConfusion > 30 && slideNotes) {
      for (const sn of slideNotes) {
        confusionSlides.push({
          slide_index: sn.slide_index,
          slide_title: sn.slide_title,
          confusion_percentage: overallConfusion,
          pulse_responses: Math.round(pulseTotal / (slideNotes.length || 1)),
        });
      }
    }

    // ════════════════════════════════════════════
    // AI GENERATION
    // ════════════════════════════════════════════
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sessionData = {
      duration_minutes: durationMinutes,
      total_students: totalStudents,
      active_students: activeStudents,
      engagement_rate: engagementRate,
      overall_confusion_percentage: overallConfusion,
      total_slides: session.total_slides,
      concept_check_analysis: conceptCheckAnalysis,
      unanswered_questions: (questions || []).map(q => ({
        id: q.id, content: q.content, upvotes: q.upvotes,
      })),
      slide_titles: (slideNotes || []).map(s => ({
        index: s.slide_index, title: s.slide_title,
      })),
    };

    const systemPrompt = `You are an expert educational analyst reviewing a live classroom session. Analyze the provided session data and generate actionable insights for the teacher. Be specific, data-driven, and constructive. Prioritize insights that will most improve student outcomes in the next class.`;

    const userPrompt = `Analyze this live class session data and generate a teacher intelligence report.

Session data:
${JSON.stringify(sessionData, null, 2)}

Generate a JSON report with these sections:

1. topics_to_revisit: Array of topics needing review (max 5). For each: topic (string), reason (data-driven string), priority ("high"|"medium"|"low"). Base on: high confusion%, failed concept checks, most upvoted unanswered questions.

2. concept_check_analysis: For each check with correct% < 70%, identify the likely misconception based on which wrong answer was most popular. Keep the existing data and add a "misconception" field.

3. top_unanswered_questions: Top 5 questions by upvotes that were never answered. Include a suggested_answer field (brief, max 30 words).

4. engagement_summary: One paragraph (max 50 words) summarizing overall class engagement honestly.

Return ONLY valid JSON with keys: topics_to_revisit, concept_check_analysis, top_unanswered_questions, engagement_summary. Be specific — no generic advice.`;

    let aiReport: Record<string, unknown> | null = null;
    let aiFailed = false;

    try {
      const aiResult = await callAI(LOVABLE_API_KEY, systemPrompt, userPrompt);
      aiReport = parseJsonFromAI(aiResult);

      if (!aiReport) {
        // Retry once
        console.log("First AI attempt failed to parse, retrying...");
        const retry = await callAI(LOVABLE_API_KEY, systemPrompt, userPrompt);
        aiReport = parseJsonFromAI(retry);
      }
    } catch (e) {
      console.error("AI generation failed:", e);
      const err = e as { status?: number };
      if (err.status === 429 || err.status === 402) {
        // Propagate rate limit / payment errors
        return new Response(JSON.stringify({ error: (e as Error).message }), {
          status: err.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!aiReport) {
      aiFailed = true;
      aiReport = {
        topics_to_revisit: conceptCheckAnalysis.filter(c => c.needs_review).map(c => ({
          topic: c.question, reason: `Only ${c.correct_percentage}% answered correctly`, priority: "high",
        })),
        concept_check_analysis: conceptCheckAnalysis,
        top_unanswered_questions: (questions || []).slice(0, 5).map(q => ({
          question_id: q.id, content: q.content, upvotes: q.upvotes, suggested_answer: "",
        })),
        engagement_summary: `Session had ${activeStudents}/${totalStudents} active students (${engagementRate}% engagement). Overall confusion was ${overallConfusion}%.`,
      };
    }

    // ════════════════════════════════════════════
    // ASSEMBLE FINAL REPORT
    // ════════════════════════════════════════════
    const teacherReport = {
      session_summary: {
        duration_minutes: durationMinutes,
        total_students: totalStudents,
        active_students: activeStudents,
        engagement_rate: engagementRate,
      },
      confusion_slides: confusionSlides,
      concept_check_analysis: aiReport.concept_check_analysis || conceptCheckAnalysis,
      top_unanswered_questions: aiReport.top_unanswered_questions || [],
      topics_to_revisit: aiReport.topics_to_revisit || [],
      engagement_heatmap: engagementHeatmap,
      engagement_summary: aiReport.engagement_summary || "",
      ...(aiFailed ? { _ai_failed: true, _message: "AI analysis unavailable — showing raw data" } : {}),
    };

    // ── Save report ──
    const { error: updateErr } = await supabaseAdmin
      .from("session_intelligence_reports")
      .update({
        teacher_report: teacherReport,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", report_id);

    if (updateErr) {
      console.error("Failed to save report:", updateErr);
      throw new Error("Failed to save report");
    }

    return new Response(JSON.stringify({ success: true, report: teacherReport }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-teacher-report error:", error);
    const err = error as { status?: number; message?: string };
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: err.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
