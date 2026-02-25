import { useState, useRef, useEffect, useCallback } from "react";
import { useConceptCheck } from "@/hooks/useConceptCheck";
import { ConceptCheckTimer } from "./ConceptCheckTimer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, MessageCircle } from "lucide-react";
import { getNewtonOpenFn } from "@/lib/newtonOpenRef";

interface ConceptCheckOverlayProps {
  sessionId: string;
}

const labels = ["A", "B", "C", "D"] as const;
const keys = ["a", "b", "c", "d"] as const;

export function ConceptCheckOverlay({ sessionId }: ConceptCheckOverlayProps) {
  const {
    activeCheck,
    myResponse,
    isSubmitting,
    isClosed,
    timeRemaining,
    hasResponded,
    submitAnswer,
  } = useConceptCheck({ sessionId, role: "student", slideContext: "" });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Reset start time when a new check arrives
  useEffect(() => {
    if (activeCheck) {
      startTimeRef.current = Date.now();
      setSelectedKey(null);
      setShowResult(false);
    }
  }, [activeCheck?.id]);

  // Show result after close
  useEffect(() => {
    if (isClosed && hasResponded) setShowResult(true);
    if (isClosed && !hasResponded) setShowResult(true);
  }, [isClosed, hasResponded]);

  const handleSelect = useCallback(
    async (key: "a" | "b" | "c" | "d") => {
      if (hasResponded || isSubmitting || isClosed) return;
      setSelectedKey(key);
      const elapsed = Date.now() - startTimeRef.current;
      // brief suspense
      await new Promise((r) => setTimeout(r, 300));
      const result = await submitAnswer(key, elapsed);
      if (result) setShowResult(true);
    },
    [hasResponded, isSubmitting, isClosed, submitAnswer]
  );

  const handleAskNewton = useCallback(() => {
    if (!activeCheck || !myResponse) return;
    const optionMap: Record<string, string> = {
      a: activeCheck.option_a,
      b: activeCheck.option_b,
      c: activeCheck.option_c,
      d: activeCheck.option_d,
    };
    const msg = `Explain why "${optionMap[activeCheck.correct_answer]}" is correct for this question: ${activeCheck.question}. I chose "${optionMap[myResponse.selected_answer]}".`;
    // Open Newton and pass message via custom event
    const openFn = getNewtonOpenFn();
    openFn?.();
    window.dispatchEvent(new CustomEvent("newton-prefill", { detail: { message: msg, messageType: "concept_check_explanation" } }));
  }, [activeCheck, myResponse]);

  if (!activeCheck) return null;

  const options = [
    activeCheck.option_a,
    activeCheck.option_b,
    activeCheck.option_c,
    activeCheck.option_d,
  ];

  const timedOut = timeRemaining === 0 && !hasResponded && !isClosed;
  const revealCorrect = showResult || isClosed || timedOut;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-concept-slide-up">
      <div className="w-[90%] max-w-[500px] bg-gray-900 border border-gray-700 rounded-2xl p-5 shadow-2xl animate-concept-bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-bold text-teal-300 flex items-center gap-1.5">
            ⚡ Quick Check
          </span>
          <ConceptCheckTimer
            totalSeconds={activeCheck.duration_seconds}
            remainingSeconds={timeRemaining}
            size="small"
          />
        </div>

        {/* Question */}
        <p className="text-lg font-semibold text-foreground mb-5 leading-snug">
          {activeCheck.question}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {keys.map((key, i) => {
            const isCorrect = key === activeCheck.correct_answer;
            const isSelected = selectedKey === key || myResponse?.selected_answer === key;
            const answered = hasResponded || selectedKey !== null;

            let btnClass = "border-gray-700 text-foreground hover:border-teal-500";
            if (revealCorrect && isCorrect) {
              btnClass = "border-emerald-500 bg-emerald-500/15 text-emerald-300";
            } else if (revealCorrect && isSelected && !isCorrect) {
              btnClass = "border-red-500 bg-red-500/10 text-red-400";
            } else if (answered && isSelected) {
              btnClass = "border-teal-500 bg-teal-500/15 text-teal-300";
            } else if (answered) {
              btnClass = "border-gray-800 text-gray-600";
            }

            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={answered || isSubmitting || isClosed || timedOut}
                aria-label={`Option ${labels[i]}: ${options[i]}`}
                className={cn(
                  "flex items-center gap-3 w-full text-left rounded-xl border px-4 py-3 transition-colors text-sm font-medium",
                  btnClass
                )}
              >
                <span
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border",
                    revealCorrect && isCorrect
                      ? "border-emerald-400 text-emerald-300"
                      : "border-gray-600 text-gray-400"
                  )}
                >
                  {labels[i]}
                </span>
                <span className="flex-1">{options[i]}</span>
              </button>
            );
          })}
        </div>

        {/* Status messages */}
        <div className="mt-4 text-center text-sm">
          {isSubmitting && (
            <p className="text-gray-400 animate-pulse">Submitting…</p>
          )}
          {hasResponded && !revealCorrect && (
            <p className="text-gray-400">Answer submitted! Waiting for results…</p>
          )}
          {revealCorrect && hasResponded && myResponse && (
            <div className="space-y-2">
              {myResponse.is_correct ? (
                <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" /> Correct! Well done
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-red-400">
                  <XCircle className="w-5 h-5" /> Incorrect — correct answer was {activeCheck.correct_answer.toUpperCase()}
                </div>
              )}
              {activeCheck.explanation && (
                <p className="text-xs text-gray-400 leading-relaxed">{activeCheck.explanation}</p>
              )}
              {!myResponse.is_correct && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAskNewton}
                  className="mt-2 border-teal-600 text-teal-300 hover:bg-teal-600/10"
                  aria-label="Ask Newton to explain"
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Ask Newton to explain →
                </Button>
              )}
            </div>
          )}
          {timedOut && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-amber-400">
                <Clock className="w-5 h-5" /> Time's up! You didn't respond
              </div>
              {activeCheck.explanation && (
                <p className="text-xs text-gray-400">{activeCheck.explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
