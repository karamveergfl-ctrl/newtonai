import { useState, useEffect, useCallback } from "react";

export interface PodcastPreferences {
  style: "casual" | "academic" | "deep-dive" | "interview";
  host1Name: string;
  host1VoiceId: string;
  host2Name: string;
  host2VoiceId: string;
  language: string;
  tone: "enthusiastic" | "balanced" | "serious";
  depth: number;
  hasCompletedSetup: boolean;
}

const STORAGE_KEY = "podcast-preferences";

const DEFAULT_PREFERENCES: PodcastPreferences = {
  style: "casual",
  host1Name: "Alex",
  host1VoiceId: "CwhRBWXzGAHq8TQ4Fs17", // Roger
  host2Name: "Sarah",
  host2VoiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
  language: "en",
  tone: "balanced",
  depth: 3,
  hasCompletedSetup: false,
};

export const usePodcastPreferences = () => {
  const [preferences, setPreferences] = useState<PodcastPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
      
      // Also check for legacy voice preferences
      const legacyVoices = localStorage.getItem("podcast_voice_preferences");
      if (legacyVoices && !stored) {
        const { host1VoiceId, host2VoiceId } = JSON.parse(legacyVoices);
        setPreferences(prev => ({ 
          ...prev, 
          host1VoiceId: host1VoiceId || prev.host1VoiceId, 
          host2VoiceId: host2VoiceId || prev.host2VoiceId 
        }));
      }
    } catch (e) {
      console.error("Failed to load podcast preferences:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((updates: Partial<PodcastPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Also update legacy voice preferences for backward compatibility
        localStorage.setItem("podcast_voice_preferences", JSON.stringify({
          host1VoiceId: updated.host1VoiceId,
          host2VoiceId: updated.host2VoiceId,
        }));
      } catch (e) {
        console.error("Failed to save podcast preferences:", e);
      }
      return updated;
    });
  }, []);

  const markSetupComplete = useCallback(() => {
    savePreferences({ hasCompletedSetup: true });
  }, [savePreferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to reset podcast preferences:", e);
    }
  }, []);

  return {
    preferences,
    isLoaded,
    hasCompletedSetup: preferences.hasCompletedSetup,
    savePreferences,
    markSetupComplete,
    resetPreferences,
  };
};

// Voice options for settings display
export const VOICE_OPTIONS = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Warm, conversational male voice", gender: "male" as const },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Clear, engaging female voice", gender: "female" as const },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Professional female narrator", gender: "female" as const },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Friendly, casual male voice", gender: "male" as const },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Authoritative British male", gender: "male" as const },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Energetic young male", gender: "male" as const },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Smooth, professional male", gender: "male" as const },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Warm, friendly female", gender: "female" as const },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Clear, articulate female", gender: "female" as const },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Deep, resonant male voice", gender: "male" as const },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Expressive female voice", gender: "female" as const },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Mature, trustworthy male", gender: "male" as const },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", description: "Casual, relatable male", gender: "male" as const },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Deep, authoritative male", gender: "male" as const },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Versatile multilingual male", gender: "male" as const },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Bright, cheerful female", gender: "female" as const },
];

export const PODCAST_STYLES = [
  { id: "casual" as const, name: "Casual Chat", description: "Friendly, relaxed conversation" },
  { id: "academic" as const, name: "Academic", description: "Structured, formal discussion" },
  { id: "deep-dive" as const, name: "Deep Dive", description: "Comprehensive exploration" },
  { id: "interview" as const, name: "Interview", description: "Q&A format style" },
];

export const PODCAST_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", flag: "🇮🇳" },
];
