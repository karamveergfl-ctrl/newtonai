import { useState, useRef, useCallback, useEffect } from "react";
import { useWebSpeechTTS } from "./useWebSpeechTTS";

export type QueueStatus = "idle" | "loading" | "buffering" | "playing" | "paused" | "error";

export interface AudioSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
  audio?: string | null;
  fallbackAudio?: boolean;
}

interface UsePodcastAudioQueueOptions {
  segments: AudioSegment[];
  language?: string; // Language code for Web Speech fallback
  onSegmentChange?: (index: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface UsePodcastAudioQueueReturn {
  status: QueueStatus;
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
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
  usingFallback: boolean;
}

const BUFFER_SIZE = 2; // Preload next 2 segments

export function usePodcastAudioQueue({
  segments,
  language = "en",
  onSegmentChange,
  onComplete,
  onError,
}: UsePodcastAudioQueueOptions): UsePodcastAudioQueueReturn {
  const [status, setStatus] = useState<QueueStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [usingFallback, setUsingFallback] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bufferRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const playbackRateRef = useRef(1);
  const languageRef = useRef(language);

  const { speak, cancel: cancelSpeech, isSupported: webSpeechSupported } = useWebSpeechTTS();

  // Keep language ref in sync
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Keep refs in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // Preload segment audio with validation and timeout
  const preloadSegment = useCallback(async (index: number): Promise<HTMLAudioElement | null> => {
    if (index >= segments.length || index < 0) return null;
    
    // Check if already buffered
    if (bufferRef.current.has(index)) {
      return bufferRef.current.get(index)!;
    }

    const segment = segments[index];
    
    // Validate audio data - must be base64 string with reasonable length
    if (!segment.audio || typeof segment.audio !== 'string' || segment.audio.length < 100) {
      console.log(`Segment ${index}: No valid audio data, will use fallback`);
      return null;
    }

    try {
      const audio = new Audio(`data:audio/mpeg;base64,${segment.audio}`);
      audio.preload = "auto";
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      
      // Add timeout to prevent hanging on invalid audio
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Audio load timeout"));
        }, 5000);
        
        audio.oncanplaythrough = () => {
          clearTimeout(timeout);
          resolve();
        };
        audio.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Failed to load audio"));
        };
        audio.load();
      });

      bufferRef.current.set(index, audio);
      
      // Limit buffer size - clean up old segments
      if (bufferRef.current.size > BUFFER_SIZE + 2) {
        const keysToRemove = Array.from(bufferRef.current.keys())
          .filter(k => k < index - 1)
          .slice(0, bufferRef.current.size - BUFFER_SIZE);
        keysToRemove.forEach(k => {
          const oldAudio = bufferRef.current.get(k);
          if (oldAudio) {
            oldAudio.src = "";
            bufferRef.current.delete(k);
          }
        });
      }

