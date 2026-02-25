import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import type { ConceptCheck, ConceptCheckResults } from "@/types/liveSession";

interface ConceptCheckHistoryCardProps {
  check: ConceptCheck;
  results: ConceptCheckResults;
}

const optKeys = ["a", "b", "c", "d"] as const;
const optLabels = ["A", "B", "C", "D"] as const;

export function ConceptCheckHistoryCard({ check, results }: ConceptCheckHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const pct = results.correct_percentage;
  const badgeColor =
    pct >= 70
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : pct >= 40
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : "bg-red-500/15 text-red-400 border-red-500/30";

  const options: Record<string, string> = {
    a: check.option_a,
    b: check.option_b,
    c: check.option_c,
    d: check.option_d,
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 space-y-2">
      {/* Collapsed view */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-start gap-2"
        aria-label={expanded ? "Collapse concept check details" : "Expand concept check details"}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2">{check.question}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", badgeColor)}>
              {Math.round(pct)}% correct
            </span>
            <span className="text-xs text-gray-500">
              {results.total_responses}/{results.total_enrolled} responded
            </span>
            {pct < 60 && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          </div>
        </div>
        {/* Mini bars */}
        <div className="flex items-end gap-0.5 h-6 shrink-0">
          {optKeys.map((key) => {
            const isCorrect = key === check.correct_answer;
            const height = Math.max(4, (results.answer_distribution[key].percentage / 100) * 24);
            return (
              <div
                key={key}
                className={cn("w-2 rounded-sm", isCorrect ? "bg-emerald-500" : "bg-gray-600")}
                style={{ height }}
              />
            );
          })}
        </div>
        <span className="text-gray-500 shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded view */}
      {expanded && (
        <div className="pt-2 border-t border-gray-800 space-y-2 animate-concept-slide-up">
          {optKeys.map((key, i) => {
            const isCorrect = key === check.correct_answer;
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className={cn("w-5 font-bold", isCorrect ? "text-emerald-400" : "text-gray-500")}>
                  {optLabels[i]}
                </span>
                <span className={cn("flex-1", isCorrect ? "text-emerald-300" : "text-gray-400")}>
                  {options[key]}
                </span>
                {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-gray-500 tabular-nums">
                  {results.answer_distribution[key].count} ({Math.round(results.answer_distribution[key].percentage)}%)
                </span>
              </div>
            );
          })}
          {check.explanation && (
            <p className="text-xs text-gray-400 leading-relaxed pt-1">{check.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
