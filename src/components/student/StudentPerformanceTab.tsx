import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Award, Target, CheckCircle2, AlertTriangle, BookOpen, Brain, FileQuestion } from "lucide-react";
import { StudentLearningInsights } from "./StudentLearningInsights";

interface Props {
  classId: string;
}

export function StudentPerformanceTab({ classId }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: result } = await supabase.rpc("get_student_class_performance", { p_class_id: classId } as any);
      setData(result);
      setLoading(false);
    };
    fetch();
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
