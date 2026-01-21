import { useState, useEffect, useRef } from "react";
import type { ProcessingPhase } from "./useProcessingState";

interface UseSimulatedProgressOptions {
  /** Speed multiplier (default: 1) */
  speed?: number;
}

/**
 * Hook to simulate smooth progress animation during processing phases
 * - thinking: 0% → 30%
 * - writing: 30% → 90%
 * - completed: jumps to 100%
 */
export const useSimulatedProgress = (
  phase: ProcessingPhase,
  options: UseSimulatedProgressOptions = {}
) => {
  const { speed = 1 } = options;
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (phase === "idle") {
      setProgress(0);
      return;
    }

    if (phase === "completed") {
      setProgress(100);
      return;
    }

    // Define phase ranges
    const ranges = {
      thinking: { start: 0, end: 30, duration: 5000 },
      writing: { start: 30, end: 90, duration: 8000 },
    };

    const config = ranges[phase as keyof typeof ranges];
    if (!config) return;

    // Adjust for current progress (if switching phases mid-way)
    const currentProgress = Math.max(progress, config.start);
    startTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startTimeRef.current) * speed;
      const normalizedProgress = Math.min(elapsed / config.duration, 1);
      
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - normalizedProgress, 3);
      
      const newProgress = currentProgress + (config.end - currentProgress) * eased;
      setProgress(Math.min(newProgress, config.end));

      if (normalizedProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, speed]);

  return { progress };
};

export default useSimulatedProgress;
