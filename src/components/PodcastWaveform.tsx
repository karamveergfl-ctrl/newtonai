import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PodcastWaveformProps {
  segments: { speaker: "host1" | "host2" }[];
  currentSegment: number;
  progress: number;
  onSeekToSegment: (index: number) => void;
  className?: string;
  isPlaying?: boolean;
}

export function PodcastWaveform({
  segments,
  currentSegment,
  progress,
  onSeekToSegment,
  className,
  isPlaying = false,
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

  // Calculate time display
  const timeDisplay = useMemo(() => {
    const currentSeg = currentSegment + 1;
    const totalSegs = segments.length;
    const progressPercent = Math.round(overallProgress);
    return { currentSeg, totalSegs, progressPercent };
  }, [currentSegment, segments.length, overallProgress]);

  return (
    <div className={cn("relative", className)}>
      {/* Waveform container */}
      <div
        className="relative h-16 bg-muted/30 rounded-lg overflow-hidden cursor-pointer group"
        onClick={handleClick}
      >
        {/* Progress overlay with gradient */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/30 via-primary/20 to-secondary/20"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.15, ease: "linear" }}
        />

        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center">
          {segments.map((segment, segIdx) => (
            <div
              key={segIdx}
              className={cn(
                "flex-1 flex items-center justify-center gap-[1px] px-[1px] h-full transition-opacity duration-200",
                segIdx === currentSegment ? "opacity-100" : "opacity-70 group-hover:opacity-90"
              )}
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
                        ? isHost1 ? "bg-teal-500" : "bg-indigo-500"
                        : "bg-muted-foreground/30"
                    )}
                    style={{ height: `${height}%` }}
                    initial={{ scaleY: 0 }}
                    animate={{ 
                      scaleY: 1,
                      opacity: isCurrent && isActive && isPlaying ? [0.7, 1, 0.7] : 1,
                    }}
                    transition={{
                      scaleY: { duration: 0.3, delay: (segIdx * 8 + barIdx) * 0.01 },
                      opacity: isCurrent && isActive && isPlaying ? { duration: 0.5, repeat: Infinity } : {},
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Segment markers with speaker color */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {segments.map((segment, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 h-1.5 transition-all duration-200",
                idx < currentSegment
                  ? segment.speaker === "host1" ? "bg-teal-500" : "bg-indigo-500"
                  : idx === currentSegment
                    ? segment.speaker === "host1" ? "bg-teal-500/70" : "bg-indigo-500/70"
                    : "bg-muted/50"
              )}
            />
          ))}
        </div>

        {/* Playhead with glow effect */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground shadow-lg"
          style={{
            boxShadow: "0 0 8px 2px rgba(var(--foreground), 0.3)",
          }}
          initial={{ left: 0 }}
          animate={{ left: `${overallProgress}%` }}
          transition={{ duration: 0.15, ease: "linear" }}
        />

        {/* Hover preview indicator */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
            Click to seek
          </div>
        </div>
      </div>

      {/* Time indicators with progress */}
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">Segment {timeDisplay.currentSeg}</span>
          <span className="text-muted-foreground/60">of {timeDisplay.totalSegs}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-[10px]">Alex</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px]">Sarah</span>
          </div>
        </div>
        <span className="font-mono">{timeDisplay.progressPercent}%</span>
      </div>
    </div>
  );
}
