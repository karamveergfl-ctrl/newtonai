/**
 * Centralized Newton Animation Configuration
 * 
 * This file is the single source of truth for:
 * 1. ProcessingState enum - all possible animation states
 * 2. Animation mapping - state → Lottie JSON
 * 3. Looping logic - which states loop vs play-once
 * 4. State metadata - messages, durations, use cases
 */

import thinkingAnimation from "./lottie/newton-thinking.json";
import writingAnimation from "./lottie/newton-writing.json";
import completedAnimation from "./lottie/newton-completed.json";
import confusedAnimation from "./lottie/newton-confused.json";
import celebratingAnimation from "./lottie/newton-celebrating.json";
import sleepingAnimation from "./lottie/newton-sleeping.json";

/**
 * Processing states for Newton animations.
 * This enum is the source of truth for all animation states.
 */
export enum ProcessingState {
  IDLE = "idle",
  THINKING = "thinking",
  ANALYZING = "analyzing",
  WRITING = "writing",
  SUMMARIZING = "summarizing",
  DONE = "done",
  ERROR = "error",
  // Extended states for specific UI contexts
  CONFUSED = "confused",
  CELEBRATING = "celebrating",
  SLEEPING = "sleeping",
}

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use ProcessingState enum instead
 */
export type ProcessingPhase = "idle" | "thinking" | "writing" | "completed";

/**
 * Maps ProcessingState to Lottie animation data.
 * Some states share animations (e.g., ANALYZING uses thinking animation).
 */
export const animationMap: Record<Exclude<ProcessingState, ProcessingState.IDLE>, object> = {
  [ProcessingState.THINKING]: thinkingAnimation,
  [ProcessingState.ANALYZING]: thinkingAnimation, // Reuse thinking for analysis phase
  [ProcessingState.WRITING]: writingAnimation,
  [ProcessingState.SUMMARIZING]: writingAnimation, // Reuse writing for summarization
  [ProcessingState.DONE]: completedAnimation,
  [ProcessingState.ERROR]: confusedAnimation,
  [ProcessingState.CONFUSED]: confusedAnimation,
  [ProcessingState.CELEBRATING]: celebratingAnimation,
  [ProcessingState.SLEEPING]: sleepingAnimation,
};

/**
 * States that should loop continuously.
 * All other states play once.
 */
const LOOPING_STATES: ProcessingState[] = [
  ProcessingState.THINKING,
  ProcessingState.ANALYZING,
  ProcessingState.WRITING,
  ProcessingState.SUMMARIZING,
  ProcessingState.CONFUSED,
  ProcessingState.SLEEPING,
];

/**
 * Determines if a state should loop its animation.
 * @param state - The processing state to check
 * @returns true if the animation should loop
 */
export function isLoopingState(state: ProcessingState): boolean {
  return LOOPING_STATES.includes(state);
}

/**
 * Default messages for each processing state.
 * Used by ProcessingOverlay and other components.
 */
export const stateMessages: Record<ProcessingState, { message: string; subMessage?: string }> = {
  [ProcessingState.IDLE]: { message: "" },
  [ProcessingState.THINKING]: { 
    message: "Newton is thinking...", 
    subMessage: "Analyzing your content" 
  },
  [ProcessingState.ANALYZING]: { 
    message: "Analyzing content...", 
    subMessage: "Understanding the structure" 
  },
  [ProcessingState.WRITING]: { 
    message: "Writing your results...", 
    subMessage: "Almost there" 
  },
  [ProcessingState.SUMMARIZING]: { 
    message: "Summarizing...", 
    subMessage: "Extracting key points" 
  },
  [ProcessingState.DONE]: { 
    message: "All done!", 
    subMessage: "Here are your results" 
  },
  [ProcessingState.ERROR]: { 
    message: "Something went wrong", 
    subMessage: "Let's try again" 
  },
  [ProcessingState.CONFUSED]: { 
    message: "Hmm, that's confusing...", 
    subMessage: "Let me think about this" 
  },
  [ProcessingState.CELEBRATING]: { 
    message: "Congratulations!", 
    subMessage: "You did it!" 
  },
  [ProcessingState.SLEEPING]: { 
    message: "Taking a break...", 
    subMessage: "Click to wake Newton up" 
  },
};

/**
 * Animation metadata for the preview page and debugging.
 */
export interface AnimationMeta {
  label: string;
  duration: string;
  frames: number;
  loops: boolean;
  useCase: string;
  description: string;
}

export const animationMeta: Record<Exclude<ProcessingState, ProcessingState.IDLE>, AnimationMeta> = {
  [ProcessingState.THINKING]: {
    label: "Thinking",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "Processing content, API calls in progress",
    description: "Head bob with floating thought dots and pulsing lightbulb",
  },
  [ProcessingState.ANALYZING]: {
    label: "Analyzing",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "Content analysis, structure detection",
    description: "Same as thinking - analyzing phase",
  },
  [ProcessingState.WRITING]: {
    label: "Writing",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "Generating results, creating content",
    description: "Pencil motion with paper sheets appearing",
  },
  [ProcessingState.SUMMARIZING]: {
    label: "Summarizing",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "Creating summaries, extracting key points",
    description: "Same as writing - summarization phase",
  },
  [ProcessingState.DONE]: {
    label: "Completed",
    duration: "1.2s",
    frames: 72,
    loops: false,
    useCase: "Success states, task completion",
    description: "Bounce entry with thumbs up and sparkles",
  },
  [ProcessingState.ERROR]: {
    label: "Error",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "Error states, validation failures",
    description: "Confused expression with question marks",
  },
  [ProcessingState.CONFUSED]: {
    label: "Confused",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "User confusion, help needed",
    description: "Head tilt with floating question marks",
  },
  [ProcessingState.CELEBRATING]: {
    label: "Celebrating",
    duration: "1.5s",
    frames: 90,
    loops: false,
    useCase: "Level-ups, achievements, streaks",
    description: "Jumping motion with arms raised and confetti",
  },
  [ProcessingState.SLEEPING]: {
    label: "Sleeping",
    duration: "3s",
    frames: 180,
    loops: true,
    useCase: "Idle timeout, inactivity detection",
    description: "Closed eyes with gentle breathing and floating ZZZ",
  },
};

/**
 * Minimum duration (in ms) a state should be visible before transitioning.
 * Prevents animation flickering on fast API responses.
 */
export const MIN_STATE_DURATION = 300;

/**
 * Duration (in ms) to show the completed animation before resetting.
 */
export const COMPLETED_ANIMATION_DURATION = 1500;

/**
 * Convert legacy ProcessingPhase to ProcessingState
 * @deprecated For backward compatibility only
 */
export function phaseToState(phase: ProcessingPhase): ProcessingState {
  switch (phase) {
    case "idle": return ProcessingState.IDLE;
    case "thinking": return ProcessingState.THINKING;
    case "writing": return ProcessingState.WRITING;
    case "completed": return ProcessingState.DONE;
    default: return ProcessingState.IDLE;
  }
}

/**
 * Convert ProcessingState to legacy ProcessingPhase
 * @deprecated For backward compatibility only
 */
export function stateToPhase(state: ProcessingState): ProcessingPhase {
  switch (state) {
    case ProcessingState.IDLE: return "idle";
    case ProcessingState.THINKING:
    case ProcessingState.ANALYZING: return "thinking";
    case ProcessingState.WRITING:
    case ProcessingState.SUMMARIZING: return "writing";
    case ProcessingState.DONE:
    case ProcessingState.CELEBRATING: return "completed";
    default: return "idle";
  }
}
