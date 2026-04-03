import { useState, useRef, useCallback, useEffect } from "react";
import { useWebSpeechTTS, LockedVoices } from "./useWebSpeechTTS";

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

const BUFFER_SIZE = 4;
const SEGMENT_TRANSITION_DELAY = 300; // Increased for smoother transitions

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

  // Promise-based play lock — serialises playSegment calls
  const playChainRef = useRef<Promise<void>>(Promise.resolve());
  const currentSegmentIdRef = useRef<number>(0);
  
  // Locked voices for the entire session
  const lockedVoicesRef = useRef<LockedVoices | null>(null);
  
  // Chrome keepalive interval
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Web Speech progress tracking
  const webSpeechProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { speak, cancel: cancelSpeech, isSupported: webSpeechSupported, lockVoices } = useWebSpeechTTS();

  // Keep refs in sync
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // Clear buffer when segments change
  useEffect(() => {
    const prev = segmentsRef.current;
    segmentsRef.current = segments;
    if (prev !== segments) {
      bufferRef.current.forEach(({ audio }) => {
        audio.pause(); audio.onended = null; audio.ontimeupdate = null; audio.onerror = null; audio.src = "";
      });
      bufferRef.current.clear();
      currentSegmentIdRef.current = 0;
      lockedVoicesRef.current = null; // Reset locked voices for new podcast
      playChainRef.current = Promise.resolve();
    }
  }, [segments]);

  const clearProgressInterval = useCallback(() => {
    if (webSpeechProgressIntervalRef.current) {
      clearInterval(webSpeechProgressIntervalRef.current);
      webSpeechProgressIntervalRef.current = null;
    }
  }, []);

  const startKeepalive = useCallback(() => {
    if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    keepaliveRef.current = setInterval(() => {
      if (typeof speechSynthesis !== "undefined" && !speechSynthesis.paused) {
        speechSynthesis.resume();
      }
    }, 8000);
  }, []);

  const stopKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }
  }, []);

  // Full audio stop with await-style cancel
  const stopAllAudio = useCallback(async () => {
    cancelSpeech();
    clearProgressInterval();
    stopKeepalive();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }

    bufferRef.current.forEach(({ audio }) => {
      audio.pause(); audio.currentTime = 0;
      audio.onended = null; audio.ontimeupdate = null; audio.onerror = null;
    });

    // Give browser 50ms to fully release previous speech context
    await new Promise(r => setTimeout(r, 50));
  }, [cancelSpeech, clearProgressInterval, stopKeepalive]);

  // Preload segment
  const preloadSegment = useCallback(async (index: number): Promise<BufferedAudioData | null> => {
    if (index >= segments.length || index < 0) return null;
    const segment = segments[index];
    const expectedHash = getSegmentHash(segment, index);

    const cached = bufferRef.current.get(index);
    if (cached && cached.speaker === segment.speaker && cached.hash === expectedHash) return cached;
    if (cached) { cached.audio.pause(); cached.audio.src = ""; bufferRef.current.delete(index); }

    if (!segment.audio || typeof segment.audio !== 'string' || segment.audio.length < 100) return null;

    try {
      const audio = new Audio(`data:audio/mpeg;base64,${segment.audio}`);
      audio.preload = "auto";
      audio.volume = volumeRef.current;
      audio.playbackRate = playbackRateRef.current;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Audio load timeout")), 8000);
        audio.oncanplaythrough = () => { clearTimeout(timeout); resolve(); };
        audio.onerror = () => { clearTimeout(timeout); reject(new Error("Failed to load audio")); };
        audio.load();
      });

      const data: BufferedAudioData = { audio, speaker: segment.speaker, hash: expectedHash };
      bufferRef.current.set(index, data);

      // Evict old entries
      if (bufferRef.current.size > BUFFER_SIZE + 3) {
        Array.from(bufferRef.current.keys())
          .filter(k => k < index - 2)
          .slice(0, bufferRef.current.size - BUFFER_SIZE)
          .forEach(k => {
            const old = bufferRef.current.get(k);
            if (old) { old.audio.pause(); old.audio.src = ""; bufferRef.current.delete(k); }
          });
      }
      return data;
    } catch {
      return null;
    }
  }, [segments]);

  const preloadUpcoming = useCallback(async (fromIndex: number) => {
    const promises: Promise<BufferedAudioData | null>[] = [];
    for (let i = fromIndex; i < Math.min(fromIndex + BUFFER_SIZE, segments.length); i++) {
      const seg = segments[i];
      const cached = bufferRef.current.get(i);
      if (seg.audio && (!cached || cached.speaker !== seg.speaker)) {
        promises.push(preloadSegment(i));
      }
    }
    await Promise.all(promises);
  }, [segments, preloadSegment]);

  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      .replace(/\s*\([a-zA-Z]+\)\s*$/g, '')
      .replace(/\s*\([a-zA-Z]+\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Ensure voices are locked for this session
  const ensureLockedVoices = useCallback((): LockedVoices => {
    if (!lockedVoicesRef.current) {
      lockedVoicesRef.current = lockVoices(languageRef.current);
    }
    return lockedVoicesRef.current;
  }, [lockVoices]);

  // Play with Web Speech — uses locked voices
  const playWithWebSpeech = useCallback(async (
    segment: AudioSegment, index: number, segmentId: number
  ) => {
    setUsingFallback(true);
    setStatus("playing");

    const locked = ensureLockedVoices();
    const lockedVoice = segment.speaker === "host2" ? locked.host2Voice : locked.host1Voice;

    const cleanedText = cleanTextForSpeech(segment.text);
    const textLength = cleanedText.length;
    const estimatedDuration = (textLength / 150) * 1000 / playbackRateRef.current;
    let startTime = Date.now();

    clearProgressInterval();

    webSpeechProgressIntervalRef.current = setInterval(() => {
      if (segmentId !== currentSegmentIdRef.current) { clearProgressInterval(); return; }
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / estimatedDuration) * 100, 99));
      setCurrentTime(elapsed / 1000);
      setDuration(estimatedDuration / 1000);
    }, 50);

    startKeepalive();

    try {
      await speak(cleanedText, {
        speaker: segment.speaker,
        rate: playbackRateRef.current,
        language: languageRef.current,
        lockedVoice: lockedVoice || undefined,
        onStart: () => { startTime = Date.now(); setStatus("playing"); },
        onEnd: () => {
          if (segmentId !== currentSegmentIdRef.current) return;
          clearProgressInterval();
          stopKeepalive();
          setProgress(100);

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
        onError: () => {
          if (segmentId !== currentSegmentIdRef.current) return;
          clearProgressInterval();
          stopKeepalive();
          if (isPlayingRef.current && index < segments.length - 1) playSegment(index + 1);
        },
      });
    } catch {
      if (segmentId !== currentSegmentIdRef.current) return;
      clearProgressInterval();
      stopKeepalive();
      if (isPlayingRef.current && index < segments.length - 1) playSegment(index + 1);
    }
  }, [speak, segments.length, onComplete, cleanTextForSpeech, clearProgressInterval, startKeepalive, stopKeepalive, ensureLockedVoices]);

  // Main play segment — serialised via promise chain
  const playSegment = useCallback((index: number) => {
    playChainRef.current = playChainRef.current.then(async () => {
      if (index >= segments.length) {
        setIsPlaying(false);
        setStatus("idle");
        onComplete?.();
        return;
      }

      const segmentId = ++currentSegmentIdRef.current;

      // Stop previous audio and wait for full cleanup
      await stopAllAudio();
      if (segmentId !== currentSegmentIdRef.current) return;

      setCurrentIndex(index);
      setProgress(0);
      onSegmentChange?.(index);

      const segment = segments[index];
      const expectedHash = getSegmentHash(segment, index);

      // Preload upcoming
      preloadUpcoming(index + 1);

      // Try buffered audio
      const buffered = bufferRef.current.get(index);
      const isValid = buffered && buffered.speaker === segment.speaker && buffered.hash === expectedHash;

      if (segment.audio && isValid) {
        setUsingFallback(false);
        setStatus("playing");

        const preloaded = buffered.audio;
        audioRef.current = preloaded;
        preloaded.currentTime = 0;
        preloaded.volume = volumeRef.current;
        preloaded.playbackRate = playbackRateRef.current;
        preloaded.onended = null; preloaded.ontimeupdate = null; preloaded.onerror = null;

        preloaded.ontimeupdate = () => {
          if (segmentId !== currentSegmentIdRef.current) return;
          setCurrentTime(preloaded.currentTime);
          setDuration(preloaded.duration || 0);
          if (preloaded.duration) setProgress((preloaded.currentTime / preloaded.duration) * 100);
        };

        preloaded.onended = () => {
          if (segmentId !== currentSegmentIdRef.current) return;
          if (isPlayingRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current && segmentId === currentSegmentIdRef.current) playSegment(index + 1);
            }, SEGMENT_TRANSITION_DELAY);
          }
        };

        preloaded.onerror = () => {
          if (segmentId !== currentSegmentIdRef.current) return;
          if (webSpeechSupported) playWithWebSpeech(segment, index, segmentId);
          else if (isPlayingRef.current) playSegment(index + 1);
        };

        try {
          await preloaded.play();
        } catch {
          if (segmentId !== currentSegmentIdRef.current) return;
          if (webSpeechSupported) playWithWebSpeech(segment, index, segmentId);
        }
      } else if (segment.audio) {
        // Audio exists but not preloaded — load now
        setStatus("buffering");
        if (buffered && !isValid) {
          buffered.audio.pause(); buffered.audio.src = ""; bufferRef.current.delete(index);
        }
        const loaded = await preloadSegment(index);
        if (segmentId !== currentSegmentIdRef.current) return;

        if (loaded && isPlayingRef.current && loaded.speaker === segment.speaker) {
          const audio = loaded.audio;
          audioRef.current = audio;
          audio.currentTime = 0;
          audio.volume = volumeRef.current;
          audio.playbackRate = playbackRateRef.current;
          audio.onended = null; audio.ontimeupdate = null; audio.onerror = null;

          audio.ontimeupdate = () => {
            if (segmentId !== currentSegmentIdRef.current) return;
            setCurrentTime(audio.currentTime);
            setDuration(audio.duration || 0);
            if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
          };

          audio.onended = () => {
            if (segmentId !== currentSegmentIdRef.current) return;
            if (isPlayingRef.current) {
              setTimeout(() => {
                if (isPlayingRef.current && segmentId === currentSegmentIdRef.current) playSegment(index + 1);
              }, SEGMENT_TRANSITION_DELAY);
            }
          };

          setStatus("playing");
          try { await audio.play(); } catch {
            if (segmentId !== currentSegmentIdRef.current) return;
            if (webSpeechSupported) playWithWebSpeech(segment, index, segmentId);
          }
        } else if (webSpeechSupported) {
          playWithWebSpeech(segment, index, segmentId);
        }
      } else if (webSpeechSupported || segment.fallbackAudio) {
        playWithWebSpeech(segment, index, segmentId);
      } else {
        if (isPlayingRef.current) playSegment(index + 1);
      }
    });
  }, [segments, onSegmentChange, onComplete, preloadUpcoming, preloadSegment, stopAllAudio, webSpeechSupported, playWithWebSpeech]);

  // Controls
  const play = useCallback(() => {
    setIsPlaying(true);
    if (status === "paused" && audioRef.current) {
      audioRef.current.play().catch(console.error);
      setStatus("playing");
      // Restart keepalive for web speech segments
      startKeepalive();
    } else {
      playSegment(currentIndexRef.current);
    }
  }, [status, playSegment, startKeepalive]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    setStatus("paused");
    cancelSpeech();
    clearProgressInterval();
    stopKeepalive();
    if (audioRef.current) audioRef.current.pause();
  }, [cancelSpeech, clearProgressInterval, stopKeepalive]);

  const toggle = useCallback(() => {
    if (isPlaying) pause(); else play();
  }, [isPlaying, play, pause]);

  const seekToSegment = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, segments.length - 1));
    setCurrentIndex(clamped);
    setProgress(0);
    if (isPlaying) {
      // Chain the stop + play through the promise lock
      playChainRef.current = playChainRef.current.then(async () => {
        await stopAllAudio();
      });
      playSegment(clamped);
    }
  }, [segments.length, isPlaying, stopAllAudio, playSegment]);

  const skipForward = useCallback(() => seekToSegment(currentIndexRef.current + 1), [seekToSegment]);
  const skipBack = useCallback(() => seekToSegment(currentIndexRef.current - 1), [seekToSegment]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v); volumeRef.current = v;
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const setPlaybackRate = useCallback((r: number) => {
    setPlaybackRateState(r); playbackRateRef.current = r;
    if (audioRef.current) audioRef.current.playbackRate = r;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      stopAllAudio();
      stopKeepalive();
      bufferRef.current.forEach(({ audio }) => { audio.src = ""; });
      bufferRef.current.clear();
      currentSegmentIdRef.current = 0;
      lockedVoicesRef.current = null;
    };
  }, [stopAllAudio, stopKeepalive]);

  // Preload first segments on mount
  useEffect(() => {
    if (segments.length > 0) preloadUpcoming(0);
  }, [segments, preloadUpcoming]);

  return {
    status, currentIndex, isPlaying, progress, currentTime, duration,
    play, pause, toggle, seekToSegment, skipForward, skipBack,
    setVolume, setPlaybackRate, volume, playbackRate, usingFallback,
  };
}
