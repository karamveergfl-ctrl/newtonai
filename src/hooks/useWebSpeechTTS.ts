import { useCallback, useRef, useState, useEffect } from "react";

const STORAGE_KEY = "podcast-voice-settings";

interface VoiceSettings {
  host1VoiceName: string;
  host2VoiceName: string;
  host1Pitch: number;
  host2Pitch: number;
  host1Rate: number;
  host2Rate: number;
}

interface WebSpeechOptions {
  speaker?: "host1" | "host2";
  rate?: number;
  pitch?: number;
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// Language code to BCP 47 language tag mapping
const LANGUAGE_TAGS: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  ar: "ar-SA",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
};

interface UseWebSpeechTTSReturn {
  speak: (text: string, options?: WebSpeechOptions) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
}

function getStoredSettings(): VoiceSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function useWebSpeechTTS(): UseWebSpeechTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Load voices (they load asynchronously in some browsers)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  // Select appropriate voice based on speaker and language
  const selectVoice = useCallback(
    (speaker: "host1" | "host2", language: string = "en"): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      // Get target language tag
      const langTag = LANGUAGE_TAGS[language] || "en-US";
      const langPrefix = langTag.split("-")[0];

      // Check for user-configured voice first (only for English)
      if (language === "en") {
        const storedSettings = getStoredSettings();
        if (storedSettings) {
          const configuredName = speaker === "host1" 
            ? storedSettings.host1VoiceName 
            : storedSettings.host2VoiceName;
          
          if (configuredName) {
            const configuredVoice = voices.find((v) => v.name === configuredName);
            if (configuredVoice) return configuredVoice;
          }
        }
      }

      // For non-English languages, filter by language first
      const languageVoices = voices.filter(
        (v) => v.lang.startsWith(langPrefix) || v.lang.toLowerCase().startsWith(langPrefix)
      );

      // If we have language-specific voices, use them
      if (languageVoices.length > 0) {
        if (speaker === "host1") {
          // Prefer male voices for host1
          const maleVoice = languageVoices.find(
            (v) =>
              /\b(male|guy|david|james|daniel|mark|paul|tom|george|matthew|arthur|henry|alex|adam|brian|chris|eric|john|michael|peter|richard|robert|ravi|amit|arun|krishna|raj|sanjay)\b/i.test(v.name) &&
              !/female/i.test(v.name)
          );
          if (maleVoice) return maleVoice;
          // Return first voice for host1
          return languageVoices[0];
        } else {
          // Prefer female voices for host2
          const femaleVoice = languageVoices.find(
            (v) =>
              /\b(female|woman|samantha|karen|victoria|fiona|moira|susan|zira|hazel|emma|alice|kate|linda|lisa|mary|nancy|rachel|sarah|tessa|amy|priya|anita|sunita|kavita|meera|lakshmi)\b/i.test(v.name)
          );
          if (femaleVoice) return femaleVoice;
          // Return second voice if available, otherwise first
          return languageVoices[Math.min(1, languageVoices.length - 1)];
        }
      }

      // Fallback to English voice selection if no language-specific voices
      // Check for user-configured voice first
      const storedSettings = getStoredSettings();
      if (storedSettings) {
        const configuredName = speaker === "host1" 
          ? storedSettings.host1VoiceName 
          : storedSettings.host2VoiceName;
        
        if (configuredName) {
          const configuredVoice = voices.find((v) => v.name === configuredName);
          if (configuredVoice) return configuredVoice;
        }
      }

      // Auto-select based on gender hints
      const englishVoices = voices.filter(
        (v) => v.lang.startsWith("en") || v.lang.startsWith("EN")
      );

      if (speaker === "host1") {
        // Prefer male voices for Alex (host1) - expanded patterns
        const maleVoice = englishVoices.find(
          (v) =>
            /\b(male|guy|david|james|daniel|mark|paul|tom|george|matthew|arthur|henry|alex|aaron|adam|brian|chris|eric|fred|john|kevin|michael|peter|richard|robert|william)\b/i.test(v.name) &&
            !/female/i.test(v.name)
        );
        if (maleVoice) return maleVoice;
        
        // If no explicit male voice, find one that doesn't sound female
        const neutralVoice = englishVoices.find(
          (v) => !/female|woman|samantha|karen|victoria|fiona|moira|susan|zira|hazel|emma|alice|kate|linda|lisa|mary|nancy|rachel|sarah|tessa/i.test(v.name)
        );
        if (neutralVoice) return neutralVoice;
      } else {
        // Prefer female voices for Sarah (host2) - expanded patterns
        const femaleVoice = englishVoices.find(
          (v) =>
            /\b(female|woman|samantha|karen|victoria|fiona|moira|susan|zira|hazel|emma|alice|kate|linda|lisa|mary|nancy|rachel|sarah|tessa|amy|catherine|emily|jessica|jennifer|nicole|olivia)\b/i.test(v.name)
        );
        if (femaleVoice) return femaleVoice;
      }

      // Fallback: alternate between first two English voices or any voice
      const fallbackVoices = englishVoices.length > 0 ? englishVoices : voices;
      const index = speaker === "host1" ? 0 : Math.min(1, fallbackVoices.length - 1);
      return fallbackVoices[index] || null;
    },
    [voices]
  );

  const speak = useCallback(
    (text: string, options: WebSpeechOptions = {}): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          reject(new Error("Web Speech API is not supported in this browser"));
          return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Apply voice based on speaker and language
        const selectedVoice = selectVoice(options.speaker || "host1", options.language);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Set language for the utterance
        if (options.language) {
          utterance.lang = LANGUAGE_TAGS[options.language] || options.language;
        }

        // Get stored settings for pitch/rate
        const storedSettings = getStoredSettings();
        const speaker = options.speaker || "host1";
        
        // Apply rate - use options first, then stored settings, then defaults
        if (options.rate !== undefined) {
          utterance.rate = options.rate;
        } else if (storedSettings) {
          const storedRate = speaker === "host1" ? storedSettings.host1Rate : storedSettings.host2Rate;
          utterance.rate = storedRate;
        } else {
          utterance.rate = 1;
        }

        // Apply pitch - use options first, then stored settings, then defaults
        if (options.pitch !== undefined) {
          utterance.pitch = options.pitch;
        } else if (storedSettings) {
          const storedPitch = speaker === "host1" ? storedSettings.host1Pitch : storedSettings.host2Pitch;
          utterance.pitch = storedPitch;
        } else {
          utterance.pitch = speaker === "host2" ? 1.1 : 0.95;
        }

        utterance.volume = 1;

        utterance.onstart = () => {
          setIsSpeaking(true);
          options.onStart?.();
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          options.onEnd?.();
          resolve();
        };

        utterance.onerror = (event) => {
          setIsSpeaking(false);
          // "interrupted" and "canceled" are expected when canceling speech, not real errors
          if (event.error === "interrupted" || event.error === "canceled") {
            resolve();
            return;
          }
          const error = new Error(`Speech synthesis error: ${event.error}`);
          options.onError?.(error);
          reject(error);
        };

        speechSynthesis.speak(utterance);
      });
    },
    [isSupported, selectVoice]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    voices,
  };
}
