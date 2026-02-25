import { useLivePulse } from "@/hooks/useLivePulse";
import { cn } from "@/lib/utils";

interface PulseMeterProps {
  sessionId: string;
  confusionThreshold: number;
}

const BARS = [
  { key: "got_it" as const, label: "Got it", barColor: "bg-emerald-500", textColor: "text-emerald-400" },
  { key: "slightly_lost" as const, label: "Slightly lost", barColor: "bg-amber-500", textColor: "text-amber-400" },
  { key: "lost" as const, label: "Lost", barColor: "bg-red-500", textColor: "text-red-400" },
];

export function PulseMeter({ sessionId, confusionThreshold }: PulseMeterProps) {
  const { pulseSummary, isLoading, confusionAlert } = useLivePulse({
    sessionId,
    role: "teacher",
  });

  const { total } = pulseSummary;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-all duration-500",
        confusionAlert
          ? "border-red-500/60 shadow-[0_0_20px_hsl(0_84%_60%/0.2)]"
          : "border-border"
      )}
    >
      {confusionAlert && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400 animate-fade-in">
          <span>⚠️</span>
          <span>{Math.round(pulseSummary.confusion_percentage)}% of students are confused</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Live Pulse</h3>
        <span className="text-xs text-muted-foreground">
          {total} {total === 1 ? "response" : "responses"}
        </span>
      </div>

      {isLoading || total === 0 ? (
        <div className="space-y-3">
          {BARS.map((b) => (
            <div key={b.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="text-muted-foreground">—</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-muted-foreground/20 animate-pulse w-1/4" />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-1">
            Waiting for responses…
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
                  <span className={b.textColor}>{b.label}</span>
                  <span className="text-muted-foreground">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", b.barColor)}
                    style={{ width: `${pct}%` }}
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
