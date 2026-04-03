import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, GraduationCap, ClipboardList, BarChart3, ChevronRight,
  Plus, Calendar, FileText, Clock, ArrowRight
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import newtonCharacter from "@/assets/newton-character-sm.webp";
import { format } from "date-fns";

interface EnrolledClass {
  id: string;
  name: string;
  subject: string | null;
}

interface DueAssignment {
  id: string;
  title: string;
  due_date: string;
  class_name: string;
  class_id: string;
}

interface RecentReport {
  session_id: string;
  session_title: string;
  understanding_score: number;
  generated_at: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [dueAssignments, setDueAssignments] = useState<DueAssignment[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Enrolled classes
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", user.id)
        .eq("status", "active");

      const classIds = (enrollments || []).map(e => e.class_id);

      if (classIds.length > 0) {
        const { data: classData } = await supabase
          .from("classes")
          .select("id, name, subject")
          .in("id", classIds);
        setClasses(classData || []);

        // Due assignments
        const { data: assignments } = await supabase
          .from("assignments")
          .select("id, title, due_date, class_id")
          .in("class_id", classIds)
          .eq("is_published", true)
          .gte("due_date", new Date().toISOString())
          .order("due_date", { ascending: true })
          .limit(5);

        if (assignments) {
          const classMap = new Map((classData || []).map(c => [c.id, c.name]));
          setDueAssignments(assignments.map(a => ({
            ...a,
            due_date: a.due_date!,
            class_name: classMap.get(a.class_id) || "Class",
          })));
        }
      }

      // Recent intelligence reports
      const { data: reports } = await supabase
        .from("student_intelligence_reports")
        .select("session_id, understanding_score, generated_at")
        .eq("student_id", user.id)
        .eq("status", "ready")
        .order("generated_at", { ascending: false })
        .limit(5);

      if (reports && reports.length > 0) {
        const sessionIds = reports.map(r => r.session_id);
        const { data: sessions } = await supabase
          .from("live_sessions")
          .select("id, title")
          .in("id", sessionIds);

        const sessionMap = new Map((sessions || []).map(s => [s.id, s.title]));
        setRecentReports(reports.map(r => ({
          session_id: r.session_id,
          session_title: sessionMap.get(r.session_id) || "Session",
          understanding_score: r.understanding_score,
          generated_at: r.generated_at,
        })));
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  const stats = [
    { label: "Classes", value: classes.length, icon: GraduationCap },
    { label: "Due Soon", value: dueAssignments.length, icon: ClipboardList },
    { label: "Reports", value: recentReports.length, icon: BarChart3 },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Student Dashboard" description="Your learning overview" noIndex />
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your learning at a glance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((s, i) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — Classes */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Classes</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/student/classes")} className="gap-1 text-xs">
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </div>

            {classes.length === 0 ? (
              <Card className="text-center py-12 border-border/50">
                <CardContent>
                  <img src={newtonCharacter} alt="Newton" className="h-20 w-20 mx-auto mb-3 opacity-80" />
                  <p className="text-muted-foreground mb-4">No classes yet</p>
                  <Button onClick={() => navigate("/join-class")} className="gap-2"><Plus className="h-4 w-4" /> Join a Class</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {classes.slice(0, 5).map((cls, i) => (
                  <motion.div key={cls.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="cursor-pointer hover:border-primary/30 transition-colors border-border/50"
                      onClick={() => navigate(`/student/class/${cls.id}`)}>
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10"><GraduationCap className="h-4 w-4 text-primary" /></div>
                          <div>
                            <p className="font-medium text-sm">{cls.name}</p>
                            {cls.subject && <Badge variant="secondary" className="text-[10px] mt-0.5">{cls.subject}</Badge>}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Due & Reports */}
          <div className="lg:col-span-2 space-y-4">
            {/* Due Assignments */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" /> Due Soon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dueAssignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No upcoming assignments 🎉</p>
                ) : dueAssignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/student/class/${a.class_id}`)}>
                    <div>
                      <p className="text-xs font-medium">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">{a.class_name}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {format(new Date(a.due_date), "MMM d")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentReports.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No reports yet</p>
                ) : recentReports.map(r => (
                  <div key={r.session_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/student/report/${r.session_id}`)}>
                    <div>
                      <p className="text-xs font-medium">{r.session_title}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(r.generated_at), "MMM d, yyyy")}</p>
                    </div>
                    <Badge variant={r.understanding_score >= 70 ? "default" : "outline"}
                      className={`text-[10px] ${r.understanding_score >= 70 ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" : ""}`}>
                      {r.understanding_score}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentDashboard;
