import { useCallback, useRef, useState, useEffect } from "react";

const STORAGE_KEY = "podcast-voice-settings";
const VOICE_CACHE_KEY = "tts-voice-cache";

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
  voiceName?: string; // Explicit voice name to use (from dropdown selection)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// Prepare text for natural speech with pauses - makes it sound human-like
const prepareTextForSpeech = (text: string, language: string): string => {
  let prepared = text;
  
  // Add longer pauses after sentences for human-like pacing (like Hindi voice)
  prepared = prepared.replace(/\. /g, '. ... ');
  prepared = prepared.replace(/! /g, '! ... ');
  prepared = prepared.replace(/\? /g, '? ... ');
  
  // Add pauses after commas for smoother word-by-word reading (all languages)
  prepared = prepared.replace(/,\s+/g, ', ... ');
  
  // Add pause after colons and semicolons for better pacing
  prepared = prepared.replace(/:\s+/g, ': ... ');
  prepared = prepared.replace(/;\s+/g, '; ... ');
  
  // Add pauses around dashes for natural reading
  prepared = prepared.replace(/[-–—]\s*/g, ' ... ');
  
  return prepared;
};

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
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  as: "as-IN",
  ks: "ks-IN",
  ru: "ru-RU",
  it: "it-IT",
  nl: "nl-NL",
  pl: "pl-PL",
  tr: "tr-TR",
  vi: "vi-VN",
  th: "th-TH",
  id: "id-ID",
};

