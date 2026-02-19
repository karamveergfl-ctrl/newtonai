import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { ProcessingPhase } from "@/hooks/useProcessingState";
import { useNewtonPoses } from "@/hooks/useNewtonPoses";
import newtonCharacter from "@/assets/newton-character.webp";

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
  sm: "w-24 h-24 sm:w-28 sm:h-28",
  md: "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48",
  lg: "w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64",
};

// Easy Ease equivalent
const EASY_EASE: [number, number, number, number] = [0.42, 0, 0.58, 1];

// Thinking Animation - Newton with smooth head bob and glowing aura
const ThinkingAnimation = memo(({ sizeClass, poseImage }: { sizeClass: string; poseImage: string }) => (
  <motion.div
    className={`relative ${sizeClass} flex items-center justify-center`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {/* Glowing aura behind Newton */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-radial from-primary/30 via-primary/10 to-transparent"
      animate={{ 
        scale: [1, 1.15, 1],
        opacity: [0.4, 0.7, 0.4]
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Newton character with smooth head bob */}
    <motion.div
      className="relative z-10"
      animate={{ 
        y: [0, -6, 0, 3, 0],
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: EASY_EASE,
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
    >
      <img 
        src={poseImage} 
        alt="Newton thinking"
        className="w-full h-full object-contain drop-shadow-xl"
        draggable={false}
      />
    </motion.div>
  </motion.div>
));

ThinkingAnimation.displayName = "ThinkingAnimation";

// Writing Animation - Newton with subtle movement and glowing effect
const WritingAnimation = memo(({ sizeClass, poseImage }: { sizeClass: string; poseImage: string }) => (
  <motion.div
    className={`relative ${sizeClass} flex items-center justify-center`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {/* Active working glow */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-radial from-secondary/30 via-secondary/10 to-transparent"
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Newton character with subtle movement */}
    <motion.div
      className="relative z-10"
      animate={{ 
        y: [0, -4, 0, 2, 0],
        rotate: [0, 0.5, 0, -0.5, 0]
      }}
      transition={{ 
        duration: 1.8,
        repeat: Infinity,
        ease: EASY_EASE,
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
    >
      <img 
        src={poseImage} 
        alt="Newton writing"
        className="w-full h-full object-contain drop-shadow-xl"
        draggable={false}
      />
    </motion.div>
  </motion.div>
));

WritingAnimation.displayName = "WritingAnimation";

// Completed Animation - Newton with success effects
const CompletedAnimation = memo(({ 
  sizeClass,
  poseImage,
  onAnimationEnd 
}: { 
  sizeClass: string;
  poseImage: string;
  onAnimationEnd?: () => void;
}) => (
  <motion.div
    className={`relative ${sizeClass} flex items-center justify-center`}
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ 
      type: "spring",
      stiffness: 300,
      damping: 15
    }}
    onAnimationComplete={onAnimationEnd}
  >
    {/* Success burst ring */}
    <motion.div
      className="absolute inset-0 rounded-full border-4 border-green-500/50"
      initial={{ scale: 0.8, opacity: 1 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
    
    {/* Secondary ring */}
    <motion.div
      className="absolute inset-0 rounded-full border-2 border-primary/40"
      initial={{ scale: 0.9, opacity: 1 }}
      animate={{ scale: 1.8, opacity: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
    />
    
    {/* Success glow background */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-radial from-green-400/30 via-green-300/10 to-transparent"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1.2, opacity: 1 }}
      transition={{ duration: 0.4 }}
    />
    
    {/* Newton character with bounce */}
    <motion.div
      className="relative z-10"
      initial={{ scale: 0.3, y: 30 }}
      animate={{ 
        scale: 1,
        y: [0, -15, 0]
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 400, damping: 12 },
        y: { duration: 0.5, delay: 0.2 }
      }}
    >
      <img 
        src={poseImage} 
        alt="Newton completed"
        className="w-full h-full object-contain drop-shadow-2xl"
        draggable={false}
      />
      
      {/* Success checkmark badge */}
      <motion.div
        className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 10,
          delay: 0.3
        }}
      >
        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={3} />
      </motion.div>
    </motion.div>
    
    {/* Confetti-like particles */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={`confetti-${i}`}
        className="absolute left-1/2 top-1/2 z-30"
        initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 1, 0.5],
          x: (Math.random() - 0.5) * 100,
          y: [0, -40 - Math.random() * 30, 20],
          rotate: Math.random() * 360,
          opacity: [0, 1, 0]
        }}
        transition={{ 
          duration: 1,
          delay: 0.3 + i * 0.08,
          ease: "easeOut"
        }}
      >
        <div 
          className={`w-2 h-2 rounded-sm ${
            ['bg-primary', 'bg-amber-400', 'bg-green-400', 'bg-pink-400', 'bg-blue-400', 'bg-purple-400'][i]
          }`}
        />
      </motion.div>
    ))}
  </motion.div>
));

CompletedAnimation.displayName = "CompletedAnimation";

/**
 * Newton Processing Animation Component
 * 
 * Displays the Newton character with animated states for processing tasks:
 * - thinking: Gentle bobbing with glowing aura
 * - writing: Active movement with working glow
 * - completed: Celebratory bounce with success burst
 */
export const NewtonProcessingAnimation = memo(({
  state,
  message,
  subMessage,
  progress,
  showProgress = true,
  onCompleteAnimationEnd,
  size = "md",
  className = "",
}: NewtonProcessingAnimationProps) => {
  const [hasCompletedPlayed, setHasCompletedPlayed] = useState(false);

  // Pose images hook - uses AI-generated poses with fallback to default
  const { getPoseImage } = useNewtonPoses({
    enabled: true,
    fallbackImage: newtonCharacter
  });

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
  const currentPoseImage = getPoseImage(state);

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Animation container */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {state === "thinking" && (
            <ThinkingAnimation key="thinking" sizeClass={sizeClass} poseImage={currentPoseImage} />
          )}
          {state === "writing" && (
            <WritingAnimation key="writing" sizeClass={sizeClass} poseImage={currentPoseImage} />
          )}
          {state === "completed" && (
            <CompletedAnimation 
              key="completed" 
              sizeClass={sizeClass}
              poseImage={currentPoseImage}
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
            transition={{ duration: 0.3 }}
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

      {/* Progress bar */}
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
  thinking: { message: "Newton is thinking...", subMessage: "Analyzing your content" },
  writing: { message: "Writing your results...", subMessage: "Almost there" },
  completed: { message: "All done!", subMessage: "Here are your results" },
  processing: { message: "Newton is working...", subMessage: "Please wait" },
};

export default NewtonProcessingAnimation;
