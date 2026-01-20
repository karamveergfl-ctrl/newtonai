import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  Maximize2,
  Volume2,
  VolumeX,
  Podcast,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePodcastContextSafe } from "@/contexts/PodcastContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function PodcastMiniPlayer() {
  const podcastContext = usePodcastContextSafe();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);

  if (!podcastContext || !podcastContext.isActive || !podcastContext.isMinimized) {
    return null;
  }

  const {
    podcast,
    currentSegment,
    currentIndex,
    isPlaying,
    status,
    toggle,
    skipForward,
    skipBack,
    closePodcast,
    setIsMinimized,
    setVolume,
    volume,
  } = podcastContext;

  const isLoading = status === "loading" || status === "buffering";
  const totalSegments = podcast?.segments.length || 0;
  const progress = totalSegments > 0 ? ((currentIndex + 1) / totalSegments) * 100 : 0;

  const handleExpand = () => {
    setIsMinimized(false);
    navigate("/tools/ai-podcast");
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    setVolume(isMuted ? 1 : 0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-3">
            {/* Top row: Info + Close */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Speaker avatar */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    currentSegment?.speaker === "host1"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/20 text-secondary"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Podcast className="w-5 h-5" />
                  )}
                </div>

                {/* Title and current text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {podcast?.title || "AI Podcast"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentSegment?.name}: {currentSegment?.text.substring(0, 50)}...
                  </p>
                </div>
              </div>

              {/* Expand and close buttons */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleExpand}
                  title="Expand"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={closePodcast}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Bottom row: Controls */}
            <div className="flex items-center justify-between">
              {/* Playback controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={skipBack}
                  disabled={currentIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                  onClick={toggle}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={skipForward}
                  disabled={currentIndex === totalSegments - 1}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              {/* Volume + Segment counter */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleMuteToggle}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={([v]) => {
                      setVolume(v / 100);
                      if (v > 0) setIsMuted(false);
                    }}
                    max={100}
                    step={1}
                    className="w-16"
                  />
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {currentIndex + 1}/{totalSegments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
