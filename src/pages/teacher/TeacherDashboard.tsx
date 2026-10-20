import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClasses } from "@/hooks/useClasses";
import { CreateClassDialog } from "@/components/teacher/CreateClassDialog";
import { LiveSessionDialog } from "@/components/teacher/LiveSessionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, Radio, Users, DoorOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";

/**
 * Teacher home: reuses the student study dashboard (search, progress,
 * upload + full study workspace) with a live banner and a compact classes row.
 */
const TeacherDashboard = () => {
  const { classes, loading, createClass } = useClasses();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [liveSession, setLiveSession] = useState<{ id: string; class_id: string; title: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("live_sessions")
        .select("id, class_id, title")
        .eq("teacher_id", user.id)
        .eq("status", "teaching")
        .limit(1);
      if (!cancelled) setLiveSession(data && data.length > 0 ? data[0] : null);
    })();
    return () => { cancelled = true; };
  }, []);

  const liveClassName = liveSession ? classes.find((c) => c.id === liveSession.class_id)?.name || "Class" : "";

  const liveBanner = liveSession ? (
    <Card className="mb-6 border-destructive/30 bg-destructive/5">
      <CardContent className="py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{liveClassName} is LIVE</p>
            <p className="text-xs text-muted-foreground truncate">{liveSession.title}</p>
          </div>
        </div>
        <Button size="sm" variant="destructive" className="gap-1 shrink-0" onClick={() => navigate(`/teacher/classes/${liveSession.class_id}`)}>
          Return to Classroom <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  ) : null;

  const classesRow = (
    <section aria-labelledby="your-classes-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="your-classes-heading" className="text-lg font-semibold">Your Classes</h2>
        <Button size="sm" variant="ghost" className="gap-1" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Class
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : classes.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No classes yet. Create one to go live with your students.
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {classes.map((cls) => (
            <Card key={cls.id} className="min-w-[240px] snap-start border-border/50">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-medium text-sm truncate">{cls.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {cls.subject && <Badge variant="secondary" className="text-[10px]">{cls.subject}</Badge>}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {cls.student_count || 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => navigate(`/teacher/classes/${cls.id}`)}>
                    <DoorOpen className="h-3.5 w-3.5" /> Enter Classroom
                  </Button>
                  {liveSession?.class_id === cls.id ? (
                    <Button size="sm" variant="destructive" className="flex-1 gap-1 text-xs" onClick={() => navigate(`/teacher/classes/${cls.id}`)}>
                      <Radio className="h-3.5 w-3.5" /> Live
                    </Button>
                  ) : (
                    <LiveSessionDialog classId={cls.id} onSessionStarted={() => navigate(`/teacher/classes/${cls.id}`)}>
                      <Button size="sm" className="flex-1 gap-1 text-xs">
                        <Radio className="h-3.5 w-3.5" /> Go Live
                      </Button>
                    </LiveSessionDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <CreateClassDialog onCreateClass={createClass} externalOpen={createDialogOpen} onExternalOpenChange={setCreateDialogOpen} />
    </section>
  );

  return <Index variant="teacher" topSlot={liveBanner} bottomSlot={classesRow} />;
};

export default TeacherDashboard;
