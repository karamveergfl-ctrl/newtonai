import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfusionAlertBannerProps {
  confusionPercentage: number;
  threshold: number;
  slideContent: string;
  sessionId: string;
}

export function ConfusionAlertBanner({
  confusionPercentage,
  threshold,
  slideContent,
  sessionId,
}: ConfusionAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [recapLoading, setRecapLoading] = useState(false);
  const [recapText, setRecapText] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const chimePlayed = useRef(false);
  const lastAlertLevel = useRef<"warning" | "critical" | null>(null);

  const isCritical = confusionPercentage >= 50;
  const isWarning = confusionPercentage >= 30 && confusionPercentage < 50;
  const shouldShow = (isWarning || isCritical) && !dismissed;

  // Play chime for critical
  useEffect(() => {
    if (isCritical && !chimePlayed.current) {
      chimePlayed.current = true;
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {}
    }
    if (!isCritical) chimePlayed.current = false;
  }, [isCritical]);

  // Reset dismissed when level changes
  useEffect(() => {
    const level = isCritical ? "critical" : isWarning ? "warning" : null;
    if (level && level !== lastAlertLevel.current) {
      setDismissed(false);
      setCountdown(30);
      setRecapText(null);
    }
    lastAlertLevel.current = level;
  }, [isCritical, isWarning]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!shouldShow) return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setDismissed(true);
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [shouldShow]);

  const handleRecap = useCallback(async () => {
    setRecapLoading(true);
    try {
      const { data } = await supabase.functions.invoke("newton-chat", {
        body: {
          message: `Based on this slide content, provide a 3-bullet recap for students who are confused. Keep it very simple and clear:\n\n${slideContent}`,
          conversationHistory: [],
        },
      });
      setRecapText(data?.response || "Could not generate recap.");
    } catch {
      setRecapText("Failed to generate recap.");
    } finally {
      setRecapLoading(false);
    }
  }, [slideContent]);

  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        "px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 animate-fade-in relative overflow-hidden",
        isCritical
          ? "bg-destructive/15 border-b border-destructive/30"
          : "bg-amber-500/10 border-b border-amber-500/20"
      )}
    >
      {/* Countdown progress bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-0.5 transition-all duration-1000 ease-linear",
          isCritical ? "bg-destructive/40" : "bg-amber-500/30"
        )}
        style={{ width: `${(countdown / 30) * 100}%` }}
      />

      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle
          className={cn("w-4 h-4 shrink-0", isCritical ? "text-destructive" : "text-amber-500")}
        />
        <p className={cn("text-sm font-medium", isCritical ? "text-destructive" : "text-amber-500")}>
          {isCritical
            ? `🚨 ${Math.round(confusionPercentage)}% of students are lost — consider pausing`
            : `⚠ ${Math.round(confusionPercentage)}% struggling — consider slowing down`}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => { if (!recapText) handleRecap(); }}
            >
              {recapLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
              Recap Now
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm" side="bottom">
            {recapLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating recap…
              </div>
            ) : recapText ? (
              <div className="whitespace-pre-wrap text-xs leading-relaxed">{recapText}</div>
            ) : (
              <p className="text-xs text-muted-foreground">Click to generate a quick recap</p>
            )}
          </PopoverContent>
        </Popover>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
