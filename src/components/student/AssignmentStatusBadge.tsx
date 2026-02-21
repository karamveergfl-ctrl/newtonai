import { cn } from "@/lib/utils";
import { Circle, CheckCircle2, Clock } from "lucide-react";

type Status = "not_started" | "submitted" | "graded" | "overdue";

interface AssignmentStatusBadgeProps {
  status: Status;
  score?: number | null;
  maxScore?: number | null;
  className?: string;
}

const statusConfig: Record<Status, { label: string; icon: typeof Circle; color: string }> = {
  not_started: {
    label: "Not Started",
    icon: Circle,
    color: "bg-muted text-muted-foreground border-border",
  },
  submitted: {
    label: "Submitted",
    icon: Clock,
    color: "bg-secondary/10 text-secondary border-secondary/30",
  },
  graded: {
    label: "Graded",
    icon: CheckCircle2,
    color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  },
  overdue: {
    label: "Overdue",
    icon: Clock,
    color: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

export function AssignmentStatusBadge({ status, score, maxScore, className }: AssignmentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {status === "graded" && score !== null && score !== undefined
        ? `${score}${maxScore ? `/${maxScore}` : ""}`
        : config.label}
    </span>
  );
}
