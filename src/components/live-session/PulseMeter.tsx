import { useState, useEffect, useRef } from "react";
import { useLivePulse } from "@/hooks/useLivePulse";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface PulseMeterProps {
  sessionId: string;
  confusionThreshold: number;
}

const BARS = [
  { key: "got_it" as const, label: "Got it", emoji: "✅", barColor: "bg-emerald-500", textColor: "text-emerald-400" },
  { key: "slightly_lost" as const, label: "Slightly lost", emoji: "🤔", barColor: "bg-amber-500", textColor: "text-amber-400" },
  { key: "lost" as const, label: "Lost", emoji: "❌", barColor: "bg-red-500", textColor: "text-red-400" },
];

export function PulseMeter({ sessionId, confusionThreshold }: PulseMeterProps) {
  const { pulseSummary, isLoading, confusionAlert } = useLivePulse({
    sessionId,
    role: "teacher",
  });

  const { total } = pulseSummary;

  // Alert dismiss state — prevent re-trigger until confusion drops and rises again
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(30);
  const prevConfusionRef = useRef(false);

  // Reset dismiss flag when confusion drops below threshold
  useEffect(() => {
    if (!confusionAlert && prevConfusionRef.current) {
      setAlertDismissed(false);
    }
    prevConfusionRef.current = confusionAlert;
  }, [confusionAlert]);

  // Alert countdown timer
  useEffect(() => {
    if (!confusionAlert || alertDismissed) {
      setAlertCountdown(30);
      return;
    }
    setAlertCountdown(30);
    const interval = setInterval(() => {
      setAlertCountdown((prev) => {
        if (prev <= 1) {
          setAlertDismissed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [confusionAlert, alertDismissed]);

  const showAlert = confusionAlert && !alertDismissed;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-all duration-500 relative",
        showAlert
          ? "border-destructive/60 animate-[confusion-glow_1.5s_ease-in-out_infinite]"
          : "border-border"
      )}
      role="region"
      aria-label="Live Pulse meter"
    >
      {/* Confusion alert banner */}
      {showAlert && (
        <div
          className="mb-3 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 animate-[slide-down_0.3s_ease-out]"
          role="alert"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-destructive flex items-center gap-1.5">
              <span>⚠️</span>
              <span aria-live="polite">
                {Math.round(pulseSummary.confusion_percentage)}% of students need help — consider pausing
              </span>
            </span>
            <button
              onClick={() => setAlertDismissed(true)}
              className="shrink-0 text-destructive/60 hover:text-destructive transition-colors"
              aria-label="Dismiss confusion alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Countdown progress bar */}
          <div className="mt-1.5 h-0.5 rounded-full bg-destructive/20 overflow-hidden">
            <div
              className="h-full bg-destructive/50 transition-all duration-1000 ease-linear"
              style={{ width: `${(alertCountdown / 30) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground tracking-wide">Live Pulse</h3>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {total} {total === 1 ? "response" : "responses"}
        </span>
      </div>

      {isLoading || total === 0 ? (
        <div className="space-y-3">
          {BARS.map((b) => (
            <div key={b.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{b.emoji} {b.label}</span>
                <span className="text-muted-foreground">—</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-muted-foreground/20 animate-pulse w-1/4" />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-1 animate-pulse">
            Waiting for students to respond…
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {BARS.map((b) => {
            const count = pulseSummary[b.key];
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={b.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={b.textColor}>{b.emoji} {b.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    <span className={cn(
                      b.key === "lost" && showAlert && "animate-[count-pop_0.4s_ease-out]"
                    )}>
                      {count}
                    </span>
                    {" "}({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", b.barColor)}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${b.label}: ${Math.round(pct)}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
