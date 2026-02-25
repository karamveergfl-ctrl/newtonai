import { useLiveNotes } from "@/hooks/useLiveNotes";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Check, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherNotesOverviewProps {
  sessionId: string;
}

export function TeacherNotesOverview({ sessionId }: TeacherNotesOverviewProps) {
  const {
    slideNotesMap,
    totalSlides,
    isGenerating,
    generationError,
    notesEnabled,
    currentSlideIndex,
  } = useLiveNotes({ sessionId, role: "teacher" });

  const readyCount = Object.values(slideNotesMap).filter((n) => n.status === "ready").length;
  const failedCount = Object.values(slideNotesMap).filter((n) => n.status === "failed").length;

  const toggleNotes = async () => {
    await supabase
      .from("live_sessions")
      .update({ notes_enabled: !notesEnabled })
      .eq("id", sessionId);
  };

  // Build progress segments
  const segments: { color: string }[] = [];
  for (let i = 1; i <= totalSlides; i++) {
    const note = slideNotesMap[i];
    if (!note) segments.push({ color: "bg-muted" });
    else if (note.status === "ready") segments.push({ color: "bg-primary" });
    else if (note.status === "failed") segments.push({ color: "bg-amber-500" });
    else segments.push({ color: "bg-primary/40 animate-pulse" });
  }

  const currentNote = slideNotesMap[currentSlideIndex];

  return (
    <div className="space-y-2 p-3">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Live Notes</span>
        </div>
        <button
          onClick={toggleNotes}
          className={cn(
            "relative w-8 h-4 rounded-full transition-colors duration-200",
            notesEnabled ? "bg-primary" : "bg-muted"
          )}
          aria-label={notesEnabled ? "Disable live notes" : "Enable live notes"}
        >
          <span
            className={cn(
              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200",
              notesEnabled ? "translate-x-4.5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      {!notesEnabled && (
        <p className="text-[10px] text-muted-foreground">
          Notes paused — students won't receive new notes
        </p>
      )}

      {notesEnabled && (
        <>
          {/* Progress bar */}
          {totalSlides > 0 && (
            <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
              {segments.map((seg, i) => (
                <div
                  key={i}
                  className={cn("flex-1 rounded-sm transition-colors duration-300", seg.color)}
                />
              ))}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            {readyCount}/{totalSlides} slides have notes
            {failedCount > 0 && (
              <span className="text-amber-400"> · {failedCount} failed</span>
            )}
          </p>

          {/* Current slide status */}
          {currentNote && (
            <div className="flex items-center gap-1.5 text-[10px]">
              {currentNote.status === "generating" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-muted-foreground">Generating…</span>
                </>
              )}
              {currentNote.status === "ready" && (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Ready</span>
                </>
              )}
              {currentNote.status === "failed" && (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">Failed</span>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
