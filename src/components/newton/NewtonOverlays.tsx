import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Animation timing constants matching 60fps After Effects spec
export const ANIMATION_CONFIG = {
  thinking: {
    duration: 2, // 120 frames at 60fps
    headBob: { times: [0, 0.25, 0.5, 0.75, 1], values: [0, -4, 0, 4, 0] },
    pencilWiggle: { times: [0, 0.25, 0.5, 0.75, 1], values: [0, 3, 0, -3, 0] },
    eyeBlink: { times: [0, 0.417, 0.45, 0.483, 1], values: [1, 1, 0.1, 1, 1] }, // Blink at frame 50-58
  },
  writing: {
    duration: 2, // 120 frames at 60fps
    pencilMotion: { duration: 0.5, values: [0, 4, 0, 4, 0] }, // Faster loop
    armRotation: { times: [0, 0.5, 1], values: [0, 5, 0] },
    paperOpacity: { times: [0, 0.167, 0.667, 0.833, 1], values: [0, 1, 1, 0, 0] }, // Frames 0, 20, 80, 100, 120
  },
  completed: {
    duration: 1.2, // 72 frames at 60fps
    armRaise: { times: [0, 0.278, 1], values: [-20, 0, 0] }, // Frame 0→-20°, 20→0°, 72→0°
    lightbulbPop: { times: [0, 0.208, 0.417, 1], values: [0, 1.2, 1, 1] }, // Frame 0→0%, 15→120%, 30→100%
    glowPulse: { times: [0.208, 0.347, 0.833, 1], values: [0, 1, 1, 0] }, // Frame 15→0%, 25→100%, 60→100%, 72→0%
    mouthSmile: { times: [0, 0.278, 1], values: [0.9, 1, 1] }, // Frame 0→90%, 20→100%
  },
};

// Easy Ease equivalent in CSS
const EASY_EASE: [number, number, number, number] = [0.42, 0, 0.58, 1];

interface OverlayProps {
  className?: string;
}

// Pencil overlay for thinking/writing states
export const PencilOverlay = memo(({ className = "" }: OverlayProps) => (
  <motion.div
    className={`absolute bottom-[28%] right-[22%] origin-bottom z-20 ${className}`}
    animate={{ rotate: [0, 3, 0, -3, 0] }}
    transition={{
      duration: ANIMATION_CONFIG.thinking.duration,
      repeat: Infinity,
      ease: EASY_EASE,
      times: [0, 0.25, 0.5, 0.75, 1],
    }}
  >
    <svg viewBox="0 0 20 60" className="w-3 h-10 drop-shadow-md">
      {/* Pencil body */}
      <rect fill="#D4A574" width="6" height="40" x="7" y="8" rx="1" />
      {/* Pencil tip */}
      <polygon fill="#2C2C2C" points="10,48 7,58 13,58" />
      {/* Eraser */}
      <rect fill="#FFB6C1" width="6" height="6" x="7" y="2" rx="1" />
      {/* Metal band */}
      <rect fill="#C0C0C0" width="6" height="2" x="7" y="6" />
    </svg>
  </motion.div>
));
PencilOverlay.displayName = "PencilOverlay";

// Writing pencil with faster motion
export const WritingPencilOverlay = memo(({ className = "" }: OverlayProps) => (
  <motion.div
    className={`absolute bottom-[30%] right-[20%] origin-bottom z-20 ${className}`}
    animate={{ 
      y: [0, 4, 0, 4, 0],
      rotate: [0, 2, 0, -2, 0]
    }}
    transition={{
      duration: ANIMATION_CONFIG.writing.pencilMotion.duration,
      repeat: Infinity,
      ease: EASY_EASE,
    }}
  >
    <svg viewBox="0 0 20 60" className="w-3 h-10 drop-shadow-md">
      <rect fill="#D4A574" width="6" height="40" x="7" y="8" rx="1" />
      <polygon fill="#2C2C2C" points="10,48 7,58 13,58" />
      <rect fill="#FFB6C1" width="6" height="6" x="7" y="2" rx="1" />
      <rect fill="#C0C0C0" width="6" height="2" x="7" y="6" />
    </svg>
  </motion.div>
));
WritingPencilOverlay.displayName = "WritingPencilOverlay";

