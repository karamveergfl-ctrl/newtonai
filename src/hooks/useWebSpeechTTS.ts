import { useCallback, useRef, useState, useEffect } from "react";

interface WebSpeechOptions {
  speaker?: "host1" | "host2";
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UseWebSpeechTTSReturn {
  speak: (text: string, options?: WebSpeechOptions) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
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

  // Select appropriate voice based on speaker (male for host1, female for host2)
  const selectVoice = useCallback(
    (speaker: "host1" | "host2"): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      const englishVoices = voices.filter(
        (v) => v.lang.startsWith("en") || v.lang.startsWith("EN")
      );

      if (speaker === "host1") {
        // Prefer male voices for Alex (host1)
        const maleVoice = englishVoices.find(
          (v) =>
            /male|guy|david|james|daniel|google uk english male/i.test(v.name) &&
            !/female/i.test(v.name)
        );
        if (maleVoice) return maleVoice;
      } else {
        // Prefer female voices for Sarah (host2)
        const femaleVoice = englishVoices.find(
          (v) =>
            /female|woman|samantha|karen|victoria|google uk english female/i.test(v.name)
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

        // Apply voice based on speaker
        const selectedVoice = selectVoice(options.speaker || "host1");
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Apply rate and pitch
        utterance.rate = options.rate ?? 1;
        utterance.pitch = options.pitch ?? (options.speaker === "host2" ? 1.1 : 0.95);
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
