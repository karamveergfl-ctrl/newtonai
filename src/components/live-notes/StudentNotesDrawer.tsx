import { useState, useRef, useEffect } from "react";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveNotesPanel } from "./LiveNotesPanel";
import { useLiveNotes } from "@/hooks/useLiveNotes";
import { cn } from "@/lib/utils";

interface StudentNotesDrawerProps {
  sessionId: string;
}

export function StudentNotesDrawer({ sessionId }: StudentNotesDrawerProps) {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastSeenRef = useRef<number | null>(null);

  const { latestNoteSlideIndex } = useLiveNotes({ sessionId, role: "student" });

  // Track new notes
  useEffect(() => {
    if (latestNoteSlideIndex === null) return;
    if (lastSeenRef.current === latestNoteSlideIndex) return;
    if (!open) setHasNew(true);
    lastSeenRef.current = latestNoteSlideIndex;
  }, [latestNoteSlideIndex, open]);

  const handleOpen = () => {
    setOpen(true);
    setHasNew(false);
  };

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      {/* Trigger button — fixed bottom-left, above MobileBottomNav */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className="fixed bottom-20 left-4 z-40 sm:bottom-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform duration-150 active:scale-95 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open live notes"
      >
        <BookOpen className="w-5 h-5" />
        {hasNew && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-200"
          onClick={handleClose}
        />
      )}

      {/* Drawer — bottom sheet (mobile) / side panel (desktop) */}
      <div
        className={cn(
          "fixed z-50 bg-card border-border flex flex-col transition-transform duration-300 ease-out",
          "inset-x-0 bottom-0 h-[85vh] rounded-t-2xl border-t",
          "sm:inset-x-auto sm:top-0 sm:left-0 sm:bottom-0 sm:h-full sm:w-[380px] sm:rounded-t-none sm:rounded-r-2xl sm:border-r sm:border-t-0",
          open
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:-translate-x-full"
        )}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 z-10"
          onClick={handleClose}
          aria-label="Close notes"
        >
          <X className="w-4 h-4" />
        </Button>

        <LiveNotesPanel sessionId={sessionId} role="student" />
      </div>
    </>
  );
}
