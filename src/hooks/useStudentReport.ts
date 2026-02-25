import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  StudentIntelligenceReport,
  ReportVideoResult,
  TopicScore,
  KnowledgeGap,
  RevisionFlashcard,
  VideoSuggestion,
} from "@/types/liveSession";

interface UseStudentReportProps {
  sessionId: string;
}

type ReportStatus = "idle" | "generating" | "ready" | "failed";

export function useStudentReport({ sessionId }: UseStudentReportProps) {
  const [report, setReport] = useState<StudentIntelligenceReport | null>(null);
  const [videoResults, setVideoResults] = useState<ReportVideoResult[]>([]);
  const [status, setStatus] = useState<ReportStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [activeGapIndex, setActiveGapIndex] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_student_report" as never,
        { p_session_id: sessionId } as never
      );
      if (rpcError) throw rpcError;
      if (data) {
        const row = data as unknown as {
          id: string;
          session_id: string;
          student_id: string;
          status: string;
          understanding_score: number;
          topic_scores: TopicScore[];
          knowledge_gaps: KnowledgeGap[];
          revision_flashcards: RevisionFlashcard[];
          video_suggestions: VideoSuggestion[];
          generated_at: string;
          updated_at: string;
        };
        const mapped: StudentIntelligenceReport = {
          id: row.id,
          session_id: row.session_id,
          student_id: row.student_id,
          status: row.status as StudentIntelligenceReport["status"],
          understanding_score: row.understanding_score,
          topic_scores: row.topic_scores,
          knowledge_gaps: row.knowledge_gaps,
          revision_flashcards: row.revision_flashcards,
          video_suggestions: row.video_suggestions,
          generated_at: row.generated_at,
          updated_at: row.updated_at,
        };
        setReport(mapped);
        setStatus(mapped.status);
        return mapped;
      } else {
        setStatus("idle");
        return null;
      }
    } catch (err) {
      console.error("Failed to fetch student report", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const fetchVideoResults = useCallback(
    async (reportId: string) => {
      try {
        const { data, error: queryError } = await supabase
          .from("report_video_results")
          .select("*")
          .eq("student_report_id", reportId);
        if (queryError) throw queryError;
        setVideoResults(
          (data ?? []).map((v) => ({
            id: v.id,
            student_report_id: v.student_report_id,
            topic: v.topic,
            video_id: v.video_id,
            video_title: v.video_title,
            channel_name: v.channel_name,
            thumbnail_url: v.thumbnail_url,
            duration: v.duration,
            fetched_at: v.fetched_at,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch video results", err);
      }
    },
    []
  );

  const setActiveGap = useCallback((index: number | null) => {
    setActiveGapIndex(index);
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`student-report-${sessionId}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "student_intelligence_reports",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const row = payload.new as { student_id: string; status: string };
          if (row.student_id !== userId) return;
          if (row.status === "ready") {
            setStatus("ready");
            const fetched = await fetchReport();
            if (fetched) await fetchVideoResults(fetched.id);
          } else if (row.status === "failed") {
            setStatus("failed");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId, fetchReport, fetchVideoResults]);

  // On mount
  useEffect(() => {
    const init = async () => {
      const fetched = await fetchReport();
      if (fetched && fetched.status === "ready") {
        await fetchVideoResults(fetched.id);
      }
    };
    init();
  }, [fetchReport, fetchVideoResults]);

  return {
    report,
    videoResults,
    status,
    isLoading,
    activeGapIndex,
    setActiveGap,
    fetchReport,
  };
}
