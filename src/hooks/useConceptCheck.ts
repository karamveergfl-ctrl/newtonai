import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ConceptCheck, ConceptCheckResults } from "@/types/liveSession";

interface UseConceptCheckProps {
  sessionId: string;
  role: "teacher" | "student";
  slideContext: string;
}

interface MyResponse {
  selected_answer: string;
  is_correct: boolean;
}

interface SubmitResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string | null;
}

export function useConceptCheck({ sessionId, role, slideContext }: UseConceptCheckProps) {
  const [activeCheck, setActiveCheck] = useState<ConceptCheck | null>(null);
  const [checkResults, setCheckResults] = useState<ConceptCheckResults | null>(null);
  const [myResponse, setMyResponse] = useState<MyResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasResponded, setHasResponded] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const responsesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Clear timer helper ──
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Start countdown timer ──
  const startTimer = useCallback(
    (durationSeconds: number) => {
      clearTimer();
      setTimeRemaining(durationSeconds);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer]
  );

  // ── Auto-close when timer hits 0 (teacher) ──
  const closeCheckRef = useRef<() => Promise<void>>();

  useEffect(() => {
    if (timeRemaining === 0 && activeCheck && !isClosed) {
      if (role === "teacher") {
        closeCheckRef.current?.();
      }
    }
  }, [timeRemaining, activeCheck, isClosed, role]);

  // ── Refresh results ──
  const refreshResults = useCallback(async () => {
    if (!activeCheck) return;
    try {
      const { data, error } = await supabase.rpc("get_concept_check_results", {
        p_check_id: activeCheck.id,
      });
      if (error) {
        console.error("refreshResults error:", error.message);
        return;
      }
      if (data) {
        setCheckResults(data as unknown as ConceptCheckResults);
      }
    } catch (err) {
      console.error("refreshResults exception:", err);
    }
  }, [activeCheck]);

  // ── Close check (teacher) ──
  const closeCheck = useCallback(async () => {
    if (!activeCheck || role !== "teacher") return;
    try {
      clearTimer();
      const { error } = await supabase.rpc("close_concept_check", {
        p_check_id: activeCheck.id,
      });
      if (error) {
        console.error("closeCheck error:", error.message);
        return;
      }
      setIsClosed(true);
      // Fetch final results
      const { data } = await supabase.rpc("get_concept_check_results", {
        p_check_id: activeCheck.id,
      });
      if (data) {
        setCheckResults(data as unknown as ConceptCheckResults);
      }
    } catch (err) {
      console.error("closeCheck exception:", err);
    }
  }, [activeCheck, role, clearTimer]);

  // Keep ref in sync
  useEffect(() => {
    closeCheckRef.current = closeCheck;
  }, [closeCheck]);

  // ── Trigger concept check (teacher) ──
  const triggerConceptCheck = useCallback(
    async (difficulty: "easy" | "medium" | "hard" = "medium") => {
      if (role !== "teacher") return;
      setIsGenerating(true);
      setGenerationError(null);
      setRateLimitSeconds(null);

      try {
        const { data, error } = await supabase.functions.invoke(
          "generate-concept-check",
          {
            body: {
              session_id: sessionId,
              slide_context: slideContext,
              difficulty,
            },
          }
        );

        if (error) {
          // Check for rate limit from function invoke error
          const errorMsg = error.message || "Failed to generate concept check";
          setGenerationError(errorMsg);
          return;
        }

        if (data?.error) {
          if (data.retry_after_seconds) {
            setRateLimitSeconds(data.retry_after_seconds);
          }
          setGenerationError(data.error);
          return;
        }

        if (data?.success && data.concept_check) {
          const check = data.concept_check as ConceptCheck;
          setActiveCheck(check);
          setIsClosed(false);
          setCheckResults(null);
          setMyResponse(null);
          setHasResponded(false);
          startTimer(check.duration_seconds);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        setGenerationError(msg);
      } finally {
        setIsGenerating(false);
      }
    },
    [role, sessionId, slideContext, startTimer]
  );

  // ── Submit answer (student) ──
  const submitAnswer = useCallback(
    async (
      selectedAnswer: "a" | "b" | "c" | "d",
      responseTimeMs: number
    ): Promise<SubmitResult | null> => {
      if (role !== "student" || !activeCheck || hasResponded) return null;
      setIsSubmitting(true);

      try {
        const { data, error } = await supabase.rpc(
          "submit_concept_check_response",
          {
            p_check_id: activeCheck.id,
            p_selected_answer: selectedAnswer,
            p_response_time_ms: responseTimeMs,
          }
        );

        if (error) {
          console.error("submitAnswer error:", error.message);
          return null;
        }

        const result = data as unknown as SubmitResult;
        setMyResponse({
          selected_answer: selectedAnswer,
          is_correct: result.is_correct,
        });
        setHasResponded(true);
        return result;
      } catch (err) {
        console.error("submitAnswer exception:", err);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [role, activeCheck, hasResponded]
  );

  // ── Dismiss check (teacher) ──
  const dismissCheck = useCallback(() => {
    if (role !== "teacher") return;
    clearTimer();
    setActiveCheck(null);
    setCheckResults(null);
    setMyResponse(null);
    setIsClosed(false);
    setTimeRemaining(0);
    setHasResponded(false);
    setGenerationError(null);
    setRateLimitSeconds(null);
  }, [role, clearTimer]);

  // ── Fetch active check on mount ──
  useEffect(() => {
    if (!sessionId) return;

    const fetchActive = async () => {
      try {
        const { data, error } = await supabase.rpc("get_active_concept_check", {
          p_session_id: sessionId,
        });
        if (error || !data) return;

        const check = data as unknown as ConceptCheck;
        if (check.id) {
          setActiveCheck(check);
          setIsClosed(false);

          // Calculate remaining time
          const createdAt = new Date(check.created_at).getTime();
          const elapsed = Math.floor((Date.now() - createdAt) / 1000);
          const remaining = Math.max(0, check.duration_seconds - elapsed);
          if (remaining > 0) {
            startTimer(remaining);
          } else {
            setTimeRemaining(0);
          }

          // Check if student already responded
          if (role === "student") {
            const { data: existing } = await supabase
              .from("concept_check_responses")
              .select("selected_answer, is_correct")
              .eq("check_id", check.id)
              .maybeSingle();

            if (existing) {
              setMyResponse({
                selected_answer: existing.selected_answer,
                is_correct: existing.is_correct,
              });
              setHasResponded(true);
            }
          }
        }
      } catch (err) {
        console.error("fetchActive exception:", err);
      }
    };

    fetchActive();
  }, [sessionId, role, startTimer]);

  // ── Realtime: concept_checks (new checks / status changes) ──
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`concept-check-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "concept_checks",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" && role === "student") {
            const raw = payload.new as Record<string, unknown>;
            // Strip correct_answer and explanation from Realtime payload
            // to prevent students from seeing the answer while check is active
            const check: ConceptCheck = {
              id: raw.id as string,
              session_id: raw.session_id as string,
              question: raw.question as string,
              option_a: raw.option_a as string,
              option_b: raw.option_b as string,
              option_c: raw.option_c as string,
              option_d: raw.option_d as string,
              correct_answer: "" as ConceptCheck["correct_answer"], // hidden
              explanation: null,
              slide_context: null,
              status: "active",
              duration_seconds: (raw.duration_seconds as number) || 30,
              created_at: raw.created_at as string,
              closed_at: null,
            };
            setActiveCheck(check);
            setIsClosed(false);
            setMyResponse(null);
            setHasResponded(false);
            setCheckResults(null);
            startTimer(check.duration_seconds);
          }

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Record<string, unknown>;
            if (updated.status === "closed") {
              setIsClosed(true);
              clearTimer();
              // Now that check is closed, populate correct_answer and explanation
              setActiveCheck((prev) => {
                if (!prev || prev.id !== updated.id) return prev;
                return {
                  ...prev,
                  status: "closed" as const,
                  correct_answer: (updated.correct_answer as string) as ConceptCheck["correct_answer"],
                  explanation: (updated.explanation as string) || null,
                  closed_at: (updated.closed_at as string) || null,
                };
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, role, startTimer, clearTimer]);

  // ── Realtime: concept_check_responses (teacher live distribution) ──
  useEffect(() => {
    // Clean up previous responses channel
    if (responsesChannelRef.current) {
      supabase.removeChannel(responsesChannelRef.current);
      responsesChannelRef.current = null;
    }

    if (!activeCheck || role !== "teacher") return;

    const channel = supabase
      .channel(`concept-responses-${activeCheck.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "concept_check_responses",
          filter: `check_id=eq.${activeCheck.id}`,
        },
        () => {
          refreshResults();
        }
      )
      .subscribe();

    responsesChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      responsesChannelRef.current = null;
    };
  }, [activeCheck, role, refreshResults]);

  // ── Cleanup timer on unmount ──
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // ── Rate limit countdown ──
  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  return {
    activeCheck,
    checkResults,
    myResponse,
    isGenerating,
    isSubmitting,
    isClosed,
    timeRemaining,
    hasResponded,
    generationError,
    rateLimitSeconds,
    triggerConceptCheck,
    submitAnswer,
    closeCheck,
    refreshResults,
    dismissCheck,
    setActiveCheck,
  };
}
