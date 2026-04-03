import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Radio, MessageSquare, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "enrollment" | "session" | "chat";
  description: string;
  className: string;
  timestamp: string;
}

export function TeacherActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch teacher's class IDs
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user.id);

      if (!classes || classes.length === 0) { setActivities([]); setLoading(false); return; }

      const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));
      const classIds = classes.map(c => c.id);
      const items: ActivityItem[] = [];

      // Recent enrollments
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("id, class_id, enrolled_at")
        .in("class_id", classIds)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false })
        .limit(5);

      (enrollments || []).forEach(e => {
        items.push({
          id: `enr-${e.id}`,
          type: "enrollment",
          description: "New student joined",
          className: classMap[e.class_id] || "Unknown",
          timestamp: e.enrolled_at,
        });
      });

      // Recent completed sessions
      const { data: sessions } = await supabase
        .from("live_sessions")
        .select("id, class_id, started_at, title")
        .eq("teacher_id", user.id)
        .eq("status", "ended")
        .order("started_at", { ascending: false })
        .limit(5);

      (sessions || []).forEach(s => {
        items.push({
          id: `ses-${s.id}`,
          type: "session",
          description: `Session "${s.title}" completed`,
          className: classMap[s.class_id] || "Unknown",
          timestamp: s.started_at,
        });
      });

      // Recent Newton Chat conversations
      const { data: chats } = await supabase
        .from("newton_conversations")
        .select("id, created_at, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      (chats || []).forEach(c => {
        items.push({
          id: `chat-${c.id}`,
          type: "chat",
          description: c.title || "Newton Chat conversation",
          className: "",
          timestamp: c.created_at || new Date().toISOString(),
        });
      });

      // Sort all by timestamp descending
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 10));
      setLoading(false);
    };

    fetchActivity();
  }, []);

  const iconMap = {
    enrollment: <UserPlus className="h-4 w-4 text-emerald-500" />,
    session: <Radio className="h-4 w-4 text-primary" />,
    chat: <MessageSquare className="h-4 w-4 text-secondary" />,
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-lg bg-muted/50">{iconMap[item.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.className && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {item.className}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