// Extended voice patterns for different languages - used for gender detection
const VOICE_PATTERNS: Record<string, { male: RegExp; female: RegExp }> = {
  // English
  en: {
    male: /\b(david|james|daniel|mark|paul|tom|george|matthew|arthur|henry|alex|aaron|adam|brian|chris|eric|fred|john|kevin|michael|peter|richard|robert|william|guy|male)\b/i,
    female: /\b(samantha|karen|victoria|fiona|moira|susan|zira|hazel|emma|alice|kate|linda|lisa|mary|nancy|rachel|sarah|tessa|amy|catherine|emily|jessica|jennifer|nicole|olivia|female|woman)\b/i,
  },
  // Hindi
  hi: {
    male: /\b(ravi|amit|arun|krishna|raj|sanjay|hemant|madhur|prabhat|arvind|vijay|prakash|suresh|mahesh|kiran|male)\b/i,
    female: /\b(lekha|aditi|neerja|swara|priya|anita|sunita|kavita|meera|lakshmi|sneha|divya|anjali|pooja|neha|female)\b/i,
  },
  // Tamil
  ta: {
    male: /\b(kumar|rajan|murali|prakash|vijay|ganesh|valluvar|muthu|male)\b/i,
    female: /\b(vani|veena|priya|lakshmi|devi|meena|pallavi|female)\b/i,
  },
  // Telugu
  te: {
    male: /\b(ravi|krishna|vijay|prasad|venkat|mohan|male)\b/i,
    female: /\b(lakshmi|priya|devi|swathi|madhavi|shruti|female)\b/i,
  },
  // Bengali
  bn: {
    male: /\b(tanmoy|arnab|raj|amit|bashkar|male)\b/i,
    female: /\b(tanishaa|ria|priya|anjali|bondita|female)\b/i,
  },
  // Marathi
  mr: {
    male: /\b(aaditya|rahul|amit|nachiket|male)\b/i,
    female: /\b(aishwarya|sakhi|priya|aarohi|female)\b/i,
  },
  // Gujarati
  gu: {
    male: /\b(dhruv|ketan|jay|niranjan|male)\b/i,
    female: /\b(dhwani|nishtha|priya|hemant|female)\b/i,
  },
  // Kannada
  kn: {
    male: /\b(suresh|ramesh|prakash|gagan|male)\b/i,
    female: /\b(sapna|gagan|priya|female)\b/i,
  },
  // Malayalam
  ml: {
    male: /\b(midhun|sreejith|arun|male)\b/i,
    female: /\b(sobhana|anjali|priya|female)\b/i,
  },
  // Punjabi
  pa: {
    male: /\b(harjinder|amardeep|singh|male)\b/i,
    female: /\b(harleen|amarjeet|kaur|female)\b/i,
  },
  // Odia
  or: {
    male: /\b(manoranjan|subrat|male)\b/i,
    female: /\b(subhasini|sukanya|female)\b/i,
  },
  // Assamese
  as: {
    male: /\b(bishnu|male)\b/i,
    female: /\b(priyom|female)\b/i,
  },
  // Spanish
  es: {
    male: /\b(jorge|diego|pablo|carlos|andres|miguel|juan|antonio|enrique|male)\b/i,
    female: /\b(lucia|elena|isabela|carmen|rosa|maria|ana|sofia|laura|monica|female)\b/i,
  },
  // French
  fr: {
    male: /\b(thomas|henri|pierre|jean|louis|nicolas|mathieu|olivier|male)\b/i,
    female: /\b(aurelie|amelie|marie|sophie|camille|chloe|lea|manon|julie|nathalie|female)\b/i,
  },
  // German
  de: {
    male: /\b(stefan|hans|markus|michael|andreas|thomas|florian|jan|conrad|male)\b/i,
    female: /\b(vicki|anna|marlene|petra|sabine|katja|julia|claudia|female)\b/i,
  },
  // Japanese
  ja: {
    male: /\b(kenji|takumi|haruki|ichiro|keita|ryu|shota|yuki|male)\b/i,
    female: /\b(nanami|haruka|mizuki|yui|sakura|mio|aoi|rin|ayaka|female)\b/i,
  },
  // Korean
  ko: {
    male: /\b(seojun|minho|jiho|hyun|jongsu|dongwook|male)\b/i,
    female: /\b(soyeon|yuna|jieun|minji|heami|sunhi|female)\b/i,
  },
  // Chinese
  zh: {
    male: /\b(yunyang|yunxi|xiaoming|wei|chen|long|male)\b/i,
    female: /\b(xiaoxiao|xiaoyi|xiaohan|huihui|yaoyao|yunzhi|mei|ling|female)\b/i,
  },
  // Arabic
  ar: {
    male: /\b(naayf|hamdan|omar|ahmed|mohammad|ali|male)\b/i,
    female: /\b(fatima|hala|salma|layla|amina|yasmin|zariyah|female)\b/i,
  },
  // Portuguese
  pt: {
    male: /\b(antonio|nicolau|duarte|heitor|julio|male)\b/i,
    female: /\b(fernanda|raquel|francisca|ines|camila|beatriz|female)\b/i,
  },
  // Russian
  ru: {
    male: /\b(dmitry|pavel|maxim|ivan|aleksei|nikolai|mikhail|male)\b/i,
    female: /\b(svetlana|dariya|ekaterina|olga|tatiana|irina|maria|female)\b/i,
  },
  // Italian
  it: {
    male: /\b(diego|benigno|luca|marco|andrea|giuseppe|francesco|male)\b/i,
    female: /\b(elsa|isabella|francesca|giulia|alessia|chiara|paola|female)\b/i,
  },
  // Default fallback
  default: {
    male: /\b(male|man|guy)\b/i,
    female: /\b(female|woman|girl)\b/i,
  },
};

// Quality indicators - prefer these voices (extended with Indian voice names)
const QUALITY_INDICATORS = /\b(neural|natural|premium|enhanced|wavenet|online|remote|lekha|aditi|swara|heera)\b/i;

// Known female voice patterns - extended for better female voice detection across all languages
const FEMALE_VOICE_NAMES = /\b(lekha|aditi|priya|swara|female|woman|raveena|kajal|suman|veena|meera|ananya|divya|kavya|shreya|nisha|pallavi|sunita|varsha|rekha|geeta|jyoti|nandini|lakshmi|sarita|shobha|heera|kalpana|chhaya|zira|hazel|samantha|karen|moira|tessa|fiona|victoria|susan|allison|ava|joana|paulina|monica|lucia|amelie|celine|aurelie|sara|anna|petra|katja|yuna|kyoko|nanami|tingting|xiaoxiao|xiaoyi|zhiyu|yelda|elif|zeynep|filiz|vani|deepa|anjali|pooja|neha|ria|tanishaa|bondita|aishwarya|sakhi|aarohi|dhwani|nishtha|sapna|sobhana|subhasini|priyom|harleen)\b/i;

