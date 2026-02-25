import { cn } from "@/lib/utils";

interface LiveSessionBadgeProps {
  sessionId: string;
  role: "teacher" | "student";
  className?: string;
  onClick?: () => void;
  studentCount?: number;
  className2?: string;
  label?: string;
}

export function LiveSessionBadge({
  role,
  className,
  onClick,
  studentCount,
  label,
}: LiveSessionBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25",
        className
      )}
    >
      {/* Pulsing red dot */}
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>

      <span>Live</span>

      {role === "teacher" && studentCount !== undefined && (
        <span className="text-red-400/70">· {studentCount} students</span>
      )}
      {role === "student" && label && (
        <span className="text-red-400/70">· {label}</span>
      )}
    </button>
  );
}
