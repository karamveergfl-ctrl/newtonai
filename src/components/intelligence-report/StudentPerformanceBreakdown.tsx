import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentPerformanceBreakdownProps {
  sessionId: string;
}

interface StudentRow {
  student_id: string;
  full_name: string;
  understanding_score: number;
  knowledge_gaps_count: number;
}

export function StudentPerformanceBreakdown({ sessionId }: StudentPerformanceBreakdownProps) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get all student reports for this session
      const { data: reports } = await supabase
        .from("student_intelligence_reports")
        .select("student_id, understanding_score, knowledge_gaps")
        .eq("session_id", sessionId)
        .eq("status", "ready");

      if (!reports || reports.length === 0) {
        setLoading(false);
        return;
      }

      // Get profile names
      const studentIds = reports.map((r) => r.student_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p.full_name || "Unknown"])
      );

      const rows: StudentRow[] = reports
        .map((r) => ({
          student_id: r.student_id,
          full_name: profileMap.get(r.student_id) || "Unknown",
          understanding_score: (r as any).understanding_score ?? 0,
          knowledge_gaps_count: Array.isArray((r as any).knowledge_gaps)
            ? (r as any).knowledge_gaps.length
            : 0,
        }))
        .sort((a, b) => b.understanding_score - a.understanding_score);

      setStudents(rows);
      setLoading(false);
    };
    fetch();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No student reports available yet</p>
        </CardContent>
      </Card>
    );
  }

  // Bottom quartile threshold
  const threshold = Math.max(
    students[Math.floor(students.length * 0.75)]?.understanding_score ?? 0,
    40
  );

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">👥 Student Performance</p>
          <span className="text-xs text-muted-foreground">{students.length} students</span>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Student</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Score</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Gaps</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const score = s.understanding_score;
                const needsAttention = score < threshold;
                return (
                  <tr
                    key={s.student_id}
                    className={cn(
                      "border-b border-border/50 last:border-0 transition-colors",
                      score >= 80 && "bg-emerald-500/5",
                      score >= 50 && score < 80 && "bg-amber-500/5",
                      score < 50 && "bg-red-500/5"
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {s.full_name[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium truncate max-w-[120px]">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          score >= 80 && "text-emerald-500",
                          score >= 50 && score < 80 && "text-amber-500",
                          score < 50 && "text-red-500"
                        )}
                      >
                        {score}%
                      </span>
                    </td>
                    <td className="text-center px-3 py-2.5 text-muted-foreground">
                      {s.knowledge_gaps_count}
                    </td>
                    <td className="text-right px-3 py-2.5">
                      {needsAttention ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] h-5 bg-red-500/10 text-red-400 border-red-500/30 gap-1"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Needs Attention
                        </Badge>
                      ) : score >= 80 ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] h-5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        >
                          Excellent
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-5">
                          OK
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
