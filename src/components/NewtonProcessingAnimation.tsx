import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Pencil, ThumbsUp, Sparkles } from "lucide-react";
import type { ProcessingPhase } from "@/hooks/useProcessingState";

interface NewtonProcessingAnimationProps {
  /** Current animation state */
  state: ProcessingPhase;
  /** Primary message to display */
  message?: string;
  /** Secondary/sub message */
  subMessage?: string;
  /** Progress value (0-100) for optional progress bar */
  progress?: number;
  /** Show progress bar */
  showProgress?: boolean;
  /** Callback when completed animation finishes playing */
  onCompleteAnimationEnd?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

const sizeClasses = {
  sm: "w-20 h-20 sm:w-24 sm:h-24",
  md: "w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40",
  lg: "w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52",
};

const iconSizes = {
  sm: "w-10 h-10 sm:w-12 sm:h-12",
  md: "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20",
  lg: "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28",
};

// Animated icon components for each state
const ThinkingAnimation = memo(({ iconSize }: { iconSize: string }) => (
  <motion.div
    className="relative flex items-center justify-center"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3 }}
  >
    {/* Rotating ring */}
    <motion.div
      className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Pulsing background */}
    <motion.div
      className="absolute inset-2 rounded-full bg-primary/10"
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Brain icon with thinking animation */}
    <motion.div
      animate={{ 
        rotate: [0, 5, -5, 0],
        y: [0, -2, 0]
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <Brain className={`${iconSize} text-primary drop-shadow-lg`} />
    </motion.div>
    
    {/* Floating thought bubbles */}
    <motion.div
      className="absolute -top-1 -right-1"
      animate={{ 
        y: [0, -8, 0], 
        opacity: [0.5, 1, 0.5],
        scale: [0.8, 1, 0.8]
      }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
    >
      <Sparkles className="w-4 h-4 text-amber-500" />
    </motion.div>
    <motion.div
      className="absolute -top-2 right-4"
      animate={{ 
        y: [0, -6, 0], 
        opacity: [0.3, 0.8, 0.3],
        scale: [0.6, 0.9, 0.6]
      }}
      transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
    >
      <Sparkles className="w-3 h-3 text-primary" />
    </motion.div>
  </motion.div>
));

ThinkingAnimation.displayName = "ThinkingAnimation";

const WritingAnimation = memo(({ iconSize }: { iconSize: string }) => (
  <motion.div
    className="relative flex items-center justify-center"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3 }}
  >
    {/* Paper/document background effect */}
    <motion.div
      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-lg"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
    />
    
    {/* Writing lines effect */}
    <motion.div className="absolute inset-4 flex flex-col justify-center gap-1.5 opacity-30">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-0.5 bg-primary rounded-full"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: [0, 1, 1, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            times: [0, 0.4, 0.6, 1],
          }}
        />
      ))}
    </motion.div>
    
    {/* Pencil icon with writing motion */}
    <motion.div
      animate={{ 
        x: [0, 3, -3, 3, 0],
        y: [0, 2, 0, 2, 0],
        rotate: [0, 2, -2, 2, 0]
      }}
      transition={{ 
        duration: 0.6, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <Pencil className={`${iconSize} text-primary drop-shadow-lg`} />
    </motion.div>
    
    {/* Flying sparkles/particles */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ 
          left: `${20 + i * 25}%`, 
          bottom: "30%" 
        }}
        animate={{ 
          y: [-10, -30],
          x: [0, (i - 1) * 15],
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          delay: i * 0.2 
        }}
      >
        <Sparkles className="w-3 h-3 text-amber-500" />
      </motion.div>
    ))}
  </motion.div>
));

WritingAnimation.displayName = "WritingAnimation";

const CompletedAnimation = memo(({ 
  iconSize, 
  onAnimationEnd 
}: { 
  iconSize: string;
  onAnimationEnd?: () => void;
}) => (
  <motion.div
    className="relative flex items-center justify-center"
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ 
      type: "spring", 
      stiffness: 300, 
      damping: 15 
    }}
    onAnimationComplete={onAnimationEnd}
  >
    {/* Success ring burst */}
    <motion.div
      className="absolute inset-0 rounded-full border-4 border-green-500"
      initial={{ scale: 0.8, opacity: 1 }}
      animate={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 0.6 }}
    />
    
    {/* Background glow */}
    <motion.div
      className="absolute inset-0 rounded-full bg-green-500/20"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1 }}
    />
    
    {/* Thumbs up icon */}
    <motion.div
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 10,
        delay: 0.1
      }}
    >
      <ThumbsUp className={`${iconSize} text-green-500 drop-shadow-lg`} />
    </motion.div>
    
    {/* Celebration sparkles */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        className="absolute"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
          x: [0, Math.cos((i / 6) * Math.PI * 2) * 40],
          y: [0, Math.sin((i / 6) * Math.PI * 2) * 40],
        }}
        transition={{ 
          duration: 0.8, 
          delay: 0.2 + i * 0.05 
        }}
      >
        <Sparkles className="w-4 h-4 text-amber-500" />
      </motion.div>
    ))}
  </motion.div>
));

CompletedAnimation.displayName = "CompletedAnimation";

/**
 * Newton Processing Animation Component
 * 
 * Displays animated states for processing tasks:
 * - thinking: Brain with rotating ring and thought bubbles
 * - writing: Pencil with writing motion and particle effects
 * - completed: Thumbs up with celebration burst
 */
export const NewtonProcessingAnimation = memo(({
  state,
  message,
  subMessage,
  progress,
  showProgress = false,
  onCompleteAnimationEnd,
  size = "md",
  className = "",
}: NewtonProcessingAnimationProps) => {
  const [hasCompletedPlayed, setHasCompletedPlayed] = useState(false);

  // Reset completed state when state changes from completed
  useEffect(() => {
    if (state !== "completed") {
      setHasCompletedPlayed(false);
    }
  }, [state]);

  const handleCompleteEnd = () => {
    if (!hasCompletedPlayed) {
      setHasCompletedPlayed(true);
      onCompleteAnimationEnd?.();
    }
  };

  if (state === "idle") return null;

  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Animation container */}
      <div className={`relative ${sizeClass}`}>
        <AnimatePresence mode="wait">
          {state === "thinking" && (
            <ThinkingAnimation key="thinking" iconSize={iconSize} />
          )}
          {state === "writing" && (
            <WritingAnimation key="writing" iconSize={iconSize} />
          )}
          {state === "completed" && (
            <CompletedAnimation 
              key="completed" 
              iconSize={iconSize} 
              onAnimationEnd={handleCompleteEnd}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Message text */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
});

NewtonProcessingAnimation.displayName = "NewtonProcessingAnimation";

// State-specific messages for convenience
export const PROCESSING_MESSAGES: Record<ProcessingPhase, { message: string; subMessage?: string }> = {
  idle: { message: "" },
  thinking: { message: "Analyzing your content...", subMessage: "This may take a moment" },
  writing: { message: "Generating results...", subMessage: "Almost there" },
  completed: { message: "Done!", subMessage: "Here are your results" },
};

export default NewtonProcessingAnimation;
