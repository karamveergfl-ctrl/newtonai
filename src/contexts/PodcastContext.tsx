import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { usePodcastAudioQueue, AudioSegment, QueueStatus } from "@/hooks/usePodcastAudioQueue";

export interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
  audio?: string;
  fallbackAudio?: boolean;
}

interface PodcastData {
  title: string;
  segments: PodcastSegment[];
  sourceContent?: string;
  language?: string; // Language code for voice selection
}

interface PodcastContextType {
  // Podcast data
  podcast: PodcastData | null;
  setPodcast: (podcast: PodcastData | null) => void;
  
  // Playback state
  isActive: boolean;
  status: QueueStatus;
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  usingFallback: boolean;
  
  // Controls
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekToSegment: (index: number) => void;
  skipForward: () => void;
  skipBack: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  volume: number;
  playbackRate: number;
  
  // Mini player
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  closePodcast: () => void;
  
  // Current segment
  currentSegment: PodcastSegment | null;
}

const PodcastContext = createContext<PodcastContextType | null>(null);

export function usePodcastContext() {
  const context = useContext(PodcastContext);
  if (!context) {
    throw new Error("usePodcastContext must be used within a PodcastProvider");
  }
  return context;
}

export function usePodcastContextSafe() {
  return useContext(PodcastContext);
}

interface PodcastProviderProps {
  children: ReactNode;
}

export function PodcastProvider({ children }: PodcastProviderProps) {
  const [podcast, setPodcastState] = useState<PodcastData | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const audioQueue = usePodcastAudioQueue({
    segments: (podcast?.segments || []) as AudioSegment[],
    language: podcast?.language || "en", // Pass language for consistent voice
    onComplete: () => {
      // Optionally close or minimize on complete
    },
  });

  const setPodcast = useCallback((newPodcast: PodcastData | null) => {
    setPodcastState(newPodcast);
    setIsMinimized(false);
    if (newPodcast) {
      // Auto-play when podcast is set
      setTimeout(() => audioQueue.play(), 100);
    }
  }, [audioQueue]);

  const closePodcast = useCallback(() => {
    audioQueue.pause();
    setPodcastState(null);
    setIsMinimized(false);
  }, [audioQueue]);

  const currentSegment = podcast?.segments[audioQueue.currentIndex] || null;

  const value: PodcastContextType = {
    podcast,
    setPodcast,
    isActive: !!podcast,
    status: audioQueue.status,
    currentIndex: audioQueue.currentIndex,
    isPlaying: audioQueue.isPlaying,
    progress: audioQueue.progress,
    currentTime: audioQueue.currentTime,
    duration: audioQueue.duration,
    usingFallback: audioQueue.usingFallback,
    play: audioQueue.play,
    pause: audioQueue.pause,
    toggle: audioQueue.toggle,
    seekToSegment: audioQueue.seekToSegment,
    skipForward: audioQueue.skipForward,
    skipBack: audioQueue.skipBack,
    setVolume: audioQueue.setVolume,
    setPlaybackRate: audioQueue.setPlaybackRate,
    volume: audioQueue.volume,
    playbackRate: audioQueue.playbackRate,
    isMinimized,
    setIsMinimized,
    closePodcast,
    currentSegment,
  };

  return (
    <PodcastContext.Provider value={value}>
      {children}
    </PodcastContext.Provider>
  );
}
