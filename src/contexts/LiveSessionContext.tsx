import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LiveSessionSettings, ConceptCheck } from "@/types/liveSession";

interface LiveSessionContextValue {
  sessionId: string | null;
  sessionRole: "teacher" | "student" | null;
  confusionThreshold: number;
  pulseEnabled: boolean;
  questionsEnabled: boolean;
  currentSlideContent: string;
  setCurrentSlideContent: (content: string) => void;
  updateSessionSettings: (settings: Partial<LiveSessionSettings>) => Promise<void>;
  activeConceptCheck: ConceptCheck | null;
  setActiveConceptCheck: (check: ConceptCheck | null) => void;
  currentSlideIndex: number;
  totalSlides: number;
  setCurrentSlideIndex: (index: number) => void;
  setTotalSlides: (total: number) => void;
  notesEnabled: boolean;
}

const LiveSessionContext = createContext<LiveSessionContextValue | null>(null);

interface LiveSessionProviderProps {
  sessionId: string;
  role: "teacher" | "student";
  initialSettings?: Partial<LiveSessionSettings>;
  children: ReactNode;
}

export function LiveSessionProvider({
  sessionId,
  role,
  initialSettings,
  children,
}: LiveSessionProviderProps) {
  const [pulseEnabled, setPulseEnabled] = useState(initialSettings?.pulse_enabled ?? true);
  const [questionsEnabled, setQuestionsEnabled] = useState(initialSettings?.questions_enabled ?? true);
  const [confusionThreshold, setConfusionThreshold] = useState(initialSettings?.confusion_threshold ?? 40);
  const [currentSlideContent, setCurrentSlideContent] = useState("");
  const [activeConceptCheck, setActiveConceptCheck] = useState<ConceptCheck | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [notesEnabled, setNotesEnabled] = useState(true);

  const updateSessionSettings = useCallback(
    async (settings: Partial<LiveSessionSettings>) => {
      const updates: Record<string, unknown> = {};
      if (settings.pulse_enabled !== undefined) {
        updates.pulse_enabled = settings.pulse_enabled;
        setPulseEnabled(settings.pulse_enabled);
      }
      if (settings.questions_enabled !== undefined) {
        updates.questions_enabled = settings.questions_enabled;
        setQuestionsEnabled(settings.questions_enabled);
      }
      if (settings.confusion_threshold !== undefined) {
        updates.confusion_threshold = settings.confusion_threshold;
        setConfusionThreshold(settings.confusion_threshold);
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("live_sessions" as "live_sessions")
          .update(updates)
          .eq("id", sessionId);
        if (error) {
          console.error("updateSessionSettings error:", error.message);
        }
      }
    },
    [sessionId]
  );

  return (
    <LiveSessionContext.Provider
      value={{
        sessionId,
        sessionRole: role,
        confusionThreshold,
        pulseEnabled,
        questionsEnabled,
        currentSlideContent,
        setCurrentSlideContent,
        updateSessionSettings,
        activeConceptCheck,
        setActiveConceptCheck,
        currentSlideIndex,
        totalSlides,
        setCurrentSlideIndex,
        setTotalSlides,
        notesEnabled,
      }}
    >
      {children}
    </LiveSessionContext.Provider>
  );
}

export function useLiveSession() {
  const ctx = useContext(LiveSessionContext);
  if (!ctx) {
    throw new Error("useLiveSession must be used within a LiveSessionProvider");
  }
  return ctx;
}
