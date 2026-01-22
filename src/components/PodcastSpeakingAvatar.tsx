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

// Alex - Male host with realistic 3D-style face
const AlexFace = memo(function AlexFace({ isActive, size }: FaceProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("rounded-full", sizes[size].container)}
      style={{ width: sizes[size].svg, height: sizes[size].svg }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id="alex-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        
        {/* 3D skin with warm undertones */}
        <radialGradient id="alex-skin-3d" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#F7D5C4" />
          <stop offset="50%" stopColor="#EBCAB5" />
          <stop offset="100%" stopColor="#D4A68A" />
        </radialGradient>
        
        {/* Face shadow for depth */}
        <radialGradient id="alex-face-shadow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        
        {/* Eye iris with depth */}
        <radialGradient id="alex-iris" cx="35%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#8B7355" />
          <stop offset="60%" stopColor="#5D4037" />
          <stop offset="100%" stopColor="#3E2723" />
        </radialGradient>
        
        {/* Hair gradient */}
        <linearGradient id="alex-hair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5D4037" />
          <stop offset="100%" stopColor="#4E342E" />
        </linearGradient>
        
        {/* Lip color */}
        <linearGradient id="alex-lips" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C08080" />
          <stop offset="100%" stopColor="#A06060" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <circle cx="50" cy="50" r="50" fill="url(#alex-bg)" />
      
      {/* Neck with shadow */}
      <rect x="40" y="74" width="20" height="14" fill="#D4A68A" />
      <rect x="40" y="74" width="20" height="4" fill="rgba(0,0,0,0.05)" />
      
      {/* Face base with 3D shading */}
      <ellipse cx="50" cy="48" rx="28" ry="30" fill="url(#alex-skin-3d)" />
      <ellipse cx="50" cy="58" rx="24" ry="20" fill="url(#alex-face-shadow)" />
      
      {/* Ears */}
      <ellipse cx="22" cy="48" rx="5" ry="8" fill="#D4A68A" />
      <ellipse cx="23" cy="48" rx="3" ry="5" fill="rgba(0,0,0,0.08)" />
      <ellipse cx="78" cy="48" rx="5" ry="8" fill="#D4A68A" />
      <ellipse cx="77" cy="48" rx="3" ry="5" fill="rgba(0,0,0,0.08)" />
      
      {/* Hair - styled short cut */}
      <path 
        d="M22 40 Q20 20 50 15 Q80 20 78 40 Q72 28 50 26 Q28 28 22 40" 
        fill="url(#alex-hair)" 
      />
      <ellipse cx="50" cy="20" rx="24" ry="10" fill="url(#alex-hair)" />
      {/* Hair texture lines */}
      <path d="M30 25 Q35 20 40 22" stroke="#4E342E" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M60 22 Q65 20 70 25" stroke="#4E342E" strokeWidth="1" fill="none" opacity="0.5" />
      
      {/* Eyebrows - natural shape */}
      <path d="M30 36 Q35 32 42 35 Q44 35 46 36" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M54 36 Q56 35 58 35 Q65 32 70 36" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      
      {/* Left eye with depth */}
      <ellipse cx="38" cy="44" rx="7" ry="5.5" fill="white" />
      <ellipse cx="38" cy="45" rx="7" ry="5" fill="white" />
      {/* Upper eyelid shadow */}
      <path d="M31 43 Q38 40 45 43" fill="rgba(0,0,0,0.1)" />
      {/* Iris */}
      <circle cx="38" cy="44.5" r="4" fill="url(#alex-iris)" />
      {/* Pupil */}
      <circle cx="38" cy="44.5" r="2" fill="#1a1a1a" />
      {/* Eye highlight */}
      <circle cx="36.5" cy="43" r="1.5" fill="white" opacity="0.9" />
      <circle cx="39.5" cy="45.5" r="0.8" fill="white" opacity="0.5" />
      
      {/* Right eye with depth */}
      <ellipse cx="62" cy="44" rx="7" ry="5.5" fill="white" />
      <ellipse cx="62" cy="45" rx="7" ry="5" fill="white" />
      <path d="M55 43 Q62 40 69 43" fill="rgba(0,0,0,0.1)" />
      <circle cx="62" cy="44.5" r="4" fill="url(#alex-iris)" />
      <circle cx="62" cy="44.5" r="2" fill="#1a1a1a" />
      <circle cx="60.5" cy="43" r="1.5" fill="white" opacity="0.9" />
      <circle cx="63.5" cy="45.5" r="0.8" fill="white" opacity="0.5" />
      
      {/* Nose with realistic shading */}
      <path d="M50 44 C52 48 52 52 50 58" fill="none" stroke="#C4A484" strokeWidth="1.2" strokeLinecap="round" />
      {/* Nostril shadows */}
      <ellipse cx="46" cy="57" rx="3" ry="1.5" fill="rgba(0,0,0,0.08)" />
      <ellipse cx="54" cy="57" rx="3" ry="1.5" fill="rgba(0,0,0,0.08)" />
      {/* Nose highlight */}
      <ellipse cx="50" cy="52" rx="2" ry="3" fill="rgba(255,255,255,0.15)" />
      
      {/* Mouth area - animated */}
      <g>
        {/* Upper lip line */}
        <motion.path
          d="M40 66 Q45 64 50 65 Q55 64 60 66"
          stroke="url(#alex-lips)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={isActive 
            ? { d: [
                "M40 66 Q45 64 50 65 Q55 64 60 66",
                "M40 64 Q45 62 50 63 Q55 62 60 64",
                "M40 65 Q45 63 50 64 Q55 63 60 65",
              ]}
            : {}}
          transition={isActive ? { duration: 0.3, repeat: Infinity } : {}}
        />
        
        {/* Lower lip / mouth opening */}
        <motion.ellipse
          cx="50"
          cy="68"
          rx="8"
          fill="url(#alex-lips)"
          animate={isActive 
            ? { ry: [2, 7, 4, 9, 3, 6, 2] } 
            : { ry: 0 }
          }
          transition={isActive 
            ? { duration: 0.45, repeat: Infinity, ease: "easeInOut" } 
            : { duration: 0.15 }
          }
        />
        
        {/* Teeth when mouth open */}
        <motion.rect
          x="43"
          y="66"
          width="14"
          height="4"
          rx="1"
          fill="white"
          animate={isActive 
            ? { opacity: [0, 0.95, 0.6, 0.95, 0] }
            : { opacity: 0 }
          }
          transition={isActive 
            ? { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.1 }
          }
        />
        
        {/* Closed mouth smile */}
        {!isActive && (
          <path 
            d="M42 67 Q50 72 58 67" 
            stroke="#B07070" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
          />
        )}
      </g>
      
      {/* Subtle jaw shadow */}
      <ellipse cx="50" cy="75" rx="20" ry="5" fill="rgba(0,0,0,0.05)" />
    </svg>
  );
});

