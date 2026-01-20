import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AmbientPreset {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  category: "nature" | "urban" | "focus" | "cozy";
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  // Nature
  { id: "rain", name: "Rain", icon: "🌧️", prompt: "Gentle rain falling on a window, soft and calming ambient sound", category: "nature" },
  { id: "forest", name: "Forest", icon: "🌲", prompt: "Peaceful forest ambience with birds chirping and leaves rustling", category: "nature" },
  { id: "ocean", name: "Ocean Waves", icon: "🌊", prompt: "Calm ocean waves gently crashing on a beach, relaxing ambient", category: "nature" },
  { id: "thunder", name: "Thunderstorm", icon: "⛈️", prompt: "Distant thunder with rain, cozy storm ambience", category: "nature" },
  
  // Focus
  { id: "library", name: "Library", icon: "📚", prompt: "Quiet library ambience with soft page turning and distant footsteps", category: "focus" },
  { id: "whitenoise", name: "White Noise", icon: "📻", prompt: "Soft static white noise for concentration", category: "focus" },
  { id: "typing", name: "Keyboard", icon: "⌨️", prompt: "Gentle mechanical keyboard typing sounds, productive ambience", category: "focus" },
  
  // Cozy
  { id: "cafe", name: "Coffee Shop", icon: "☕", prompt: "Cozy coffee shop ambience with soft chatter and espresso machine", category: "cozy" },
  { id: "fireplace", name: "Fireplace", icon: "🔥", prompt: "Crackling fireplace with warm fire sounds", category: "cozy" },
  { id: "lofi", name: "Lo-Fi Vibes", icon: "🎵", prompt: "Soft lo-fi ambient background music, chill and relaxing", category: "cozy" },
  
  // Urban
  { id: "train", name: "Train Journey", icon: "🚂", prompt: "Train journey ambience with rhythmic tracks and distant whistle", category: "urban" },
  { id: "city", name: "City Night", icon: "🌃", prompt: "Nighttime city ambience with distant traffic and urban sounds", category: "urban" },
];

interface UseAmbientAudioReturn {
  isLoading: boolean;
  isPlaying: boolean;
  currentPreset: AmbientPreset | null;
  volume: number;
  cachedPresets: Set<string>;
  play: (preset: AmbientPreset) => Promise<void>;
  stop: () => void;
  setVolume: (volume: number) => void;
  presets: AmbientPreset[];
}

export function useAmbientAudio(): UseAmbientAudioReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<AmbientPreset | null>(null);
  const [volume, setVolumeState] = useState(0.3);
  const [cachedPresets, setCachedPresets] = useState<Set<string>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  // Load cached audio from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("ambient_audio_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        Object.entries(parsed).forEach(([key, value]) => {
          cacheRef.current.set(key, value as string);
        });
        setCachedPresets(new Set(Object.keys(parsed)));
      }
    } catch (e) {
      console.error("Failed to load ambient cache:", e);
    }
  }, []);

  // Save cache to localStorage
  const saveCache = useCallback(() => {
    try {
      const cacheObj: Record<string, string> = {};
      cacheRef.current.forEach((value, key) => {
        cacheObj[key] = value;
      });
      // Only cache first 3 to avoid localStorage limits
      const limited = Object.fromEntries(Object.entries(cacheObj).slice(0, 3));
      localStorage.setItem("ambient_audio_cache", JSON.stringify(limited));
    } catch (e) {
      console.error("Failed to save ambient cache:", e);
    }
  }, []);

  const generateAmbientAudio = useCallback(async (preset: AmbientPreset): Promise<string> => {
    // Check cache first
    const cached = cacheRef.current.get(preset.id);
    if (cached) {
      console.log(`Using cached ambient audio for ${preset.name}`);
      return cached;
    }

    console.log(`Generating ambient audio for ${preset.name}...`);
    
    const { data, error } = await supabase.functions.invoke("elevenlabs-ambient", {
      body: { prompt: preset.prompt, duration: 22 },
    });

    if (error) throw error;
    if (!data?.audio) throw new Error("No audio received");

    // Cache the audio
    cacheRef.current.set(preset.id, data.audio);
    setCachedPresets(prev => new Set([...prev, preset.id]));
    saveCache();

    return data.audio;
  }, [saveCache]);

  const play = useCallback(async (preset: AmbientPreset) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoading(true);
    setCurrentPreset(preset);

    try {
      const base64Audio = await generateAmbientAudio(preset);
      
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audio.loop = true;
      audio.volume = volume;
      
      audioRef.current = audio;
      
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play ambient audio:", error);
      setCurrentPreset(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [volume, generateAmbientAudio]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentPreset(null);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isLoading,
    isPlaying,
    currentPreset,
    volume,
    cachedPresets,
    play,
    stop,
    setVolume,
    presets: AMBIENT_PRESETS,
  };
}
