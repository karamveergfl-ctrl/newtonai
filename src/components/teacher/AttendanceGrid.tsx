import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarCheck } from "lucide-react";

interface AttendanceGridProps {
  students: Array<{ student_id: string; full_name: string }>;
  assignments: Array<{ assignment_id: string; title: string; due_date: string | null }>;
  attendance: Array<{ student_id: string; assignment_id: string; status: string }>;
}

const statusColors: Record<string, string> = {
  submitted: "bg-green-500",
  late: "bg-amber-500",
  missing: "bg-destructive",
  not_due: "bg-muted-foreground/30",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  late: "Late",
  missing: "Missing",
  not_due: "Not yet due",
};

export function AttendanceGrid({ students, assignments, attendance }: AttendanceGridProps) {
  if (students.length === 0 || assignments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No attendance data available yet</p>
      </div>
    );
  }

  const getStatus = (studentId: string, assignmentId: string) => {
    const entry = attendance.find((a) => a.student_id === studentId && a.assignment_id === assignmentId);
    return entry?.status || "missing";
  };

  const getStudentRate = (studentId: string) => {
    const total = assignments.length;
    const submitted = attendance.filter((a) => a.student_id === studentId && (a.status === "submitted" || a.status === "late")).length;
    return total > 0 ? Math.round((submitted / total) * 100) : 0;
  };

  const getAssignmentRate = (assignmentId: string) => {
    const total = students.length;
    const submitted = attendance.filter((a) => a.assignment_id === assignmentId && (a.status === "submitted" || a.status === "late")).length;
    return total > 0 ? Math.round((submitted / total) * 100) : 0;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex items-end gap-1 mb-2 pl-36">
            {assignments.map((a) => (
              <div key={a.assignment_id} className="w-8 text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[9px] text-muted-foreground truncate block cursor-default leading-tight">
                      {a.title.slice(0, 3)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-48">
                    {a.title}
                    {a.due_date && <div className="text-muted-foreground">Due: {new Date(a.due_date).toLocaleDateString()}</div>}
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
            <div className="w-12 text-center text-[9px] text-muted-foreground font-medium">Rate</div>
          </div>

          {/* Student rows */}
          {students.map((s) => {
            const rate = getStudentRate(s.student_id);
            return (
              <div key={s.student_id} className="flex items-center gap-1 mb-1">
                <div className="w-36 shrink-0 truncate text-xs font-medium pr-2">{s.full_name}</div>
                {assignments.map((a) => {
                  const status = getStatus(s.student_id, a.assignment_id);
                  return (
                    <Tooltip key={a.assignment_id}>
                      <TooltipTrigger asChild>
                        <div className="w-8 h-6 flex items-center justify-center">
                          <div className={cn("w-3.5 h-3.5 rounded-full", statusColors[status] || "bg-muted")} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {s.full_name} · {a.title}: {statusLabels[status] || status}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                <div className={cn("w-12 text-center text-xs font-medium tabular-nums",
                  rate >= 80 ? "text-green-500" : rate >= 50 ? "text-amber-500" : "text-destructive"
                )}>{rate}%</div>
              </div>
            );
          })}

          {/* Summary row */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
            <div className="w-36 shrink-0 text-xs font-medium text-muted-foreground">Participation</div>
            {assignments.map((a) => {
              const rate = getAssignmentRate(a.assignment_id);
              return (
                <div key={a.assignment_id} className={cn("w-8 text-center text-[10px] font-medium tabular-nums",
                  rate >= 80 ? "text-green-500" : rate >= 50 ? "text-amber-500" : "text-destructive"
                )}>{rate}%</div>
              );
            })}
            <div className="w-12" />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
            {Object.entries(statusColors).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                <span className="capitalize">{statusLabels[key]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
