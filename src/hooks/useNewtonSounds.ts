import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type SoundType = "thinking" | "writing" | "completed";

interface SoundConfig {
  prompt: string;
  duration: number;
  loop: boolean;
  baseVolume: number;
}

// Sound configurations for each animation state
const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  thinking: {
    prompt: "Soft contemplative humming sound, gentle 'hmm' like someone thinking deeply, ambient and calming, subtle background",
    duration: 3,
    loop: true,
    baseVolume: 0.25,
  },
  writing: {
    prompt: "Pencil scratching softly on paper, gentle writing sounds, rhythmic and delicate, ASMR quality, satisfying",
    duration: 4,
    loop: true,
    baseVolume: 0.2,
  },
  completed: {
    prompt: "Cheerful success chime, bright positive completion sound, short celebratory ding, achievement unlocked, satisfying",
    duration: 1.5,
    loop: false,
    baseVolume: 0.45,
  },
};

// LocalStorage keys
const MUTE_STORAGE_KEY = "newton_sounds_muted";
const CACHE_STORAGE_KEY = "newton_sounds_cache";

interface CachedSounds {
  [key: string]: string; // base64 audio data
}

interface UseNewtonSoundsOptions {
  enabled?: boolean;
  volume?: number; // 0-1, multiplier for base volumes
}

interface UseNewtonSoundsReturn {
  playThinkingSound: () => Promise<void>;
  playWritingSound: () => Promise<void>;
  playCompletedSound: () => Promise<void>;
  stopAllSounds: () => void;
  crossfadeTo: (soundType: SoundType | null) => Promise<void>;
  setVolume: (volume: number) => void;
  volume: number;
  isMuted: boolean;
  toggleMute: () => void;
  isLoading: boolean;
  currentSound: SoundType | null;
}

/**
 * Hook to manage Newton animation sound effects.
 * Supports playback, looping, crossfading, and mute controls.
 */
