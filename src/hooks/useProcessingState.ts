import { useState, useCallback } from "react";

/**
 * Simplified processing state - just binary processing or not.
 * No fake phases or timers.
 */
export function useProcessingState() {
  const [isProcessing, setIsProcessing] = useState(false);

  const start = useCallback(() => {
    setIsProcessing(true);
  }, []);

  const stop = useCallback(() => {
    setIsProcessing(false);
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    start,
    stop,
    reset,
    // Legacy compatibility - these all just map to isProcessing
    phase: isProcessing ? "processing" : "idle" as "idle" | "processing" | "thinking" | "writing" | "completed",
    startThinking: start,
    startWriting: start,
    complete: stop,
    setPhase: (_phase: string) => {
      if (_phase === "idle" || _phase === "completed") {
        setIsProcessing(false);
      } else {
        setIsProcessing(true);
      }
    },
  };
}

// Legacy type export for backwards compatibility
export type ProcessingPhase = "idle" | "thinking" | "writing" | "completed" | "processing";
