import { useState, useEffect } from "react";
import { useLivePulse } from "@/hooks/useLivePulse";
import type { PulseStatus } from "@/types/liveSession";
import { cn } from "@/lib/utils";

interface PulseWidgetProps {
  sessionId: string;
}

const PULSE_OPTIONS: { status: PulseStatus; emoji: string; label: string; colorClass: string }[] = [
  { status: "got_it", emoji: "✅", label: "Got it", colorClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30" },
  { status: "slightly_lost", emoji: "🤔", label: "Slightly lost", colorClass: "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30" },
  { status: "lost", emoji: "❌", label: "Lost", colorClass: "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30" },
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
  const { myStatus, pulseEnabled, submitPulse } = useLivePulse({ sessionId, role: "student" });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!myStatus) {
      setIsExpanded(true);
    }
  }, []);

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
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 sm:bottom-6">
      <div
        className={cn(
          "bg-card border border-border rounded-2xl shadow-elevated transition-all duration-300 ease-out overflow-hidden",
          isExpanded ? "px-4 py-3 min-w-[280px]" : "px-3 py-2 cursor-pointer"
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {showConfirmation ? (
          <div className="flex items-center gap-2 text-sm text-primary animate-fade-in">
            <span>✓</span>
            <span>Response sent</span>
          </div>
        ) : isExpanded ? (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs text-muted-foreground text-center font-medium">
              How are you following?
            </p>
            <div className="flex gap-2">
              {PULSE_OPTIONS.map((opt) => (
                <button
                  key={opt.status}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmit(opt.status);
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-medium transition-all duration-150 active:scale-[0.96]",
                    opt.colorClass,
                    myStatus === opt.status && "ring-2 ring-primary"
                  )}
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
                <span className={cn("w-2 h-2 rounded-full animate-pulse", STATUS_DOT_COLOR[myStatus])} />
                <span className="text-foreground font-medium">{STATUS_LABEL[myStatus]}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                <span className="text-muted-foreground">Tap to respond</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
