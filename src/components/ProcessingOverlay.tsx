import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { LottieNewton } from "@/components/newton/LottieNewton";
import { useNewtonSounds } from "@/hooks/useNewtonSounds";
import type { ProcessingPhase } from "@/hooks/useProcessingState";

// State-specific messages
export const PROCESSING_MESSAGES: Record<ProcessingPhase, { message: string; subMessage?: string }> = {
  idle: { message: "" },
  thinking: { message: "Newton is thinking...", subMessage: "Analyzing your content" },
  writing: { message: "Writing your results...", subMessage: "Almost there" },
  completed: { message: "All done!", subMessage: "Here are your results" },
};

interface ProcessingOverlayProps {
  /** Whether to show the overlay */
  isVisible: boolean;
  /** Current processing phase */
  phase?: ProcessingPhase;
  /** Custom message to display (overrides default) */
  message?: string;
  /** Sub-message for additional context */
  subMessage?: string;
  /** Progress value (0-100) */
  progress?: number;
  /** Show progress bar */
  showProgress?: boolean;
  /** Size of the animation */
  size?: "sm" | "md" | "lg";
  /** Whether to use full-screen overlay or inline card */
  variant?: "overlay" | "card" | "inline";
  /** Callback when completed animation ends */
  onCompleteEnd?: () => void;
  /** Additional className */
  className?: string;
  /** Enable sound effects (default: true) */
  enableSounds?: boolean;
  /** Sound volume multiplier 0-1 (default: 1) */
  soundVolume?: number;
}

/**
 * Processing Overlay Component
 * 
 * Provides a reusable loading/processing UI with smooth Lottie animations.
 * Can be used as a full-screen overlay, card, or inline element.
 */
export const ProcessingOverlay = memo(({
  isVisible,
  phase = "thinking",
  message,
  subMessage,
  progress,
  showProgress = false,
  size = "md",
  variant = "card",
  onCompleteEnd,
  className = "",
  enableSounds = true,
  soundVolume = 1,
}: ProcessingOverlayProps) => {
  const [internalPhase, setInternalPhase] = useState<ProcessingPhase>(phase);

  // Sound effects hook
  const {
    crossfadeTo,
    playCompletedSound,
    stopAllSounds,
    isMuted,
    toggleMute,
    isLoading: isSoundLoading,
  } = useNewtonSounds({
    enabled: enableSounds,
    volume: soundVolume,
  });

  // Sync internal phase with prop
  useEffect(() => {
    setInternalPhase(phase);
  }, [phase]);

  // Handle sound transitions based on state
  useEffect(() => {
    if (!enableSounds) return;

    if (internalPhase === "thinking") {
      crossfadeTo("thinking");
    } else if (internalPhase === "writing") {
      crossfadeTo("writing");
    } else if (internalPhase === "completed") {
      playCompletedSound();
    } else if (internalPhase === "idle") {
      stopAllSounds();
    }
  }, [internalPhase, enableSounds, crossfadeTo, playCompletedSound, stopAllSounds]);

  // Get default messages for the phase
  const defaultMessages = PROCESSING_MESSAGES[internalPhase];
  const displayMessage = message || defaultMessages.message;
  const displaySubMessage = subMessage || defaultMessages.subMessage;

  if (!isVisible && internalPhase === "idle") return null;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Lottie Animation with sound control */}
      <div className="relative">
        <LottieNewton
          state={internalPhase}
          size={size}
          onComplete={onCompleteEnd}
        />

        {/* Sound control button */}
        {enableSounds && internalPhase !== "completed" && internalPhase !== "idle" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background transition-colors z-20"
            aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isSoundLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            ) : isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-primary" />
            )}
          </motion.button>
        )}
      </div>

      {/* Message text */}
      <AnimatePresence mode="wait">
        {displayMessage && (
          <motion.div
            key={displayMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-base sm:text-lg font-medium text-foreground">
              {displayMessage}
            </p>
            {displaySubMessage && (
              <p className="text-sm text-muted-foreground mt-1">
                {displaySubMessage}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional progress bar */}
      {showProgress && typeof progress === "number" && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          className="w-full max-w-xs"
        >
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            {Math.round(progress)}%
          </p>
        </motion.div>
      )}
    </div>
  );

  // Full-screen overlay variant
  if (variant === "overlay") {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${className}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Card variant (default)
  if (variant === "card") {
    return (
      <AnimatePresence>
        {isVisible && (
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
        )}
      </AnimatePresence>
    );
  }

  // Inline variant
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center justify-center py-8 ${className}`}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ProcessingOverlay.displayName = "ProcessingOverlay";

export default ProcessingOverlay;