      return audio;
    } catch (error) {
      console.warn(`Segment ${index} audio failed to load, will use fallback:`, error);
      return null;
    }
  }, [segments, volume, playbackRate]);

  // Preload upcoming segments
  const preloadUpcoming = useCallback(async (fromIndex: number) => {
    const preloadPromises: Promise<HTMLAudioElement | null>[] = [];
    for (let i = fromIndex; i < Math.min(fromIndex + BUFFER_SIZE, segments.length); i++) {
      if (!bufferRef.current.has(i) && segments[i].audio) {
        preloadPromises.push(preloadSegment(i));
      }
    }
    await Promise.all(preloadPromises);
  }, [segments, preloadSegment]);

  // Play with Web Speech fallback
  const playWithWebSpeech = useCallback(async (segment: AudioSegment, index: number) => {
    setUsingFallback(true);
    setStatus("playing");
    
    try {
      await speak(segment.text, {
        speaker: segment.speaker,
        rate: playbackRateRef.current,
        language: languageRef.current, // Pass language for correct voice selection
        onStart: () => setStatus("playing"),
        onEnd: () => {
          if (isPlayingRef.current && index < segments.length - 1) {
            playSegment(index + 1);
          } else if (index >= segments.length - 1) {
            setIsPlaying(false);
            setStatus("idle");
            onComplete?.();
          }
        },
        onError: (error) => {
          console.error("Web Speech error:", error);
          // Continue to next segment on error
          if (isPlayingRef.current && index < segments.length - 1) {
            playSegment(index + 1);
          }
        },
      });
    } catch (error) {
      console.error("Web Speech playback error:", error);
      if (isPlayingRef.current && index < segments.length - 1) {
        playSegment(index + 1);
      }
    }
  }, [speak, segments.length, onComplete]);

  // Main play segment function
  const playSegment = useCallback(async (index: number) => {
    if (index >= segments.length) {
      setIsPlaying(false);
      setStatus("idle");
      onComplete?.();
      return;
    }

    // Cancel any ongoing playback
    cancelSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setCurrentIndex(index);
    onSegmentChange?.(index);

    const segment = segments[index];

    // Start preloading upcoming segments
    preloadUpcoming(index + 1);

    // Try to use preloaded audio
    const preloadedAudio = bufferRef.current.get(index);
    
    if (segment.audio && preloadedAudio) {
      // Use ElevenLabs audio
      setUsingFallback(false);
      setStatus("playing");
      
      audioRef.current = preloadedAudio;
      preloadedAudio.volume = volume;
      preloadedAudio.playbackRate = playbackRateRef.current;
      
      preloadedAudio.ontimeupdate = () => {
        setCurrentTime(preloadedAudio.currentTime);
        setDuration(preloadedAudio.duration || 0);
        if (preloadedAudio.duration) {
          setProgress((preloadedAudio.currentTime / preloadedAudio.duration) * 100);
        }
      };

      preloadedAudio.onended = () => {
        if (isPlayingRef.current) {
          playSegment(index + 1);
        }
      };

      preloadedAudio.onerror = () => {
        console.error("Audio playback error, using fallback");
        if (webSpeechSupported) {
          playWithWebSpeech(segment, index);
        } else if (isPlayingRef.current) {
          playSegment(index + 1);
        }
      };

      try {
        await preloadedAudio.play();
      } catch (error) {
        console.error("Failed to play audio:", error);
        if (webSpeechSupported) {
          playWithWebSpeech(segment, index);
        }
      }
    } else if (segment.audio) {
      // Audio exists but not preloaded, load it now
      setStatus("buffering");
      const audio = await preloadSegment(index);
      
      if (audio && isPlayingRef.current) {
        audioRef.current = audio;
        audio.volume = volume;
        audio.playbackRate = playbackRateRef.current;
        
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration || 0);
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        audio.onended = () => {
          if (isPlayingRef.current) {
            playSegment(index + 1);
          }
        };

        setStatus("playing");
        try {
          await audio.play();
        } catch (error) {
          console.error("Failed to play audio:", error);
          if (webSpeechSupported) {
            playWithWebSpeech(segment, index);
          }
        }
      } else if (webSpeechSupported) {
        playWithWebSpeech(segment, index);
      }
    } else if (webSpeechSupported || segment.fallbackAudio) {
      // Use Web Speech fallback
      playWithWebSpeech(segment, index);
    } else {
      // Skip segment if no audio available
      console.warn(`No audio available for segment ${index}, skipping`);
      if (isPlayingRef.current) {
        playSegment(index + 1);
      }
    }
  }, [segments, volume, onSegmentChange, onComplete, preloadUpcoming, preloadSegment, cancelSpeech, webSpeechSupported, playWithWebSpeech]);

  // Control functions
  const play = useCallback(() => {
    setIsPlaying(true);
    if (status === "paused" && audioRef.current) {
      audioRef.current.play().catch(console.error);
      setStatus("playing");
    } else {
      playSegment(currentIndexRef.current);
    }
  }, [status, playSegment]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    setStatus("paused");
    cancelSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [cancelSpeech]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekToSegment = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, segments.length - 1));
    setCurrentIndex(clampedIndex);
    if (isPlaying) {
      cancelSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      playSegment(clampedIndex);
    }
  }, [segments.length, isPlaying, cancelSpeech, playSegment]);

  const skipForward = useCallback(() => {
    seekToSegment(currentIndexRef.current + 1);
  }, [seekToSegment]);

  const skipBack = useCallback(() => {
    seekToSegment(currentIndexRef.current - 1);
  }, [seekToSegment]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      cancelSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      bufferRef.current.forEach(audio => {
        audio.pause();
        audio.src = "";
      });
      bufferRef.current.clear();
    };
  }, [cancelSpeech]);

  // Preload first few segments on mount
  useEffect(() => {
    if (segments.length > 0) {
      preloadUpcoming(0);
    }
  }, [segments, preloadUpcoming]);

  return {
    status,
    currentIndex,
    isPlaying,
    progress,
    currentTime,
    duration,
    play,
    pause,
    toggle,
    seekToSegment,
    skipForward,
    skipBack,
    setVolume,
    setPlaybackRate,
    volume,
    playbackRate,
    usingFallback,
  };
}
