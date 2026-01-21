import { useState, useCallback, useRef, useEffect } from "react";

type SoundType = "thinking" | "writing" | "completed";

// LocalStorage keys
const MUTE_STORAGE_KEY = "newton_sounds_muted";

interface UseNewtonSoundsOptions {
  enabled?: boolean;
  volume?: number;
}

interface UseNewtonSoundsReturn {
  playThinkingSound: () => void;
  playWritingSound: () => void;
  playCompletedSound: () => void;
  stopAllSounds: () => void;
  crossfadeTo: (soundType: SoundType | null) => void;
  setVolume: (volume: number) => void;
  volume: number;
  isMuted: boolean;
  toggleMute: () => void;
  isLoading: boolean;
  currentSound: SoundType | null;
}

// Create AudioContext lazily
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (audioContext && audioContext.state !== "closed") {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  }
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch {
    console.warn("Web Audio API not supported");
    return null;
  }
};

// Generate a soft "hmm" thinking sound using oscillators
const playThinkingTone = (ctx: AudioContext, volume: number): { stop: () => void } => {
  const now = ctx.currentTime;
  const duration = 2.5;
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  // Warm low frequency hum
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(140, now);
  osc1.frequency.linearRampToValueAtTime(145, now + 1.25);
  osc1.frequency.linearRampToValueAtTime(140, now + 2.5);
  
  // Subtle harmonic overtone
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(280, now);
  osc2.frequency.linearRampToValueAtTime(290, now + 1.25);
  osc2.frequency.linearRampToValueAtTime(280, now + 2.5);
  
  // Low-pass filter for warmth
  filter.type = "lowpass";
  filter.frequency.value = 350;
  filter.Q.value = 1;
  
  // Gentle volume envelope
  const targetVolume = volume * 0.12;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.4);
  gainNode.gain.setValueAtTime(targetVolume, now + duration - 0.4);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
  
  return {
    stop: () => {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        setTimeout(() => {
          osc1.stop();
          osc2.stop();
        }, 150);
      } catch {}
    },
  };
};

// Generate pencil scratching sound using filtered noise
const playWritingTone = (ctx: AudioContext, volume: number): { stop: () => void } => {
  const now = ctx.currentTime;
  const duration = 1.2;
  
  // Create noise buffer
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate scratchy pattern
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    // Intermittent scratching with varying intensity
    const scratchPattern = Math.sin(t * 18) > 0.2 ? 1 : 0.15;
    const microVariation = 0.7 + Math.random() * 0.3;
    data[i] = (Math.random() * 2 - 1) * scratchPattern * microVariation * 0.4;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  // Bandpass filter for paper-like sound
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2500;
  filter.Q.value = 0.8;
  
  const gainNode = ctx.createGain();
  const targetVolume = volume * 0.06;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.08);
  gainNode.gain.setValueAtTime(targetVolume, now + duration - 0.15);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);
  
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  source.start(now);
  source.stop(now + duration);
  
  return {
    stop: () => {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
        setTimeout(() => source.stop(), 100);
      } catch {}
    },
  };
};

// Generate cheerful completion chime - major chord arpeggio
const playCompletedTone = (ctx: AudioContext, volume: number): void => {
  const now = ctx.currentTime;
  
  // C5, E5, G5 major chord arpeggio
  const notes = [523.25, 659.25, 783.99];
  const noteDuration = 0.12;
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.value = freq;
    
    const noteStart = now + i * noteDuration;
    const targetVolume = volume * 0.25;
    
    gainNode.gain.setValueAtTime(0, noteStart);
    gainNode.gain.linearRampToValueAtTime(targetVolume, noteStart + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(noteStart);
    osc.stop(noteStart + 0.6);
  });
};

/**
 * Hook to manage Newton animation sound effects using Web Audio API.
 * No external API needed - generates sounds programmatically.
 */
export function useNewtonSounds(
  options: UseNewtonSoundsOptions = {}
): UseNewtonSoundsReturn {
  const { enabled = true, volume: initialVolume = 1 } = options;

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const storedMute = localStorage.getItem(MUTE_STORAGE_KEY);
    return storedMute === "true" || prefersReducedMotion;
  });
  
  const [volume, setVolumeState] = useState(initialVolume);
  const [currentSound, setCurrentSound] = useState<SoundType | null>(null);
  
  const thinkingLoopRef = useRef<NodeJS.Timeout | null>(null);
  const writingLoopRef = useRef<NodeJS.Timeout | null>(null);
  const activeNodesRef = useRef<{ stop: () => void }[]>([]);

  // Cleanup loops on unmount
  useEffect(() => {
    return () => {
      if (thinkingLoopRef.current) clearInterval(thinkingLoopRef.current);
      if (writingLoopRef.current) clearInterval(writingLoopRef.current);
      activeNodesRef.current.forEach((node) => node.stop());
    };
  }, []);

  // Pause sounds when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllSounds();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const stopAllSounds = useCallback(() => {
    if (thinkingLoopRef.current) {
      clearInterval(thinkingLoopRef.current);
      thinkingLoopRef.current = null;
    }
    if (writingLoopRef.current) {
      clearInterval(writingLoopRef.current);
      writingLoopRef.current = null;
    }
    activeNodesRef.current.forEach((node) => {
      try { node.stop(); } catch {}
    });
    activeNodesRef.current = [];
    setCurrentSound(null);
  }, []);

  const playThinkingSound = useCallback(() => {
    if (!enabled || isMuted) return;
    
    const ctx = getAudioContext();
    if (!ctx) return;

    stopAllSounds();
    
    // Play immediately and loop
    const playOnce = () => {
      const nodes = playThinkingTone(ctx, volume);
      activeNodesRef.current.push(nodes);
    };
    
    playOnce();
    thinkingLoopRef.current = setInterval(playOnce, 2400);
    setCurrentSound("thinking");
  }, [enabled, isMuted, volume, stopAllSounds]);

  const playWritingSound = useCallback(() => {
    if (!enabled || isMuted) return;
    
    const ctx = getAudioContext();
    if (!ctx) return;

    stopAllSounds();
    
    const playOnce = () => {
      const nodes = playWritingTone(ctx, volume);
      activeNodesRef.current.push(nodes);
    };
    
    playOnce();
    writingLoopRef.current = setInterval(playOnce, 1100);
    setCurrentSound("writing");
  }, [enabled, isMuted, volume, stopAllSounds]);

  const playCompletedSound = useCallback(() => {
    if (!enabled || isMuted) return;
    
    const ctx = getAudioContext();
    if (!ctx) return;

    stopAllSounds();
    playCompletedTone(ctx, volume);
    setCurrentSound("completed");
    
    // Clear after chime finishes
    setTimeout(() => setCurrentSound(null), 800);
  }, [enabled, isMuted, volume, stopAllSounds]);

  const crossfadeTo = useCallback((soundType: SoundType | null) => {
    if (!enabled || isMuted) {
      stopAllSounds();
      return;
    }

    if (soundType === currentSound) return;

    if (!soundType) {
      stopAllSounds();
      return;
    }

    switch (soundType) {
      case "thinking":
        playThinkingSound();
        break;
      case "writing":
        playWritingSound();
        break;
      case "completed":
        playCompletedSound();
        break;
    }
  }, [enabled, isMuted, currentSound, playThinkingSound, playWritingSound, playCompletedSound, stopAllSounds]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

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
    isLoading: false, // No loading needed with Web Audio API
    currentSound,
  };
}

export default useNewtonSounds;
