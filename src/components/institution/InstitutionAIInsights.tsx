import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, Building2, BarChart3, Users, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Props {
  analytics: any;
  facultyStats: any[];
}

interface InstitutionInsights {
  department_performance: { department: string; rating: string; insight: string }[];
  exam_difficulty_trends: { course: string; finding: string }[];
  attendance_correlations: { finding: string; recommendation: string }[];
  overall_recommendations: string[];
}

export function InstitutionAIInsights({ analytics, facultyStats }: Props) {
  const [insights, setInsights] = useState<InstitutionInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const payload = {
        total_students: analytics?.total_students ?? 0,
        avg_score: analytics?.avg_score ?? 0,
        attendance_rate: analytics?.attendance_rate ?? 0,
        active_courses: analytics?.active_courses ?? 0,
        course_stats: (analytics?.course_stats || []).map((c: any) => ({
          course_name: c.course_name,
          course_code: c.course_code,
          avg_score: c.avg_score,
          pass_count: c.pass_count,
          fail_count: c.fail_count,
          student_count: c.student_count,
        })),
        attendance_stats: (analytics?.attendance_stats || []).map((a: any) => ({
          class_name: a.class_name,
          attendance_rate: a.attendance_rate,
        })),
        faculty_summary: (facultyStats || []).map((f: any) => ({
          teacher_id_short: f.teacher_id?.slice(0, 8) || "unknown",
          class_count: f.class_count,
          session_count: f.session_count,
          assignment_count: f.assignment_count,
          avg_student_score: f.avg_student_score,
        })),
      };

      const { data, error } = await supabase.functions.invoke("generate-academic-insights", {
        body: { type: "institution", data: payload },
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

  const ratingColor = (r: string) =>
    r === "excellent" ? "text-green-500" : r === "good" ? "text-primary" : r === "average" ? "text-amber-500" : "text-destructive";

  const ratingBg = (r: string) =>
    r === "excellent" ? "bg-green-500/10" : r === "good" ? "bg-primary/10" : r === "average" ? "bg-amber-500/10" : "bg-destructive/10";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> AI Institutional Insights
        </h3>
        <Button size="sm" variant="outline" onClick={generateInsights} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          {insights ? "Refresh" : "Generate Insights"}
        </Button>
      </div>

      {!insights && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Generate AI-powered insights across departments, courses, and attendance patterns.</p>
          </CardContent>
        </Card>
      )}

      {insights && (
        <div className="space-y-4">
          {/* Department Performance */}
          {insights.department_performance.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> Department Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {insights.department_performance.map((d, i) => (
                    <div key={i} className={`rounded-lg p-3 ${ratingBg(d.rating)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold">{d.department}</p>
                        <Badge variant="outline" className={`text-[10px] capitalize ${ratingColor(d.rating)}`}>{d.rating.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{d.insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exam Difficulty */}
          {insights.exam_difficulty_trends.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" /> Exam Difficulty Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.exam_difficulty_trends.map((e, i) => (
                  <div key={i} className="border rounded-lg p-3 border-border/50">
                    <p className="text-sm font-medium">{e.course}</p>
                    <p className="text-[11px] text-muted-foreground">{e.finding}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Attendance Correlations */}
          {insights.attendance_correlations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Attendance Correlations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.attendance_correlations.map((a, i) => (
                  <div key={i} className="border rounded-lg p-3 border-border/50">
                    <p className="text-sm">{a.finding}</p>
                    <p className="text-[11px] text-primary mt-1">→ {a.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {insights.overall_recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {insights.overall_recommendations.map((r, i) => (
                  <p key={i} className="text-sm text-muted-foreground">• {r}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
