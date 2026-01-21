import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioWaveformVisualizerProps {
  waveformData: number[];
  isActive: boolean;
  variant?: "recording" | "playback";
  className?: string;
}

export function AudioWaveformVisualizer({
  waveformData,
  isActive,
  variant = "recording",
  className,
}: AudioWaveformVisualizerProps) {
  const isRecording = variant === "recording";

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-[2px] sm:gap-1 h-16 sm:h-20 px-4",
        className
      )}
    >
      {waveformData.map((height, index) => (
        <motion.div
          key={index}
          className={cn(
            "w-1 sm:w-1.5 rounded-full",
            isRecording
              ? "bg-destructive"
              : "bg-primary"
          )}
          initial={{ height: 4 }}
          animate={{ 
            height: isActive ? `${height}%` : "8%",
            opacity: isActive ? 1 : 0.4,
          }}
          transition={{
            height: { duration: 0.05, ease: "linear" },
            opacity: { duration: 0.2 },
          }}
        />
      ))}
    </div>
  );
}

// Simpler static waveform for uploaded files
export function StaticWaveformVisualizer({
  progress = 0,
  className,
}: {
  progress?: number;
  className?: string;
}) {
  // Generate pseudo-random bar heights for visual interest
  const bars = Array.from({ length: 40 }, (_, i) => {
    const seed = (i * 17 + 7) % 100;
    return 20 + (seed / 100) * 60;
  });

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center gap-[2px] h-12 px-2 bg-muted/30 rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Progress overlay */}
      <motion.div
        className="absolute inset-y-0 left-0 bg-primary/20"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
      
      {/* Bars */}
      {bars.map((height, index) => {
        const isPassed = (index / bars.length) * 100 <= progress;
        return (
          <div
            key={index}
            className={cn(
              "w-1 rounded-full transition-colors duration-150",
              isPassed ? "bg-primary" : "bg-muted-foreground/30"
            )}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}
