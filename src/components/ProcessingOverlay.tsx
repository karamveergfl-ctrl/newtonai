import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { NewtonProcessingAnimation, PROCESSING_MESSAGES } from "./NewtonProcessingAnimation";
import type { ProcessingPhase } from "@/hooks/useProcessingState";

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
}

/**
 * Processing Overlay Component
 * 
 * Provides a reusable loading/processing UI with the Newton animation.
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
}: ProcessingOverlayProps) => {
  const [internalPhase, setInternalPhase] = useState<ProcessingPhase>(phase);

  // Sync internal phase with prop
  useEffect(() => {
    setInternalPhase(phase);
  }, [phase]);

  // Get default messages for the phase
  const defaultMessages = PROCESSING_MESSAGES[internalPhase];
  const displayMessage = message || defaultMessages.message;
  const displaySubMessage = subMessage || defaultMessages.subMessage;

  if (!isVisible && internalPhase === "idle") return null;

  const content = (
    <NewtonProcessingAnimation
      state={internalPhase}
      message={displayMessage}
      subMessage={displaySubMessage}
      progress={progress}
      showProgress={showProgress}
      size={size}
      onCompleteAnimationEnd={onCompleteEnd}
    />
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
