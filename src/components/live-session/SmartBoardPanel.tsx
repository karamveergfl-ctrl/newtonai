import { type ReactNode } from "react";
import { useLiveSession } from "@/contexts/LiveSessionContext";
import { PulseMeter } from "./PulseMeter";
import { QuestionWall } from "./QuestionWall";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SmartBoardPanelProps {
  sessionId: string;
  children: ReactNode;
  onEndSession?: () => void;
}

export function SmartBoardPanel({ sessionId, children, onEndSession }: SmartBoardPanelProps) {
  const {
    confusionThreshold,
    pulseEnabled,
    questionsEnabled,
    updateSessionSettings,
  } = useLiveSession();

  return (
    <div className="flex h-full w-full">
      {/* Main content area */}
      <div className="flex-1 min-w-0 h-full overflow-auto">
        {children}
      </div>

      {/* Interaction sidebar — hidden on mobile */}
      <aside className="hidden lg:flex flex-col w-[320px] xl:w-[360px] border-l border-border bg-card h-full shrink-0">
        {/* Pulse Meter */}
        <div className="p-3 shrink-0">
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
          <button
            onClick={() => updateSessionSettings({ pulse_enabled: !pulseEnabled })}
            className={cn(
              "flex-1 text-xs rounded-lg px-3 py-2 border transition-colors font-medium",
              pulseEnabled
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted border-border text-muted-foreground"
            )}
          >
            Pulse {pulseEnabled ? "On" : "Off"}
          </button>
          <button
            onClick={() => updateSessionSettings({ questions_enabled: !questionsEnabled })}
            className={cn(
              "flex-1 text-xs rounded-lg px-3 py-2 border transition-colors font-medium",
              questionsEnabled
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted border-border text-muted-foreground"
            )}
          >
            Q&A {questionsEnabled ? "On" : "Off"}
          </button>
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
      </aside>
    </div>
  );
}
