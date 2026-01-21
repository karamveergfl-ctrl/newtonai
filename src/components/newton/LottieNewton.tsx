import { memo, useEffect, useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";

// Import Lottie animations
import thinkingAnimation from "./lottie/newton-thinking.json";
import writingAnimation from "./lottie/newton-writing.json";
import completedAnimation from "./lottie/newton-completed.json";
import confusedAnimation from "./lottie/newton-confused.json";
import celebratingAnimation from "./lottie/newton-celebrating.json";
import sleepingAnimation from "./lottie/newton-sleeping.json";

// Expanded Newton states
export type NewtonState = 
  | "idle" 
  | "thinking" 
  | "writing" 
  | "completed"
  | "confused"
  | "celebrating"
  | "sleeping";

interface LottieNewtonProps {
  state: NewtonState;
  size?: "sm" | "md" | "lg";
  className?: string;
  onComplete?: () => void;
}

const sizeClasses = {
  sm: "w-24 h-24 sm:w-28 sm:h-28",
  md: "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48",
  lg: "w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64",
};

const animations: Record<Exclude<NewtonState, "idle">, object> = {
  thinking: thinkingAnimation,
  writing: writingAnimation,
  completed: completedAnimation,
  confused: confusedAnimation,
  celebrating: celebratingAnimation,
  sleeping: sleepingAnimation,
};

// States that should loop vs play once
const loopingStates: NewtonState[] = ["thinking", "writing", "confused", "sleeping"];

/**
 * Lottie-based Newton Animation Component
 * 
 * Uses pure vector Lottie animations for smooth 60fps playback.
 * Supports 6 states: thinking, writing, completed, confused, celebrating, sleeping.
 */
export const LottieNewton = memo(({
  state,
  size = "md",
  className = "",
  onComplete,
}: LottieNewtonProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if ((state === "completed" || state === "celebrating") && lottieRef.current) {
      // For play-once animations, start from beginning
      lottieRef.current.goToAndPlay(0);
    }
  }, [state]);

  if (state === "idle") return null;

  const animationData = animations[state];
  const isLoop = loopingStates.includes(state);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className={`${sizeClasses[size]} ${className}`}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={isLoop}
          autoplay={true}
          onComplete={!isLoop ? onComplete : undefined}
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
