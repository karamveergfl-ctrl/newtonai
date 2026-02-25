import { useEffect } from "react";
import { useConceptCheck } from "@/hooks/useConceptCheck";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { ConceptCheck, ConceptCheckResults } from "@/types/liveSession";

interface ConceptCheckResultsPanelProps {
  check: ConceptCheck;
  results: ConceptCheckResults | null;
  onDismiss: () => void;
  onNewCheck: () => void;
}

const optKeys = ["a", "b", "c", "d"] as const;
const optLabels = ["A", "B", "C", "D"] as const;

export function ConceptCheckResultsPanel({
  check,
  results,
  onDismiss,
  onNewCheck,
}: ConceptCheckResultsPanelProps) {
  if (!results) return null;

  const options: Record<string, string> = {
    a: check.option_a,
    b: check.option_b,
    c: check.option_c,
    d: check.option_d,
  };

  const correctPct = results.correct_percentage;
  const pctColor =
    correctPct >= 70
      ? "text-emerald-400"
      : correctPct >= 40
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Question */}
      <p className="text-sm font-semibold text-foreground leading-snug">{check.question}</p>

      {/* Distribution bars */}
      <div className="flex flex-col gap-1.5">
        {optKeys.map((key, i) => {
          const dist = results.answer_distribution[key];
          const isCorrect = key === check.correct_answer;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-5 font-bold text-muted-foreground">{optLabels[i]}</span>
              <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden relative">
                <div
                  className={cn(
                    "h-full rounded animate-bar-fill",
                    isCorrect ? "bg-emerald-500/60" : "bg-red-500/40"
                  )}
                  style={{ "--bar-width": `${dist.percentage}%`, width: `${dist.percentage}%` } as React.CSSProperties}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs text-foreground truncate">
                  {options[key]}
                </span>
              </div>
              <span className="w-14 text-right text-muted-foreground tabular-nums">
                {dist.count} ({Math.round(dist.percentage)}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {results.total_responses}/{results.total_enrolled} answered ({Math.round(results.response_rate)}%)
        </span>
        <span>Avg {(results.avg_response_time_ms / 1000).toFixed(1)}s</span>
      </div>

      {/* Correct percentage */}
      <div className="text-center">
        <span className={cn("text-2xl font-bold tabular-nums", pctColor)}>
          {Math.round(correctPct)}%
        </span>
        <span className="text-xs text-muted-foreground ml-1">correct</span>
      </div>

      {/* Warning */}
      {correctPct < 60 && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          Most students got this wrong — consider re-explaining
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="flex-1 text-xs text-muted-foreground"
          aria-label="Dismiss results"
        >
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={onNewCheck}
          className="flex-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Start new concept check"
        >
          New Check
        </Button>
      </div>
    </div>
  );
}
