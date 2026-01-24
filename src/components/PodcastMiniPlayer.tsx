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
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-50"
      >
        <div className="bg-card/98 backdrop-blur-2xl border border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Ambient glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          
          {/* Progress bar */}
          <div className="h-1.5 bg-muted/50 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            {/* Glowing dot at progress end */}
            <motion.div 
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"
              animate={{ left: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-4 relative z-10">
            {/* Top row: Info + Close */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Speaker avatar with pulse animation */}
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-offset-2 ring-offset-card transition-all",
                    currentSegment?.speaker === "host1"
                      ? "bg-gradient-to-br from-primary/30 to-primary/10 text-primary ring-primary/30"
                      : "bg-gradient-to-br from-secondary/30 to-secondary/10 text-secondary ring-secondary/30"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Podcast className="w-5 h-5" />
                  )}
                </motion.div>

                {/* Title and current text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {podcast?.title || "AI Podcast"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      currentSegment?.speaker === "host1" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-secondary/20 text-secondary"
                    )}>
                      {currentSegment?.name}
                    </span>
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {currentSegment?.text.substring(0, 40)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Expand and close buttons */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={handleExpand}
                  title="Expand"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
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
                  className="h-9 w-9 hover:bg-muted/80"
                  onClick={skipBack}
                  disabled={currentIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    size="icon"
                    className={cn(
                      "h-11 w-11 rounded-full shadow-lg transition-all",
                      isPlaying 
                        ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/30" 
                        : "bg-primary hover:bg-primary/90"
                    )}
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
                </motion.div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted/80"
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
                    className="h-8 w-8 hover:bg-muted/80"
                    onClick={handleMuteToggle}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
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
                    className="w-20"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                  <span className="text-xs font-medium text-foreground">
                    {currentIndex + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-xs text-muted-foreground">
                    {totalSegments}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
