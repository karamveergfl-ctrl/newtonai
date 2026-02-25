import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Verify teacher owns session ──
    const { data: session, error: sessionErr } = await supabase
      .from("live_sessions")
      .select("id, class_id, teacher_id")
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

    // ── Get enrolled students ──
    const { data: enrollments } = await supabaseAdmin
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", session.class_id)
      .eq("status", "active");

    const studentIds = enrollments?.map(e => e.student_id) ?? [];

    // ── Trigger teacher report generation ──
    const { data: triggerResult } = await supabaseAdmin.rpc("trigger_report_generation", {
      p_session_id: session_id,
    });

    const reportId = (triggerResult as Record<string, unknown>)?.report_id;

    // Fire teacher report generation (don't await)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (reportId && (triggerResult as Record<string, unknown>)?.status === "generating") {
      fetch(`${supabaseUrl}/functions/v1/generate-teacher-report`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id, report_id: reportId }),
      }).catch(e => console.error("Teacher report fire-and-forget error:", e));
    }

    // ── Create student report records & fire generation ──
    let studentsQueued = 0;

    // Batch insert student report records
    if (studentIds.length > 0) {
      const insertRows = studentIds.map(sid => ({
        session_id,
        student_id: sid,
        status: "generating",
      }));

      // Use ON CONFLICT DO NOTHING via upsert
      await supabaseAdmin
        .from("student_intelligence_reports")
        .upsert(insertRows, { onConflict: "session_id,student_id", ignoreDuplicates: true });

      // Fire all student report generations in parallel (fire-and-forget)
      const promises = studentIds.map(studentId =>
        fetch(`${supabaseUrl}/functions/v1/generate-student-report`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id, student_id: studentId }),
        }).catch(e => console.error(`Student report error for ${studentId}:`, e))
      );

      // Wait for all to settle (but don't fail if some fail)
      await Promise.allSettled(promises);
      studentsQueued = studentIds.length;
    }

    return new Response(JSON.stringify({
      success: true,
      students_queued: studentsQueued,
      teacher_report_id: reportId,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("trigger-all-student-reports error:", error);
    const err = error as { status?: number; message?: string };
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: err.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
