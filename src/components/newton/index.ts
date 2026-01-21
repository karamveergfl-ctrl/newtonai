/**
 * Newton Animation System - Public Exports
 * 
 * This module provides a unified animation system for the Newton character.
 * Use ProcessingState enum for all state management.
 */

// Main configuration and types
export { 
  ProcessingState,
  animationMap,
  animationMeta,
  stateMessages,
  isLoopingState,
  phaseToState,
  stateToPhase,
  MIN_STATE_DURATION,
  COMPLETED_ANIMATION_DURATION,
  type AnimationMeta,
  type ProcessingPhase,
} from "./animationConfig";

// Main Lottie component
export { LottieNewton, type NewtonState } from "./LottieNewton";