// Natural speech parameters - ALL LANGUAGES use Hindi-like natural reading style
// Same slow rate (0.85) and warm pitch (1.03) for human-like female voice across all languages
const LANGUAGE_SPEECH_PARAMS: Record<string, { rate: number; pitch: number }> = {
  // Indian Languages - Hindi baseline applied to all
  hi: { rate: 0.85, pitch: 1.03 },   // Hindi - baseline (perfect voice)
  mr: { rate: 0.85, pitch: 1.03 },   // Marathi - same as Hindi
  gu: { rate: 0.85, pitch: 1.03 },   // Gujarati - same as Hindi
  ta: { rate: 0.85, pitch: 1.03 },   // Tamil - same as Hindi
  te: { rate: 0.85, pitch: 1.03 },   // Telugu - same as Hindi
  bn: { rate: 0.85, pitch: 1.03 },   // Bengali - same as Hindi
  kn: { rate: 0.85, pitch: 1.03 },   // Kannada - same as Hindi
  ml: { rate: 0.82, pitch: 1.03 },   // Malayalam - slightly slower for longer words
  pa: { rate: 0.85, pitch: 1.03 },   // Punjabi - same as Hindi
  or: { rate: 0.85, pitch: 1.03 },   // Odia - same as Hindi
  as: { rate: 0.85, pitch: 1.03 },   // Assamese - same as Hindi
  ks: { rate: 0.85, pitch: 1.03 },   // Kashmiri - same as Hindi
  // European Languages - same natural style as Hindi
  en: { rate: 0.88, pitch: 1.03 },   // English - slightly faster but same warmth
  es: { rate: 0.85, pitch: 1.03 },   // Spanish - same as Hindi
  fr: { rate: 0.85, pitch: 1.03 },   // French - same as Hindi
  de: { rate: 0.85, pitch: 1.03 },   // German - same as Hindi
  it: { rate: 0.85, pitch: 1.03 },   // Italian - same as Hindi
  pt: { rate: 0.85, pitch: 1.03 },   // Portuguese - same as Hindi
  ru: { rate: 0.85, pitch: 1.03 },   // Russian - same as Hindi
  nl: { rate: 0.85, pitch: 1.03 },   // Dutch - same as Hindi
  pl: { rate: 0.85, pitch: 1.03 },   // Polish - same as Hindi
  // Asian Languages - same natural style as Hindi
  ja: { rate: 0.85, pitch: 1.03 },   // Japanese - same as Hindi
  zh: { rate: 0.85, pitch: 1.03 },   // Chinese - same as Hindi
  ko: { rate: 0.85, pitch: 1.03 },   // Korean - same as Hindi
  vi: { rate: 0.85, pitch: 1.03 },   // Vietnamese - same as Hindi
  th: { rate: 0.85, pitch: 1.03 },   // Thai - same as Hindi
  id: { rate: 0.85, pitch: 1.03 },   // Indonesian - same as Hindi
  ms: { rate: 0.85, pitch: 1.03 },   // Malay - same as Hindi
  // Middle Eastern - same natural style as Hindi
  ar: { rate: 0.85, pitch: 1.03 },   // Arabic - same as Hindi
  fa: { rate: 0.85, pitch: 1.03 },   // Persian - same as Hindi
  ur: { rate: 0.85, pitch: 1.03 },   // Urdu - same as Hindi
  he: { rate: 0.85, pitch: 1.03 },   // Hebrew - same as Hindi
  tr: { rate: 0.85, pitch: 1.03 },   // Turkish - same as Hindi
};

interface UseWebSpeechTTSReturn {
  speak: (text: string, options?: WebSpeechOptions) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  getVoicesForLanguage: (language: string) => SpeechSynthesisVoice[];
  setPreferredVoice: (voiceName: string, language: string) => void;
  getPreferredVoice: (language: string) => string | null;
}

