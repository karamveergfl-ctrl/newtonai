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

interface BufferedAudioData {
  audio: HTMLAudioElement;
  speaker: "host1" | "host2";
  hash: string;
}

interface UsePodcastAudioQueueOptions {
  segments: AudioSegment[];
  language?: string;
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

// INCREASED: Buffer more segments for smoother playback
const BUFFER_SIZE = 4;
// INCREASED: More time between segments to prevent voice wobble
const SEGMENT_TRANSITION_DELAY = 150;
// Maximum text length per TTS chunk to prevent pitch drift
const MAX_TTS_CHUNK_LENGTH = 200;

// Generate unique hash for segment to validate correct audio
const getSegmentHash = (segment: AudioSegment, index: number): string => {
  return `${index}-${segment.speaker}-${segment.text.substring(0, 50)}`;
};

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
  const bufferRef = useRef<Map<number, BufferedAudioData>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const playbackRateRef = useRef(1);
  const languageRef = useRef(language);
  const segmentsRef = useRef(segments);
  const volumeRef = useRef(1);
  
  // Mutex and segment tracking to prevent race conditions
  const playingLockRef = useRef<boolean>(false);
  const currentSegmentIdRef = useRef<number>(0);
  // Track which speaker is currently active to prevent voice swapping
  const activeSpeakerRef = useRef<"host1" | "host2" | null>(null);
  // Track Web Speech progress for waveform
  const webSpeechProgressRef = useRef<number>(0);
  const webSpeechProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { speak, cancel: cancelSpeech, isSupported: webSpeechSupported } = useWebSpeechTTS();

  // Keep refs in sync
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Clear buffer when segments change to prevent stale/mismatched audio
  useEffect(() => {
    const prevSegments = segmentsRef.current;
    segmentsRef.current = segments;
    
    // If segments array changed, clear everything
    if (prevSegments !== segments) {
      console.log("Segments changed, clearing audio buffer");
      bufferRef.current.forEach(({ audio }) => {
        audio.pause();
        audio.onended = null;
        audio.ontimeupdate = null;
        audio.onerror = null;
        audio.src = "";
      });
      bufferRef.current.clear();
      currentSegmentIdRef.current = 0;
      playingLockRef.current = false;
      activeSpeakerRef.current = null;
    }
  }, [segments]);

  // Clear Web Speech progress interval
  const clearWebSpeechProgressInterval = useCallback(() => {
    if (webSpeechProgressIntervalRef.current) {
      clearInterval(webSpeechProgressIntervalRef.current);
      webSpeechProgressIntervalRef.current = null;
    }
  }, []);

  // Cleanup function to properly stop all audio and clear handlers
  const stopAllAudio = useCallback(() => {
    cancelSpeech();
    clearWebSpeechProgressInterval();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    
    // Clear event handlers on all buffered audio
    bufferRef.current.forEach(({ audio }) => {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.ontimeupdate = null;
      audio.onerror = null;
    });
    
    playingLockRef.current = false;
    activeSpeakerRef.current = null;
  }, [cancelSpeech, clearWebSpeechProgressInterval]);

