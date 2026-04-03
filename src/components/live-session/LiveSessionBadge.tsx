import { cn } from "@/lib/utils";

interface LiveSessionBadgeProps {
  sessionId: string;
  role: "teacher" | "student";
  className?: string;
  onClick?: () => void;
  studentCount?: number;
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
        "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25",
        className
      )}
    >
      {/* Pulsing red dot */}
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
      </span>

      <span>Live</span>

      {role === "teacher" && studentCount !== undefined && (
        <span className="opacity-70">· {studentCount} students</span>
      )}
      {role === "student" && label && (
        <span className="opacity-70">· {label}</span>
      )}
    </button>
  );
}
