import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ShortAnswerQuestionProps {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  aiScore: number | null;       // 0-1
  aiFeedback: string | null;
  isGrading: boolean;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
}

export const ShortAnswerQuestion = ({
  question,
  correctAnswer,
  userAnswer,
  showResult,
  aiScore,
  aiFeedback,
  isGrading,
  onAnswerChange,
  onSubmit,
}: ShortAnswerQuestionProps) => {
  const scoreColor = aiScore !== null
    ? aiScore >= 0.8 ? "text-accent-foreground" : aiScore >= 0.5 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive"
    : "";

  return (
    <div className="space-y-4">
      <Textarea
        value={userAnswer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={showResult || isGrading}
        placeholder="Type your answer here..."
        className="min-h-[120px] resize-none text-base"
      />

      {isGrading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Newton is evaluating your answer...</span>
        </div>
      )}

      {showResult && aiScore !== null && (
        <div className={cn(
          "p-4 rounded-lg border space-y-2",
          aiScore >= 0.8 ? "bg-accent/10 border-accent/30" : aiScore >= 0.5 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-destructive/10 border-destructive/30"
        )}>
          <div className="flex items-center gap-2">
            {aiScore >= 0.8 ? <CheckCircle className="w-5 h-5 text-accent-foreground" /> : <XCircle className="w-5 h-5 text-destructive" />}
            <span className={cn("font-bold text-lg", scoreColor)}>
              {Math.round(aiScore * 100)}%
            </span>
          </div>
          {aiFeedback && <p className="text-sm text-muted-foreground">{aiFeedback}</p>}
          <div className="text-sm mt-2">
            <span className="font-medium">Expected answer: </span>
            <span className="text-muted-foreground">{correctAnswer}</span>
          </div>
        </div>
      )}

      {!showResult && !isGrading && (
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
