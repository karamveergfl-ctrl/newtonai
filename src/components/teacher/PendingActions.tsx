import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileCheck, Loader2 } from "lucide-react";

interface PendingItem {
  id: string;
  type: "ungraded" | "alert";
  title: string;
  description: string;
  classId?: string;
  severity: "amber" | "red";
}

export function PendingActions() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPending = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const pending: PendingItem[] = [];

      // Check for published assignments with ungraded submissions
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, title, class_id")
        .eq("teacher_id", user.id)
        .eq("is_published", true);

      if (assignments && assignments.length > 0) {
        for (const a of assignments.slice(0, 5)) {
          const { count } = await supabase
            .from("assignment_submissions")
            .select("*", { count: "exact", head: true })
            .eq("assignment_id", a.id)
            .is("score", null);

          if (count && count > 0) {
            pending.push({
              id: `grade-${a.id}`,
              type: "ungraded",
              title: `${count} ungraded submission${count > 1 ? "s" : ""}`,
              description: a.title,
              classId: a.class_id,
              severity: "amber",
            });
          }
        }
      }

      // Check for recent sessions with high confusion
      const { data: recentSessions } = await supabase
        .from("live_sessions")
        .select("id, class_id, title")
        .eq("teacher_id", user.id)
        .eq("status", "ended")
        .order("started_at", { ascending: false })
        .limit(5);

      if (recentSessions) {
        for (const s of recentSessions) {
          const { data: pulseData } = await supabase
            .from("live_pulse_responses")
            .select("status")
            .eq("session_id", s.id);

          if (pulseData && pulseData.length >= 3) {
            const lostCount = pulseData.filter(p => p.status === "lost").length;
            const lostPct = (lostCount / pulseData.length) * 100;
            if (lostPct > 50) {
              pending.push({
                id: `alert-${s.id}`,
                type: "alert",
                title: "High confusion detected",
                description: `${Math.round(lostPct)}% lost in "${s.title}"`,
                classId: s.class_id,
                severity: "red",
              });
            }
          }
        }
      }

      setItems(pending.slice(0, 6));
      setLoading(false);
    };

    fetchPending();
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Pending Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">All caught up! 🎉</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                item.severity === "red"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              {item.type === "alert" ? (
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              ) : (
                <FileCheck className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
              </div>
              {item.classId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={() => navigate(`/teacher/classes/${item.classId}`)}
                >
                  View
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