  // Preload segment audio with speaker validation
  const preloadSegment = useCallback(async (index: number): Promise<BufferedAudioData | null> => {
    if (index >= segments.length || index < 0) return null;
    
    const segment = segments[index];
    const expectedHash = getSegmentHash(segment, index);
    
    // Check if already buffered with correct speaker
    const cached = bufferRef.current.get(index);
    if (cached) {
      // Validate speaker matches
      if (cached.speaker === segment.speaker && cached.hash === expectedHash) {
        return cached;
      } else {
        // Mismatch! Clear this entry
        console.warn(`Speaker mismatch at segment ${index}: cached ${cached.speaker} vs expected ${segment.speaker}`);
        cached.audio.pause();
        cached.audio.src = "";
        bufferRef.current.delete(index);
      }
    }

    if (!segment.audio || typeof segment.audio !== 'string' || segment.audio.length < 100) {
      console.log(`Segment ${index}: No valid audio data, will use fallback`);
      return null;
    }

    try {
      const audio = new Audio(`data:audio/mpeg;base64,${segment.audio}`);
      audio.preload = "auto";
      audio.volume = volumeRef.current;
      audio.playbackRate = playbackRateRef.current;
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Audio load timeout"));
        }, 8000); // Increased timeout
        
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

      const bufferedData: BufferedAudioData = {
        audio,
        speaker: segment.speaker,
        hash: expectedHash,
      };
      
      bufferRef.current.set(index, bufferedData);
      
      // Limit buffer size - keep more segments
      if (bufferRef.current.size > BUFFER_SIZE + 3) {
        const keysToRemove = Array.from(bufferRef.current.keys())
          .filter(k => k < index - 2)
          .slice(0, bufferRef.current.size - BUFFER_SIZE);
        keysToRemove.forEach(k => {
          const oldData = bufferRef.current.get(k);
          if (oldData) {
            oldData.audio.pause();
            oldData.audio.onended = null;
            oldData.audio.ontimeupdate = null;
            oldData.audio.onerror = null;
            oldData.audio.src = "";
            bufferRef.current.delete(k);
          }
        });
      }

      return bufferedData;
    } catch (error) {
      console.warn(`Segment ${index} audio failed to load:`, error);
      return null;
    }
  }, [segments]);

  // Preload upcoming segments
  const preloadUpcoming = useCallback(async (fromIndex: number) => {
    const preloadPromises: Promise<BufferedAudioData | null>[] = [];
    for (let i = fromIndex; i < Math.min(fromIndex + BUFFER_SIZE, segments.length); i++) {
      const segment = segments[i];
      const cached = bufferRef.current.get(i);
      // Only preload if not cached or speaker mismatch
      if (segment.audio && (!cached || cached.speaker !== segment.speaker)) {
        preloadPromises.push(preloadSegment(i));
      }
    }
    await Promise.all(preloadPromises);
  }, [segments, preloadSegment]);

  // Clean emotion tags from text before TTS
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      .replace(/\s*\([a-zA-Z]+\)\s*$/g, '')     // End: " (enthusiastic)"
      .replace(/\s*\([a-zA-Z]+\)\s*/g, ' ')     // Middle: "(curious) "
      .replace(/\s+/g, ' ')                      // Normalize whitespace
      .trim();
  }, []);

  // Split long text into smaller chunks for better TTS quality
  const splitTextIntoChunks = useCallback((text: string): string[] => {
    if (text.length <= MAX_TTS_CHUNK_LENGTH) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + " " + sentence).trim().length <= MAX_TTS_CHUNK_LENGTH) {
        currentChunk = (currentChunk + " " + sentence).trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    return chunks;
  }, []);

  // Play with Web Speech fallback - with progress tracking
  const playWithWebSpeech = useCallback(async (segment: AudioSegment, index: number, segmentId: number) => {
    // CRITICAL: Validate speaker hasn't changed
    if (activeSpeakerRef.current && activeSpeakerRef.current !== segment.speaker) {
      console.log(`Speaker change detected: ${activeSpeakerRef.current} -> ${segment.speaker}, stopping previous audio`);
      cancelSpeech();
    }
    
    activeSpeakerRef.current = segment.speaker;
    setUsingFallback(true);
    setStatus("playing");
    
    const cleanedText = cleanTextForSpeech(segment.text);
    const textLength = cleanedText.length;
    
    // Start progress tracking based on estimated reading time
    // Roughly 150 characters per second at normal speed
    const estimatedDuration = (textLength / 150) * 1000 / playbackRateRef.current;
    let startTime = Date.now();
    
    clearWebSpeechProgressInterval();
    webSpeechProgressRef.current = 0;
    
    webSpeechProgressIntervalRef.current = setInterval(() => {
      if (segmentId !== currentSegmentIdRef.current) {
        clearWebSpeechProgressInterval();
        return;
      }
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / estimatedDuration) * 100, 99);
      webSpeechProgressRef.current = progressPercent;
      setProgress(progressPercent);
      setCurrentTime(elapsed / 1000);
      setDuration(estimatedDuration / 1000);
    }, 50);
    
    try {
      await speak(cleanedText, {
        speaker: segment.speaker,
        rate: playbackRateRef.current,
        language: languageRef.current,
        onStart: () => {
          startTime = Date.now();
          setStatus("playing");
        },
        onEnd: () => {
          if (segmentId !== currentSegmentIdRef.current) return;
          
          clearWebSpeechProgressInterval();
          setProgress(100);
          playingLockRef.current = false;
          activeSpeakerRef.current = null;
          
          if (isPlayingRef.current && index < segments.length - 1) {
            setTimeout(() => {
              if (isPlayingRef.current && segmentId === currentSegmentIdRef.current) {
                playSegment(index + 1);
              }
            }, SEGMENT_TRANSITION_DELAY);
          } else if (index >= segments.length - 1) {
            setIsPlaying(false);
            setStatus("idle");
            onComplete?.();
          }
        },
        onError: (error) => {
          console.error("Web Speech error:", error);
          if (segmentId !== currentSegmentIdRef.current) return;
          
          clearWebSpeechProgressInterval();
          playingLockRef.current = false;
          activeSpeakerRef.current = null;
          
          if (isPlayingRef.current && index < segments.length - 1) {
            playSegment(index + 1);
          }
        },
      });
    } catch (error) {
      console.error("Web Speech playback error:", error);
      if (segmentId !== currentSegmentIdRef.current) return;
      
      clearWebSpeechProgressInterval();
      playingLockRef.current = false;
      activeSpeakerRef.current = null;
      
      if (isPlayingRef.current && index < segments.length - 1) {
        playSegment(index + 1);
      }
    }
  }, [speak, segments.length, onComplete, cancelSpeech, cleanTextForSpeech, clearWebSpeechProgressInterval]);

  // Main play segment function
  const playSegment = useCallback(async (index: number) => {
    if (index >= segments.length) {
      playingLockRef.current = false;
      activeSpeakerRef.current = null;
      setIsPlaying(false);
      setStatus("idle");
      onComplete?.();
      return;
    }

    // Increment segment ID to invalidate any pending old playback
    const segmentId = ++currentSegmentIdRef.current;
    
    // Stop any ongoing playback first
    stopAllAudio();
    
    if (segmentId !== currentSegmentIdRef.current) {
      return;
    }
    
    playingLockRef.current = true;

    setCurrentIndex(index);
    setProgress(0);
    onSegmentChange?.(index);

    const segment = segments[index];
    const expectedHash = getSegmentHash(segment, index);
    
    // CRITICAL: Set active speaker before any audio playback
    activeSpeakerRef.current = segment.speaker;
    console.log(`Playing segment ${index} with speaker: ${segment.speaker}`);

    // Start preloading upcoming segments
    preloadUpcoming(index + 1);

    // Try to use preloaded audio with speaker validation
    const bufferedData = bufferRef.current.get(index);
    
    // Validate buffered audio matches expected speaker
    const isValidBuffer = bufferedData && 
      bufferedData.speaker === segment.speaker && 
      bufferedData.hash === expectedHash;
    
    if (segment.audio && isValidBuffer) {
      const preloadedAudio = bufferedData.audio;
      
      // Double-check speaker before playing
      if (bufferedData.speaker !== segment.speaker) {
        console.error(`CRITICAL: Buffer speaker ${bufferedData.speaker} doesn't match segment speaker ${segment.speaker}`);
        bufferRef.current.delete(index);
        if (webSpeechSupported) {
          playWithWebSpeech(segment, index, segmentId);
        }
        return;
      }
      
      setUsingFallback(false);
      setStatus("playing");
      
      audioRef.current = preloadedAudio;
      preloadedAudio.currentTime = 0;
      preloadedAudio.volume = volumeRef.current;
      preloadedAudio.playbackRate = playbackRateRef.current;
      
      // Clear old handlers
      preloadedAudio.onended = null;
      preloadedAudio.ontimeupdate = null;
      preloadedAudio.onerror = null;
      
      preloadedAudio.ontimeupdate = () => {
        if (segmentId !== currentSegmentIdRef.current) return;
        
        setCurrentTime(preloadedAudio.currentTime);
        setDuration(preloadedAudio.duration || 0);
        if (preloadedAudio.duration) {
          setProgress((preloadedAudio.currentTime / preloadedAudio.duration) * 100);
        }
      };

      preloadedAudio.onended = () => {
        if (segmentId !== currentSegmentIdRef.current) return;
        
        playingLockRef.current = false;
        activeSpeakerRef.current = null;
        
        if (isPlayingRef.current) {
          setTimeout(() => {
            if (isPlayingRef.current && segmentId === currentSegmentIdRef.current) {
              playSegment(index + 1);
            }
          }, SEGMENT_TRANSITION_DELAY);
        }
      };

      preloadedAudio.onerror = () => {
        if (segmentId !== currentSegmentIdRef.current) return;
        
        console.error("Audio playback error, using fallback");
        playingLockRef.current = false;
        activeSpeakerRef.current = null;
        
        if (webSpeechSupported) {
          playWithWebSpeech(segment, index, segmentId);
        } else if (isPlayingRef.current) {
          playSegment(index + 1);
        }
      };

      try {
        await preloadedAudio.play();
      } catch (error) {
        if (segmentId !== currentSegmentIdRef.current) return;
        
        console.error("Failed to play audio:", error);
        playingLockRef.current = false;
        activeSpeakerRef.current = null;
        
        if (webSpeechSupported) {
          playWithWebSpeech(segment, index, segmentId);
        }
      }
    } else if (segment.audio) {
      // Audio exists but not preloaded or speaker mismatch, load it now
      setStatus("buffering");
      
      // Clear any mismatched buffer
      if (bufferedData && !isValidBuffer) {
        console.warn(`Clearing mismatched buffer for segment ${index}`);
        bufferedData.audio.pause();
        bufferedData.audio.src = "";
        bufferRef.current.delete(index);
      }
      
      const loadedData = await preloadSegment(index);
      
      if (segmentId !== currentSegmentIdRef.current) return;
      
      if (loadedData && isPlayingRef.current) {
        // Validate speaker one more time
        if (loadedData.speaker !== segment.speaker) {
          console.error(`Loaded data speaker mismatch: ${loadedData.speaker} vs ${segment.speaker}`);
          if (webSpeechSupported) {
            playWithWebSpeech(segment, index, segmentId);
          }
          return;
        }
        
        const audio = loadedData.audio;
        audioRef.current = audio;
        audio.currentTime = 0;
        audio.volume = volumeRef.current;
        audio.playbackRate = playbackRateRef.current;
        
        audio.onended = null;
        audio.ontimeupdate = null;
        audio.onerror = null;
        
        audio.ontimeupdate = () => {
          if (segmentId !== currentSegmentIdRef.current) return;
          
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration || 0);
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        audio.onended = () => {
          if (segmentId !== currentSegmentIdRef.current) return;
          
          playingLockRef.current = false;
          activeSpeakerRef.current = null;
          
          if (isPlayingRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current && segmentId === currentSegmentIdRef.current) {
                playSegment(index + 1);
              }
            }, SEGMENT_TRANSITION_DELAY);
          }
        };

        setStatus("playing");
        try {
          await audio.play();
        } catch (error) {
          if (segmentId !== currentSegmentIdRef.current) return;
          
          console.error("Failed to play audio:", error);
          playingLockRef.current = false;
          activeSpeakerRef.current = null;
          
          if (webSpeechSupported) {
            playWithWebSpeech(segment, index, segmentId);
          }
        }
      } else if (webSpeechSupported) {
        playWithWebSpeech(segment, index, segmentId);
      }
    } else if (webSpeechSupported || segment.fallbackAudio) {
      playWithWebSpeech(segment, index, segmentId);
    } else {
      console.warn(`No audio available for segment ${index}, skipping`);
      playingLockRef.current = false;
      activeSpeakerRef.current = null;
      
      if (isPlayingRef.current) {
        playSegment(index + 1);
      }
    }
  }, [segments, onSegmentChange, onComplete, preloadUpcoming, preloadSegment, stopAllAudio, webSpeechSupported, playWithWebSpeech]);

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
    clearWebSpeechProgressInterval();
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [cancelSpeech, clearWebSpeechProgressInterval]);

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
    setProgress(0);
    if (isPlaying) {
      stopAllAudio();
      playSegment(clampedIndex);
    }
  }, [segments.length, isPlaying, stopAllAudio, playSegment]);

  const skipForward = useCallback(() => {
    seekToSegment(currentIndexRef.current + 1);
  }, [seekToSegment]);

  const skipBack = useCallback(() => {
    seekToSegment(currentIndexRef.current - 1);
  }, [seekToSegment]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    volumeRef.current = newVolume;
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    playbackRateRef.current = rate;
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      stopAllAudio();
      bufferRef.current.forEach(({ audio }) => {
        audio.src = "";
      });
      bufferRef.current.clear();
      currentSegmentIdRef.current = 0;
      playingLockRef.current = false;
      activeSpeakerRef.current = null;
    };
  }, [stopAllAudio]);

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
