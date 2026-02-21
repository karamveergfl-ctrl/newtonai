import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentScoreBar } from "./StudentScoreBar";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface AssignmentResult {
  assignment_id: string;
  title: string;
  assignment_type: string;
  is_published: boolean;
  due_date: string | null;
  total_enrolled: number;
  submission_count: number;
  average_score: number;
  submissions: Array<{
    student_id: string;
    full_name: string;
    score: number | null;
    status: string;
    submitted_at: string;
  }>;
}

interface AssignmentResultsPanelProps {
  assignments: AssignmentResult[];
  enrolledStudentIds?: string[];
}

export function AssignmentResultsPanel({ assignments, enrolledStudentIds }: AssignmentResultsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = ["all", ...new Set(assignments.map((a) => a.assignment_type))];
  const filtered = typeFilter === "all" ? assignments : assignments.filter((a) => a.assignment_type === typeFilter);

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No assignment data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <Badge
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            className="cursor-pointer capitalize"
            onClick={() => setTypeFilter(t)}
          >
            {t}
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a, i) => {
          const isExpanded = expandedId === a.assignment_id;
          const completionPct = a.total_enrolled > 0 ? Math.round((a.submission_count / a.total_enrolled) * 100) : 0;

          // Score distribution buckets
          const buckets = [
            { name: "0-40", count: 0 },
            { name: "40-60", count: 0 },
            { name: "60-80", count: 0 },
            { name: "80-100", count: 0 },
          ];
          a.submissions.forEach((s) => {
            if (s.score == null) return;
            if (s.score < 40) buckets[0].count++;
            else if (s.score < 60) buckets[1].count++;
            else if (s.score < 80) buckets[2].count++;
            else buckets[3].count++;
          });

          // Find students who haven't submitted
          const submittedIds = new Set(a.submissions.map((s) => s.student_id));

          return (
            <motion.div
              key={a.assignment_id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className={cn("border-border/50 cursor-pointer transition-colors hover:border-border", isExpanded && "border-primary/30")}
                onClick={() => setExpandedId(isExpanded ? null : a.assignment_id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] h-5 capitalize">{a.assignment_type}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {a.submission_count}/{a.total_enrolled} submitted ({completionPct}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-lg font-bold tabular-nums">{a.average_score || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">avg score</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-4">
                          {/* Score distribution chart */}
                          {buckets.some((b) => b.count > 0) && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Score Distribution</p>
                              <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={buckets}>
                                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                  <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Submitted students */}
                          {a.submissions.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Submissions</p>
                              <div className="space-y-1.5">
                                {a.submissions.map((s) => (
                                  <div key={s.student_id} className="flex items-center justify-between text-sm">
                                    <span>{s.full_name}</span>
                                    <span className={cn("text-xs font-medium",
                                      s.score != null && s.score >= 80 ? "text-green-500" :
                                      s.score != null && s.score >= 50 ? "text-amber-500" :
                                      s.score != null ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                      {s.score != null ? `${s.score}%` : s.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Not submitted */}
                          {enrolledStudentIds && enrolledStudentIds.filter((id) => !submittedIds.has(id)).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-destructive mb-2">Not Submitted</p>
                              <div className="space-y-1 text-sm text-destructive/80">
                                {enrolledStudentIds.filter((id) => !submittedIds.has(id)).map((id) => (
                                  <p key={id}>• Student {id.slice(0, 8)}…</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