export function useNewtonSounds(
  options: UseNewtonSoundsOptions = {}
): UseNewtonSoundsReturn {
  const { enabled = true, volume: initialVolume = 1 } = options;

  // State
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    // Also check for reduced motion preference
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const storedMute = localStorage.getItem(MUTE_STORAGE_KEY);
    return storedMute === "true" || prefersReducedMotion;
  });
  const [volume, setVolumeState] = useState(initialVolume);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSound, setCurrentSound] = useState<SoundType | null>(null);

  // Refs
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    thinking: null,
    writing: null,
    completed: null,
  });
  const cachedAudioUrls = useRef<Record<SoundType, string | null>>({
    thinking: null,
    writing: null,
    completed: null,
  });
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingRef = useRef<Record<SoundType, boolean>>({
    thinking: false,
    writing: false,
    completed: false,
  });

  // Load cached sounds from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      if (cached) {
        const parsedCache: CachedSounds = JSON.parse(cached);
        Object.entries(parsedCache).forEach(([key, base64]) => {
          if (base64 && SOUND_CONFIGS[key as SoundType]) {
            cachedAudioUrls.current[key as SoundType] = `data:audio/mpeg;base64,${base64}`;
          }
        });
      }
    } catch (e) {
      console.warn("Failed to load cached sounds:", e);
    }
  }, []);

  // Pause sounds when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentSound) {
        const audio = audioRefs.current[currentSound];
        if (audio && !audio.paused) {
          audio.pause();
        }
      } else if (!document.hidden && currentSound && !isMuted) {
        const audio = audioRefs.current[currentSound];
        if (audio && audio.paused) {
          audio.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentSound, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  /**
   * Generate sound via ElevenLabs API
   */
  const generateSound = useCallback(async (soundType: SoundType): Promise<string | null> => {
    if (isGeneratingRef.current[soundType]) {
      // Already generating, wait a bit and check cache
      await new Promise(resolve => setTimeout(resolve, 500));
      return cachedAudioUrls.current[soundType];
    }

    // Check cache first
    if (cachedAudioUrls.current[soundType]) {
      return cachedAudioUrls.current[soundType];
    }

    const config = SOUND_CONFIGS[soundType];
    isGeneratingRef.current[soundType] = true;
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: config.prompt,
            duration: config.duration,
            promptInfluence: 0.4,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`SFX generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        cachedAudioUrls.current[soundType] = audioUrl;
        
        // Save to localStorage cache
        try {
          const existing = localStorage.getItem(CACHE_STORAGE_KEY);
          const cache: CachedSounds = existing ? JSON.parse(existing) : {};
          cache[soundType] = data.audioContent;
          localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
        } catch (e) {
          console.warn("Failed to cache sound:", e);
        }

        return audioUrl;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to generate ${soundType} sound:`, error);
      return null;
    } finally {
      isGeneratingRef.current[soundType] = false;
      setIsLoading(false);
    }
  }, []);

  /**
   * Fade audio volume smoothly
   */
  const fadeAudio = useCallback((
    audio: HTMLAudioElement,
    fromVolume: number,
    toVolume: number,
    duration: number,
    onComplete?: () => void
  ) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (toVolume - fromVolume) / steps;
    let currentStep = 0;

    audio.volume = fromVolume;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVolume = fromVolume + volumeStep * currentStep;
      audio.volume = Math.max(0, Math.min(1, newVolume));

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        onComplete?.();
      }
    }, stepDuration);
  }, []);

  /**
   * Play a specific sound
   */
  const playSound = useCallback(async (soundType: SoundType) => {
    if (!enabled || isMuted) return;

    const config = SOUND_CONFIGS[soundType];
    let audioUrl = cachedAudioUrls.current[soundType];

    // Generate if not cached
    if (!audioUrl) {
      audioUrl = await generateSound(soundType);
      if (!audioUrl) return;
    }

    // Create or reuse audio element
    let audio = audioRefs.current[soundType];
    if (!audio || audio.src !== audioUrl) {
      audio = new Audio(audioUrl);
      audio.loop = config.loop;
      audioRefs.current[soundType] = audio;
    }

    const targetVolume = config.baseVolume * volume;

    // Fade in
    audio.volume = 0;
    await audio.play().catch((e) => {
      console.warn("Audio play failed:", e);
    });
    
    fadeAudio(audio, 0, targetVolume, 300);
    setCurrentSound(soundType);
  }, [enabled, isMuted, volume, generateSound, fadeAudio]);

  /**
   * Stop a specific sound with fade out
   */
  const stopSound = useCallback((soundType: SoundType, immediate = false) => {
    const audio = audioRefs.current[soundType];
    if (!audio) return;

    if (immediate) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      fadeAudio(audio, audio.volume, 0, 150, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    }

    if (currentSound === soundType) {
      setCurrentSound(null);
    }
  }, [currentSound, fadeAudio]);

  /**
   * Stop all sounds
   */
  const stopAllSounds = useCallback(() => {
    Object.keys(audioRefs.current).forEach((key) => {
      stopSound(key as SoundType, true);
    });
    setCurrentSound(null);
  }, [stopSound]);

  /**
   * Crossfade from current sound to a new sound
   */
  const crossfadeTo = useCallback(async (soundType: SoundType | null) => {
    if (!enabled || isMuted) {
      stopAllSounds();
      return;
    }

    // If same sound, do nothing
    if (soundType === currentSound) return;

    // If no new sound, just stop current
    if (!soundType) {
      if (currentSound) {
        stopSound(currentSound);
      }
      return;
    }

    // Preload the new sound
    const config = SOUND_CONFIGS[soundType];
    let audioUrl = cachedAudioUrls.current[soundType];
    if (!audioUrl) {
      audioUrl = await generateSound(soundType);
      if (!audioUrl) return;
    }

    // Create new audio
    let newAudio = audioRefs.current[soundType];
    if (!newAudio || newAudio.src !== audioUrl) {
      newAudio = new Audio(audioUrl);
      newAudio.loop = config.loop;
      audioRefs.current[soundType] = newAudio;
    }

    const targetVolume = config.baseVolume * volume;

    // Stop current sound with quick fade
    if (currentSound) {
      const currentAudio = audioRefs.current[currentSound];
      if (currentAudio) {
        fadeAudio(currentAudio, currentAudio.volume, 0, 200, () => {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        });
      }
    }

    // Start new sound with fade in
    newAudio.volume = 0;
    await newAudio.play().catch((e) => {
      console.warn("Audio play failed:", e);
    });
    fadeAudio(newAudio, 0, targetVolume, 250);
    setCurrentSound(soundType);
  }, [enabled, isMuted, currentSound, volume, generateSound, fadeAudio, stopSound, stopAllSounds]);

  /**
   * Play thinking sound
   */
  const playThinkingSound = useCallback(async () => {
    await crossfadeTo("thinking");
  }, [crossfadeTo]);

  /**
   * Play writing sound
   */
  const playWritingSound = useCallback(async () => {
    await crossfadeTo("writing");
  }, [crossfadeTo]);

  /**
   * Play completed sound (one-shot)
   */
  const playCompletedSound = useCallback(async () => {
    if (!enabled || isMuted) return;

    // Stop any looping sounds first
    stopAllSounds();

    const config = SOUND_CONFIGS.completed;
    let audioUrl = cachedAudioUrls.current.completed;

    if (!audioUrl) {
      audioUrl = await generateSound("completed");
      if (!audioUrl) return;
    }

    const audio = new Audio(audioUrl);
    audio.loop = false;
    audio.volume = config.baseVolume * volume;
    audioRefs.current.completed = audio;

    await audio.play().catch((e) => {
      console.warn("Completed sound play failed:", e);
    });

    setCurrentSound("completed");

    // Clear current sound after it finishes
    audio.onended = () => {
      setCurrentSound(null);
    };
  }, [enabled, isMuted, volume, generateSound, stopAllSounds]);

  /**
   * Set volume
   */
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);

    // Update current playing audio
    if (currentSound) {
      const audio = audioRefs.current[currentSound];
      const config = SOUND_CONFIGS[currentSound];
      if (audio) {
        audio.volume = config.baseVolume * clampedVolume;
      }
    }
  }, [currentSound]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      localStorage.setItem(MUTE_STORAGE_KEY, String(newMuted));

      if (newMuted) {
        stopAllSounds();
      }

      return newMuted;
    });
  }, [stopAllSounds]);

  return {
    playThinkingSound,
    playWritingSound,
    playCompletedSound,
    stopAllSounds,
    crossfadeTo,
    setVolume,
    volume,
    isMuted,
    toggleMute,
    isLoading,
    currentSound,
  };
}

export default useNewtonSounds;
