import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  SessionIntelligenceReport,
  ClassReportOverview,
  TeacherReport,
} from "@/types/liveSession";

interface UseTeacherReportProps {
  sessionId: string;
}

type ReportStatus = "idle" | "generating" | "ready" | "failed";

export function useTeacherReport({ sessionId }: UseTeacherReportProps) {
  const [report, setReport] = useState<SessionIntelligenceReport | null>(null);
  const [classOverview, setClassOverview] = useState<ClassReportOverview | null>(null);
  const [status, setStatus] = useState<ReportStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setError(null);
      const { data, error: rpcError } = await supabase.rpc(
        "get_teacher_report" as never,
        { p_session_id: sessionId } as never
      );
      if (rpcError) throw rpcError;
      if (data) {
        const row = data as unknown as {
          id: string;
          session_id: string;
          class_id: string;
          teacher_id: string;
          status: string;
          teacher_report: TeacherReport;
          generated_at: string;
          updated_at: string;
        };
        const mapped: SessionIntelligenceReport = {
          id: row.id,
          session_id: row.session_id,
          class_id: row.class_id,
          teacher_id: row.teacher_id,
          status: row.status as SessionIntelligenceReport["status"],
          teacher_report: row.teacher_report,
          generated_at: row.generated_at,
          updated_at: row.updated_at,
        };
        setReport(mapped);
        setStatus(mapped.status);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch report";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const triggerGeneration = useCallback(async () => {
    try {
      setError(null);
      setStatus("generating");

      // Create the report record
      await supabase.rpc(
        "trigger_report_generation" as never,
        { p_session_id: sessionId } as never
      );

      // Fire the orchestration edge function
      supabase.functions.invoke("trigger-all-student-reports", {
        body: { session_id: sessionId },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to trigger generation";
      setError(msg);
      setStatus("failed");
    }
  }, [sessionId]);

  const fetchClassOverview = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_class_report_overview" as never,
        { p_session_id: sessionId } as never
      );
      if (rpcError) throw rpcError;
      if (data) {
        setClassOverview(data as unknown as ClassReportOverview);
      }
    } catch (err) {
      console.error("Failed to fetch class overview", err);
    }
  }, [sessionId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`teacher-report-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "session_intelligence_reports",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          if (newStatus === "ready") {
            setStatus("ready");
            fetchReport();
            fetchClassOverview();
          } else if (newStatus === "failed") {
            setStatus("failed");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchReport, fetchClassOverview]);

  // On mount: check existing report and auto-trigger if needed
  useEffect(() => {
    const init = async () => {
      await fetchReport();

      // Check if session ended and no report exists yet
      const { data: session } = await supabase
        .from("live_sessions")
        .select("status")
        .eq("id", sessionId)
        .single();

      if (session?.status === "ended" && !report) {
        triggerGeneration();
      }
    };
    init();
    // Only run on mount — report ref captured at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return {
    report,
    classOverview,
    status,
    isLoading,
    error,
    fetchReport,
    triggerGeneration,
    fetchClassOverview,
  };
}
