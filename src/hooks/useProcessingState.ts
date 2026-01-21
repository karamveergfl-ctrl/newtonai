import { useState, useCallback, useRef } from "react";

export type ProcessingPhase = "idle" | "thinking" | "writing" | "completed";

interface UseProcessingStateOptions {
  /** Duration of the completed animation in ms (default: 1500ms) */
  completedAnimationDuration?: number;
  /** Callback when the completed animation finishes */
  onComplete?: () => void;
}

interface UseProcessingStateReturn {
  /** Current processing phase */
  phase: ProcessingPhase;
  /** Whether any processing is happening (not idle) */
  isProcessing: boolean;
  /** Start the thinking phase */
  startThinking: () => void;
  /** Transition to writing phase */
  startWriting: () => void;
  /** Transition to completed phase (auto-resets to idle after animation) */
  complete: () => void;
  /** Reset to idle immediately */
  reset: () => void;
  /** Set phase directly (for edge cases) */
  setPhase: (phase: ProcessingPhase) => void;
}

/**
 * Hook to manage processing state for Newton animations.
 * Handles state transitions: idle → thinking → writing → completed → idle
 */
export function useProcessingState(
  options: UseProcessingStateOptions = {}
): UseProcessingStateReturn {
  const { completedAnimationDuration = 1500, onComplete } = options;
  const [phase, setPhase] = useState<ProcessingPhase>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startThinking = useCallback(() => {
    clearPendingTimeout();
    setPhase("thinking");
  }, [clearPendingTimeout]);

  const startWriting = useCallback(() => {
    clearPendingTimeout();
    setPhase("writing");
  }, [clearPendingTimeout]);

  const complete = useCallback(() => {
    clearPendingTimeout();
    setPhase("completed");
    
    // Auto-reset to idle after the completed animation plays
    timeoutRef.current = setTimeout(() => {
      setPhase("idle");
      onComplete?.();
    }, completedAnimationDuration);
  }, [clearPendingTimeout, completedAnimationDuration, onComplete]);

  const reset = useCallback(() => {
    clearPendingTimeout();
    setPhase("idle");
  }, [clearPendingTimeout]);

  return {
    phase,
    isProcessing: phase !== "idle",
    startThinking,
    startWriting,
    complete,
    reset,
    setPhase,
  };
}
