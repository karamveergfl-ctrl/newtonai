import { useState, useEffect } from "react";

/**
 * Defers rendering of non-critical components until the browser is idle,
 * reducing main-thread blocking and improving First Input Delay (FID).
 */
export function useDeferredLoad(delayMs = 2000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(() => setReady(true), {
        timeout: delayMs,
      });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setReady(true), delayMs);
      return () => clearTimeout(id);
    }
  }, [delayMs]);

  return ready;
}
