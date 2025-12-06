import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  threshold?: number;
  onStart?: () => void;
  onCancel?: () => void;
}

export function useLongPress(
  callback: () => void,
  options: UseLongPressOptions = {}
) {
  const { threshold = 500, onStart, onCancel } = options;
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const start = useCallback(
    (x: number, y: number) => {
      clear();
      startPosRef.current = { x, y };
      setIsPressed(true);
      onStart?.();

      timeoutRef.current = setTimeout(() => {
        callback();
        setIsPressed(false);
        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, threshold);
    },
    [callback, threshold, onStart, clear]
  );

  const cancel = useCallback(() => {
    clear();
    setIsPressed(false);
    startPosRef.current = null;
    onCancel?.();
  }, [clear, onCancel]);

  const handleMove = useCallback(
    (x: number, y: number) => {
      if (startPosRef.current && isPressed) {
        const dx = Math.abs(x - startPosRef.current.x);
        const dy = Math.abs(y - startPosRef.current.y);
        // Cancel if moved more than 10px
        if (dx > 10 || dy > 10) {
          cancel();
        }
      }
    },
    [isPressed, cancel]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      start(touch.clientX, touch.clientY);
    },
    [start]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );

  const onTouchEnd = useCallback(() => {
    cancel();
  }, [cancel]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      start(e.clientX, e.clientY);
    },
    [start]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const onMouseUp = useCallback(() => {
    cancel();
  }, [cancel]);

  const onMouseLeave = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    isPressed,
  };
}
