import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Volume2, VolumeX, Loader2 } from "lucide-react";
import type { ProcessingPhase } from "@/hooks/useProcessingState";
import { useNewtonSounds } from "@/hooks/useNewtonSounds";
import { useNewtonPoses } from "@/hooks/useNewtonPoses";
import newtonCharacter from "@/assets/newton-character.png";

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
  /** Enable sound effects (default: true) */
  enableSounds?: boolean;
  /** Sound volume multiplier 0-1 (default: 1) */
  soundVolume?: number;
}

const sizeClasses = {
  sm: "w-24 h-24 sm:w-28 sm:h-28",
  md: "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48",
  lg: "w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64",
};

// Thinking Animation - Newton with pulsing lightbulb and gentle bob
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
      className="absolute inset-0 rounded-full bg-gradient-radial from-amber-200/40 via-amber-100/20 to-transparent dark:from-amber-500/20 dark:via-amber-400/10"
      animate={{ 
        scale: [1, 1.15, 1],
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Newton character with gentle bobbing */}
    <motion.div
      className="relative z-10"
      animate={{ 
        y: [0, -8, 0],
        rotate: [0, 2, 0, -2, 0]
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <img 
        src={poseImage} 
        alt="Newton thinking"
        className="w-full h-full object-contain drop-shadow-xl"
        draggable={false}
      />
    </motion.div>
    
    {/* Animated lightbulb glow effect */}
    <motion.div
      className="absolute top-0 right-2 sm:right-4"
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 blur-sm" />
    </motion.div>
    
    {/* Floating thought sparkles */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ 
          top: `${10 + i * 15}%`,
          right: `${5 + i * 8}%`
        }}
        animate={{ 
          y: [0, -12, 0],
          x: [0, 5, 0],
          opacity: [0.4, 1, 0.4],
          scale: [0.8, 1.1, 0.8]
        }}
        transition={{ 
          duration: 2 + i * 0.3,
          repeat: Infinity,
          delay: i * 0.4,
          ease: "easeInOut"
        }}
      >
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 drop-shadow-lg" />
      </motion.div>
    ))}
  </motion.div>
));

ThinkingAnimation.displayName = "ThinkingAnimation";

// Writing Animation - Newton with active pencil motion
const WritingAnimation = memo(({ sizeClass, poseImage }: { sizeClass: string; poseImage: string }) => (
  <motion.div
    className={`relative ${sizeClass} flex items-center justify-center`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {/* Writing surface effect */}
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-3 rounded-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      animate={{ 
        scaleX: [0.8, 1, 0.8],
        opacity: [0.3, 0.6, 0.3]
      }}
      transition={{ duration: 0.8, repeat: Infinity }}
    />
    
    {/* Newton character with writing motion */}
    <motion.div
      className="relative z-10"
      animate={{ 
        x: [0, 3, -2, 3, 0],
        rotate: [0, 1, -1, 1, 0]
      }}
      transition={{ 
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <img 
        src={poseImage} 
        alt="Newton writing"
        className="w-full h-full object-contain drop-shadow-xl"
        draggable={false}
      />
    </motion.div>
    
    {/* Pencil stroke particles */}
    {[0, 1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="absolute left-1/3"
        style={{ bottom: `${20 + i * 5}%` }}
        initial={{ opacity: 0, x: 0 }}
        animate={{ 
          opacity: [0, 1, 0],
          x: [0, 30 + i * 10],
          y: [0, -10 - i * 5],
          scale: [0.5, 1, 0.3]
        }}
        transition={{ 
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeOut"
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
      </motion.div>
    ))}
    
    {/* Flying text lines effect */}
    <motion.div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-1 w-3/4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-0.5 bg-gradient-to-r from-primary/40 to-transparent rounded-full"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ 
            scaleX: [0, 1, 1, 0],
            opacity: [0, 0.6, 0.6, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            times: [0, 0.3, 0.7, 1],
          }}
        />
      ))}
    </motion.div>
    
    {/* Sparkle accents */}
    <motion.div
      className="absolute top-2 right-4"
      animate={{ 
        rotate: [0, 180, 360],
        scale: [0.8, 1, 0.8],
        opacity: [0.5, 1, 0.5]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    >
      <Sparkles className="w-4 h-4 text-primary" />
    </motion.div>
  </motion.div>
));

WritingAnimation.displayName = "WritingAnimation";

// Completed Animation - Newton with celebratory thumbs up effect
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
      className="absolute inset-0 rounded-full border-2 border-amber-400/40"
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
    
    {/* Celebration sparkles radiating outward */}
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
        }}
        initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
        animate={{ 
          scale: [0, 1.2, 0],
          opacity: [0, 1, 0],
          x: Math.cos((i / 8) * Math.PI * 2) * 60,
          y: Math.sin((i / 8) * Math.PI * 2) * 60,
        }}
        transition={{ 
          duration: 0.8,
          delay: 0.2 + i * 0.05,
          ease: "easeOut"
        }}
      >
        <Sparkles className={`w-4 h-4 ${i % 2 === 0 ? 'text-amber-500' : 'text-green-500'}`} />
      </motion.div>
    ))}
    
    {/* Confetti-like particles */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={`confetti-${i}`}
        className="absolute left-1/2 top-1/2"
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
 * - thinking: Gentle bobbing with pulsing lightbulb effect
 * - writing: Active pencil motion with particle effects
 * - completed: Celebratory bounce with success burst
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
  enableSounds = true,
  soundVolume = 1,
}: NewtonProcessingAnimationProps) => {
  const [hasCompletedPlayed, setHasCompletedPlayed] = useState(false);

  // Pose images hook - uses AI-generated poses with fallback to default
  const { getPoseImage } = useNewtonPoses({
    enabled: true,
    fallbackImage: newtonCharacter
  });

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

  // Handle sound transitions based on state
  useEffect(() => {
    if (!enableSounds) return;

    if (state === "thinking") {
      crossfadeTo("thinking");
    } else if (state === "writing") {
      crossfadeTo("writing");
    } else if (state === "completed") {
      playCompletedSound();
    } else if (state === "idle") {
      stopAllSounds();
    }
  }, [state, enableSounds, crossfadeTo, playCompletedSound, stopAllSounds]);

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

        {/* Sound control button */}
        {enableSounds && state !== "completed" && (
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
  thinking: { message: "Newton is thinking...", subMessage: "Analyzing your content" },
  writing: { message: "Writing your results...", subMessage: "Almost there" },
  completed: { message: "All done!", subMessage: "Here are your results" },
};

export default NewtonProcessingAnimation;
