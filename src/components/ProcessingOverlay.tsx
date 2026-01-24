import { memo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import newtonCharacter from "@/assets/newton-character.png";
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
  /** Minimum time before showing overlay - skip for fast responses (default: 300ms) */
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
 * - Skips overlay entirely for responses under skipDelayMs (default 300ms)
 * - Video starts/stops instantly based on visibility
 * - Progress bar is either indeterminate or shows exact backend progress
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
  skipDelayMs = 300,
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

  // Skip overlay for fast responses - only show after skipDelayMs
  useEffect(() => {
    if (isVisible) {
      wasVisibleRef.current = true;
      
      // Delay showing overlay by skipDelayMs
      showTimerRef.current = setTimeout(() => {
        setShouldShow(true);
      }, skipDelayMs);
    } else {
      // Clear timer and check if we should show completion
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      
      // If we were visible and showing, show completion state
      if (wasVisibleRef.current && shouldShow && progress >= 90) {
        setShowCompleted(true);
        const timer = setTimeout(() => {
          setShowCompleted(false);
          setShouldShow(false);
          wasVisibleRef.current = false;
          onCompleted?.();
        }, 600);
        return () => clearTimeout(timer);
      } else {
        // Fast response - just hide immediately
        setShouldShow(false);
        wasVisibleRef.current = false;
        if (progress >= 90) {
          onCompleted?.();
        }
      }
    }
    
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
    };
  }, [isVisible, skipDelayMs, progress, shouldShow, onCompleted]);

  // Instant video start/stop control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldShow && isVisible) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay may be blocked
        });
      }
    } else {
      // INSTANT stop - no waiting for loop to finish
      video.pause();
      video.currentTime = 0;
    }
  }, [shouldShow, isVisible]);

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

  // Don't render if not visible and not showing completed state
  if (!shouldShow && !showCompleted) return null;

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
        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-green-500/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
        >
          <CheckCircle className="w-20 h-20 sm:w-24 sm:h-24 text-green-500" />
        </motion.div>
      </motion.div>

      {/* Complete message */}
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl sm:text-3xl font-semibold text-green-600 dark:text-green-400"
      >
        Complete!
      </motion.p>

      {/* 100% Progress bar */}
      <div className="w-full max-w-md px-6">
        <div className="h-3 bg-green-500 rounded-full overflow-hidden" />
      </div>
    </motion.div>
  );

  const processingContent = (
    <div className="flex flex-col items-center justify-center gap-6 py-4 w-full">
      {/* Newton Video */}
      <div className="relative w-[85vw] max-w-[500px] aspect-square sm:w-[70vw] sm:max-w-[550px] md:max-w-[600px] lg:max-w-[650px]">
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
          {/* Enhanced loading fallback while video loads */}
          <AnimatePresence>
            {!videoLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 z-20"
              >
                {/* Animated Newton character */}
                <motion.div
                  className="relative"
                  animate={{ 
                    y: [0, -8, 0],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  {/* Soft glow behind character */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150"
                    animate={{ 
                      scale: [1.5, 1.8, 1.5],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Newton character image */}
                  <img 
                    src={newtonCharacter} 
                    alt="Newton loading"
                    className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain drop-shadow-xl"
                  />
                  
                  {/* Thinking dots animation */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full bg-primary"
                        animate={{ 
                          y: [0, -8, 0],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{ 
                          duration: 0.8, 
                          repeat: Infinity, 
                          delay: i * 0.15,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
                
                {/* Loading text */}
                <motion.p
                  className="mt-10 text-sm text-muted-foreground font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  Loading Newton...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Video with fade-in when loaded */}
          <motion.video
            ref={videoRef}
            src="/newton-processing.mp4"
            poster="/newton-poster.webp"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
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
        <p className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
          {message}
        </p>
        {subMessage && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
            {subMessage}
          </p>
        )}
      </motion.div>

      {/* Progress bar - Backend driven ONLY */}
      <div className="w-full max-w-md px-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span className="font-medium">Processing...</span>
          {!isIndeterminate && (
            <span className="font-bold text-foreground">{Math.round(progress)}%</span>
          )}
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
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
    </div>
  );

  const content = showCompleted ? completedContent : processingContent;

  // Full-screen overlay variant
  if (variant === "overlay") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md ${className}`}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Card variant (default)
  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card className="border-border/50 shadow-xl overflow-hidden">
          <CardContent className="flex items-center justify-center min-h-[450px] sm:min-h-[550px] md:min-h-[650px] py-8">
            {content}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Inline variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center justify-center py-8 ${className}`}
    >
      {content}
    </motion.div>
  );
});

ProcessingOverlay.displayName = "ProcessingOverlay";

export default ProcessingOverlay;
