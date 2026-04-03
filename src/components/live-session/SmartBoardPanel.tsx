import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useLiveSession } from "@/contexts/LiveSessionContext";
import { PulseMeter } from "./PulseMeter";
import { QuestionWall } from "./QuestionWall";
import { SmartBoardConceptCheckPanel } from "@/components/concept-check";
import { TeacherNotesOverview } from "@/components/live-notes/TeacherNotesOverview";
import { SlideAdvanceControls } from "@/components/live-notes/SlideAdvanceControls";
import { SpotlightTeacherControls } from "@/components/spotlight";
import { useSpotlightSync } from "@/hooks/useSpotlightSync";
import { useLiveNotes } from "@/hooks/useLiveNotes";
import { useWhiteboardState } from "@/hooks/useWhiteboardState";
import { useWhiteboardAutoSave } from "@/hooks/useWhiteboardAutoSave";
import { useHandwritingRecognition } from "@/hooks/useHandwritingRecognition";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { useLectureCapture } from "@/hooks/useLectureCapture";
import { useLivePulse } from "@/hooks/useLivePulse";
import { ClassroomThemeProvider, useClassroomTheme } from "@/components/smartboard/ClassroomThemeProvider";
import { SmartBoardToolbar } from "@/components/smartboard/SmartBoardToolbar";
import { WhiteboardCanvas, type WhiteboardCanvasHandle } from "@/components/smartboard/WhiteboardCanvas";
import { VoiceCommandIndicator } from "@/components/smartboard/VoiceCommandIndicator";
import { WalkInBanner } from "@/components/smartboard/WalkInBanner";
import { ConfusionAlertBanner } from "@/components/smartboard/ConfusionAlertBanner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Maximize, Minimize, PanelRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import newtonLogoSm from "@/assets/newton-logo-sm.webp";

