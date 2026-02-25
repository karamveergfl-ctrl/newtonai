import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, RefreshCw, AlertTriangle, Users, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classId: string;
  courseId?: string;
  marks: any[];
}

interface TeacherInsights {
  reteach_topics: { topic: string; reason: string; affected_student_pct: number }[];
  students_needing_help: { student_id_short: string; signals: string[]; priority: string }[];
  assignment_improvements: { suggestion: string; rationale: string }[];
}

export function TeacherAIInsights({ classId, courseId, marks }: Props) {
  const [insights, setInsights] = useState<TeacherInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (marks.length === 0) {
      toast.error("No marks data to analyze");
      return;
    }
    setLoading(true);
    try {
      // Fetch attendance + submissions for richer context
      const [{ data: attendance }, { data: submissions }] = await Promise.all([
        supabase.from("attendance_records").select("student_id, status").eq("class_id", classId),
        supabase.from("assignment_submissions").select("student_id, score, status, assignment_id").eq("status", "graded"),
      ]);

      const totalStudents = marks.length;
      const avgTotal = marks.reduce((s, m) => s + (m.total_marks || 0), 0) / totalStudents;
      const passRate = (marks.filter(m => (m.total_marks || 0) >= 40).length / totalStudents) * 100;

      // Anonymize student IDs
      const studentPerformance = marks.map(m => ({
        id: m.student_id?.slice(0, 8) || "unknown",
        total: m.total_marks || 0,
        grade: m.grade || "Ungraded",
        assignment: m.assignment_marks || 0,
        midsem1: m.midsem1 || 0,
        midsem2: m.midsem2 || 0,
        endsem: m.endsem || 0,
      }));

      // Aggregate attendance
      const attendanceByStudent: Record<string, { total: number; present: number }> = {};
      (attendance || []).forEach((a: any) => {
        const sid = a.student_id?.slice(0, 8) || "unknown";
        if (!attendanceByStudent[sid]) attendanceByStudent[sid] = { total: 0, present: 0 };
        attendanceByStudent[sid].total++;
        if (a.status === "present") attendanceByStudent[sid].present++;
      });

      const payload = {
        total_students: totalStudents,
        avg_total: avgTotal.toFixed(1),
        pass_rate: passRate.toFixed(0),
        component_avgs: {
          assignment: (marks.reduce((s, m) => s + (m.assignment_marks || 0), 0) / totalStudents).toFixed(1),
          midsem1: (marks.reduce((s, m) => s + (m.midsem1 || 0), 0) / totalStudents).toFixed(1),
          midsem2: (marks.reduce((s, m) => s + (m.midsem2 || 0), 0) / totalStudents).toFixed(1),
          endsem: (marks.reduce((s, m) => s + (m.endsem || 0), 0) / totalStudents).toFixed(1),
        },
        student_performance: studentPerformance.slice(0, 50),
        attendance_summary: Object.entries(attendanceByStudent).slice(0, 50).map(([id, v]) => ({
          id, rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
        })),
        grade_distribution: marks.reduce((acc: any, m) => {
          const g = m.grade || "Ungraded";
          acc[g] = (acc[g] || 0) + 1;
          return acc;
        }, {}),
      };

      const { data, error } = await supabase.functions.invoke("generate-academic-insights", {
        body: { type: "teacher", data: payload },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data.insights);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = (p: string) =>
    p === "critical" ? "destructive" : p === "high" ? "destructive" : p === "medium" ? "secondary" : "outline";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-primary" /> AI Performance Insights
        </CardTitle>
        <Button size="sm" variant="outline" onClick={generateInsights} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          {insights ? "Refresh" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {!insights && !loading && (
          <p className="text-sm text-muted-foreground">Click "Generate" to get AI-powered insights on class performance, at-risk students, and teaching recommendations.</p>
        )}

        {insights && (
          <div className="space-y-4 mt-2">
            {/* Reteach Topics */}
            {insights.reteach_topics.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                  <RefreshCw className="h-3.5 w-3.5" /> Topics to Reteach
                </h4>
                <div className="space-y-2">
                  {insights.reteach_topics.map((t, i) => (
                    <div key={i} className="flex items-start justify-between border rounded-lg p-3 border-border/50">
                      <div>
                        <p className="text-sm font-medium">{t.topic}</p>
                        <p className="text-[11px] text-muted-foreground">{t.reason}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">{t.affected_student_pct}% affected</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Students Needing Help */}
            {insights.students_needing_help.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                  <Users className="h-3.5 w-3.5" /> Students Needing Help
                </h4>
                <div className="space-y-2">
                  {insights.students_needing_help.map((s, i) => (
                    <div key={i} className="flex items-center justify-between border rounded-lg p-3 border-border/50">
                      <div>
                        <p className="text-sm font-mono">{s.student_id_short}...</p>
                        <p className="text-[11px] text-muted-foreground">{s.signals.join(" · ")}</p>
                      </div>
                      <Badge variant={priorityColor(s.priority) as any} className="text-[10px] capitalize">{s.priority}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment Improvements */}
            {insights.assignment_improvements.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                  <Lightbulb className="h-3.5 w-3.5" /> Assignment Improvements
                </h4>
                <div className="space-y-2">
                  {insights.assignment_improvements.map((a, i) => (
                    <div key={i} className="border rounded-lg p-3 border-border/50">
                      <p className="text-sm font-medium">{a.suggestion}</p>
                      <p className="text-[11px] text-muted-foreground">{a.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
