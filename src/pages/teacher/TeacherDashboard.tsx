import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useClasses } from "@/hooks/useClasses";
import { CreateClassDialog } from "@/components/teacher/CreateClassDialog";
import { ClassCard } from "@/components/teacher/ClassCard";
import { TeacherActivityFeed } from "@/components/teacher/TeacherActivityFeed";
import { PendingActions } from "@/components/teacher/PendingActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, Users, Radio, Brain, ArrowRight, Plus, Calendar } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import newtonCharacter from "@/assets/newton-character-sm.webp";

const TeacherDashboard = () => {
  const { classes, loading, createClass } = useClasses();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [liveSession, setLiveSession] = useState<{ id: string; class_id: string; title: string; className: string } | null>(null);
  const [monthSessions, setMonthSessions] = useState(0);
  const [avgUnderstanding, setAvgUnderstanding] = useState<number | null>(null);
  const [lastSessionDates, setLastSessionDates] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const totalStudents = classes.reduce((acc, cls) => acc + (cls.student_count || 0), 0);

  // Fetch enhanced stats
  const fetchStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Live session check
    const { data: liveSessions } = await supabase
      .from("live_sessions")
      .select("id, class_id, title")
      .eq("teacher_id", user.id)
      .eq("status", "teaching")
      .limit(1);

    if (liveSessions && liveSessions.length > 0) {
      const ls = liveSessions[0];
      const cls = classes.find(c => c.id === ls.class_id);
      setLiveSession({ ...ls, className: cls?.name || "Class" });
    }

    // Sessions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("live_sessions")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", user.id)
      .gte("started_at", startOfMonth.toISOString());
    setMonthSessions(count || 0);

    // Avg understanding from recent pulse responses
    const { data: recentSessions } = await supabase
      .from("live_sessions")
      .select("id")
      .eq("teacher_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10);

    if (recentSessions && recentSessions.length > 0) {
      const sessionIds = recentSessions.map(s => s.id);
      const { data: pulses } = await supabase
        .from("live_pulse_responses")
        .select("status")
        .in("session_id", sessionIds);

      if (pulses && pulses.length > 0) {
        const gotIt = pulses.filter(p => p.status === "got_it").length;
        setAvgUnderstanding(Math.round((gotIt / pulses.length) * 100));
      }
    }

    // Last session date per class
    const classIds = classes.map(c => c.id);
    if (classIds.length > 0) {
      const { data: sessionDates } = await supabase
        .from("live_sessions")
        .select("class_id, started_at")
        .in("class_id", classIds)
        .order("started_at", { ascending: false });

      if (sessionDates) {
        const dateMap: Record<string, string> = {};
        sessionDates.forEach(s => {
          if (!dateMap[s.class_id]) dateMap[s.class_id] = s.started_at;
        });
        setLastSessionDates(dateMap);
      }
    }
  }, [classes]);

  useEffect(() => {
    if (!loading && classes.length >= 0) {
      fetchStats();
    }
  }, [loading, classes, fetchStats]);

  const stats = [
    { label: "Active Classes", value: classes.filter(c => c.is_active).length, icon: GraduationCap, color: "text-primary" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-secondary" },
    { label: "Sessions This Month", value: monthSessions, icon: Radio, color: "text-accent" },
    { label: "Avg Understanding", value: avgUnderstanding !== null ? `${avgUnderstanding}%` : "—", icon: Brain, color: "text-primary" },
  ];

  const displayedClasses = showAllClasses ? classes : classes.slice(0, 6);

  return (
    <AppLayout>
      <SEOHead title="Teacher Dashboard" description="Manage your classes and assignments" noIndex />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your classes and students</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Class
          </Button>
        </div>

        {/* Live Session Banner */}
        {liveSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{liveSession.className} is LIVE</p>
                    <p className="text-xs text-muted-foreground">{liveSession.title}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => navigate(`/teacher/classes/${liveSession.class_id}/live`)}
                >
                  Return to Classroom
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="interactive-card border-border/50 overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column — Classes (60%) */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Classes</h2>
              {classes.length > 6 && (
                <Button variant="ghost" size="sm" onClick={() => setShowAllClasses(!showAllClasses)}>
                  {showAllClasses ? "Show Less" : `View All (${classes.length})`}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : classes.length === 0 ? (
              <Card className="text-center py-16 border-border/50">
                <CardContent>
                  <img src={newtonCharacter} alt="Newton" className="h-24 w-24 mx-auto mb-4 opacity-80" />
                  <h2 className="text-xl font-semibold mb-2">No classes yet</h2>
                  <p className="text-muted-foreground mb-6">Create your first class to get started</p>
                  <CreateClassDialog onCreateClass={createClass} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedClasses.map((cls, i) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ClassCard classData={{ ...cls, last_session_date: lastSessionDates[cls.id] || null }} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column — Activity & Pending (40%) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Sessions Placeholder */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground text-center py-4">No upcoming sessions scheduled</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => classes.length > 0 && navigate(`/teacher/classes/${classes[0].id}`)}
                  disabled={classes.length === 0}
                >
                  Schedule a Session
                </Button>
              </CardContent>
            </Card>

            <TeacherActivityFeed />
            <PendingActions />
          </div>
        </div>

        {/* Floating Create Class Dialog */}
        <CreateClassDialog onCreateClass={createClass} externalOpen={createDialogOpen} onExternalOpenChange={setCreateDialogOpen} />
      </div>
    </AppLayout>
  );
};

export default TeacherDashboard;
