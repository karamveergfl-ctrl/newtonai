import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PodcastSpeakingAvatarProps {
  speaker: "host1" | "host2";
  name: string;
  isActive: boolean;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

// Character face with gradient background - like NotebookLM style
const CharacterFace = memo(function CharacterFace({ 
  speaker, 
  isActive,
  size 
}: { 
  speaker: "host1" | "host2"; 
  isActive: boolean;
  size: "sm" | "md" | "lg";
}) {
  const isHost1 = speaker === "host1";
  
  const sizes = {
    sm: { container: "w-12 h-12", svg: 40 },
    md: { container: "w-16 h-16", svg: 54 },
    lg: { container: "w-24 h-24", svg: 80 },
  };

  return (
    <div 
      className={cn(
        "relative rounded-full flex items-center justify-center overflow-hidden",
        sizes[size].container,
        // Gradient backgrounds matching the reference image
        isHost1 
          ? "bg-gradient-to-br from-teal-400 via-cyan-500 to-emerald-600" 
          : "bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600"
      )}
    >
      {/* Character SVG */}
      <svg 
        viewBox="0 0 24 24" 
        width={sizes[size].svg * 0.6} 
        height={sizes[size].svg * 0.6}
        className="text-white/95"
      >
        {/* Head */}
        <circle cx="12" cy="8" r="5.5" fill="currentColor" />
        
        {/* Body/shoulders */}
        <path 
          d="M3 21 Q3 14 12 14 Q21 14 21 21" 
          fill="currentColor"
          opacity="0.85"
        />
        
        {/* Face features - eyes */}
        <circle cx="10" cy="7" r="0.8" fill={isHost1 ? "#0d9488" : "#4f46e5"} />
        <circle cx="14" cy="7" r="0.8" fill={isHost1 ? "#0d9488" : "#4f46e5"} />
        
        {/* Animated mouth when speaking */}
        <motion.ellipse
          cx="12"
          cy="10"
          rx="1.8"
          fill={isHost1 ? "#0d9488" : "#4f46e5"}
          initial={{ ry: 0.5 }}
          animate={isActive 
            ? { ry: [1, 2.5, 1.5, 3, 1] } 
            : { ry: 0.5 }
          }
          transition={isActive 
            ? { duration: 0.25, repeat: Infinity, ease: "easeInOut" as const } 
            : { duration: 0.1 }
          }
        />
      </svg>
    </div>
  );
});

// Sound wave dots animation - simpler and more performant
const SoundWaveDots = memo(function SoundWaveDots({ 
  active, 
  color 
}: { 
  active: boolean; 
  color: string;
}) {
  // Fixed heights to avoid random calculations on each render
  const dotHeights = useMemo(() => [8, 14, 10, 16, 8], []);
  
  if (!active) {
    return (
      <div className="flex items-end justify-center gap-1 h-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn("w-1 rounded-full", color)}
            style={{ height: 4 }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="flex items-end justify-center gap-1 h-6">
      {dotHeights.map((height, i) => (
        <motion.div
          key={i}
          className={cn("w-1 rounded-full", color)}
          animate={{
            height: [4, height, 6, height * 0.8, 4],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});

// Pulsing ring animation - optimized with CSS instead of JS
const PulsingRing = memo(function PulsingRing({ 
  active, 
  color 
}: { 
  active: boolean; 
  color: string;
}) {
  if (!active) return null;
  
  return (
    <>
      <motion.div
        className={cn("absolute inset-0 rounded-full", color)}
        initial={{ scale: 1, opacity: 0.4 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className={cn("absolute inset-0 rounded-full", color)}
        initial={{ scale: 1, opacity: 0.25 }}
        animate={{ scale: 1.15, opacity: 0 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
      />
    </>
  );
});

export const PodcastSpeakingAvatar = memo(function PodcastSpeakingAvatar({
  speaker,
  name,
  isActive,
  isLoading = false,
  size = "md",
}: PodcastSpeakingAvatarProps) {
  const isHost1 = speaker === "host1";
  
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };
  
  const ringColor = isHost1 ? "bg-teal-500/30" : "bg-indigo-500/30";
  const barColor = isHost1 ? "bg-teal-500" : "bg-indigo-500";
  const textColor = isHost1 ? "text-teal-600 dark:text-teal-400" : "text-indigo-600 dark:text-indigo-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <PulsingRing active={isActive && !isLoading} color={ringColor} />
        
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "relative rounded-full flex items-center justify-center z-10",
                sizeClasses[size],
                isHost1 
                  ? "bg-gradient-to-br from-teal-400 to-cyan-500" 
                  : "bg-gradient-to-br from-blue-400 to-indigo-500"
              )}
            >
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={speaker}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "relative z-10",
                isActive && "ring-2 ring-offset-2 ring-offset-background rounded-full",
                isActive && (isHost1 ? "ring-teal-500" : "ring-indigo-500")
              )}
            >
              <CharacterFace speaker={speaker} isActive={isActive} size={size} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Sound wave dots below avatar */}
      {size !== "sm" && (
        <div className="h-6">
          <SoundWaveDots active={isActive && !isLoading} color={barColor} />
        </div>
      )}
      
      {/* Name label */}
      <motion.p
        className={cn(
          "font-semibold text-sm",
          textColor,
          isActive && "font-bold"
        )}
        animate={isActive ? { scale: 1.05 } : { scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        {name}
      </motion.p>
    </div>
  );
});
