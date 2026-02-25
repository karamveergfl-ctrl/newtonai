import { cn } from "@/lib/utils";

interface ConceptCheckTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: "small" | "large";
}

export function ConceptCheckTimer({
  totalSeconds,
  remainingSeconds,
  size = "large",
}: ConceptCheckTimerProps) {
  const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const dims = size === "large" ? 72 : 40;
  const stroke = size === "large" ? 4 : 3;
  const radius = (dims - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  const colorClass =
    fraction > 0.5
      ? "stroke-emerald-400"
      : fraction > 0.2
        ? "stroke-amber-400"
        : "stroke-red-500";

  const isPulsing = remainingSeconds <= 5 && remainingSeconds > 0;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", isPulsing && "animate-concept-pulse")}
      style={{ width: dims, height: dims }}
      aria-label={`${remainingSeconds} seconds remaining`}
    >
      <svg width={dims} height={dims} className="-rotate-90">
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={radius}
          fill="none"
          className="stroke-gray-700"
          strokeWidth={stroke}
        />
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={radius}
          fill="none"
          className={cn(colorClass, "transition-all duration-1000 ease-linear")}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "absolute font-bold tabular-nums",
          size === "large" ? "text-lg" : "text-xs",
          remainingSeconds === 0 ? "text-red-500" : "text-foreground"
        )}
      >
        {remainingSeconds}
      </span>
    </div>
  );
}