// Eyes blink overlay - positioned to match Newton's eyes
export const EyesBlinkOverlay = memo(({ className = "" }: OverlayProps) => (
  <motion.div
    className={`absolute top-[32%] left-1/2 -translate-x-1/2 flex gap-3 z-10 ${className}`}
    style={{ transformOrigin: "center" }}
  >
    {/* Left eye */}
    <motion.div
      className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]"
      animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
      transition={{
        duration: ANIMATION_CONFIG.thinking.duration,
        repeat: Infinity,
        ease: EASY_EASE,
        times: [0, 0.417, 0.45, 0.483, 1],
      }}
    />
    {/* Right eye */}
    <motion.div
      className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]"
      animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
      transition={{
        duration: ANIMATION_CONFIG.thinking.duration,
        repeat: Infinity,
        ease: EASY_EASE,
        times: [0, 0.417, 0.45, 0.483, 1],
      }}
    />
  </motion.div>
));
EyesBlinkOverlay.displayName = "EyesBlinkOverlay";

// Floating dots for thinking state
export const FloatingDotsOverlay = memo(({ className = "" }: OverlayProps) => (
  <div className={`absolute inset-0 pointer-events-none z-30 ${className}`}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-amber-400/80"
        style={{ 
          top: `${15 + i * 8}%`, 
          right: `${8 + i * 6}%` 
        }}
        animate={{
          y: [0, -10, -25],
          opacity: [1, 1, 0],
          scale: [0.8, 1, 0.6]
        }}
        transition={{
          duration: ANIMATION_CONFIG.thinking.duration,
          repeat: Infinity,
          delay: i * 0.4,
          times: [0, 0.5, 1],
          ease: EASY_EASE,
        }}
      />
    ))}
  </div>
));
FloatingDotsOverlay.displayName = "FloatingDotsOverlay";

// Paper sheets for writing state
export const PaperSheetsOverlay = memo(({ className = "" }: OverlayProps) => (
  <div className={`absolute bottom-[8%] left-[18%] z-10 ${className}`}>
    {/* Paper 1 */}
    <motion.div
      className="absolute w-10 h-8 bg-white/95 rounded-sm shadow-md border border-gray-200"
      animate={{ opacity: [0, 1, 1, 0, 0] }}
      transition={{
        duration: ANIMATION_CONFIG.writing.duration,
        repeat: Infinity,
        times: [0, 0.167, 0.667, 0.833, 1],
        ease: EASY_EASE,
      }}
    >
      {/* Paper lines */}
      <div className="p-1.5 space-y-1">
        <div className="w-full h-0.5 bg-gray-300 rounded-full" />
        <div className="w-4/5 h-0.5 bg-gray-300 rounded-full" />
        <div className="w-3/5 h-0.5 bg-gray-300 rounded-full" />
      </div>
    </motion.div>
    
    {/* Paper 2 - offset by 0.5s (30 frames) */}
    <motion.div
      className="absolute w-10 h-8 bg-white/95 rounded-sm shadow-md border border-gray-200 translate-x-3 translate-y-2"
      animate={{ opacity: [0, 1, 1, 0, 0] }}
      transition={{
        duration: ANIMATION_CONFIG.writing.duration,
        repeat: Infinity,
        times: [0, 0.167, 0.667, 0.833, 1],
        ease: EASY_EASE,
        delay: 0.5, // +30 frames offset
      }}
    >
      <div className="p-1.5 space-y-1">
        <div className="w-full h-0.5 bg-gray-300 rounded-full" />
        <div className="w-3/4 h-0.5 bg-gray-300 rounded-full" />
        <div className="w-1/2 h-0.5 bg-gray-300 rounded-full" />
      </div>
    </motion.div>
  </div>
));
PaperSheetsOverlay.displayName = "PaperSheetsOverlay";

