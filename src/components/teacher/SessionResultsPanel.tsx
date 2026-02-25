import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, BookOpen, AlertTriangle, CheckCircle2, XCircle, MessageSquare, ThumbsUp, Download, Zap } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSessionSummary } from "@/hooks/useSessionSummary";
import { Button } from "@/components/ui/button";

interface SessionResultsPanelProps {
  sessionId: string;
  sessionTitle: string;
}

export function SessionResultsPanel({ sessionId, sessionTitle }: SessionResultsPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { pulseSummary, topQuestions, totalQuestions, isLoading: summaryLoading, isExporting, exportSummaryAsPDF, totalConceptChecks, avgCorrectPercentage, hardestCheck, conceptChecks, conceptResultsMap } = useSessionSummary({ sessionId });

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
      {/* Interaction Summary — new section */}
      {!summaryLoading && pulseSummary.total > 0 && (
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Interaction Summary
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportSummaryAsPDF}
                disabled={isExporting}
                className="text-xs h-7 gap-1.5"
              >
                {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pulse breakdown */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{pulseSummary.got_it}</p>
                <p className="text-[10px] text-muted-foreground">Got It</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{pulseSummary.slightly_lost}</p>
                <p className="text-[10px] text-muted-foreground">Slightly Lost</p>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{pulseSummary.lost}</p>
                <p className="text-[10px] text-muted-foreground">Lost</p>
              </div>
            </div>

            {/* Confusion warning */}
            {pulseSummary.confusion_percentage > 40 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  Confusion spiked to {Math.round(pulseSummary.confusion_percentage)}% — consider revisiting this topic next class
                </p>
              </div>
            )}

            {/* Questions summary */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total questions asked</span>
              <span className="font-medium">{totalQuestions}</span>
            </div>

            {/* Top questions */}
            {topQuestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Top Questions</p>
                {topQuestions.map((q) => (
                  <div key={q.id} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{q.upvotes}</span>
                    </div>
                    <span className="flex-1">{q.content}</span>
                    {q.is_answered && (
                      <Badge variant="secondary" className="text-[9px] h-4 shrink-0">Answered</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Concept Checks Summary */}
      {!summaryLoading && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" /> Concept Checks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalConceptChecks === 0 ? (
              <div className="text-center py-3">
                <p className="text-sm text-muted-foreground">No concept checks were run this session</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: Use ⚡ Check Understanding during your next lecture to gauge student understanding in real-time
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{totalConceptChecks} check{totalConceptChecks > 1 ? "s" : ""} run</span>
                  <span className={`font-bold ${avgCorrectPercentage >= 70 ? "text-green-500" : avgCorrectPercentage >= 40 ? "text-amber-500" : "text-red-500"}`}>
                    {avgCorrectPercentage}% avg correct
                  </span>
                </div>
                {hardestCheck && conceptResultsMap[hardestCheck.id]?.correct_percentage < 60 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-start gap-2 text-xs text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Hardest: "{hardestCheck.question.split(" ").slice(0, 8).join(" ")}…" — consider reviewing next class</span>
                  </div>
                )}
                <div className="space-y-2">
                  {conceptChecks.map((check) => {
                    const r = conceptResultsMap[check.id];
                    if (!r) return null;
                    const pct = r.correct_percentage;
                    return (
                      <div key={check.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30 text-xs">
                        <span className="truncate flex-1 mr-2">{check.question}</span>
                        <Badge className={`text-[10px] ${pct >= 70 ? "bg-green-500/15 text-green-400" : pct >= 40 ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>
                          {Math.round(pct)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

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
