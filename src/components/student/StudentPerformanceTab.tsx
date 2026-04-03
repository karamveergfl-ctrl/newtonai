import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Award, Target, CheckCircle2, AlertTriangle, BookOpen, Brain, FileQuestion, BarChart3 } from "lucide-react";
import { StudentLearningInsights } from "./StudentLearningInsights";
import { format } from "date-fns";

interface Props {
  classId: string;
}

export function StudentPerformanceTab({ classId }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportScores, setReportScores] = useState<{ session_id: string; score: number; date: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: result } = await supabase.rpc("get_student_class_performance", { p_class_id: classId } as any);
      setData(result);

      // Fetch intelligence report scores for this class's sessions
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sessions } = await supabase
          .from("live_sessions")
          .select("id")
          .eq("class_id", classId)
          .in("status", ["ended", "completed"]);

        if (sessions && sessions.length > 0) {
          const sessionIds = sessions.map(s => s.id);
          const { data: reports } = await supabase
            .from("student_intelligence_reports")
            .select("session_id, understanding_score, generated_at")
            .eq("student_id", user.id)
            .eq("status", "ready")
            .in("session_id", sessionIds)
            .order("generated_at", { ascending: true });

          if (reports) {
            setReportScores(reports.map(r => ({
              session_id: r.session_id,
              score: r.understanding_score,
              date: r.generated_at,
            })));
          }
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [classId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.success) return <p className="text-center text-muted-foreground py-12">Unable to load performance data</p>;

  const stats = [
    { label: "Attendance", value: `${data.attendance_pct}%`, icon: CheckCircle2, color: data.attendance_pct >= 80 ? "text-green-500" : data.attendance_pct >= 50 ? "text-amber-500" : "text-destructive" },
    { label: "Avg Score", value: data.average_score || "—", icon: TrendingUp, color: "text-primary" },
    { label: "Rank", value: `#${data.rank}/${data.total_students}`, icon: Award, color: data.rank <= 3 ? "text-amber-500" : "text-muted-foreground" },
    { label: "Completed", value: `${data.assignments_completed}/${data.total_assignments}`, icon: Target, color: "text-primary" },
  ];

  const weakQuestions = data.weak_questions || [];

  return (
    <div className="space-y-6">
      {/* Understanding Score Trend */}
      {reportScores.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Understanding Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-24">
              {reportScores.map((r, i) => {
                const height = Math.max(r.score, 5);
                return (
                  <div key={r.session_id} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                    onClick={() => navigate(`/report/student/${r.session_id}`)}>
                    <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{r.score}%</span>
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className={`w-full rounded-t-md transition-colors ${
                        r.score >= 80 ? "bg-emerald-500/70 hover:bg-emerald-500"
                        : r.score >= 50 ? "bg-amber-500/70 hover:bg-amber-500"
                        : "bg-destructive/70 hover:bg-destructive"
                      }`}
                    />
                    <span className="text-[8px] text-muted-foreground">{format(new Date(r.date), "M/d")}</span>
                  </div>
                );
              })}
            </div>
            {reportScores.length >= 2 && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {reportScores[reportScores.length - 1].score >= reportScores[0].score
                  ? "📈 Your understanding is improving!"
                  : "💪 Keep practicing to improve your scores"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={`h-5 w-5 mx-auto mb-1.5 ${s.color}`} />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Per-assignment scores */}
      {data.scores?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Assignment Scores
          </h3>
          <div className="space-y-2">
            {data.scores.map((s: any, i: number) => (
              <Card key={s.assignment_id || i} className="border-border/50">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {s.status === "graded" ? `${s.score}/${s.total}` : s.status || "Not attempted"}
                    </Badge>
                  </div>
                  {s.status === "graded" && (
                    <span className={`text-lg font-bold ${s.percentage >= 80 ? "text-green-500" : s.percentage >= 50 ? "text-amber-500" : "text-destructive"}`}>
                      {s.percentage}%
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Weak Topics */}
      {weakQuestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Topics to Focus On
          </h3>
          <div className="space-y-2">
            {weakQuestions.slice(0, 5).map((q: any, i: number) => (
              <Card key={i} className="border-l-4 border-l-amber-500 border-border/50">
                <CardContent className="py-3 px-4">
                  <p className="text-sm">{q.question}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">From: {q.assignment_title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Study Tool Suggestions */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> Recommended Study Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => navigate("/tools/flashcards")}>
            <BookOpen className="h-4 w-4 text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium">Flashcards</p>
              <p className="text-[10px] text-muted-foreground">Review weak topics</p>
            </div>
          </Button>
          <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => navigate("/tools/summarizer")}>
            <FileQuestion className="h-4 w-4 text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium">Summarizer</p>
              <p className="text-[10px] text-muted-foreground">Condense key concepts</p>
            </div>
          </Button>
          <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => navigate("/tools/quiz")}>
            <Target className="h-4 w-4 text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium">Practice Quiz</p>
              <p className="text-[10px] text-muted-foreground">Test your knowledge</p>
            </div>
          </Button>
        </div>
      </div>

      {/* AI Learning Insights */}
      <StudentLearningInsights classId={classId} performanceData={data} />
    </div>
  );
}
