import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Hand,
  Loader2,
  Mic,
  X,
  Maximize2,
  Minimize2,
  Volume1,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePodcastAudioQueue, AudioSegment } from "@/hooks/usePodcastAudioQueue";
import { PodcastVoiceSettings } from "@/components/PodcastVoiceSettings";
import { PodcastSpeakingAvatar } from "@/components/PodcastSpeakingAvatar";
import { PodcastWaveform } from "@/components/PodcastWaveform";

export interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
  audio?: string;
  fallbackAudio?: boolean;
}

interface PodcastPlayerProps {
  title: string;
  segments: PodcastSegment[];
  onRaiseHand: () => void;
  isRaiseHandActive: boolean;
  onClose?: () => void;
}

export function PodcastPlayer({ 
  title, 
  segments, 
  onRaiseHand, 
  isRaiseHandActive,
  onClose 
}: PodcastPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Use the new audio queue hook
  const {
    status,
    currentIndex,
    isPlaying,
    progress,
    toggle,
    seekToSegment,
    skipForward,
    skipBack,
    setVolume,
    setPlaybackRate,
    volume,
    playbackRate,
    usingFallback,
    pause,
  } = usePodcastAudioQueue({
    segments: segments as AudioSegment[],
    onSegmentChange: (index) => {
      // Auto-scroll transcript to current segment
      if (transcriptRef.current) {
        const segmentElement = transcriptRef.current.querySelector(`[data-segment="${index}"]`);
        if (segmentElement) {
          segmentElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    },
    onComplete: () => {
      console.log("Podcast playback complete");
    },
  });

  const currentSeg = segments[currentIndex];
  const isLoading = status === "loading" || status === "buffering";

  // Handle raise hand
  const handleRaiseHand = useCallback(() => {
    pause();
    onRaiseHand();
  }, [pause, onRaiseHand]);

  // Pause when raise hand is active
  useEffect(() => {
    if (isRaiseHandActive && isPlaying) {
      pause();
    }
  }, [isRaiseHandActive, isPlaying, pause]);

  // Handle mute
  useEffect(() => {
    setVolume(isMuted ? 0 : 1);
  }, [isMuted, setVolume]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full",
        isFullscreen && "fixed inset-0 z-50 bg-background flex items-center justify-center p-8"
      )}
    >
      <Card className={cn(
        "p-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20",
        isFullscreen && "max-w-4xl w-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">
                Segment {currentIndex + 1} of {segments.length}
              </p>
            </div>
            {usingFallback && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Volume1 className="w-3 h-3" />
                Browser Voice
              </Badge>
            )}
            {status === "buffering" && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                Buffering...
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVoiceSettings(true)}
              title="Voice Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Speaker Avatars - NotebookLM Style */}
        <div className="flex justify-center items-end gap-12 mb-6">
          <PodcastSpeakingAvatar
            speaker="host1"
            name="Alex"
            isActive={isPlaying && currentSeg?.speaker === "host1"}
            isLoading={isLoading && currentSeg?.speaker === "host1"}
            size="lg"
          />
          <PodcastSpeakingAvatar
            speaker="host2"
            name="Sarah"
            isActive={isPlaying && currentSeg?.speaker === "host2"}
            isLoading={isLoading && currentSeg?.speaker === "host2"}
            size="lg"
          />
        </div>

        {/* Current Text Display */}
        <div className="mb-6 p-4 bg-card/50 rounded-lg min-h-[80px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-foreground/90 text-center text-lg leading-relaxed"
            >
              {currentSeg?.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Waveform Progress Bar */}
        <PodcastWaveform
          segments={segments}
          currentSegment={currentIndex}
          progress={progress}
          onSeekToSegment={seekToSegment}
          className="mb-6"
        />

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={skipBack} 
            disabled={currentIndex === 0}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            size="lg"
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
            onClick={toggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={skipForward}
            disabled={currentIndex === segments.length - 1}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={([v]) => {
                const newVolume = v / 100;
                setVolume(newVolume);
                if (v > 0) setIsMuted(false);
              }}
              max={100}
              step={1}
              className="w-24"
            />
          </div>

          {/* Speed */}
          <div className="flex items-center gap-1">
            {[0.75, 1, 1.25, 1.5].map((speed) => (
              <Button
                key={speed}
                variant={playbackRate === speed ? "secondary" : "ghost"}
                size="sm"
                className="text-xs px-2"
                onClick={() => setPlaybackRate(speed)}
              >
                {speed}x
              </Button>
            ))}
          </div>

          {/* Raise Hand */}
          <Button
            variant={isRaiseHandActive ? "secondary" : "outline"}
            size="sm"
            onClick={handleRaiseHand}
            className="gap-2"
            disabled={isRaiseHandActive}
          >
            {isRaiseHandActive ? (
              <>
                <Mic className="w-4 h-4 animate-pulse text-destructive" />
                Listening...
              </>
            ) : (
              <>
                <Hand className="w-4 h-4" />
                Raise Hand
              </>
            )}
          </Button>
        </div>

        {/* Transcript Preview */}
        <div ref={transcriptRef} className="mt-6 max-h-48 overflow-y-auto space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Transcript</h3>
          {segments.map((seg, idx) => (
            <motion.div
              key={idx}
              data-segment={idx}
              className={cn(
                "p-2 rounded text-sm cursor-pointer transition-colors",
                idx === currentIndex 
                  ? "bg-primary/10 border-l-2 border-primary" 
                  : "hover:bg-muted/50"
              )}
              onClick={() => seekToSegment(idx)}
              initial={{ opacity: 0.5 }}
              animate={{ 
                opacity: idx === currentIndex ? 1 : 0.7,
                scale: idx === currentIndex ? 1.01 : 1,
              }}
            >
              <span className={cn(
                "font-medium mr-2",
                seg.speaker === "host1" ? "text-primary" : "text-secondary"
              )}>
                {seg.name}:
              </span>
              <span className="text-foreground/80">{seg.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Voice Settings Dialog */}
        <PodcastVoiceSettings
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          onSave={() => {
            // Settings are stored in localStorage and will be used on next playback
          }}
        />
      </Card>
    </motion.div>
  );
}
