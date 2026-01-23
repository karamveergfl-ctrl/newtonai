import { memo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";

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
  /** External progress value (0-100) from backend. If provided, overrides simulated progress */
  externalProgress?: number;
}

/**
 * Processing Overlay Component (Video-Based)
 * 
 * Displays a large, fullscreen Newton video during processing.
 * Video loops infinitely until isVisible becomes false.
 * Shows a brief completion state with checkmark before dismissing.
 * 
 * Progress can be controlled externally via externalProgress prop
 * for real backend integration, or will simulate progress automatically.
 */
export const ProcessingOverlay = memo(({
  isVisible,
  message = "Newton is working...",
  subMessage,
  variant = "card",
  className = "",
  onCompleted,
  externalProgress,
}: ProcessingOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const wasVisibleRef = useRef(false);

  // Use external progress if provided, otherwise use simulated
  const progress = externalProgress !== undefined ? externalProgress : simulatedProgress;

  // Instant start/stop video control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      wasVisibleRef.current = true;
      // Reset to start and play immediately
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay may be blocked, but video will still show
        });
      }
    } else {
      // Stop instantly and reset
      video.pause();
      video.currentTime = 0;
    }
  }, [isVisible]);

  // Simulated progress animation (only when externalProgress is not provided)
  useEffect(() => {
    if (externalProgress !== undefined) return; // Skip if using external progress

    if (!isVisible) {
      // When transitioning from visible to hidden, show completion state
      if (wasVisibleRef.current && simulatedProgress >= 30) {
        setSimulatedProgress(100);
        setShowCompleted(true);
        const timer = setTimeout(() => {
          setShowCompleted(false);
          setSimulatedProgress(0);
          wasVisibleRef.current = false;
          onCompleted?.();
        }, 800);
        return () => clearTimeout(timer);
      } else {
        setSimulatedProgress(0);
        wasVisibleRef.current = false;
      }
      return;
    }

    // Progress stages: 0 -> 10% -> 30% -> 60% -> 90%
    const timers = [
      setTimeout(() => setSimulatedProgress(10), 500),
      setTimeout(() => setSimulatedProgress(30), 2000),
      setTimeout(() => setSimulatedProgress(60), 4000),
      setTimeout(() => setSimulatedProgress(90), 6500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isVisible, externalProgress, onCompleted, simulatedProgress]);

  // Handle completion when external progress hits 100
  useEffect(() => {
    if (externalProgress === 100 && !showCompleted) {
      setShowCompleted(true);
      const timer = setTimeout(() => {
        setShowCompleted(false);
        wasVisibleRef.current = false;
        onCompleted?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [externalProgress, showCompleted, onCompleted]);

  // Don't render if not visible and not showing completed state
  if (!isVisible && !showCompleted) return null;

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
      {/* Newton Video - MUCH LARGER to fill screen with prominent rounded corners */}
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

        {/* Video container with prominent rounded corners */}
        <div className="relative w-full h-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-2 border-border/40 shadow-2xl bg-card/50">
          {/* Loading placeholder while video loads */}
          {!videoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-20">
              <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
            </div>
          )}
          
          <video
            ref={videoRef}
            src="/newton-processing.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
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

      {/* Progress bar with percentage - wider and more prominent */}
      <div className="w-full max-w-md px-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span className="font-medium">Processing...</span>
          <span className="font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
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

  // Card variant (default) - with larger min height for bigger video
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
