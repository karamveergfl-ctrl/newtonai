import { useEffect, useState } from "react";

interface UnderstandingScoreRingProps {
  score: number;
  size?: "small" | "large";
}

function scoreColorClass(score: number) {
  if (score >= 80) return "text-teal-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function UnderstandingScoreRing({ score, size = "large" }: UnderstandingScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const isLarge = size === "large";
  const svgSize = isLarge ? 160 : 60;
  const radius = isLarge ? 64 : 24;
  const strokeWidth = isLarge ? 8 : 4;
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1000;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = circumference - (displayScore / 100) * circumference;
  const color = scoreColorClass(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize, filter: score >= 70 ? "drop-shadow(0 0 12px rgba(20,184,166,0.4))" : undefined }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted" />
          <circle
            cx={center} cy={center} r={radius} fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={`${color} transition-[stroke-dashoffset] duration-100`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold ${color} ${isLarge ? "text-3xl" : "text-sm"}`}>
          {displayScore}
        </span>
      </div>
      {isLarge && <p className="text-xs text-muted-foreground">Understanding Score</p>}
    </div>
  );
}
