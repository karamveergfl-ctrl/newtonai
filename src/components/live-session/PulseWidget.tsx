import { useState, useEffect } from "react";
import { useLivePulse } from "@/hooks/useLivePulse";
import type { PulseStatus } from "@/types/liveSession";
import { cn } from "@/lib/utils";

interface PulseWidgetProps {
  sessionId: string;
}

const PULSE_OPTIONS: { status: PulseStatus; emoji: string; label: string; colorClass: string }[] = [
  { status: "got_it", emoji: "✅", label: "Got it", colorClass: "bg-green-900/40 text-green-300 border-green-600 hover:bg-green-900/50" },
  { status: "slightly_lost", emoji: "🤔", label: "Slightly lost", colorClass: "bg-amber-900/40 text-amber-300 border-amber-600 hover:bg-amber-900/50" },
  { status: "lost", emoji: "❌", label: "Lost", colorClass: "bg-red-900/40 text-red-300 border-red-600 hover:bg-red-900/50" },
];

const STATUS_DOT_COLOR: Record<PulseStatus, string> = {
  got_it: "bg-emerald-400",
  slightly_lost: "bg-amber-400",
  lost: "bg-red-400",
};

const STATUS_LABEL: Record<PulseStatus, string> = {
  got_it: "Got it",
  slightly_lost: "Slightly lost",
  lost: "Lost",
};

export function PulseWidget({ sessionId }: PulseWidgetProps) {
  const { myStatus, pulseEnabled, isLoading, submitPulse } = useLivePulse({ sessionId, role: "student" });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!myStatus && !isLoading) {
      setIsExpanded(true);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 sm:bottom-6">
        <div className="bg-card border border-border rounded-2xl shadow-elevated px-4 py-2.5 animate-pulse">
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!pulseEnabled) return null;

  const handleSubmit = async (status: PulseStatus) => {
    await submitPulse(status);
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
      setIsExpanded(false);
    }, 2000);
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 sm:bottom-6" role="region" aria-label="Understanding check">
      <div
        className={cn(
          "bg-card border border-border rounded-2xl shadow-elevated transition-all duration-300 ease-out overflow-hidden",
          isExpanded ? "px-4 py-3 min-w-[280px]" : "px-3 py-2 cursor-pointer"
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {showConfirmation ? (
          <div className="flex items-center gap-2 text-sm text-primary animate-[fade-up-out_1.2s_ease-out_forwards]">
            <span>✓</span>
            <span>Response sent</span>
          </div>
        ) : isExpanded ? (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs text-muted-foreground text-center font-medium">
              How are you following?
            </p>
            <div className="flex gap-2" role="radiogroup" aria-label="Understanding level">
              {PULSE_OPTIONS.map((opt) => (
                <button
                  key={opt.status}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmit(opt.status);
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-medium transition-all duration-150 active:scale-[0.93] focus-visible:ring-2 focus-visible:ring-ring",
                    opt.colorClass,
                    myStatus === opt.status && "ring-2 ring-primary"
                  )}
                  role="radio"
                  aria-checked={myStatus === opt.status}
                  aria-label={opt.label}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              Collapse
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            {myStatus ? (
              <>
                <span className={cn("w-2 h-2 rounded-full animate-[status-pulse_2.5s_ease-in-out_infinite]", STATUS_DOT_COLOR[myStatus])} />
                <span className="text-foreground font-medium">{STATUS_LABEL[myStatus]}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-[status-pulse_2.5s_ease-in-out_infinite]" />
                <span className="text-muted-foreground">Tap to respond</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
