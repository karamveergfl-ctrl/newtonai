import { memo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
}

/**
 * Processing Overlay Component (Video-Based)
 * 
 * Displays a looping Newton video during processing.
 * Video loops infinitely until isVisible becomes false.
 * No fake progress - duration matches real backend time.
 */
export const ProcessingOverlay = memo(({
  isVisible,
  message = "Newton is working...",
  subMessage,
  variant = "card",
  className = "",
}: ProcessingOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Instant start/stop video control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
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

  if (!isVisible) return null;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      {/* Newton Video - loops until processing completes */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden">
        {/* Glow effect behind video */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Loading placeholder while video loads */}
        {!videoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-2xl z-20">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
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
          className="relative z-10 w-full h-full object-contain rounded-2xl"
        />
      </div>

      {/* Message text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-base sm:text-lg font-medium text-foreground">
          {message}
        </p>
        {subMessage && (
          <p className="text-sm text-muted-foreground mt-1">
            {subMessage}
          </p>
        )}
      </motion.div>

      {/* Indeterminate progress bar - shimmer animation */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full w-1/3 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
            animate={{
              x: ["-100%", "400%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );

  // Full-screen overlay variant
  if (variant === "overlay") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${className}`}
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
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardContent className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] py-8">
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
