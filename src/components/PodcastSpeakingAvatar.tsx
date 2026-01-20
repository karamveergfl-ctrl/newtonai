import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, Loader2 } from "lucide-react";

interface PodcastSpeakingAvatarProps {
  speaker: "host1" | "host2";
  name: string;
  isActive: boolean;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

// Sound bars animation component
function SoundBars({ active, color }: { active: boolean; color: string }) {
  const bars = [1, 2, 3, 4, 5];
  
  return (
    <div className="flex items-end justify-center gap-0.5 h-8">
      {bars.map((bar) => (
        <motion.div
          key={bar}
          className={cn("w-1 rounded-full", color)}
          initial={{ height: 4 }}
          animate={active ? {
            height: [4, 12 + Math.random() * 16, 8, 20 + Math.random() * 12, 4],
          } : { height: 4 }}
          transition={{
            duration: 0.5 + Math.random() * 0.3,
            repeat: active ? Infinity : 0,
            repeatType: "reverse",
            delay: bar * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Pulsing ring animation
function PulsingRing({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  
  return (
    <>
      <motion.div
        className={cn("absolute inset-0 rounded-full", color)}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.4, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className={cn("absolute inset-0 rounded-full", color)}
        initial={{ scale: 1, opacity: 0.3 }}
        animate={{ scale: 1.2, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
      />
    </>
  );
}

export function PodcastSpeakingAvatar({
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
  
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };
  
  const bgColor = isHost1 ? "bg-primary/20" : "bg-secondary/20";
  const textColor = isHost1 ? "text-primary" : "text-secondary";
  const ringColor = isHost1 ? "bg-primary/30" : "bg-secondary/30";
  const barColor = isHost1 ? "bg-primary" : "bg-secondary";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <PulsingRing active={isActive && !isLoading} color={ringColor} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={speaker}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative rounded-full flex items-center justify-center z-10",
              sizeClasses[size],
              bgColor,
              textColor,
              isActive && "ring-2 ring-offset-2 ring-offset-background",
              isActive && (isHost1 ? "ring-primary" : "ring-secondary")
            )}
          >
            {isLoading ? (
              <Loader2 className={cn(iconSizes[size], "animate-spin")} />
            ) : (
              <motion.div
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
              >
                <User className={iconSizes[size]} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Sound bars below avatar */}
      {size !== "sm" && (
        <div className="h-8">
          <SoundBars active={isActive && !isLoading} color={barColor} />
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
      >
        {name}
      </motion.p>
    </div>
  );
}
