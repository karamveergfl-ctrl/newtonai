import { useConceptCheck } from "@/hooks/useConceptCheck";
import { ConceptCheckTrigger } from "./ConceptCheckTrigger";
import { ConceptCheckResultsPanel } from "./ConceptCheckResultsPanel";
import { ConceptCheckTimer } from "./ConceptCheckTimer";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";

interface SmartBoardConceptCheckPanelProps {
  sessionId: string;
  slideContext: string;
}

export function SmartBoardConceptCheckPanel({
  sessionId,
  slideContext,
}: SmartBoardConceptCheckPanelProps) {
  const {
    activeCheck,
    checkResults,
    isGenerating,
    isClosed,
    timeRemaining,
    generationError,
    rateLimitSeconds,
    triggerConceptCheck,
    closeCheck,
    refreshResults,
    dismissCheck,
  } = useConceptCheck({ sessionId, role: "teacher", slideContext });

  // idle — no active check
  if (!activeCheck && !isGenerating) {
    return (
      <ConceptCheckTrigger
        isGenerating={false}
        generationError={generationError}
        rateLimitSeconds={rateLimitSeconds}
        onTrigger={triggerConceptCheck}
      />
    );
  }

  // generating
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Generating question…
      </div>
    );
  }

  // results — check is closed
  if (activeCheck && isClosed) {
    return (
      <ConceptCheckResultsPanel
        check={activeCheck}
        results={checkResults}
        onDismiss={dismissCheck}
        onNewCheck={() => {
          dismissCheck();
        }}
      />
    );
  }

  // active — check in progress
  if (activeCheck && !isClosed) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <p className="text-xs font-medium text-foreground line-clamp-2">{activeCheck.question}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>
              {checkResults?.total_responses ?? 0}/{checkResults?.total_enrolled ?? "?"} answered
            </span>
          </div>
          <ConceptCheckTimer
            totalSeconds={activeCheck.duration_seconds}
            remainingSeconds={timeRemaining}
            size="small"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={closeCheck}
          className="text-xs border-border text-muted-foreground hover:bg-muted"
          aria-label="Close concept check early"
        >
          Close Early
        </Button>
      </div>
    );
  }

  return null;
}