// Sarah - Female host with realistic 3D-style face
const SarahFace = memo(function SarahFace({ isActive, size }: FaceProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("rounded-full", sizes[size].container)}
      style={{ width: sizes[size].svg, height: sizes[size].svg }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id="sarah-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        
        {/* 3D skin with soft undertones */}
        <radialGradient id="sarah-skin-3d" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#FDE8E0" />
          <stop offset="50%" stopColor="#F5D5C8" />
          <stop offset="100%" stopColor="#E5C4B5" />
        </radialGradient>
        
        {/* Face shadow */}
        <radialGradient id="sarah-face-shadow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        
        {/* Green eye iris */}
        <radialGradient id="sarah-iris" cx="35%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="50%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#2E7D32" />
        </radialGradient>
        
        {/* Hair gradient */}
        <linearGradient id="sarah-hair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6D4C41" />
          <stop offset="100%" stopColor="#4E342E" />
        </linearGradient>
        
        {/* Lip color - feminine pink-red */}
        <linearGradient id="sarah-lips" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E57373" />
          <stop offset="100%" stopColor="#C62828" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <circle cx="50" cy="50" r="50" fill="url(#sarah-bg)" />
      
      {/* Hair - back layer (long flowing) */}
      <path 
        d="M15 45 Q8 25 25 12 Q50 2 75 12 Q92 25 85 45 
           Q88 65 82 88 L75 70 Q80 50 75 35 Q60 20 50 20 Q40 20 25 35 Q20 50 25 70 L18 88 Q12 65 15 45" 
        fill="url(#sarah-hair)" 
      />
      
      {/* Neck */}
      <rect x="42" y="74" width="16" height="12" fill="#E5C4B5" />
      <rect x="42" y="74" width="16" height="3" fill="rgba(0,0,0,0.04)" />
      
      {/* Face base with 3D shading */}
      <ellipse cx="50" cy="48" rx="26" ry="28" fill="url(#sarah-skin-3d)" />
      <ellipse cx="50" cy="58" rx="22" ry="18" fill="url(#sarah-face-shadow)" />
      
      {/* Hair - front bangs with texture */}
      <path 
        d="M26 38 Q24 20 50 16 Q76 20 74 38 Q68 26 50 24 Q32 26 26 38" 
        fill="url(#sarah-hair)" 
      />
      {/* Hair texture */}
      <path d="M35 22 Q40 18 45 20" stroke="#5D4037" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M55 20 Q60 18 65 22" stroke="#5D4037" strokeWidth="1" fill="none" opacity="0.4" />
      
      {/* Side hair strands with volume */}
      <path d="M24 40 Q18 52 22 68" stroke="url(#sarah-hair)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M76 40 Q82 52 78 68" stroke="url(#sarah-hair)" strokeWidth="10" fill="none" strokeLinecap="round" />
      
      {/* Eyebrows - feminine arch */}
      <path d="M32 36 Q38 32 46 36" stroke="#5D4037" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M54 36 Q62 32 68 36" stroke="#5D4037" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      
      {/* Left eye with depth and lashes */}
      <ellipse cx="40" cy="44" rx="7" ry="5.5" fill="white" />
      <path d="M33 43 Q40 40 47 43" fill="rgba(0,0,0,0.08)" />
      <circle cx="40" cy="44.5" r="4" fill="url(#sarah-iris)" />
      <circle cx="40" cy="44.5" r="2" fill="#1a1a1a" />
      <circle cx="38.5" cy="43" r="1.5" fill="white" opacity="0.9" />
      <circle cx="41.5" cy="45.5" r="0.8" fill="white" opacity="0.5" />
      {/* Detailed eyelashes */}
      <path d="M33 43 L30 39" stroke="#3E2723" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M35 42 L33 38" stroke="#3E2723" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M37 41.5 L36 38" stroke="#3E2723" strokeWidth="1" strokeLinecap="round" />
      
      {/* Right eye with depth and lashes */}
      <ellipse cx="60" cy="44" rx="7" ry="5.5" fill="white" />
      <path d="M53 43 Q60 40 67 43" fill="rgba(0,0,0,0.08)" />
      <circle cx="60" cy="44.5" r="4" fill="url(#sarah-iris)" />
      <circle cx="60" cy="44.5" r="2" fill="#1a1a1a" />
      <circle cx="58.5" cy="43" r="1.5" fill="white" opacity="0.9" />
      <circle cx="61.5" cy="45.5" r="0.8" fill="white" opacity="0.5" />
      <path d="M63 41.5 L64 38" stroke="#3E2723" strokeWidth="1" strokeLinecap="round" />
      <path d="M65 42 L67 38" stroke="#3E2723" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M67 43 L70 39" stroke="#3E2723" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Blush - soft and natural */}
      <ellipse cx="32" cy="54" rx="7" ry="4" fill="#FFB6C1" opacity="0.35" />
      <ellipse cx="68" cy="54" rx="7" ry="4" fill="#FFB6C1" opacity="0.35" />
      
      {/* Nose - delicate */}
      <path d="M50 44 C51 48 51 52 50 56" fill="none" stroke="#D4A69C" strokeWidth="1" strokeLinecap="round" />
      {/* Subtle nostril shadows */}
      <ellipse cx="47" cy="56" rx="2" ry="1" fill="rgba(0,0,0,0.06)" />
      <ellipse cx="53" cy="56" rx="2" ry="1" fill="rgba(0,0,0,0.06)" />
      
      {/* Mouth area - animated with cupid's bow shape */}
      <g>
        {/* Upper lip with cupid's bow */}
        <motion.path
          d="M42 63 Q46 61 50 62 Q54 61 58 63"
          stroke="url(#sarah-lips)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          animate={isActive 
            ? { d: [
                "M42 63 Q46 61 50 62 Q54 61 58 63",
                "M42 61 Q46 59 50 60 Q54 59 58 61",
                "M42 62 Q46 60 50 61 Q54 60 58 62",
              ]}
            : {}}
          transition={isActive ? { duration: 0.3, repeat: Infinity } : {}}
        />
        
        {/* Lower lip / mouth opening */}
        <motion.ellipse
          cx="50"
          cy="66"
          rx="7"
          fill="url(#sarah-lips)"
          animate={isActive 
            ? { ry: [2, 6, 3, 8, 4, 5, 2] } 
            : { ry: 0 }
          }
          transition={isActive 
            ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" } 
            : { duration: 0.15 }
          }
        />
        
        {/* Teeth when mouth open */}
        <motion.rect
          x="44"
          y="64"
          width="12"
          height="3"
          rx="1"
          fill="white"
          animate={isActive 
            ? { opacity: [0, 0.95, 0.5, 0.95, 0] }
            : { opacity: 0 }
          }
          transition={isActive 
            ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.1 }
          }
        />
        
        {/* Closed mouth - subtle smile */}
        {!isActive && (
          <path 
            d="M44 65 Q50 70 56 65" 
            stroke="#C62828" 
            strokeWidth="1.8" 
            fill="none" 
            strokeLinecap="round" 
          />
        )}
      </g>
      
      {/* Earrings */}
      <circle cx="20" cy="52" r="3" fill="#FFD700" />
      <circle cx="20" cy="56" r="2" fill="#FFD700" />
      <circle cx="80" cy="52" r="3" fill="#FFD700" />
      <circle cx="80" cy="56" r="2" fill="#FFD700" />
      
      {/* Subtle jaw shadow */}
      <ellipse cx="50" cy="73" rx="18" ry="4" fill="rgba(0,0,0,0.04)" />
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
