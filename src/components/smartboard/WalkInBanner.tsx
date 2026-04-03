import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import { format } from "date-fns";

interface WalkInBannerProps {
  classId: string;
  sessionId: string;
  onRestoreWhiteboard?: (data: unknown) => void;
}

interface PreviousSession {
  id: string;
  title: string;
  started_at: string;
  whiteboard_data: unknown;
}

export function WalkInBanner({ classId, sessionId, onRestoreWhiteboard }: WalkInBannerProps) {
  const [prevSession, setPrevSession] = useState<PreviousSession | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const fetchPrev = async () => {
      const { data } = await supabase
        .from("live_sessions")
        .select("id, title, started_at, whiteboard_data")
        .eq("class_id", classId)
        .eq("status", "ended")
        .neq("id", sessionId)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && (data as Record<string, unknown>).whiteboard_data) {
        setPrevSession(data as unknown as PreviousSession);
        timeout = setTimeout(() => setDismissed(true), 8000);
      }
    };

    fetchPrev();
    return () => { if (timeout) clearTimeout(timeout); };
  }, [classId, sessionId]);

  if (dismissed || !prevSession) return null;

  const sessionDate = format(new Date(prevSession.started_at), "MMM d, h:mm a");

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center justify-between gap-3 shrink-0 animate-fade-in">
      <div className="flex items-center gap-2 min-w-0">
        <Clock className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-foreground truncate">
          Continue from <strong>{prevSession.title}</strong> ({sessionDate})?
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          className="text-xs"
          onClick={() => {
            onRestoreWhiteboard?.(prevSession.whiteboard_data);
            setDismissed(true);
          }}
        >
          Yes, restore
        </Button>
        <Button size="sm" variant="ghost" className="text-xs" onClick={() => setDismissed(true)}>
          <X className="w-3 h-3 mr-1" /> Fresh start
        </Button>
      </div>
    </div>
  );
}
