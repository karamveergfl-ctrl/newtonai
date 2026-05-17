import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClasses } from "@/hooks/useClasses";
import { AppLayout } from "@/components/AppLayout";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  BarChart3,
  GraduationCap,
  CheckCircle2,
  Award,
  Target,
  TrendingUp,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassPerf {
  classId: string;
  name: string;
  subject: string | null;
  attendance_pct: number;
  average_score: number | string;
  rank: number;
  total_students: number;
  assignments_completed: number;
  total_assignments: number;
  marks_total: number | null;
  grade: string | null;
}

const StudentPerformance = () => {
  const { classes, loading: classesLoading } = useClasses();
  const navigate = useNavigate();
  const [perf, setPerf] = useState<ClassPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classesLoading) return;
    if (!classes.length) {
      setPerf([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const rows = await Promise.all(
        classes.map(async (cls) => {
          const { data } = await supabase.rpc(
            "get_student_class_performance",
            { p_class_id: cls.id } as any
          );
          let marks_total: number | null = null;
          let grade: string | null = null;
          if (user) {
            const { data: marks } = await supabase
              .from("student_marks")
              .select("total_marks, grade")
              .eq("class_id", cls.id)
              .eq("student_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            marks_total = (marks as any)?.total_marks ?? null;
            grade = (marks as any)?.grade ?? null;
          }
          const d: any = data || {};
          return {
            classId: cls.id,
            name: cls.name,
            subject: cls.subject,
            attendance_pct: d.attendance_pct ?? 0,
            average_score: d.average_score ?? 0,
            rank: d.rank ?? 0,
            total_students: d.total_students ?? 0,
            assignments_completed: d.assignments_completed ?? 0,
            total_assignments: d.total_assignments ?? 0,
            marks_total,
            grade,
          } as ClassPerf;
        })
      );
      if (!cancelled) {
        setPerf(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classes, classesLoading]);

  // Aggregate stats
  const totals = perf.reduce(
    (acc, p) => {
      acc.attendance += Number(p.attendance_pct) || 0;
      acc.avgScore += Number(p.average_score) || 0;
      acc.completed += p.assignments_completed;
      acc.total += p.total_assignments;
      acc.classes += 1;
      return acc;
    },
    { attendance: 0, avgScore: 0, completed: 0, total: 0, classes: 0 }
  );

  const overall = {
    attendance: totals.classes ? Math.round(totals.attendance / totals.classes) : 0,
    avgScore: totals.classes ? Math.round(totals.avgScore / totals.classes) : 0,
    assignments: totals.total
      ? `${totals.completed}/${totals.total}`
      : "—",
    classes: totals.classes,
  };

  const summaryStats = [
    { label: "Attendance", value: `${overall.attendance}%`, icon: CheckCircle2, color: overall.attendance >= 80 ? "text-emerald-500" : overall.attendance >= 50 ? "text-amber-500" : "text-destructive" },
    { label: "Avg Score", value: overall.avgScore ? `${overall.avgScore}%` : "—", icon: TrendingUp, color: "text-primary" },
    { label: "Assignments", value: overall.assignments, icon: Target, color: "text-primary" },
    { label: "Classes", value: overall.classes, icon: GraduationCap, color: "text-primary" },
  ];

  return (
    <AppLayout>
      <SEOHead title="My Performance" description="Your attendance, marks and class progress" noIndex />
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <BarChart3 className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Attendance, marks and progress across your classes
          </p>
        </div>

        {loading || classesLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : perf.length === 0 ? (
          <Card className="text-center py-16 border-border/50">
            <CardContent>
              <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No classes yet</h2>
              <p className="text-muted-foreground mb-6">
                Join a class to start tracking your performance
              </p>
              <Button onClick={() => navigate("/join-class")}>Join a Class</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {summaryStats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="pt-5 pb-4 text-center">
                      <s.icon className={cn("h-5 w-5 mx-auto mb-2", s.color)} />
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Per-class breakdown */}
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Class breakdown
            </h2>
            <div className="space-y-3">
              {perf.map((p, i) => (
                <motion.div
                  key={p.classId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer interactive-card border-border/50"
                    onClick={() => navigate(`/student/class/${p.classId}`)}
                  >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{p.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {p.subject && (
                            <Badge variant="secondary" className="text-xs">
                              {p.subject}
                            </Badge>
                          )}
                          {p.grade && (
                            <Badge className="text-xs bg-primary/10 text-primary border-primary/30">
                              Grade {p.grade}
                            </Badge>
                          )}
                          {p.rank > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Award className="h-3 w-3" /> Rank {p.rank}/{p.total_students}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                            Attendance
                          </p>
                          <p
                            className={cn(
                              "text-lg font-bold",
                              p.attendance_pct >= 80
                                ? "text-emerald-500"
                                : p.attendance_pct >= 50
                                ? "text-amber-500"
                                : "text-destructive"
                            )}
                          >
                            {p.attendance_pct}%
                          </p>
                          <Progress value={p.attendance_pct} className="h-1.5 mt-1" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                            Avg Score
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {p.average_score || "—"}
                            {p.average_score ? "%" : ""}
                          </p>
                          <Progress
                            value={Number(p.average_score) || 0}
                            className="h-1.5 mt-1"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                            Assignments
                          </p>
                          <p className="text-lg font-bold">
                            {p.assignments_completed}/{p.total_assignments || 0}
                          </p>
                          <Progress
                            value={
                              p.total_assignments
                                ? (p.assignments_completed / p.total_assignments) * 100
                                : 0
                            }
                            className="h-1.5 mt-1"
                          />
                        </div>
                      </div>
                      {p.marks_total !== null && (
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                          <span className="text-muted-foreground">Latest total marks</span>
                          <span className="font-bold">{p.marks_total}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentPerformance;
