import React, { useState, useRef, useCallback } from 'react';
import { Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTouchOverlayProps {
  onLongPressComplete: (text: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function MobileTouchOverlay({
  onLongPressComplete,
  children,
  className,
  disabled = false,
}: MobileTouchOverlayProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const LONG_PRESS_DURATION = 600; // ms
  const PROGRESS_INTERVAL = 20; // ms

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      setIsPressed(true);
      setPressProgress(0);
      setShowHint(true);

      // Progress animation
      let progress = 0;
      intervalRef.current = setInterval(() => {
        progress += (PROGRESS_INTERVAL / LONG_PRESS_DURATION) * 100;
        setPressProgress(Math.min(progress, 100));
      }, PROGRESS_INTERVAL);

      // Long press completion
      timeoutRef.current = setTimeout(() => {
        clearTimers();
        setIsPressed(false);
        setPressProgress(0);
        
        // Get selected text
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim() || '';
        
        if (selectedText) {
          onLongPressComplete(selectedText);
        }
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, LONG_PRESS_DURATION);
    },
    [disabled, onLongPressComplete, clearTimers]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current || !isPressed) return;
      
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = Math.abs(touch.clientY - startPosRef.current.y);
      
      // Cancel if moved more than 15px
      if (dx > 15 || dy > 15) {
        clearTimers();
        setIsPressed(false);
        setPressProgress(0);
        setShowHint(false);
        startPosRef.current = null;
      }
    },
    [isPressed, clearTimers]
  );

  const handleTouchEnd = useCallback(() => {
    clearTimers();
    setIsPressed(false);
    setPressProgress(0);
    startPosRef.current = null;
    
    // Hide hint after a delay
    setTimeout(() => setShowHint(false), 300);
  }, [clearTimers]);

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}

      {/* Long press indicator */}
      {isPressed && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="relative">
            {/* Circular progress */}
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-muted"
                strokeWidth="2"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-primary"
                strokeWidth="2"
                strokeDasharray={`${pressProgress} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Hand className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Selection hint */}
      {showHint && !isPressed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-background/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Select text, then long-press to search
          </p>
        </div>
      )}
    </div>
  );
}
