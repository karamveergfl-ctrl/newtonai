import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FillBlankQuestionProps {
  sentence: string;
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
}

export const FillBlankQuestion = ({
  sentence,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswerChange,
  onSubmit,
}: FillBlankQuestionProps) => {
  // Split sentence by ___ or _____ or blank marker
  const parts = sentence.split(/_{3,}|\[blank\]|\[___\]/i);
  const isCorrect = showResult && userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div className="text-base sm:text-lg leading-relaxed flex flex-wrap items-baseline gap-1">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !showResult && userAnswer.trim() && onSubmit()}
                disabled={showResult}
                placeholder="your answer"
                className={cn(
                  "inline-block mx-1 px-3 py-1 border-b-2 bg-transparent text-center font-semibold min-w-[120px] max-w-[200px] outline-none transition-colors",
                  showResult
                    ? isCorrect
                      ? "border-accent text-accent-foreground"
                      : "border-destructive text-destructive"
                    : "border-primary focus:border-primary"
                )}
              />
            )}
          </span>
        ))}
      </div>

      {showResult && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm",
          isCorrect ? "bg-accent/10 text-accent-foreground" : "bg-destructive/10 text-destructive"
        )}>
          {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {isCorrect ? "Correct!" : (
            <span>
              Incorrect. The answer is: <strong>{correctAnswer}</strong>
            </span>
          )}
        </div>
      )}

      {!showResult && (
        <Button
          onClick={onSubmit}
          disabled={!userAnswer.trim()}
          className="w-full h-12"
        >
          Submit Answer
        </Button>
      )}
    </div>
  );
};
