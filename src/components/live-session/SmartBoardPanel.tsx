import { useState, useEffect, useRef, type ReactNode } from "react";
import { useLiveSession } from "@/contexts/LiveSessionContext";
import { PulseMeter } from "./PulseMeter";
import { QuestionWall } from "./QuestionWall";
import { SmartBoardConceptCheckPanel } from "@/components/concept-check";
import { TeacherNotesOverview } from "@/components/live-notes/TeacherNotesOverview";
import { SlideAdvanceControls } from "@/components/live-notes/SlideAdvanceControls";
import { SpotlightTeacherControls } from "@/components/spotlight";
import { useSpotlightSync } from "@/hooks/useSpotlightSync";
import { useLiveNotes } from "@/hooks/useLiveNotes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Maximize, Minimize, X } from "lucide-react";
import newtonLogoSm from "@/assets/newton-logo-sm.webp";

interface SmartBoardPanelProps {
  sessionId: string;
  children: ReactNode;
  onEndSession?: () => void;
  className?: string;
  sessionTitle?: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SmartBoardPanel({
  sessionId,
  children,
  onEndSession,
  sessionTitle,
}: SmartBoardPanelProps) {
  const {
    confusionThreshold,
    pulseEnabled,
    questionsEnabled,
    currentSlideContent,
    updateSessionSettings,
    activeConceptCheck,
    currentSlideIndex,
    totalSlides,
    setCurrentSlideIndex,
    setTeacherSlideContent,
    setTeacherSlideTitle,
    setSpotlightEnabled,
  } = useLiveSession();

  const { updateSlideContent, toggleSpotlight, spotlightEnabled: hookSpotlightEnabled, teacherSlideTitle: hookSlideTitle, syncStats } = useSpotlightSync({ sessionId, role: "teacher" });

  const onSlideAdvance = (index: number, content: string, title: string) => {
    updateSlideContent(index, content, title);
    setTeacherSlideContent(content);
    setTeacherSlideTitle(title);
  };

  const {
    isGenerating: notesGenerating,
    generationError: notesError,
    advanceToSlide,
  } = useLiveNotes({ sessionId, role: "teacher", onSlideAdvance });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());
  const hasActiveCheck = !!activeConceptCheck;

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Smart board prompt for large screens
  useEffect(() => {
    if (window.innerWidth >= 1280) {
      const dismissed = localStorage.getItem("newton_smartboard_mode");
      if (dismissed !== "dismissed") {
        setShowPrompt(true);
      }
    }
  }, []);

  // Listen for fullscreen exit
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowPrompt(false);
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      setIsFullscreen(false);
    } catch (err) {
      console.error("Exit fullscreen failed:", err);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("newton_smartboard_mode", "dismissed");
  };

  const slideTitle =
    currentSlideContent?.split("\n")[0]?.slice(0, 80) || sessionTitle || "Live Session";

  return (
    <div className={cn("flex flex-col h-full w-full", isFullscreen && "fixed inset-0 z-[100] bg-background")}>
      {/* Smart Board Mode prompt */}
      {showPrompt && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center justify-between gap-3 shrink-0 animate-fade-in">
          <p className="text-sm text-foreground">
            You appear to be on a large screen. Enable <strong>Smart Board Mode</strong> for the best classroom experience?
          </p>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={enterFullscreen} className="text-xs">
              Enable
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissPrompt} className="text-xs">
              Not now
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen header bar */}
      {isFullscreen && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <img src={newtonLogoSm} alt="" className="w-6 h-6 rounded" />
            <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
              {sessionTitle || "Live Session"}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(elapsed)}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate max-w-[40%] hidden xl:block">{slideTitle}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exitFullscreen}>
              <Minimize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 w-full">
        {/* Main content area */}
        <div className={cn("min-w-0 h-full overflow-auto transition-all duration-300", isFullscreen ? (hasActiveCheck ? "w-[70%]" : "w-[78%]") : "flex-1")}>
          {isFullscreen ? (
            <div className="h-full text-lg">{children}</div>
          ) : (
            children
          )}
        </div>

        {/* Interaction sidebar — hidden on mobile */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-l border-border bg-card h-full shrink-0 transition-all duration-300",
            isFullscreen ? (hasActiveCheck ? "w-[30%]" : "w-[22%]") + " text-base" : "w-[320px] xl:w-[360px]"
          )}
        >
          {/* Concept Check */}
          <div className="p-3 shrink-0">
            <SmartBoardConceptCheckPanel
              sessionId={sessionId}
              slideContext={currentSlideContent || ""}
            />
          </div>

          <div className="border-t border-border" />

          {/* Spotlight Teacher Controls (Phase 5) */}
          <div className="p-3 shrink-0">
            <SpotlightTeacherControls
              sessionId={sessionId}
              spotlightEnabled={hookSpotlightEnabled}
              teacherSlideTitle={hookSlideTitle}
              syncStats={syncStats}
              onToggleSpotlight={(enabled) => {
                toggleSpotlight(enabled);
                setSpotlightEnabled(enabled);
              }}
            />
          </div>

          <div className="border-t border-border" />

          {/* Live Notes Overview (Phase 3) */}
          <div className={cn("shrink-0 transition-all duration-300", notesGenerating && "ring-1 ring-primary/40 animate-pulse rounded-lg")}>
            <TeacherNotesOverview sessionId={sessionId} />
          </div>

          <div className="border-t border-border" />

          {/* Pulse Meter */}
          <div className={cn("p-3 shrink-0 transition-opacity duration-300", hasActiveCheck && "opacity-50")}>
            <PulseMeter sessionId={sessionId} confusionThreshold={confusionThreshold} />
          </div>

          <div className="border-t border-border" />

          {/* Question Wall */}
          <div className="flex-1 min-h-0 flex flex-col">
            <QuestionWall sessionId={sessionId} role="teacher" />
          </div>

          <div className="border-t border-border" />

          {/* Session controls */}
          <div className="flex items-center gap-2 p-3 shrink-0">
            {/* Slide advance controls (Phase 3) */}
            <div className="flex-1 min-w-0">
              <SlideAdvanceControls
                sessionId={sessionId}
                totalSlides={totalSlides}
                currentSlideIndex={currentSlideIndex}
                isGenerating={notesGenerating}
                generationError={notesError}
                onAdvance={(idx, ctx, title) => {
                  setCurrentSlideIndex(idx);
                  advanceToSlide(idx, ctx, title);
                }}
                onPrev={(idx) => setCurrentSlideIndex(idx)}
                getSlideContent={() =>
                  currentSlideContent
                    ? { context: currentSlideContent, title: currentSlideContent.split("\n")[0]?.slice(0, 80) }
                    : null
                }
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => updateSessionSettings({ pulse_enabled: !pulseEnabled })}
                className={cn(
                  "text-[10px] rounded-lg px-2 py-1.5 border transition-colors font-medium",
                  pulseEnabled
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                Pulse
              </button>
              <button
                onClick={() => updateSessionSettings({ questions_enabled: !questionsEnabled })}
                className={cn(
                  "text-[10px] rounded-lg px-2 py-1.5 border transition-colors font-medium",
                  questionsEnabled
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                Q&A
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                title={isFullscreen ? "Exit Smart Board Mode" : "Smart Board Mode"}
                aria-label={isFullscreen ? "Exit Smart Board Mode" : "Enter Smart Board Mode"}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
              {onEndSession && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onEndSession}
                  className="text-xs"
                >
                  End
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
