import { useScrollContext } from "@/contexts/ScrollContext";

/**
 * Hook to detect scroll progress and trigger actions at thresholds.
 * Used for user-initiated ad loading (50% scroll trigger).
 */
export function useScrollProgress(threshold: number = 50) {
  const { scrollPercent } = useScrollContext();
  
  return {
    scrollPercent,
    hasReachedThreshold: scrollPercent >= threshold
  };
}
