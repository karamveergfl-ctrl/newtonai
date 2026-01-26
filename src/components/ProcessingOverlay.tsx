import { memo, useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

interface ProcessingOverlayProps {
  /** Whether to show the overlay */
  isVisible: boolean;
  /** Message to display */
  message?: string;
  /** Sub-message for additional context */
  subMessage?: string;
  /** Whether to use full-screen overlay, card, or inline */
  variant?: "overlay" | "card" | "inline";
  /** Additional className */
  className?: string;
  /** Called after the completion animation finishes */
  onCompleted?: () => void;
  /** Backend-driven progress value (0-100). This is the ONLY source of progress. */
  progress?: number;
  /** When true, show indeterminate/pulsing progress bar */
  isIndeterminate?: boolean;
  /** Minimum time before showing overlay - skip for fast responses (default: 0 for instant) */
  skipDelayMs?: number;
  /** Whether the cancel button should be shown */
  canCancel?: boolean;
  /** Called when user clicks cancel button */
  onCancel?: () => void;
}

/**
 * Processing Overlay Component (Video-Based, Backend-Driven)
 * 
 * Displays a large Newton video during processing.
 * Video loops until isVisible becomes false.
 * Progress is ONLY driven by backend - no fake timers.
 * 
 * Key behaviors:
 * - Video is ALWAYS mounted for instant display (no decode delay)
 * - Visibility is controlled via CSS, not conditional rendering
 * - Video starts playing IMMEDIATELY when isVisible becomes true
 * - No simulated progress - backend is single source of truth
 */
export const ProcessingOverlay = memo(({
  isVisible,
  message = "Newton is working...",
  subMessage,
  variant = "card",
  className = "",
  onCompleted,
  progress = 0,
  isIndeterminate = true,
  skipDelayMs = 0, // Changed default to 0 for instant display
  canCancel = false,
  onCancel,
}: ProcessingOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasVisibleRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  // Minimum display time to prevent flash for ultra-fast responses
  const MIN_SHOW_MS = 120;

  // Force video play immediately when visible
  const forceVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay may be blocked, but video is still ready
      });
    }
  }, []);

  // Handle visibility changes - INSTANT response
  useEffect(() => {
    if (isVisible) {
      wasVisibleRef.current = true;
      startTimeRef.current = Date.now();
      
      // Force video play IMMEDIATELY
      forceVideoPlay();
      
      if (skipDelayMs > 0) {
        // Delay showing overlay by skipDelayMs (if needed)
        showTimerRef.current = setTimeout(() => {
          setShouldShow(true);
        }, skipDelayMs);
      } else {
        // INSTANT - show immediately (default behavior)
        setShouldShow(true);
      }
    } else {
      // Clear any pending timer
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      
      const elapsed = Date.now() - startTimeRef.current;
      
      // If we were visible and showing, show completion state
      if (wasVisibleRef.current && shouldShow && progress >= 90) {
        // Only show completion if we displayed for long enough
        if (elapsed >= MIN_SHOW_MS) {
          setShowCompleted(true);
          const timer = setTimeout(() => {
            setShowCompleted(false);
            setShouldShow(false);
            wasVisibleRef.current = false;
            onCompleted?.();
          }, 600);
          return () => clearTimeout(timer);
        } else {
          // Ultra-fast response - skip completion animation
          setShouldShow(false);
          wasVisibleRef.current = false;
          onCompleted?.();
        }
      } else {
        // Fast response - just hide immediately
        setShouldShow(false);
        wasVisibleRef.current = false;
        if (progress >= 90) {
          onCompleted?.();
        }
      }
      
      // Stop video
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
    
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
    };
  }, [isVisible, skipDelayMs, progress, shouldShow, onCompleted, forceVideoPlay]);

  // Show cancel button after 1.5 seconds of processing
  useEffect(() => {
    if (!shouldShow || !canCancel) {
      setShowCancelButton(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowCancelButton(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [shouldShow, canCancel]);

  // Handle video loaded state
  const handleVideoLoaded = useCallback(() => {
    setVideoLoaded(true);
  }, []);

  const completedContent = (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-6 py-8"
    >
      {/* Success Circle with Checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
        >
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500" />
        </motion.div>
      </motion.div>

      {/* Complete message */}
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg sm:text-xl font-semibold text-green-600 dark:text-green-400"
      >
        Complete!
      </motion.p>

      {/* 100% Progress bar */}
      <div className="w-full max-w-xs px-4">
        <div className="h-2 bg-green-500 rounded-full overflow-hidden" />
      </div>
    </motion.div>
  );

  const processingContent = (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-4 py-4 w-full"
    >
      {/* Newton Video */}
      <div className="relative w-[50vw] max-w-[280px] aspect-square sm:w-[45vw] sm:max-w-[300px] md:max-w-[320px] lg:max-w-[350px]">
        {/* Glow effect behind video */}
        <motion.div
          className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-2xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Video container */}
        <div className="relative w-full h-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-2 border-border/40 shadow-2xl bg-card/50">
          {/* Poster-based loading fallback - matches video starting frame */}
          <AnimatePresence>
            {!videoLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]"
              >
                {/* Poster image with subtle breathing animation */}
                <motion.div
                  className="relative w-full h-full"
                  animate={{ 
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  {/* Soft glow overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-radial from-primary/15 via-transparent to-transparent z-10 pointer-events-none"
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Poster image - same as video poster for seamless transition */}
                  <img 
                    src="/newton-poster.webp" 
                    alt="Newton loading"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                
                {/* Loading text overlay at bottom */}
                <motion.div
                  className="absolute bottom-4 left-0 right-0 flex justify-center"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium text-muted-foreground shadow-lg">
                    Loading Newton...
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Video - ALWAYS MOUNTED, visibility controlled via CSS */}
          <motion.video
            ref={videoRef}
            src="/newton-processing.mp4"
            poster="/newton-poster.webp"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={handleVideoLoaded}
            initial={{ opacity: 0 }}
            animate={{ opacity: videoLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full h-full object-cover rounded-[2rem] sm:rounded-[2.5rem]"
          />
        </div>
      </div>

      {/* Message text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4"
      >
        <p className="text-base sm:text-lg font-semibold text-foreground">
          {message}
        </p>
        {subMessage && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {subMessage}
          </p>
        )}
      </motion.div>

      {/* Progress bar - Backend driven ONLY */}
      <div className="w-full max-w-xs px-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span className="font-medium">Processing...</span>
          {!isIndeterminate && (
            <span className="font-bold text-foreground">{Math.round(progress)}%</span>
          )}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
          {isIndeterminate ? (
            // Indeterminate: Animated shimmer sliding back and forth
            <motion.div
              className="h-full w-1/3 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            // Determinate: Exact progress from backend
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          )}
        </div>
      </div>

      {/* Cancel button - appears after 1.5 seconds */}
      <AnimatePresence>
        {showCancelButton && canCancel && onCancel && !showCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const content = showCompleted ? completedContent : processingContent;

  // Determine if we should render the overlay
  const isActive = shouldShow || showCompleted;

  // Full-screen overlay variant - ALWAYS MOUNTED, toggle visibility
  if (variant === "overlay") {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-200 ${className}`}
        style={{
          visibility: isActive ? "visible" : "hidden",
          opacity: isActive ? 1 : 0,
          pointerEvents: isActive ? "auto" : "none",
        }}
        aria-hidden={!isActive}
      >
        <AnimatePresence>
          {isActive && content}
        </AnimatePresence>
      </div>
    );
  }

  // Card variant (default) - ALWAYS MOUNTED, toggle visibility
  if (variant === "card") {
    return (
      <div
        className={`transition-all duration-200 ${className}`}
        style={{
          visibility: isActive ? "visible" : "hidden",
          opacity: isActive ? 1 : 0,
          height: isActive ? "auto" : 0,
          overflow: "hidden",
        }}
        aria-hidden={!isActive}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border/50 shadow-xl overflow-hidden">
            <CardContent className="flex items-center justify-center min-h-[320px] sm:min-h-[380px] md:min-h-[420px] py-6">
              {content}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Inline variant - ALWAYS MOUNTED, toggle visibility
  return (
    <div
      className={`flex items-center justify-center py-8 transition-all duration-200 ${className}`}
      style={{
        visibility: isActive ? "visible" : "hidden",
        opacity: isActive ? 1 : 0,
        height: isActive ? "auto" : 0,
      }}
      aria-hidden={!isActive}
    >
      <AnimatePresence>
        {isActive && content}
      </AnimatePresence>
    </div>
  );
});

ProcessingOverlay.displayName = "ProcessingOverlay";

export default ProcessingOverlay;