function getStoredSettings(): VoiceSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Cache voice selection for consistency
function cacheVoiceSelection(voiceName: string, speaker: string, language: string): void {
  try {
    const cache = JSON.parse(localStorage.getItem(VOICE_CACHE_KEY) || "{}");
    cache[`${language}-${speaker}`] = voiceName;
    localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

function getCachedVoice(speaker: string, language: string): string | null {
  try {
    const cache = JSON.parse(localStorage.getItem(VOICE_CACHE_KEY) || "{}");
    return cache[`${language}-${speaker}`] || null;
  } catch {
    return null;
  }
}

// Sort voices by quality - prefer neural/natural female voices (like Hindi "Lekha")
function sortByQuality(voiceList: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return [...voiceList].sort((a, b) => {
    const aHasQuality = QUALITY_INDICATORS.test(a.name);
    const bHasQuality = QUALITY_INDICATORS.test(b.name);

    // First priority: quality indicators (neural, natural, premium)
    if (aHasQuality && !bHasQuality) return -1;
    if (!aHasQuality && bHasQuality) return 1;

    // Second priority: online/remote voices (much more natural sounding)
    if (!a.localService && b.localService) return -1;
    if (a.localService && !b.localService) return 1;

    // Third priority: female voices (like Hindi "Lekha")
    const aIsFemale = FEMALE_VOICE_NAMES.test(a.name);
    const bIsFemale = FEMALE_VOICE_NAMES.test(b.name);
    if (aIsFemale && !bIsFemale) return -1;
    if (!aIsFemale && bIsFemale) return 1;

    return 0;
  });
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
      const langTag = LANGUAGE_TAGS[language] || language;
      const langPrefix = langTag.split("-")[0].toLowerCase();

      // Check for cached voice first
      const cachedVoiceName = getCachedVoice(speaker, language);
      if (cachedVoiceName) {
        const cachedVoice = voices.find((v) => v.name === cachedVoiceName);
        if (cachedVoice) return cachedVoice;
      }

      // Check for user-configured voice (only for English in podcast settings)
      if (language === "en") {
        const storedSettings = getStoredSettings();
        if (storedSettings) {
          const configuredName =
            speaker === "host1" ? storedSettings.host1VoiceName : storedSettings.host2VoiceName;

          if (configuredName) {
            const configuredVoice = voices.find((v) => v.name === configuredName);
            if (configuredVoice) {
              cacheVoiceSelection(configuredVoice.name, speaker, language);
              return configuredVoice;
            }
          }
        }
      }

      // Filter voices by language - try multiple matching strategies
      let languageVoices = voices.filter((v) => {
        const voiceLang = v.lang.toLowerCase();
        return (
          voiceLang.startsWith(langPrefix) ||
          voiceLang === langTag.toLowerCase() ||
          voiceLang.split("-")[0] === langPrefix
        );
      });

      // If no voices found for this language, log and fall back to English
      if (languageVoices.length === 0) {
        console.warn(`No voices found for language: ${language} (${langPrefix}), falling back to English`);
        if (language !== "en") {
          return selectVoice(speaker, "en");
        }
        // Last resort: use any available voice
        languageVoices = voices;
      }

      // Sort by quality first
      const sortedVoices = sortByQuality(languageVoices);

      // Get language-specific patterns or use default
      const patterns = VOICE_PATTERNS[langPrefix] || VOICE_PATTERNS.default;

      // Try to find gender-appropriate voice
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (speaker === "host1") {
        // Prefer male voices for host1
        selectedVoice =
          sortedVoices.find((v) => patterns.male.test(v.name) && !patterns.female.test(v.name)) ||
          null;
      } else {
        // Prefer female voices for host2
        selectedVoice = sortedVoices.find((v) => patterns.female.test(v.name)) || null;
      }

      // If no gender match found, pick based on position in sorted list
      if (!selectedVoice) {
        const index = speaker === "host1" ? 0 : Math.min(1, sortedVoices.length - 1);
        selectedVoice = sortedVoices[index] || null;
      }

      // Cache the selection for consistency
      if (selectedVoice) {
        cacheVoiceSelection(selectedVoice.name, speaker, language);
      }

      return selectedVoice;
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

        const langPrefix = (options.language || "en").split("-")[0].toLowerCase();
        
        // Prepare text with natural pauses for smoother reading
        const preparedText = prepareTextForSpeech(text, langPrefix);
        const utterance = new SpeechSynthesisUtterance(preparedText);
        utteranceRef.current = utterance;

        // Voice selection priority:
        // 1. Explicit voiceName from options (from dropdown)
        // 2. User's cached preferred voice
        // 3. Automatic female voice selection (default to host2 for female voice)
        let selectedVoice: SpeechSynthesisVoice | null = null;

        // Priority 1: Explicit voiceName passed from dropdown
        if (options.voiceName) {
          selectedVoice = voices.find((v) => v.name === options.voiceName) || null;
        }

        // Priority 2: Check for manually selected preferred voice in cache
        if (!selectedVoice) {
          const preferredVoiceName = getCachedVoice("preferred", langPrefix);
          if (preferredVoiceName) {
            selectedVoice = voices.find((v) => v.name === preferredVoiceName) || null;
          }
        }

        // Priority 3: Auto-select - default to female voice (host2) like Hindi "Lekha"
        if (!selectedVoice) {
          selectedVoice = selectVoice(options.speaker || "host2", options.language);
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          // Also set the lang to match the voice for better pronunciation
          utterance.lang = selectedVoice.lang;
        } else if (options.language) {
          // Set language even if no voice found
          utterance.lang = LANGUAGE_TAGS[options.language] || options.language;
        }

        // Get stored settings for pitch/rate
        const storedSettings = getStoredSettings();
        const speaker = options.speaker || "host1";

        // Get language-specific natural speech parameters
        const langCode = options.language || "en";
        const langParams = LANGUAGE_SPEECH_PARAMS[langCode] || LANGUAGE_SPEECH_PARAMS.en;

        // Apply rate - use options first, then language defaults, then stored settings
        if (options.rate !== undefined) {
          utterance.rate = options.rate;
        } else if (storedSettings && options.language === "en") {
          // Only use stored podcast settings for English
          const storedRate = speaker === "host1" ? storedSettings.host1Rate : storedSettings.host2Rate;
          utterance.rate = storedRate;
        } else {
          // Use language-tuned natural rate
          utterance.rate = langParams.rate;
        }

        // Apply pitch - use options first, then language defaults, then stored settings
        if (options.pitch !== undefined) {
          utterance.pitch = options.pitch;
        } else if (storedSettings && options.language === "en") {
          const storedPitch = speaker === "host1" ? storedSettings.host1Pitch : storedSettings.host2Pitch;
          utterance.pitch = storedPitch;
        } else {
          // Use language-tuned natural pitch
          utterance.pitch = langParams.pitch;
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

  // Get voices filtered by language
  const getVoicesForLanguage = useCallback(
    (language: string): SpeechSynthesisVoice[] => {
      const langPrefix = language.split("-")[0].toLowerCase();
      
      // Filter voices by language
      let filtered = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(langPrefix)
      );

      // If no voices for this language, return all voices
      if (filtered.length === 0) {
        filtered = voices;
      }

      // Sort: prioritize neural/premium voices, then alphabetically
      return filtered.sort((a, b) => {
        const qualityA = QUALITY_INDICATORS.test(a.name) ? 0 : 1;
        const qualityB = QUALITY_INDICATORS.test(b.name) ? 0 : 1;
        if (qualityA !== qualityB) return qualityA - qualityB;
        return a.name.localeCompare(b.name);
      });
    },
    [voices]
  );

  // Set preferred voice for a language
  const setPreferredVoice = useCallback(
    (voiceName: string, language: string): void => {
      const langPrefix = language.split("-")[0].toLowerCase();
      cacheVoiceSelection(voiceName, "preferred", langPrefix);
    },
    []
  );

  // Get preferred voice for a language
  const getPreferredVoice = useCallback(
    (language: string): string | null => {
      const langPrefix = language.split("-")[0].toLowerCase();
      return getCachedVoice("preferred", langPrefix);
    },
    []
  );

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    voices,
    getVoicesForLanguage,
    setPreferredVoice,
    getPreferredVoice,
  };
}
