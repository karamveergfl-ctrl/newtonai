import { memo, useEffect, useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProcessingPhase } from "@/hooks/useProcessingState";

// Import Lottie animations
import thinkingAnimation from "./lottie/newton-thinking.json";
import writingAnimation from "./lottie/newton-writing.json";
import completedAnimation from "./lottie/newton-completed.json";

interface LottieNewtonProps {
  state: ProcessingPhase;
  size?: "sm" | "md" | "lg";
  className?: string;
  onComplete?: () => void;
}

const sizeClasses = {
  sm: "w-24 h-24 sm:w-28 sm:h-28",
  md: "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48",
  lg: "w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64",
};

const animations = {
  thinking: thinkingAnimation,
  writing: writingAnimation,
  completed: completedAnimation,
};

/**
 * Lottie-based Newton Animation Component
 * 
 * Uses pure vector Lottie animations for smooth 60fps playback.
 * Each animation has separate layers for Head, Eyes, Mouth, Arms, etc.
 */
export const LottieNewton = memo(({
  state,
  size = "md",
  className = "",
  onComplete,
}: LottieNewtonProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (state === "completed" && lottieRef.current) {
      // For completed, play once then trigger callback
      lottieRef.current.goToAndPlay(0);
    }
  }, [state]);

  if (state === "idle") return null;

  const animationData = animations[state];
  const isLoop = state !== "completed";

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
          onComplete={state === "completed" ? onComplete : undefined}
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
