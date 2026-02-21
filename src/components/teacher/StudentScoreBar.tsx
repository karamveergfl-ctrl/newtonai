import { cn } from "@/lib/utils";

interface StudentScoreBarProps {
  score: number;
  maxScore?: number;
  className?: string;
}

export function StudentScoreBar({ score, maxScore = 100, className }: StudentScoreBarProps) {
  const pct = maxScore > 0 ? Math.min(Math.round((score / maxScore) * 100), 100) : 0;
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", pct >= 80 ? "text-green-500" : pct >= 50 ? "text-amber-500" : "text-destructive")}>
        {score}%
      </span>
    </div>
  );
}
