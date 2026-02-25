import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PulseStatus, PulseSummary } from "@/types/liveSession";

interface UseLivePulseProps {
  sessionId: string;
  role: "teacher" | "student";
}

const DEFAULT_SUMMARY: PulseSummary = {
  got_it: 0,
  slightly_lost: 0,
  lost: 0,
  total: 0,
  confusion_percentage: 0,
};

export function useLivePulse({ sessionId, role }: UseLivePulseProps) {
  const [pulseSummary, setPulseSummary] = useState<PulseSummary>(DEFAULT_SUMMARY);
  const [myStatus, setMyStatus] = useState<PulseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confusionAlert, setConfusionAlert] = useState(false);
  const [pulseEnabled, setPulseEnabled] = useState(true);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thresholdRef = useRef(40);

  const refreshSummary = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_pulse_summary", {
        p_session_id: sessionId,
      });
      if (error) {
        console.error("get_pulse_summary error:", error.message);
        return;
      }
      const result = data as Record<string, unknown>;
      if (result?.success) {
        const summary: PulseSummary = {
          got_it: (result.got_it as number) ?? 0,
          slightly_lost: (result.slightly_lost as number) ?? 0,
          lost: (result.lost as number) ?? 0,
          total: (result.total as number) ?? 0,
          confusion_percentage: (result.confusion_percentage as number) ?? 0,
        };
        setPulseSummary(summary);

        if (summary.total >= 3 && summary.confusion_percentage >= thresholdRef.current) {
          setConfusionAlert(true);
          if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
          alertTimerRef.current = setTimeout(() => setConfusionAlert(false), 30000);
        }
      }
    } catch (err) {
      console.error("refreshSummary failed:", err);
    }
  }, [sessionId]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submitPulse = useCallback(
    async (status: PulseStatus) => {
      setMyStatus(status);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.rpc("upsert_pulse_response", {
            p_session_id: sessionId,
            p_status: status,
          });
          if (error) {
            console.error("upsert_pulse_response error:", error.message);
            return;
          }
          const result = data as Record<string, unknown>;
          if (!result?.success) {
            console.error("upsert_pulse_response failed:", result?.error);
          }
        } catch (err) {
          console.error("submitPulse failed:", err);
        }
      }, 500);
    },
    [sessionId]
  );

  // Fetch initial data
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsLoading(true);

      // Fetch session settings
      const { data: sessionData } = await supabase
        .from("live_sessions" as "live_sessions")
        .select("pulse_enabled, confusion_threshold")
        .eq("id", sessionId)
        .single();

      if (!cancelled && sessionData) {
        setPulseEnabled((sessionData as Record<string, unknown>).pulse_enabled as boolean ?? true);
        thresholdRef.current = (sessionData as Record<string, unknown>).confusion_threshold as number ?? 40;
      }

      await refreshSummary();

      // If student, fetch their existing response
      if (role === "student") {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: existingResponse } = await supabase
            .from("live_pulse_responses" as "live_pulse_responses")
            .select("status")
            .eq("session_id", sessionId)
            .eq("student_id", userData.user.id)
            .maybeSingle();

          if (!cancelled && existingResponse) {
            setMyStatus((existingResponse as Record<string, unknown>).status as PulseStatus);
          }
        }
      }

      if (!cancelled) setIsLoading(false);
    };

    init();
    return () => { cancelled = true; };
  }, [sessionId, role, refreshSummary]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`pulse-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_pulse_responses",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          refreshSummary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refreshSummary]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    pulseSummary,
    myStatus,
    isLoading,
    confusionAlert,
    pulseEnabled,
    submitPulse,
    refreshSummary,
  };
}