// Lightbulb with glow for thinking state
export const ThinkingLightbulbOverlay = memo(({ className = "" }: OverlayProps) => (
  <motion.div 
    className={`absolute -top-1 right-[12%] z-20 ${className}`}
    animate={{ 
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7]
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {/* Glow effect */}
    <motion.div
      className="absolute inset-0 w-8 h-8 rounded-full bg-yellow-300/40 blur-md -z-10"
      animate={{ 
        scale: [1, 1.3, 1],
        opacity: [0.4, 0.8, 0.4]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    {/* Lightbulb SVG */}
    <svg viewBox="0 0 24 24" className="w-7 h-7 text-yellow-400 drop-shadow-lg">
      <path 
        fill="currentColor" 
        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
      />
      <rect fill="#888" x="9" y="18" width="6" height="2" rx="1" />
      <rect fill="#888" x="10" y="20" width="4" height="1" rx="0.5" />
    </svg>
  </motion.div>
));
ThinkingLightbulbOverlay.displayName = "ThinkingLightbulbOverlay";

// Lightbulb pop animation for completed state (play once)
export const CompletedLightbulbOverlay = memo(({ className = "" }: OverlayProps) => (
  <motion.div 
    className={`absolute -top-2 right-[10%] z-20 ${className}`}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1.2, 1, 1],
      opacity: 1
    }}
    transition={{
      duration: ANIMATION_CONFIG.completed.duration,
      ease: EASY_EASE,
      times: [0, 0.208, 0.417, 1],
    }}
  >
    {/* Glow ring pulse */}
    <motion.div
      className="absolute inset-0 w-10 h-10 -translate-x-1 -translate-y-1 rounded-full bg-yellow-300/50 blur-md -z-10"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1.5, 1.3, 0],
        opacity: [0, 1, 1, 0]
      }}
      transition={{
        duration: ANIMATION_CONFIG.completed.duration,
        ease: EASY_EASE,
        times: [0.208, 0.347, 0.833, 1],
      }}
    />
    {/* Lightbulb SVG */}
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-yellow-400 drop-shadow-xl">
      <path 
        fill="currentColor" 
        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
      />
      <rect fill="#888" x="9" y="18" width="6" height="2" rx="1" />
    </svg>
  </motion.div>
));
CompletedLightbulbOverlay.displayName = "CompletedLightbulbOverlay";

// Success sparkles for completed state
export const SuccessSparklesOverlay = memo(({ className = "" }: OverlayProps) => (
  <div className={`absolute inset-0 pointer-events-none z-30 ${className}`}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
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
          x: Math.cos((i / 6) * Math.PI * 2) * 50,
          y: Math.sin((i / 6) * Math.PI * 2) * 50,
        }}
        transition={{ 
          duration: 0.8,
          delay: 0.2 + i * 0.08,
          ease: "easeOut"
        }}
      >
        <Sparkles className={`w-4 h-4 ${i % 2 === 0 ? 'text-amber-500' : 'text-green-500'}`} />
      </motion.div>
    ))}
  </div>
));
SuccessSparklesOverlay.displayName = "SuccessSparklesOverlay";

// Arm rotation overlay for writing state
export const ArmRotationWrapper = memo(({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <motion.div
    className={`${className}`}
    animate={{ rotate: [0, 5, 0] }}
    transition={{
      duration: ANIMATION_CONFIG.writing.duration,
      repeat: Infinity,
      ease: EASY_EASE,
      times: [0, 0.5, 1],
    }}
    style={{ transformOrigin: "center bottom" }}
  >
    {children}
  </motion.div>
));
ArmRotationWrapper.displayName = "ArmRotationWrapper";

// Thumbs up arm animation for completed state
export const ThumbsUpArmOverlay = memo(({ className = "" }: OverlayProps) => (
  <motion.div
    className={`absolute bottom-[25%] right-[15%] z-20 ${className}`}
    initial={{ rotate: -20, opacity: 0 }}
    animate={{ 
      rotate: [-20, 0, 0],
      opacity: 1
    }}
    transition={{
      duration: ANIMATION_CONFIG.completed.duration,
      ease: EASY_EASE,
      times: [0, 0.278, 1],
    }}
    style={{ transformOrigin: "bottom center" }}
  >
    <svg viewBox="0 0 32 48" className="w-6 h-9 drop-shadow-md">
      {/* Arm */}
      <rect fill="#8B4513" x="12" y="20" width="8" height="28" rx="3" />
      {/* Hand */}
      <circle fill="#FFDAB9" cx="16" cy="18" r="8" />
      {/* Thumb up */}
      <rect fill="#FFDAB9" x="13" y="4" width="6" height="14" rx="3" />
    </svg>
  </motion.div>
));
ThumbsUpArmOverlay.displayName = "ThumbsUpArmOverlay";
