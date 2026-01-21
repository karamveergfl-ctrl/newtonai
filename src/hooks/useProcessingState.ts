import { useState, useCallback, useRef } from "react";
import { 
  ProcessingState, 
  MIN_STATE_DURATION, 
  COMPLETED_ANIMATION_DURATION 
} from "@/components/newton/animationConfig";

/**
 * @deprecated Use ProcessingState enum from animationConfig.ts instead
 */
export type ProcessingPhase = "idle" | "thinking" | "writing" | "completed";

interface UseProcessingStateOptions {
  /** Duration of the completed animation in ms (default: 1500ms) */
  completedAnimationDuration?: number;
  /** Minimum duration a state should be visible before transitioning (default: 300ms) */
  minStateDuration?: number;
  /** Callback when the completed animation finishes */
  onComplete?: () => void;
  /** Callback when an error occurs */
  onError?: () => void;
}

interface UseProcessingStateReturn {
  /** Current processing state (new enum) */
  state: ProcessingState;
  /** Current processing phase (legacy, for backward compatibility) */
  phase: ProcessingPhase;
  /** Whether any processing is happening (not idle) */
  isProcessing: boolean;
  /** Start the thinking phase */
  startThinking: () => void;
  /** Start the analyzing phase */
  startAnalyzing: () => void;
  /** Transition to writing phase */
  startWriting: () => void;
  /** Start the summarizing phase */
  startSummarizing: () => void;
  /** Transition to completed/done phase (auto-resets to idle after animation) */
  complete: () => void;
  /** Transition to error phase */
  error: () => void;
  /** Reset to idle immediately */
  reset: () => void;
  /** Set state directly (for edge cases) */
  setState: (state: ProcessingState) => void;
  /** @deprecated Use setState instead */
  setPhase: (phase: ProcessingPhase) => void;
}

/**
 * Converts ProcessingState to legacy ProcessingPhase for backward compatibility
 */
function stateToPhase(state: ProcessingState): ProcessingPhase {
  switch (state) {
    case ProcessingState.IDLE:
      return "idle";
    case ProcessingState.THINKING:
    case ProcessingState.ANALYZING:
      return "thinking";
    case ProcessingState.WRITING:
    case ProcessingState.SUMMARIZING:
      return "writing";
    case ProcessingState.DONE:
    case ProcessingState.CELEBRATING:
      return "completed";
    case ProcessingState.ERROR:
    case ProcessingState.CONFUSED:
      return "idle"; // Error states map to idle for legacy compatibility
    case ProcessingState.SLEEPING:
      return "idle";
    default:
      return "idle";
  }
}

/**
 * Converts legacy ProcessingPhase to ProcessingState
 */
function phaseToState(phase: ProcessingPhase): ProcessingState {
  switch (phase) {
    case "idle":
      return ProcessingState.IDLE;
    case "thinking":
      return ProcessingState.THINKING;
    case "writing":
      return ProcessingState.WRITING;
    case "completed":
      return ProcessingState.DONE;
    default:
      return ProcessingState.IDLE;
  }
}

/**
 * Hook to manage processing state for Newton animations.
 * 
 * Features:
 * - State transitions with minimum duration enforcement to prevent flickering
 * - Automatic reset to idle after completed animation
 * - Both new enum-based and legacy phase-based APIs
 * 
 * State flow: idle → thinking/analyzing → writing/summarizing → done → idle
 * Error flow: any → error → idle (manual reset)
 */
export function useProcessingState(
  options: UseProcessingStateOptions = {}
): UseProcessingStateReturn {
  const { 
    completedAnimationDuration = COMPLETED_ANIMATION_DURATION, 
    minStateDuration = MIN_STATE_DURATION,
    onComplete,
    onError,
  } = options;
  
  const [state, setStateInternal] = useState<ProcessingState>(ProcessingState.IDLE);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateStartTime = useRef<number>(Date.now());
  const pendingTransition = useRef<ProcessingState | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingTransition.current = null;
  }, []);

  /**
   * Transitions to a new state, respecting minimum state duration.
   * If called too quickly, queues the transition.
   */
  const transitionTo = useCallback((newState: ProcessingState, immediate = false) => {
    clearPendingTimeout();
    
    if (immediate) {
      setStateInternal(newState);
      stateStartTime.current = Date.now();
      return;
    }

    const elapsed = Date.now() - stateStartTime.current;
    
    if (elapsed < minStateDuration) {
      // Wait remaining time before transitioning
      pendingTransition.current = newState;
      timeoutRef.current = setTimeout(() => {
        setStateInternal(newState);
        stateStartTime.current = Date.now();
        pendingTransition.current = null;
      }, minStateDuration - elapsed);
    } else {
      setStateInternal(newState);
      stateStartTime.current = Date.now();
    }
  }, [clearPendingTimeout, minStateDuration]);

  const startThinking = useCallback(() => {
    transitionTo(ProcessingState.THINKING, true); // Immediate for initial state
  }, [transitionTo]);

  const startAnalyzing = useCallback(() => {
    transitionTo(ProcessingState.ANALYZING);
  }, [transitionTo]);

  const startWriting = useCallback(() => {
    transitionTo(ProcessingState.WRITING);
  }, [transitionTo]);

  const startSummarizing = useCallback(() => {
    transitionTo(ProcessingState.SUMMARIZING);
  }, [transitionTo]);

  const complete = useCallback(() => {
    clearPendingTimeout();
    
    // Ensure minimum time in current state before showing completion
    const elapsed = Date.now() - stateStartTime.current;
    const delay = Math.max(0, minStateDuration - elapsed);
    
    timeoutRef.current = setTimeout(() => {
      setStateInternal(ProcessingState.DONE);
      stateStartTime.current = Date.now();
      
      // Auto-reset to idle after the completed animation plays
      timeoutRef.current = setTimeout(() => {
        setStateInternal(ProcessingState.IDLE);
        onComplete?.();
      }, completedAnimationDuration);
    }, delay);
  }, [clearPendingTimeout, completedAnimationDuration, minStateDuration, onComplete]);

  const error = useCallback(() => {
    clearPendingTimeout();
    setStateInternal(ProcessingState.ERROR);
    stateStartTime.current = Date.now();
    onError?.();
  }, [clearPendingTimeout, onError]);

  const reset = useCallback(() => {
    clearPendingTimeout();
    setStateInternal(ProcessingState.IDLE);
    stateStartTime.current = Date.now();
  }, [clearPendingTimeout]);

  const setState = useCallback((newState: ProcessingState) => {
    transitionTo(newState);
  }, [transitionTo]);

  // Legacy setPhase for backward compatibility
  const setPhase = useCallback((phase: ProcessingPhase) => {
    const newState = phaseToState(phase);
    if (phase === "completed") {
      complete();
    } else {
      transitionTo(newState, phase === "thinking"); // Immediate for thinking
    }
  }, [transitionTo, complete]);

  return {
    state,
    phase: stateToPhase(state),
    isProcessing: state !== ProcessingState.IDLE,
    startThinking,
    startAnalyzing,
    startWriting,
    startSummarizing,
    complete,
    error,
    reset,
    setState,
    setPhase,
  };
}
