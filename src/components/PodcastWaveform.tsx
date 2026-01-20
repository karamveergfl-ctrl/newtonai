import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PodcastWaveformProps {
  segments: { speaker: "host1" | "host2" }[];
  currentSegment: number;
  progress: number;
  onSeekToSegment: (index: number) => void;
  className?: string;
}

export function PodcastWaveform({
  segments,
  currentSegment,
  progress,
  onSeekToSegment,
  className,
}: PodcastWaveformProps) {
  // Generate pseudo-random bar heights for visual interest
  const barHeights = useMemo(() => {
    return segments.map((_, segIdx) => {
      const bars: number[] = [];
      const barsPerSegment = 8;
      for (let i = 0; i < barsPerSegment; i++) {
        // Pseudo-random height based on segment and bar index
        const seed = (segIdx * 17 + i * 31) % 100;
        bars.push(20 + (seed / 100) * 60);
      }
      return bars;
    });
  }, [segments]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    const segmentIndex = Math.floor(percentage * segments.length);
    onSeekToSegment(Math.max(0, Math.min(segmentIndex, segments.length - 1)));
  }, [segments.length, onSeekToSegment]);

  const overallProgress = useMemo(() => {
    const segmentProgress = (currentSegment / segments.length) * 100;
    const withinSegmentProgress = (progress / 100) * (100 / segments.length);
    return segmentProgress + withinSegmentProgress;
  }, [currentSegment, segments.length, progress]);

  return (
    <div className={cn("relative", className)}>
      {/* Waveform container */}
      <div
        className="relative h-16 bg-muted/30 rounded-lg overflow-hidden cursor-pointer"
        onClick={handleClick}
      >
        {/* Progress overlay */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/20 to-secondary/20"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />

        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center">
          {segments.map((segment, segIdx) => (
            <div
              key={segIdx}
              className="flex-1 flex items-center justify-center gap-[1px] px-[1px] h-full"
            >
              {barHeights[segIdx].map((height, barIdx) => {
                const isBeforeCurrent = segIdx < currentSegment;
                const isCurrent = segIdx === currentSegment;
                const barProgress = (barIdx / barHeights[segIdx].length) * 100;
                const isActive = isCurrent && barProgress <= progress;
                
                const isHost1 = segment.speaker === "host1";
                
                return (
                  <motion.div
                    key={barIdx}
                    className={cn(
                      "w-1 rounded-full transition-colors duration-150",
                      isBeforeCurrent || isActive
                        ? isHost1 ? "bg-primary" : "bg-secondary"
                        : "bg-muted-foreground/30"
                    )}
                    style={{ height: `${height}%` }}
                    initial={{ scaleY: 0 }}
                    animate={{ 
                      scaleY: 1,
                      opacity: isCurrent && isActive ? [0.7, 1, 0.7] : 1,
                    }}
                    transition={{
                      scaleY: { duration: 0.3, delay: (segIdx * 8 + barIdx) * 0.01 },
                      opacity: isCurrent && isActive ? { duration: 0.5, repeat: Infinity } : {},
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Segment markers */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {segments.map((segment, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 h-1 transition-colors",
                idx < currentSegment
                  ? segment.speaker === "host1" ? "bg-primary" : "bg-secondary"
                  : idx === currentSegment
                    ? segment.speaker === "host1" ? "bg-primary/50" : "bg-secondary/50"
                    : "bg-transparent"
              )}
            />
          ))}
        </div>

        {/* Playhead */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground shadow-lg"
          initial={{ left: 0 }}
          animate={{ left: `${overallProgress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      {/* Time indicators */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Segment {currentSegment + 1}</span>
        <span>{segments.length} segments</span>
      </div>
    </div>
  );
}
