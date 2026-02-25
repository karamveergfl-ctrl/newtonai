import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PulseSummary, LiveQuestion } from "@/types/liveSession";

interface UseSessionSummaryProps {
  sessionId: string;
}

const defaultSummary: PulseSummary = {
  got_it: 0,
  slightly_lost: 0,
  lost: 0,
  total: 0,
  confusion_percentage: 0,
};

export function useSessionSummary({ sessionId }: UseSessionSummaryProps) {
  const [pulseSummary, setPulseSummary] = useState<PulseSummary>(defaultSummary);
  const [topQuestions, setTopQuestions] = useState<LiveQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [pulseRes, topQRes, countRes] = await Promise.all([
          supabase.rpc("get_pulse_summary", { p_session_id: sessionId }),
          supabase
            .from("live_questions" as "live_questions")
            .select("*")
            .eq("session_id", sessionId)
            .order("upvotes", { ascending: false })
            .limit(3),
          supabase
            .from("live_questions" as "live_questions")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId),
        ]);

        if (pulseRes.data && typeof pulseRes.data === "object") {
          const d = pulseRes.data as Record<string, unknown>;
          setPulseSummary({
            got_it: (d.got_it as number) ?? 0,
            slightly_lost: (d.slightly_lost as number) ?? 0,
            lost: (d.lost as number) ?? 0,
            total: (d.total as number) ?? 0,
            confusion_percentage: (d.confusion_percentage as number) ?? 0,
          });
        }

        if (topQRes.data) {
          setTopQuestions(
            (topQRes.data as unknown as LiveQuestion[]).map((q) => ({
              ...q,
              has_upvoted: false,
            }))
          );
        }

        setTotalQuestions(countRes.count ?? 0);
      } catch (err) {
        console.error("useSessionSummary fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  return { pulseSummary, topQuestions, totalQuestions, isLoading };
}
