import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, X } from "lucide-react";
import { PulseWidget } from "./PulseWidget";
import { QuestionWall } from "./QuestionWall";
import { ConceptCheckOverlay } from "@/components/concept-check";
import { StudentNotesDrawer } from "@/components/live-notes/StudentNotesDrawer";
import { SpotlightToggle, SpotlightSlideView } from "@/components/spotlight";
import { useLiveSession } from "@/contexts/LiveSessionContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudentLiveViewProps {
  sessionId: string;
  children: ReactNode;
}

export function StudentLiveView({ sessionId, children }: StudentLiveViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<"spotlight" | "session">("spotlight");
  const [notification, setNotification] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { spotlightEnabled } = useLiveSession();

  // Auto-switch when teacher disables spotlight
  useEffect(() => {
    if (!spotlightEnabled) {
      setActiveView("session");
      setNotification("Spotlight view disabled by teacher");
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [spotlightEnabled]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="relative h-full w-full">
      {/* Notification banner */}
      {notification && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-amber-500/20 text-amber-300 text-xs text-center py-2 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Spotlight toggle */}
      {spotlightEnabled && (
        <SpotlightToggle
          sessionId={sessionId}
          currentView={activeView}
          onToggle={(spotlightActive) =>
            setActiveView(spotlightActive ? "spotlight" : "session")
          }
        />
      )}

      {/* Main content */}
      <div className="h-full w-full overflow-auto">
        {activeView === "spotlight" && spotlightEnabled ? (
          <SpotlightSlideView sessionId={sessionId} role="student" />
        ) : (
          <div className="h-full w-full">{children}</div>
        )}
      </div>

      {/* Pulse widget */}
      <PulseWidget sessionId={sessionId} />

      {/* Live Notes drawer (Phase 3) */}
      <StudentNotesDrawer sessionId={sessionId} />

      {/* Question wall trigger */}
      <button
        ref={triggerRef}
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-20 right-4 z-40 sm:bottom-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center transition-transform duration-150 active:scale-95 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open question wall"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-200"
          onClick={closeDrawer}
        />
      )}

      {/* Bottom sheet (mobile) / Side drawer (desktop) */}
      <div
        className={cn(
          "fixed z-50 bg-card border-border flex flex-col transition-transform duration-300 ease-out",
          "inset-x-0 bottom-0 h-[80vh] rounded-t-2xl border-t sm:inset-x-auto",
          "sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:w-[380px] sm:rounded-t-none sm:rounded-l-2xl sm:border-l sm:border-t-0",
          drawerOpen
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        )}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 z-10"
          onClick={closeDrawer}
          aria-label="Close question wall"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Question wall content */}
        <QuestionWall sessionId={sessionId} role="student" />
      </div>

      {/* Concept check overlay via portal */}
      {createPortal(
        <ConceptCheckOverlay sessionId={sessionId} />,
        document.body
      )}
    </div>
  );
}
