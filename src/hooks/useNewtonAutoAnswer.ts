import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LiveQuestion } from "@/types/liveSession";

interface UseNewtonAutoAnswerProps {
  sessionId: string;
  questions: LiveQuestion[];
  sessionContext: string;
  enabled: boolean;
}

export function useNewtonAutoAnswer({
  sessionId,
  questions,
  sessionContext,
  enabled,
}: UseNewtonAutoAnswerProps) {
  const [isAutoAnswering, setIsAutoAnswering] = useState(false);
  const [lastAutoAnsweredAt, setLastAutoAnsweredAt] = useState<Date | null>(null);
  const processingRef = useRef(false);

  const answerQuestion = useCallback(
    async (question: LiveQuestion) => {
      try {
        const { data, error } = await supabase.functions.invoke("newton-chat", {
          body: {
            messages: [
              {
                role: "system",
                content: `You are a helpful classroom assistant. Answer the student's question concisely in max 3 sentences. Context from the current lesson:\n\n${sessionContext}`,
              },
              { role: "user", content: question.content },
            ],
          },
        });

        if (error) {
          console.error("newton-chat error:", error.message);
          return;
        }

        const answer =
          typeof data === "string"
            ? data
            : (data as Record<string, unknown>)?.reply ??
              (data as Record<string, unknown>)?.response ??
              (data as Record<string, unknown>)?.content;

        if (typeof answer === "string" && answer.length > 0) {
          await supabase
            .from("live_questions" as "live_questions")
            .update({ newton_answer: answer } as Record<string, unknown>)
            .eq("id", question.id);
        }
      } catch (err) {
        console.error("answerQuestion failed:", err);
      }
    },
    [sessionContext]
  );

  useEffect(() => {
    if (!enabled || !sessionId || !sessionContext) return;

    const interval = setInterval(async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsAutoAnswering(true);

      try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

        const candidates = questions.filter(
          (q) =>
            !q.is_answered &&
            q.newton_answer === null &&
            q.upvotes < 3 &&
            q.created_at < twoMinutesAgo
        );

        const batch = candidates.slice(0, 2);

        for (const q of batch) {
          await answerQuestion(q);
          setLastAutoAnsweredAt(new Date());
        }
      } catch (err) {
        console.error("auto-answer scan failed:", err);
      } finally {
        processingRef.current = false;
        setIsAutoAnswering(false);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [enabled, sessionId, questions, answerQuestion]);

  return { isAutoAnswering, lastAutoAnsweredAt };
}
