import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, BookOpen, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SessionResultsPanelProps {
  sessionId: string;
  sessionTitle: string;
}

export function SessionResultsPanel({ sessionId, sessionTitle }: SessionResultsPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: result } = await supabase.rpc("analyze_session_results" as any, { p_session_id: sessionId });
      setData(result);
      setLoading(false);
    };
    fetch();
  }, [sessionId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.success) return <p className="text-muted-foreground text-center py-8">{data?.error || "Failed to load results"}</p>;

  const { attendance, topic_analysis, student_analysis, class_average, class_median, weak_topics_summary } = data;
  const pieData = [
    { name: "Present", value: attendance.present, color: "hsl(var(--chart-2))" },
    { name: "Absent", value: attendance.absent, color: "hsl(var(--destructive))" },
  ];
  const attendancePct = attendance.total_enrolled > 0 ? Math.round((attendance.present / attendance.total_enrolled) * 100) : 0;

  const barData = (topic_analysis || []).map((t: any, i: number) => ({
    name: `Q${i + 1}`,
    accuracy: t.accuracy_pct,
    fill: t.accuracy_pct >= 70 ? "hsl(var(--chart-2))" : t.accuracy_pct >= 50 ? "hsl(var(--chart-4))" : "hsl(var(--destructive))",
  }));

  const weakStudents = (student_analysis || []).filter((s: any) => s.status === "needs_attention");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">{sessionTitle} — Results</h2>
        <p className="text-sm text-muted-foreground">Class avg: {class_average}% · Median: {class_median}%</p>
      </div>

      {/* Attendance */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={45} strokeWidth={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-3xl font-bold">{attendancePct}%</p>
              <p className="text-sm text-muted-foreground">{attendance.present}/{attendance.total_enrolled} present</p>
            </div>
          </div>
          {attendance.absent > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs font-medium text-destructive mb-1">Absent ({attendance.absent})</p>
              <div className="flex flex-wrap gap-1.5">
                {(attendance.absent_students || []).map((s: any) => (
                  <Badge key={s.student_id} variant="destructive" className="text-[10px]">{s.full_name}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topic Analysis */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Topic Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length > 0 && (
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 30 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={30} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                    {barData.map((d: any, i: number) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weak topics list */}
          {(topic_analysis || []).filter((t: any) => t.status === "weak").length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-4 w-4" /> Weak Topics — Consider Re-teaching
              </p>
              <div className="space-y-1.5">
                {(topic_analysis || []).filter((t: any) => t.status === "weak").map((t: any) => (
                  <div key={t.question_index} className="flex items-start gap-2 text-xs">
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      Q{t.question_index + 1}: {t.question_text} ({t.accuracy_pct}% accuracy)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(topic_analysis || []).filter((t: any) => t.status === "weak").length === 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">All topics above 50% accuracy — good understanding!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Performance */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Student Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {(student_analysis || []).map((s: any) => (
              <div key={s.student_id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.status === "needs_attention" ? "bg-red-500" : s.status === "moderate" ? "bg-amber-500" : "bg-green-500"}`} />
                  <span className="text-sm truncate">{s.full_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium tabular-nums">{s.score}/{s.total}</span>
                  <span className={`text-xs tabular-nums ${s.percentage >= 80 ? "text-green-500" : s.percentage >= 50 ? "text-amber-500" : "text-destructive"}`}>
                    {s.percentage}%
                  </span>
                  {s.status === "needs_attention" && (
                    <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Needs Attention</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          {weakStudents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-destructive font-medium">{weakStudents.length} student{weakStudents.length > 1 ? "s" : ""} need additional support</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
