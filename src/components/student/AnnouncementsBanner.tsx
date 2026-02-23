import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  classId: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
}

export function AnnouncementsBanner({ classId }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("class_announcements" as any)
        .select("*")
        .eq("class_id", classId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);
      setAnnouncements((data as any[]) || []);
    };
    fetch();

    const channel = supabase
      .channel(`announcements-${classId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "class_announcements", filter: `class_id=eq.${classId}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [classId]);

  if (announcements.length === 0) return null;

  const shown = expanded ? announcements : announcements.slice(0, 1);

  return (
    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="space-y-2">
        {shown.map((a) => (
          <Card key={a.id} className="border-l-4 border-l-primary border-border/50 bg-primary/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-2">
                {a.is_pinned ? <Pin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> : <Megaphone className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {announcements.length > 1 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary flex items-center gap-1 mt-1.5 hover:underline">
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> {announcements.length - 1} more announcement{announcements.length > 2 ? "s" : ""}</>}
        </button>
      )}
    </motion.div>
  );
}
