import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LiveQuestion } from "@/types/liveSession";

interface UseQuestionWallProps {
  sessionId: string;
  role: "teacher" | "student";
}

function sortQuestions(questions: LiveQuestion[]): LiveQuestion[] {
  return [...questions].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    if (a.upvotes !== b.upvotes) return b.upvotes - a.upvotes;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function useQuestionWall({ sessionId, role }: UseQuestionWallProps) {
  const [questions, setQuestions] = useState<LiveQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionsEnabled, setQuestionsEnabled] = useState(true);
  const [newQuestionCount, setNewQuestionCount] = useState(0);
  const initialLoadDone = useRef(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_session_questions", {
        p_session_id: sessionId,
      });
      if (error) {
        console.error("get_session_questions error:", error.message);
        return;
      }
      const result = data as Record<string, unknown>;
      if (result?.success) {
        const fetched = (result.questions as LiveQuestion[]) ?? [];
        setQuestions(sortQuestions(fetched));
      }
    } catch (err) {
      console.error("fetchQuestions failed:", err);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsLoading(true);

      const { data: sessionData } = await supabase
        .from("live_sessions" as "live_sessions")
        .select("questions_enabled")
        .eq("id", sessionId)
        .single();

      if (!cancelled && sessionData) {
        setQuestionsEnabled((sessionData as Record<string, unknown>).questions_enabled as boolean ?? true);
      }

      await fetchQuestions();
      if (!cancelled) {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    init();
    return () => { cancelled = true; };
  }, [sessionId, fetchQuestions]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`questions-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_questions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!initialLoadDone.current) return;
          const newQ = payload.new as Record<string, unknown>;
          const question: LiveQuestion = {
            id: newQ.id as string,
            session_id: newQ.session_id as string,
            content: newQ.content as string,
            upvotes: (newQ.upvotes as number) ?? 0,
            is_answered: (newQ.is_answered as boolean) ?? false,
            is_pinned: (newQ.is_pinned as boolean) ?? false,
            newton_answer: (newQ.newton_answer as string) ?? null,
            has_upvoted: false,
            created_at: newQ.created_at as string,
          };
          setQuestions((prev) => sortQuestions([...prev, question]));
          if (role === "teacher") {
            setNewQuestionCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_questions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          setQuestions((prev) =>
            sortQuestions(
              prev.map((q) =>
                q.id === (updated.id as string)
                  ? {
                      ...q,
                      upvotes: (updated.upvotes as number) ?? q.upvotes,
                      is_answered: (updated.is_answered as boolean) ?? q.is_answered,
                      is_pinned: (updated.is_pinned as boolean) ?? q.is_pinned,
                      newton_answer: (updated.newton_answer as string) ?? q.newton_answer,
                    }
                  : q
              )
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "live_questions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const deleted = payload.old as Record<string, unknown>;
          setQuestions((prev) => prev.filter((q) => q.id !== (deleted.id as string)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, role]);

  const submitQuestion = useCallback(
    async (content: string) => {
      setIsSubmitting(true);
      try {
        const { data, error } = await supabase.rpc("submit_anonymous_question", {
          p_session_id: sessionId,
          p_content: content,
        });
        if (error) {
          console.error("submit_anonymous_question error:", error.message);
          return;
        }
        const result = data as Record<string, unknown>;
        if (!result?.success) {
          console.error("submit_anonymous_question failed:", result?.error);
        }
        // Realtime INSERT event will add the question to state
      } catch (err) {
        console.error("submitQuestion failed:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [sessionId]
  );

  const toggleUpvote = useCallback(
    async (questionId: string) => {
      // Optimistic update
      setQuestions((prev) =>
        sortQuestions(
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  has_upvoted: !q.has_upvoted,
                  upvotes: q.has_upvoted ? q.upvotes - 1 : q.upvotes + 1,
                }
              : q
          )
        )
      );

      try {
        const { data, error } = await supabase.rpc("toggle_question_upvote", {
          p_question_id: questionId,
        });
        if (error) {
          console.error("toggle_question_upvote error:", error.message);
          await fetchQuestions(); // revert on error
        }
        const result = data as Record<string, unknown>;
        if (!result?.success) {
          console.error("toggle_question_upvote failed:", result?.error);
          await fetchQuestions();
        }
      } catch (err) {
        console.error("toggleUpvote failed:", err);
        await fetchQuestions();
      }
    },
    [fetchQuestions]
  );

  const markAnswered = useCallback(
    async (questionId: string) => {
      if (role !== "teacher") return;
      setQuestions((prev) =>
        sortQuestions(prev.map((q) => (q.id === questionId ? { ...q, is_answered: true } : q)))
      );
      const { error } = await supabase
        .from("live_questions" as "live_questions")
        .update({ is_answered: true } as Record<string, unknown>)
        .eq("id", questionId);
      if (error) {
        console.error("markAnswered error:", error.message);
        await fetchQuestions();
      }
    },
    [role, fetchQuestions]
  );

  const togglePin = useCallback(
    async (questionId: string) => {
      if (role !== "teacher") return;
      const target = questions.find((q) => q.id === questionId);
      if (!target) return;
      const newPinned = !target.is_pinned;
      setQuestions((prev) =>
        sortQuestions(prev.map((q) => (q.id === questionId ? { ...q, is_pinned: newPinned } : q)))
      );
      const { error } = await supabase
        .from("live_questions" as "live_questions")
        .update({ is_pinned: newPinned } as Record<string, unknown>)
        .eq("id", questionId);
      if (error) {
        console.error("togglePin error:", error.message);
        await fetchQuestions();
      }
    },
    [role, questions, fetchQuestions]
  );

  const dismissQuestion = useCallback(
    async (questionId: string) => {
      if (role !== "teacher") return;
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      const { error } = await supabase
        .from("live_questions" as "live_questions")
        .delete()
        .eq("id", questionId);
      if (error) {
        console.error("dismissQuestion error:", error.message);
        await fetchQuestions();
      }
    },
    [role, fetchQuestions]
  );

  const resetNewQuestionCount = useCallback(() => {
    setNewQuestionCount(0);
  }, []);

  return {
    questions,
    isLoading,
    isSubmitting,
    questionsEnabled,
    newQuestionCount,
    submitQuestion,
    toggleUpvote,
    markAnswered,
    togglePin,
    dismissQuestion,
    resetNewQuestionCount,
  };
}
