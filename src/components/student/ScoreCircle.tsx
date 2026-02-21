import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  score: number;
  maxScore: number;
  size?: number;
  className?: string;
}

export function ScoreCircle({ score, maxScore, size = 44, className }: ScoreCircleProps) {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80
      ? "text-green-500"
      : percentage >= 50
        ? "text-accent"
        : "text-destructive";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700 ease-out", color)}
        />
      </svg>
      <span className={cn("absolute text-[10px] font-bold", color)}>{percentage}%</span>
    </div>
  );
}