interface SmartBoardPanelProps {
  sessionId: string;
  classId?: string;
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

function SmartBoardPanelInner({
  sessionId,
  classId,
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
    setCurrentSlideContent,
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

  // Teaching mode state
  const [activeView, setActiveView] = useState<"session" | "whiteboard" | "document">("session");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Live pulse for confusion alert banner
  const { pulseSummary, confusionAlert } = useLivePulse({ sessionId, role: "teacher" });

  // Classroom theme
  const { theme, toggleTheme } = useClassroomTheme();

  // Whiteboard state
  const wb = useWhiteboardState();
  const whiteboardRef = useRef<WhiteboardCanvasHandle>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  // Get canvas ref from handle
  const getCanvasRef = useCallback(() => {
    return { current: whiteboardRef.current?.getCanvas() ?? null };
  }, []);

  const { saveCanvas } = useWhiteboardAutoSave({
    sessionId,
    slideIndex: currentSlideIndex,
    canvasRef: getCanvasRef() as React.RefObject<HTMLCanvasElement | null>,
    enabled: activeView === "whiteboard",
  });

  // Handwriting recognition — feed OCR text to slide notes
  const { isRecognizing, onStrokeEnd: hwStrokeEnd } = useHandwritingRecognition({
    canvasRef: getCanvasRef() as React.RefObject<HTMLCanvasElement | null>,
    onRecognized: (text) => {
      setCurrentSlideContent(text);
      // Auto-feed OCR text as slide context for AI note generation
      if (text.trim()) {
        advanceToSlide(currentSlideIndex, text, `Whiteboard – Slide ${currentSlideIndex + 1}`);
      }
    },
  });

  // Lecture capture
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setTeacherId(user.id);
    };
    getUser();
  }, []);

  const { isCapturing, latestTranscript, startCapture, stopCapture, recordSlideChange } = useLectureCapture({
    sessionId,
    teacherId,
  });

  // When live transcript arrives, feed it as slide context for AI notes
  useEffect(() => {
    if (latestTranscript && latestTranscript.trim().length > 20) {
      advanceToSlide(currentSlideIndex, latestTranscript, `Speech – Slide ${currentSlideIndex + 1}`);
    }
  }, [latestTranscript]);

  // Voice commands
  const { isListening: voiceListening, isProcessing: voiceProcessing, lastCommand } = useVoiceCommands({
    enabled: voiceEnabled,
    slideContent: currentSlideContent,
    sessionId,
    onNextSlide: () => {
      const next = Math.min(currentSlideIndex + 1, totalSlides - 1);
      setCurrentSlideIndex(next);
    },
    onPrevSlide: () => {
      const prev = Math.max(currentSlideIndex - 1, 0);
      setCurrentSlideIndex(prev);
    },
    onToggleCapture: (recording) => {
      if (recording) startCapture();
      else stopCapture();
    },
  });

  // Whiteboard stroke handler
  const handleStrokeEnd = useCallback(() => {
    const canvas = whiteboardRef.current?.getCanvas();
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Push undo state was handled via onBeforeStroke
      }
    }
    hwStrokeEnd();
  }, [hwStrokeEnd]);

  const handleBeforeStroke = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      wb.pushUndo(imageData);
    },
    [wb.pushUndo]
  );

  const handleUndo = useCallback(() => {
    const canvas = whiteboardRef.current?.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = wb.undo(ctx);
    if (data) ctx.putImageData(data, 0, 0);
  }, [wb.undo]);

  const handleRedo = useCallback(() => {
    const canvas = whiteboardRef.current?.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = wb.redo(ctx);
    if (data) ctx.putImageData(data, 0, 0);
  }, [wb.redo]);

  const handleClear = useCallback(() => {
    whiteboardRef.current?.clear();
    wb.clearStacks();
  }, [wb.clearStacks]);

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
            {isCapturing && (
              <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                REC
              </span>
            )}
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

      <div className="flex flex-1 min-h-0 w-full relative">
        {/* Voice command indicator */}
        {voiceEnabled && (
          <VoiceCommandIndicator
            isListening={voiceListening}
            isProcessing={voiceProcessing}
            lastCommand={lastCommand}
          />
        )}

        {/* Main content area */}
        <div className={cn("min-w-0 h-full overflow-auto transition-all duration-300", isFullscreen ? (hasActiveCheck ? "w-[70%]" : "w-[78%]") : "flex-1")}>
          {activeView === "whiteboard" ? (
            <div className="relative w-full h-full whiteboard-bg">
              <WhiteboardCanvas
                ref={whiteboardRef}
                tool={wb.tool}
                color={wb.color}
                penSize={wb.penSize}
                highlighterSize={wb.highlighterSize}
                eraserSize={wb.eraserSize}
                onStrokeEnd={handleStrokeEnd}
                onBeforeStroke={handleBeforeStroke}
                className="w-full h-full"
              />
              {isRecognizing && (
                <div className="absolute bottom-4 left-4 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  Recognizing handwriting…
                </div>
              )}
            </div>
          ) : isFullscreen ? (
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

          {/* Spotlight Teacher Controls */}
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

          {/* Live Notes Overview */}
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
                  recordSlideChange(idx, ctx);
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

        {/* Mobile interaction trigger — visible only on small screens */}
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-20 right-4 z-40 lg:hidden h-12 w-12 rounded-full shadow-elevated"
          onClick={() => setMobileDrawerOpen(true)}
        >
          <PanelRight className="w-5 h-5" />
        </Button>

        {/* Mobile interaction drawer */}
        {mobileDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setMobileDrawerOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 lg:hidden w-[85vw] max-w-[380px] bg-card border-l border-border overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-card z-10">
                <span className="text-sm font-semibold">Session Controls</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileDrawerOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-3">
                <SmartBoardConceptCheckPanel sessionId={sessionId} slideContext={currentSlideContent || ""} />
              </div>
              <div className="border-t border-border" />
              <div className="p-3">
                <SpotlightTeacherControls
                  sessionId={sessionId}
                  spotlightEnabled={hookSpotlightEnabled}
                  teacherSlideTitle={hookSlideTitle}
                  syncStats={syncStats}
                  onToggleSpotlight={(enabled) => { toggleSpotlight(enabled); setSpotlightEnabled(enabled); }}
                />
              </div>
              <div className="border-t border-border" />
              <div className={cn("transition-all duration-300", notesGenerating && "ring-1 ring-primary/40 animate-pulse rounded-lg")}>
                <TeacherNotesOverview sessionId={sessionId} />
              </div>
              <div className="border-t border-border" />
              <div className={cn("p-3", hasActiveCheck && "opacity-50")}>
                <PulseMeter sessionId={sessionId} confusionThreshold={confusionThreshold} />
              </div>
              <div className="border-t border-border" />
              <div className="flex-1 min-h-[200px] flex flex-col">
                <QuestionWall sessionId={sessionId} role="teacher" />
              </div>
              <div className="border-t border-border" />
              <div className="p-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateSessionSettings({ pulse_enabled: !pulseEnabled })}
                    className={cn("text-[10px] rounded-lg px-2 py-1.5 border transition-colors font-medium", pulseEnabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground")}
                  >Pulse</button>
                  <button
                    onClick={() => updateSessionSettings({ questions_enabled: !questionsEnabled })}
                    className={cn("text-[10px] rounded-lg px-2 py-1.5 border transition-colors font-medium", questionsEnabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground")}
                  >Q&A</button>
                  {onEndSession && (
                    <Button variant="destructive" size="sm" onClick={onEndSession} className="text-xs ml-auto">End</Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom teaching toolbar — visible in fullscreen */}
      {isFullscreen && (
        <SmartBoardToolbar
          activeView={activeView}
          onViewChange={setActiveView}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled((v) => !v)}
          isCapturing={isCapturing}
          onToggleCapture={() => {
            if (isCapturing) stopCapture();
            else startCapture();
          }}
          isDarkTheme={theme === "classroom-dark"}
          onToggleTheme={toggleTheme}
          onEndSession={onEndSession}
          whiteboardTool={wb.tool}
          onToolChange={wb.setTool}
          whiteboardColor={wb.color}
          onColorChange={wb.setColor}
          penSize={wb.penSize}
          onPenSizeChange={wb.setPenSize}
          presetColors={wb.presetColors}
          canUndo={wb.canUndo}
          canRedo={wb.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />
      )}
    </div>
  );
}

export function SmartBoardPanel(props: SmartBoardPanelProps) {
  return (
    <ClassroomThemeProvider>
      <SmartBoardPanelInner {...props} />
    </ClassroomThemeProvider>
  );
}
