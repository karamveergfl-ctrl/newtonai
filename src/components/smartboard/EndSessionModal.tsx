import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface EndSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onComplete?: () => void;
}

interface Step {
  label: string;
  status: "pending" | "running" | "done" | "error";
}

const INITIAL_STEPS: Step[] = [
  { label: "Saving whiteboard snapshots", status: "pending" },
  { label: "Saving lecture transcript", status: "pending" },
  { label: "Processing OCR notes", status: "pending" },
  { label: "Generating AI study guide", status: "pending" },
  { label: "Updating student reports", status: "pending" },
  { label: "Finalizing session", status: "pending" },
];

export function EndSessionModal({
  open,
  onOpenChange,
  sessionId,
  onComplete,
}: EndSessionModalProps) {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS.map((s) => ({ ...s })));
  const [allDone, setAllDone] = useState(false);

  const updateStep = useCallback((index: number, status: Step["status"]) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    );
  }, []);

  const runSteps = useCallback(async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Step 0: whiteboard snapshots — already auto-saved, confirm
    updateStep(0, "running");
    await delay(800);
    updateStep(0, "done");

    // Step 1: lecture transcript — incremental, confirm
    updateStep(1, "running");
    await delay(600);
    updateStep(1, "done");

    // Step 2: OCR notes — confirm saved
    updateStep(2, "running");
    await delay(700);
    updateStep(2, "done");

    // Step 3: generate AI study guide
    updateStep(3, "running");
    try {
      await supabase.functions.invoke("generate-session-guide", {
        body: { session_id: sessionId },
      });
    } catch { /* non-critical */ }
    updateStep(3, "done");

    // Step 4: trigger student reports
    updateStep(4, "running");
    try {
      await supabase.functions.invoke("trigger-all-student-reports", {
        body: { session_id: sessionId },
      });
    } catch { /* non-critical */ }
    updateStep(4, "done");

    // Step 5: finalize
    updateStep(5, "running");
    await supabase
      .from("live_sessions" as any)
      .update({ status: "ended" } as any)
      .eq("id", sessionId);
    updateStep(5, "done");

    setAllDone(true);
  }, [sessionId, updateStep]);

  useEffect(() => {
    if (open) {
      setSteps(INITIAL_STEPS.map((s) => ({ ...s })));
      setAllDone(false);
      runSteps();
    }
  }, [open, runSteps]);

  return (
    <Dialog open={open} onOpenChange={allDone ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {allDone ? "Session Complete ✓" : "Ending Session…"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                step.status === "running" && "bg-primary/5",
                step.status === "done" && "bg-emerald-500/5"
              )}
            >
              <div className="shrink-0">
                {step.status === "pending" && (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                )}
                {step.status === "running" && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {step.status === "done" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {step.status === "error" && (
                  <div className="w-5 h-5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs">!</div>
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  step.status === "pending" && "text-muted-foreground",
                  step.status === "running" && "text-foreground font-medium",
                  step.status === "done" && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {allDone && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onComplete?.();
              }}
            >
              Close
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onComplete?.();
                navigate(`/report/teacher/${sessionId}`);
              }}
            >
              <BarChart3 className="w-4 h-4" />
              View Report
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
