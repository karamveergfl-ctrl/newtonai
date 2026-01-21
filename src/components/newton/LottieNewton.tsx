import { memo, useEffect, useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ProcessingState, 
  animationMap, 
  isLoopingState 
} from "./animationConfig";

// Legacy type alias for backward compatibility
export type NewtonState = 
  | "idle" 
  | "thinking" 
  | "writing" 
  | "completed"
  | "confused"
  | "celebrating"
  | "sleeping";

interface LottieNewtonProps {
  /** New enum-based state (preferred) */
  processingState?: ProcessingState;
  /** Legacy string-based state (for backward compatibility) */
  state?: NewtonState;
  size?: "sm" | "md" | "lg";
  className?: string;
  onComplete?: () => void;
}

const sizeClasses = {
  sm: "w-24 h-24 sm:w-28 sm:h-28",
  md: "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48",
  lg: "w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64",
};

/**
 * Converts legacy NewtonState to ProcessingState
 */
function legacyStateToProcessingState(state: NewtonState): ProcessingState {
  switch (state) {
    case "idle": return ProcessingState.IDLE;
    case "thinking": return ProcessingState.THINKING;
    case "writing": return ProcessingState.WRITING;
    case "completed": return ProcessingState.DONE;
    case "confused": return ProcessingState.CONFUSED;
    case "celebrating": return ProcessingState.CELEBRATING;
    case "sleeping": return ProcessingState.SLEEPING;
    default: return ProcessingState.IDLE;
  }
}

/**
 * Lottie-based Newton Animation Component
 * 
 * Single Lottie player that switches animation data based on state.
 * Uses centralized animationConfig for all state → animation mappings.
 * 
 * Supports both:
 * - New ProcessingState enum (preferred)
 * - Legacy NewtonState strings (backward compatible)
 */
export const LottieNewton = memo(({
  processingState,
  state,
  size = "md",
  className = "",
  onComplete,
}: LottieNewtonProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Determine the actual state to use (prefer new enum over legacy)
  const activeState: ProcessingState = processingState 
    ?? (state ? legacyStateToProcessingState(state) : ProcessingState.IDLE);

  // Reset animation to beginning for play-once animations when state changes
  useEffect(() => {
    if (!isLoopingState(activeState) && lottieRef.current) {
      lottieRef.current.goToAndPlay(0);
    }
  }, [activeState]);

  // Don't render anything for idle state
  if (activeState === ProcessingState.IDLE) return null;

  const animationData = animationMap[activeState];
  const shouldLoop = isLoopingState(activeState);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeState}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className={`${sizeClasses[size]} ${className}`}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={shouldLoop}
          autoplay={true}
          onComplete={!shouldLoop ? onComplete : undefined}
          style={{ width: "100%", height: "100%" }}
          rendererSettings={{
            preserveAspectRatio: "xMidYMid slice",
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
});

LottieNewton.displayName = "LottieNewton";

export default LottieNewton;
