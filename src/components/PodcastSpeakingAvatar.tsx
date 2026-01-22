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

interface FaceProps {
  isActive: boolean;
  size: "sm" | "md" | "lg";
}

const sizes = {
  sm: { container: "w-12 h-12", svg: 48 },
  md: { container: "w-16 h-16", svg: 64 },
  lg: { container: "w-24 h-24", svg: 96 },
};

// Alex - Male host with short brown hair, warm friendly face
const AlexFace = memo(function AlexFace({ isActive, size }: FaceProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("rounded-full", sizes[size].container)}
      style={{ width: sizes[size].svg, height: sizes[size].svg }}
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="alex-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="alex-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5D0B9" />
          <stop offset="100%" stopColor="#E8C4A2" />
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="url(#alex-bg)" />
      
      {/* Neck */}
      <rect x="40" y="72" width="20" height="15" fill="url(#alex-skin)" />
      
      {/* Face base */}
      <ellipse cx="50" cy="48" rx="28" ry="30" fill="url(#alex-skin)" />
      
      {/* Hair - short brown */}
      <path 
        d="M22 40 Q22 18 50 15 Q78 18 78 40 Q72 30 50 28 Q28 30 22 40" 
        fill="#5D4037" 
      />
      <ellipse cx="50" cy="22" rx="22" ry="10" fill="#5D4037" />
      
      {/* Ears */}
      <ellipse cx="22" cy="48" rx="5" ry="8" fill="#E8C4A2" />
      <ellipse cx="78" cy="48" rx="5" ry="8" fill="#E8C4A2" />
      
      {/* Eyebrows */}
      <path d="M32 36 Q38 33 44 36" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 36 Q62 33 68 36" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* Eyes */}
      <ellipse cx="38" cy="44" rx="6" ry="5" fill="white" />
      <circle cx="38" cy="44" r="3" fill="#3B2414" />
      <circle cx="37" cy="43" r="1" fill="white" />
      
      <ellipse cx="62" cy="44" rx="6" ry="5" fill="white" />
      <circle cx="62" cy="44" r="3" fill="#3B2414" />
      <circle cx="61" cy="43" r="1" fill="white" />
      
      {/* Nose */}
      <path d="M50 46 Q52 52 50 56 Q48 54 47 56" fill="none" stroke="#C4A484" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Mouth - animated when speaking */}
      <motion.ellipse
        cx="50"
        cy="66"
        rx="10"
        fill="#C47070"
        initial={{ ry: 2 }}
        animate={isActive 
          ? { ry: [2, 6, 3, 8, 4, 7, 2] } 
          : { ry: 2 }
        }
        transition={isActive 
          ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" } 
          : { duration: 0.15 }
        }
      />
      
      {/* Smile lines when not speaking */}
      {!isActive && (
        <>
          <path d="M40 66 Q50 72 60 66" stroke="#C47070" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
});

// Sarah - Female host with long brown hair, green eyes
const SarahFace = memo(function SarahFace({ isActive, size }: FaceProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("rounded-full", sizes[size].container)}
      style={{ width: sizes[size].svg, height: sizes[size].svg }}
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="sarah-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="sarah-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE4D9" />
          <stop offset="100%" stopColor="#F5D5C8" />
        </linearGradient>
        <linearGradient id="sarah-hair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5D4037" />
          <stop offset="100%" stopColor="#4E342E" />
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="url(#sarah-bg)" />
      
      {/* Hair - back layer (long flowing) */}
      <path 
        d="M15 45 Q8 25 25 12 Q50 2 75 12 Q92 25 85 45 
           Q88 65 82 85 L75 70 Q80 50 75 35 Q60 20 50 20 Q40 20 25 35 Q20 50 25 70 L18 85 Q12 65 15 45" 
        fill="url(#sarah-hair)" 
      />
      
      {/* Neck */}
      <rect x="42" y="72" width="16" height="12" fill="url(#sarah-skin)" />
      
      {/* Face base */}
      <ellipse cx="50" cy="48" rx="26" ry="28" fill="url(#sarah-skin)" />
      
      {/* Hair - front bangs */}
      <path 
        d="M26 38 Q26 20 50 18 Q74 20 74 38 Q68 28 50 26 Q32 28 26 38" 
        fill="url(#sarah-hair)" 
      />
      
      {/* Side hair strands */}
      <path d="M24 40 Q20 50 22 65" stroke="#5D4037" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M76 40 Q80 50 78 65" stroke="#5D4037" strokeWidth="8" fill="none" strokeLinecap="round" />
      
      {/* Eyebrows - thinner, arched */}
      <path d="M34 36 Q40 33 46 36" stroke="#5D4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M54 36 Q60 33 66 36" stroke="#5D4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      
      {/* Eyes with lashes */}
      <ellipse cx="40" cy="44" rx="6" ry="5" fill="white" />
      <circle cx="40" cy="44" r="3.5" fill="#2E7D32" />
      <circle cx="39" cy="43" r="1.2" fill="white" />
      
      <ellipse cx="60" cy="44" rx="6" ry="5" fill="white" />
      <circle cx="60" cy="44" r="3.5" fill="#2E7D32" />
      <circle cx="59" cy="43" r="1.2" fill="white" />
      
      {/* Eyelashes */}
      <path d="M34 42 L32 39" stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
      <path d="M36 41 L35 38" stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
      <path d="M64 41 L65 38" stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
      <path d="M66 42 L68 39" stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
      
      {/* Blush */}
      <ellipse cx="32" cy="54" rx="6" ry="3" fill="#FFB6C1" opacity="0.4" />
      <ellipse cx="68" cy="54" rx="6" ry="3" fill="#FFB6C1" opacity="0.4" />
      
      {/* Nose */}
      <path d="M50 46 Q51 52 50 55" fill="none" stroke="#D4A69C" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Lips - animated when speaking */}
      <motion.ellipse
        cx="50"
        cy="64"
        rx="8"
        fill="#E57373"
        initial={{ ry: 2 }}
        animate={isActive 
          ? { ry: [2, 5, 3, 7, 4, 6, 2] } 
          : { ry: 2 }
        }
        transition={isActive 
          ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" } 
          : { duration: 0.15 }
        }
      />
      
      {/* Smile when not speaking */}
      {!isActive && (
        <path d="M42 64 Q50 70 58 64" stroke="#E57373" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      
      {/* Earrings */}
      <circle cx="22" cy="52" r="2.5" fill="#FFD700" />
      <circle cx="78" cy="52" r="2.5" fill="#FFD700" />
    </svg>
  );
});

// Sound wave dots animation
const SoundWaveDots = memo(function SoundWaveDots({ 
  active, 
  color 
}: { 
  active: boolean; 
  color: string;
}) {
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

// Pulsing ring animation
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
                "relative z-10 rounded-full overflow-hidden",
                isActive && "ring-2 ring-offset-2 ring-offset-background",
                isActive && (isHost1 ? "ring-teal-500" : "ring-indigo-500")
              )}
            >
              {isHost1 ? (
                <AlexFace isActive={isActive} size={size} />
              ) : (
                <SarahFace isActive={isActive} size={size} />
              )}
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
