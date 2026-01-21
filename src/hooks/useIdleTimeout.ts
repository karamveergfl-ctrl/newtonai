import { useState, useEffect, useCallback, useRef } from "react";

interface UseIdleTimeoutOptions {
  timeout?: number; // milliseconds, default 5 minutes
  onIdle?: () => void;
  onActive?: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  timeout = 300000, // 5 minutes default
  onIdle,
  onActive,
  enabled = true,
}: UseIdleTimeoutOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasIdleRef = useRef(false);

  const resetIdle = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If was idle, trigger onActive callback
    if (wasIdleRef.current) {
      wasIdleRef.current = false;
      setIsIdle(false);
      onActive?.();
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      wasIdleRef.current = true;
      setIsIdle(true);
      onIdle?.();
    }, timeout);
  }, [timeout, onIdle, onActive, enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsIdle(false);
      return;
    }

    // Events to track for activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle the reset to prevent excessive calls
    let lastReset = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 1000) { // Throttle to once per second
        lastReset = now;
        resetIdle();
      }
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Initialize timeout
    resetIdle();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledReset);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetIdle, enabled]);

  return { isIdle, resetIdle };
}
