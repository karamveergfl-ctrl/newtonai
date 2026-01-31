import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to track scroll progress as a percentage of page height
 * @param threshold - The percentage threshold to trigger (default: 50)
 * @returns Object with scrollPercent and hasReachedThreshold
 */
export function useScrollProgress(threshold: number = 50) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // Avoid division by zero for short pages
    if (docHeight <= 0) {
      setScrollPercent(100);
      setHasReachedThreshold(true);
      return;
    }

    const percent = (scrollTop / docHeight) * 100;
    setScrollPercent(percent);

    if (percent >= threshold && !hasReachedThreshold) {
      setHasReachedThreshold(true);
    }
  }, [threshold, hasReachedThreshold]);

  useEffect(() => {
    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { scrollPercent, hasReachedThreshold };
}

export default useScrollProgress;
