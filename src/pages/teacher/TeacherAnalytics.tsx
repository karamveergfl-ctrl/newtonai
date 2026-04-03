import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Users, Radio, TrendingUp, CheckCircle2 } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

interface ClassStat {
  id: string;
  name: string;
  student_count: number;
  session_count: number;
  avg_understanding: number | null;
  attendance_rate: number | null;
}

interface MonthlySession {
  month: string;
  count: number;
}

const TeacherAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [monthlySessions, setMonthlySessions] = useState<MonthlySession[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgAttendance, setAvgAttendance] = useState<number | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get teacher's classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user.id)
        .eq("is_active", true);

      if (!classes || classes.length === 0) { setLoading(false); return; }

      const classIds = classes.map(c => c.id);

      // Get enrollments per class
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .in("class_id", classIds)
        .eq("status", "active");

      const enrollmentCounts: Record<string, number> = {};
      (enrollments || []).forEach(e => {
        enrollmentCounts[e.class_id] = (enrollmentCounts[e.class_id] || 0) + 1;
      });

      // Get sessions
      const { data: sessions } = await supabase
        .from("live_sessions")
        .select("id, class_id, started_at")
        .eq("teacher_id", user.id)
        .order("started_at", { ascending: true });

      const sessionCounts: Record<string, number> = {};
      (sessions || []).forEach(s => {
        sessionCounts[s.class_id] = (sessionCounts[s.class_id] || 0) + 1;
      });

      // Monthly sessions (last 6 months)
      const monthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const m = startOfMonth(subMonths(new Date(), i));
        monthMap[format(m, "yyyy-MM")] = 0;
      }
      (sessions || []).forEach(s => {
        const key = format(new Date(s.started_at), "yyyy-MM");
        if (key in monthMap) monthMap[key]++;
      });
      setMonthlySessions(Object.entries(monthMap).map(([month, count]) => ({ month, count })));

      // Attendance rates
      const sessionIds = (sessions || []).map(s => s.id);
      let attendanceRate: number | null = null;
      if (sessionIds.length > 0) {
        const { data: attendance } = await supabase
          .from("attendance_records")
          .select("session_id, status")
          .in("session_id", sessionIds.slice(-50)); // last 50 sessions

        if (attendance && attendance.length > 0) {
          const present = attendance.filter(a => a.status === "present").length;
          attendanceRate = Math.round((present / attendance.length) * 100);
        }
      }

      // Pulse understanding per class
      const understandingMap: Record<string, number | null> = {};
      if (sessionIds.length > 0) {
        const { data: pulses } = await supabase
          .from("live_pulse_responses")
          .select("session_id, status")
          .in("session_id", sessionIds.slice(-30));

        if (pulses && pulses.length > 0) {
          // Group by class
          const sessionClassMap = new Map((sessions || []).map(s => [s.id, s.class_id]));
          const classPulses: Record<string, { total: number; gotIt: number }> = {};
          pulses.forEach(p => {
            const classId = sessionClassMap.get(p.session_id);
            if (!classId) return;
            if (!classPulses[classId]) classPulses[classId] = { total: 0, gotIt: 0 };
            classPulses[classId].total++;
            if (p.status === "got_it") classPulses[classId].gotIt++;
          });
          Object.entries(classPulses).forEach(([cid, data]) => {
            understandingMap[cid] = Math.round((data.gotIt / data.total) * 100);
          });
        }
      }

      const stats: ClassStat[] = classes.map(c => ({
        id: c.id,
        name: c.name,
        student_count: enrollmentCounts[c.id] || 0,
        session_count: sessionCounts[c.id] || 0,
        avg_understanding: understandingMap[c.id] ?? null,
        attendance_rate: null, // per-class attendance would need more queries
      }));

      stats.sort((a, b) => b.session_count - a.session_count);
      setClassStats(stats);
      setTotalStudents(Object.values(enrollmentCounts).reduce((a, b) => a + b, 0));
      setTotalSessions((sessions || []).length);
      setAvgAttendance(attendanceRate);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  const maxMonthly = Math.max(...monthlySessions.map(m => m.count), 1);

  return (
    <AppLayout>
      <SEOHead title="Teacher Analytics" description="Teaching performance insights" noIndex />
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Teaching performance insights</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Students", value: totalStudents, icon: Users },
            { label: "Total Sessions", value: totalSessions, icon: Radio },
            { label: "Avg Attendance", value: avgAttendance !== null ? `${avgAttendance}%` : "—", icon: CheckCircle2 },
            { label: "Active Classes", value: classStats.length, icon: TrendingUp },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4 text-center">
                  <s.icon className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions Over Time */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Sessions Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {monthlySessions.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{m.count}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((m.count / maxMonthly) * 100, 4)}%` }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="w-full rounded-t-md bg-primary/60 hover:bg-primary transition-colors"
                    />
                    <span className="text-[8px] text-muted-foreground">
                      {format(new Date(m.month + "-01"), "MMM")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Class Comparison */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Class Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {classStats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No classes yet</p>
              ) : classStats.slice(0, 6).map((cls) => (
                <div key={cls.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{cls.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{cls.student_count} students</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{cls.session_count} sessions</span>
                    </div>
                  </div>
                  {cls.avg_understanding !== null && (
                    <Badge variant={cls.avg_understanding >= 70 ? "default" : "outline"}
                      className={`text-[9px] shrink-0 ${cls.avg_understanding >= 70 ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" : ""}`}>
                      {cls.avg_understanding}% understanding
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default TeacherAnalytics;
