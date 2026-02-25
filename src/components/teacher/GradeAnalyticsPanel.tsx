import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

interface Props {
  classId: string;
  courseId?: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 76%, 36%)",
  "hsl(48, 96%, 53%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
  "hsl(25, 95%, 53%)",
];

export function GradeAnalyticsPanel({ classId, courseId }: Props) {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    fetchMarks();
  }, [classId, courseId]);

  const fetchMarks = async () => {
    if (!courseId) { setLoading(false); return; }

    const { data } = await supabase
      .from("student_marks")
      .select("*")
      .eq("class_id", classId)
      .eq("course_id", courseId);

    setMarks((data as any[]) || []);
    setLoading(false);
  };

  const generateInsight = async () => {
    if (marks.length === 0) return;
    setLoadingAi(true);

    const summary = {
      total_students: marks.length,
      avg_total: (marks.reduce((s, m) => s + (m.total_marks || 0), 0) / marks.length).toFixed(1),
      pass_rate: ((marks.filter((m) => (m.total_marks || 0) >= 40).length / marks.length) * 100).toFixed(0),
      grade_distribution: marks.reduce((acc: any, m) => {
        const g = m.grade || "Ungraded";
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      }, {}),
      component_avgs: {
        assignment: (marks.reduce((s, m) => s + (m.assignment_marks || 0), 0) / marks.length).toFixed(1),
        midsem1: (marks.reduce((s, m) => s + (m.midsem1 || 0), 0) / marks.length).toFixed(1),
        midsem2: (marks.reduce((s, m) => s + (m.midsem2 || 0), 0) / marks.length).toFixed(1),
        endsem: (marks.reduce((s, m) => s + (m.endsem || 0), 0) / marks.length).toFixed(1),
      },
    };

    try {
      const { data, error } = await supabase.functions.invoke("newton-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Analyze this class performance data and provide brief insights (3-4 bullet points) on trends, weak areas, and recommendations:\n${JSON.stringify(summary)}`,
            },
          ],
        },
      });

      if (data?.response) {
        setAiInsight(data.response);
      }
    } catch (err) {
      toast.error("Failed to generate insights");
    }

    setLoadingAi(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!courseId || marks.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{!courseId ? "Select a course to view analytics." : "No marks data yet."}</p>
        </CardContent>
      </Card>
    );
  }

  // Compute analytics
  const avgTotal = marks.reduce((s, m) => s + (m.total_marks || 0), 0) / marks.length;
  const passRate = (marks.filter((m) => (m.total_marks || 0) >= 40).length / marks.length) * 100;

  const gradeData = Object.entries(
    marks.reduce((acc: Record<string, number>, m) => {
      const g = m.grade || "Ungraded";
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const componentAvgs = [
    { name: "Assign.", avg: marks.reduce((s, m) => s + (m.assignment_marks || 0), 0) / marks.length },
    { name: "Attend.", avg: marks.reduce((s, m) => s + (m.attendance_marks || 0), 0) / marks.length },
    { name: "Mid 1", avg: marks.reduce((s, m) => s + (m.midsem1 || 0), 0) / marks.length },
    { name: "Mid 2", avg: marks.reduce((s, m) => s + (m.midsem2 || 0), 0) / marks.length },
    { name: "End", avg: marks.reduce((s, m) => s + (m.endsem || 0), 0) / marks.length },
    { name: "Pract.", avg: marks.reduce((s, m) => s + (m.practical_marks || 0), 0) / marks.length },
    { name: "Project", avg: marks.reduce((s, m) => s + (m.project_marks || 0), 0) / marks.length },
  ];

  const weakStudents = marks
    .filter((m) => (m.total_marks || 0) < 40)
    .sort((a, b) => (a.total_marks || 0) - (b.total_marks || 0));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="py-3 text-center">
            <p className="text-lg font-bold">{avgTotal.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg Total</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 text-center">
            <p className="text-lg font-bold text-green-600">{passRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Pass Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 text-center">
            <p className="text-lg font-bold">{marks.length}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Component Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={componentAvgs}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {gradeData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weak students */}
      {weakStudents.length > 0 && (
        <Card className="border-border/50 border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-destructive" />
              At-Risk Students ({weakStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weakStudents.map((m) => (
                <Badge key={m.student_id} variant="destructive" className="text-xs">
                  {m.student_id.slice(0, 8)}... — {m.total_marks ?? 0}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Brain className="h-4 w-4 text-primary" />
            AI Performance Insights
          </CardTitle>
          <Button size="sm" variant="outline" onClick={generateInsight} disabled={loadingAi} className="gap-1.5">
            {loadingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
            Generate
          </Button>
        </CardHeader>
        <CardContent>
          {aiInsight ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiInsight}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Click "Generate" to get AI-powered insights on class performance.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
