import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentScoreBar } from "./StudentScoreBar";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentProgress {
  student_id: string;
  full_name: string;
  total_assignments: number;
  submitted_count: number;
  average_score: number;
  last_submission_at: string | null;
}

interface StudentProgressTableProps {
  students: StudentProgress[];
  assignmentResults?: any[];
}

type SortKey = "full_name" | "average_score" | "submitted_count";

export function StudentProgressTable({ students, assignmentResults }: StudentProgressTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sorted = [...students].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortKey === "full_name") return mul * a.full_name.localeCompare(b.full_name);
    return mul * ((a[sortKey] as number) - (b[sortKey] as number));
  });

  const getStudentAssignments = (studentId: string) => {
    if (!assignmentResults) return [];
    return assignmentResults.map((a: any) => {
      const sub = (a.submissions || []).find((s: any) => s.student_id === studentId);
      return { title: a.title, type: a.assignment_type, score: sub?.score, status: sub?.status || "not_submitted" };
    });
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field && <span className="text-[10px]">{sortAsc ? "↑" : "↓"}</span>}
      </span>
    </TableHead>
  );

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No student data available yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <SortHeader label="Student" field="full_name" />
            <SortHeader label="Submissions" field="submitted_count" />
            <SortHeader label="Avg Score" field="average_score" />
            <TableHead>Attendance</TableHead>
            <TableHead>Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s, i) => {
            const isExpanded = expandedId === s.student_id;
            const attendanceRate = s.total_assignments > 0 ? Math.round((s.submitted_count / s.total_assignments) * 100) : 0;
            const studentAssignments = getStudentAssignments(s.student_id);

            return (
              <motion.tr
                key={s.student_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : s.student_id)}
              >
                <TableCell colSpan={6} className="p-0">
                  <div className="flex items-center px-4 py-3">
                    <div className="w-8 shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 grid grid-cols-5 items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {s.full_name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-sm truncate">{s.full_name}</span>
                      </div>
                      <span className="text-sm tabular-nums">{s.submitted_count}/{s.total_assignments}</span>
                      <StudentScoreBar score={s.average_score} />
                      <span className={cn("text-sm font-medium tabular-nums",
                        attendanceRate >= 80 ? "text-green-500" : attendanceRate >= 50 ? "text-amber-500" : "text-destructive"
                      )}>{attendanceRate}%</span>
                      <span className="text-xs text-muted-foreground">
                        {s.last_submission_at ? new Date(s.last_submission_at).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && studentAssignments.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-muted/30 border-t border-border/50"
                      >
                        <div className="px-12 py-3 space-y-1.5">
                          {studentAssignments.map((a: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs w-16 shrink-0">{a.type}</span>
                                <span>{a.title}</span>
                              </div>
                              <span className={cn("text-xs font-medium",
                                a.status === "not_submitted" ? "text-destructive" :
                                a.score != null && a.score >= 80 ? "text-green-500" :
                                a.score != null && a.score >= 50 ? "text-amber-500" :
                                a.score != null ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {a.status === "not_submitted" ? "Not submitted" : a.score != null ? `${a.score}%` : a.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
