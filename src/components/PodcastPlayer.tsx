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
  User,
  Mic,
  X,
  Maximize2,
  Minimize2,
  Volume1,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";
import { PodcastVoiceSettings } from "@/components/PodcastVoiceSettings";

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
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to track current state for callbacks (avoids stale closures)
  const isPlayingRef = useRef(isPlaying);
  const isRaiseHandActiveRef = useRef(isRaiseHandActive);
  
  const { speak, cancel: cancelSpeech, isSupported: webSpeechSupported } = useWebSpeechTTS();

  // Keep refs in sync with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isRaiseHandActiveRef.current = isRaiseHandActive;
  }, [isRaiseHandActive]);

  const currentSeg = segments[currentSegment];

  const playSegment = useCallback(async (index: number) => {
    if (index >= segments.length) {
      setIsPlaying(false);
      setUsingFallback(false);
      return;
    }

    const segment = segments[index];
    
    // Check if segment needs fallback TTS
    const needsFallback = !segment.audio && (segment.fallbackAudio || webSpeechSupported);
    
    if (!segment.audio && !needsFallback) {
      // Skip to next if no audio and no fallback available
      setCurrentSegment(index + 1);
      playSegment(index + 1);
      return;
    }

    setIsLoading(true);
    setCurrentSegment(index);
    setUsingFallback(needsFallback);

    // Stop any ongoing HTML audio (but don't cancel speech here - let speak() handle it internally)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      if (segment.audio) {
        // Use ElevenLabs audio
        const audioUrl = `data:audio/mpeg;base64,${segment.audio}`;
        const audio = new Audio(audioUrl);
        audio.volume = isMuted ? 0 : volume;
        audio.playbackRate = playbackSpeed;
        audioRef.current = audio;

        audio.onended = () => {
          if (isPlaying && !isRaiseHandActive) {
            playSegment(index + 1);
          }
        };

        audio.onerror = () => {
          console.error("Audio playback error, trying fallback");
          setIsLoading(false);
          // Try fallback on error
          if (webSpeechSupported) {
            playWithWebSpeech(segment, index);
          }
        };

        audio.oncanplay = () => {
          setIsLoading(false);
          audio.play().catch(console.error);
        };
      } else {
        // Use Web Speech API fallback
        await playWithWebSpeech(segment, index);
      }
    } catch (error) {
      console.error("Error playing segment:", error);
      setIsLoading(false);
      // Move to next segment on error
      if (isPlaying && !isRaiseHandActive) {
        playSegment(index + 1);
      }
    }
  }, [segments, isMuted, volume, playbackSpeed, isPlaying, isRaiseHandActive, webSpeechSupported, cancelSpeech]);

  const playWithWebSpeech = useCallback(async (segment: PodcastSegment, index: number) => {
    setIsLoading(false);
    setUsingFallback(true);
    
    try {
      await speak(segment.text, {
        speaker: segment.speaker,
        rate: playbackSpeed,
      });
      // After speech completes successfully, check refs for current state
      if (isPlayingRef.current && !isRaiseHandActiveRef.current) {
        setTimeout(() => playSegment(index + 1), 100);
      }
    } catch (error) {
      console.error("Web Speech error:", error);
      // Only advance on actual errors
      if (isPlayingRef.current && !isRaiseHandActiveRef.current) {
        setTimeout(() => playSegment(index + 1), 100);
      }
    }
  }, [speak, playbackSpeed]);

  useEffect(() => {
    if (isPlaying && !isRaiseHandActive && !isLoading) {
      playSegment(currentSegment);
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, isRaiseHandActive]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      cancelSpeech();
    } else {
      setIsPlaying(true);
    }
  };

  const skipBack = () => {
    const newIndex = Math.max(0, currentSegment - 1);
    setCurrentSegment(newIndex);
    if (isPlaying) {
      playSegment(newIndex);
    }
  };

  const skipForward = () => {
    const newIndex = Math.min(segments.length - 1, currentSegment + 1);
    setCurrentSegment(newIndex);
    if (isPlaying) {
      playSegment(newIndex);
    }
  };

  const handleRaiseHand = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    cancelSpeech();
    onRaiseHand();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const progress = ((currentSegment + 1) / segments.length) * 100;

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
                Segment {currentSegment + 1} of {segments.length}
              </p>
            </div>
            {usingFallback && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Volume1 className="w-3 h-3" />
                Browser Voice
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

        {/* Current Speaker Display */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-card/50 rounded-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSeg?.speaker}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                currentSeg?.speaker === "host1" 
                  ? "bg-primary/20 text-primary" 
                  : "bg-secondary/20 text-secondary"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="flex-1">
            <p className={cn(
              "font-semibold",
              currentSeg?.speaker === "host1" ? "text-primary" : "text-secondary"
            )}>
              {currentSeg?.name || "Host"}
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentSegment}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-foreground/80 text-sm line-clamp-3"
              >
                {currentSeg?.text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{currentSegment + 1}</span>
            <span>{segments.length}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={skipBack} disabled={currentSegment === 0}>
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            size="lg"
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
            onClick={togglePlay}
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
            disabled={currentSegment === segments.length - 1}
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
                setVolume(v / 100);
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
                variant={playbackSpeed === speed ? "secondary" : "ghost"}
                size="sm"
                className="text-xs px-2"
                onClick={() => setPlaybackSpeed(speed)}
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
        <div className="mt-6 max-h-48 overflow-y-auto space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Transcript</h3>
          {segments.map((seg, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "p-2 rounded text-sm cursor-pointer transition-colors",
                idx === currentSegment 
                  ? "bg-primary/10 border-l-2 border-primary" 
                  : "hover:bg-muted/50"
              )}
              onClick={() => {
                setCurrentSegment(idx);
                if (isPlaying) playSegment(idx);
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
