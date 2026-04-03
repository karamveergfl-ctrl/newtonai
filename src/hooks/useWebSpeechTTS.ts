import { useCallback, useRef, useState, useEffect } from "react";

const STORAGE_KEY = "podcast-voice-settings";
const VOICE_CACHE_KEY = "tts-voice-cache";

// Known authentic Indian voices by provider
const INDIAN_VOICE_PRIORITY: Record<string, string[]> = {
  hi: ["Heera", "Hemant", "Kalpana", "Lekha", "Swara", "Aditi", "Ravi", "Sapna", "Neerja"],
  mr: ["Aishwarya", "Sakhi", "Nachiket", "Aarohi"],
  gu: ["Dhwani", "Nishtha", "Niranjan"],
  ta: ["Valluvar", "Pallavi", "Vani", "Shruti"],
  te: ["Chitra", "Mohan", "Shruti", "Shruthi"],
  bn: ["Tanishaa", "Bashkar", "Bondita"],
  kn: ["Sapna", "Gagan"],
  ml: ["Sobhana", "Midhun"],
  pa: ["Harleen", "Harjinder"],
  or: ["Subhadra", "Subhasini"],
  as: ["Pahi", "Priyom"],
};

const DEVANAGARI_LANGUAGES = ['hi', 'mr', 'sa', 'ne', 'kok'];
const INDIC_LANGUAGES = ['hi', 'mr', 'gu', 'bn', 'pa', 'or', 'as', 'ta', 'te', 'kn', 'ml'];

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
  voiceName?: string;
  lockedVoice?: SpeechSynthesisVoice; // Pre-locked voice — skips all selection
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

const prepareTextForSpeech = (text: string, language: string): string => {
  let prepared = text;
  prepared = prepared.replace(/\. /g, '. ... ');
  prepared = prepared.replace(/! /g, '! ... ');
  prepared = prepared.replace(/\? /g, '? ... ');
  prepared = prepared.replace(/,\s+/g, ', ... ');
  prepared = prepared.replace(/:\s+/g, ': ... ');
  prepared = prepared.replace(/;\s+/g, '; ... ');
  prepared = prepared.replace(/[-–—]\s*/g, ' ... ');
  if (DEVANAGARI_LANGUAGES.includes(language)) {
    prepared = prepared.replace(/।\s*/g, '। ... ');
    prepared = prepared.replace(/॥\s*/g, '॥ ... ');
  }
  return prepared;
};

const LANGUAGE_TAGS: Record<string, string> = {
  en: "en-US", hi: "hi-IN", es: "es-ES", fr: "fr-FR", de: "de-DE",
  pt: "pt-BR", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", ar: "ar-SA",
  ta: "ta-IN", te: "te-IN", bn: "bn-IN", mr: "mr-IN", gu: "gu-IN",
  kn: "kn-IN", ml: "ml-IN", pa: "pa-IN", or: "or-IN", as: "as-IN",
  ks: "ks-IN", ru: "ru-RU", it: "it-IT", nl: "nl-NL", pl: "pl-PL",
  tr: "tr-TR", vi: "vi-VN", th: "th-TH", id: "id-ID",
};

const QUALITY_INDICATORS = /\b(neural|natural|premium|enhanced|wavenet|online|remote|lekha|aditi|swara|heera)\b/i;
const MALE_VOICE_NAMES = /\b(david|james|daniel|mark|ravi|hemant|amit|roger|brian|eric|guy|male|man|alex|aaron|adam|chris|fred|john|kevin|michael|peter|richard|robert|william|tom|george|matthew|arthur|henry|paul|charles|edward|conrad|florian|jan|stefan|hans|markus|andreas|thomas|oliver|benjamin|brandon|christopher|derek|donald|douglas|ethan|gabriel|gregory|harold|howard|ian|jason|jeffrey|jeremy|jonathan|justin|kenneth|larry|lawrence|leonard|marcus|martin|nathan|nicholas|patrick|phillip|ralph|raymond|ronald|russell|samuel|scott|shawn|simon|stanley|theodore|victor|walter|wayne|zachary)\b/i;
const FEMALE_VOICE_NAMES = /\b(lekha|aditi|priya|swara|female|woman|raveena|kajal|suman|veena|meera|ananya|divya|kavya|shreya|nisha|pallavi|sunita|varsha|rekha|geeta|jyoti|nandini|lakshmi|sarita|shobha|heera|kalpana|chhaya|zira|hazel|samantha|karen|moira|tessa|fiona|victoria|susan|allison|ava|joana|paulina|monica|lucia|amelie|celine|aurelie|sara|anna|petra|katja|yuna|kyoko|nanami|tingting|xiaoxiao|xiaoyi|zhiyu|yelda|elif|zeynep|filiz|vani|deepa|anjali|pooja|neha|ria|tanishaa|bondita|aishwarya|sakhi|aarohi|dhwani|nishtha|sapna|sobhana|subhasini|priyom|harleen|sarah|alice|kate|linda|lisa|mary|nancy|rachel|tessa|amy|catherine|emily|jessica|jennifer|nicole|olivia|emma|vicki|marlene|sabine|julia|claudia)\b/i;

const LANGUAGE_SPEECH_PARAMS: Record<string, { rate: number; malePitch: number; femalePitch: number }> = {
  hi: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  mr: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  gu: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ta: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  te: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  bn: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  kn: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ml: { rate: 0.82, malePitch: 0.92, femalePitch: 1.03 },
  pa: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  or: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  as: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ks: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  en: { rate: 0.88, malePitch: 0.90, femalePitch: 1.03 },
  es: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  fr: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  de: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  it: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  pt: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ru: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  nl: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  pl: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ja: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  zh: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ko: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  vi: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  th: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  id: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ms: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ar: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  fa: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ur: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  he: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  tr: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
};

export interface LockedVoices {
  host1Voice: SpeechSynthesisVoice | null;
  host2Voice: SpeechSynthesisVoice | null;
}

interface UseWebSpeechTTSReturn {
  speak: (text: string, options?: WebSpeechOptions) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  getVoicesForLanguage: (language: string) => SpeechSynthesisVoice[];
  setPreferredVoice: (voiceName: string, language: string) => void;
  getPreferredVoice: (language: string) => string | null;
  lockVoices: (language: string) => LockedVoices;
}

function getStoredSettings(): VoiceSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function cacheVoiceSelection(voiceName: string, speaker: string, language: string): void {
  try {
    const cache = JSON.parse(localStorage.getItem(VOICE_CACHE_KEY) || "{}");
    cache[`${language}-${speaker}`] = voiceName;
    localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

function getCachedVoice(speaker: string, language: string): string | null {
  try {
    const cache = JSON.parse(localStorage.getItem(VOICE_CACHE_KEY) || "{}");
    return cache[`${language}-${speaker}`] || null;
  } catch { return null; }
}

function isVoiceMale(voice: SpeechSynthesisVoice): boolean {
  return MALE_VOICE_NAMES.test(voice.name) && !FEMALE_VOICE_NAMES.test(voice.name);
}

function isVoiceFemale(voice: SpeechSynthesisVoice): boolean {
  return FEMALE_VOICE_NAMES.test(voice.name);
}

function sortByQuality(
  voiceList: SpeechSynthesisVoice[], 
  language?: string,
  preferMale?: boolean
): SpeechSynthesisVoice[] {
  const langPrefix = language?.split('-')[0] || '';
  const priorityList = INDIAN_VOICE_PRIORITY[langPrefix] || [];
  
  return [...voiceList].sort((a, b) => {
    if (preferMale !== undefined) {
      const aIsMale = isVoiceMale(a);
      const bIsMale = isVoiceMale(b);
      const aIsFemale = isVoiceFemale(a);
      const bIsFemale = isVoiceFemale(b);
      if (preferMale) {
        if (aIsMale && !bIsMale) return -1;
        if (!aIsMale && bIsMale) return 1;
        if (!aIsFemale && bIsFemale) return -1;
        if (aIsFemale && !bIsFemale) return 1;
      } else {
        if (aIsFemale && !bIsFemale) return -1;
        if (!aIsFemale && bIsFemale) return 1;
        if (!aIsMale && bIsMale) return -1;
        if (aIsMale && !bIsMale) return 1;
      }
    }
    if (priorityList.length > 0) {
      const aP = priorityList.some(n => a.name.toLowerCase().includes(n.toLowerCase()));
      const bP = priorityList.some(n => b.name.toLowerCase().includes(n.toLowerCase()));
      if (aP && !bP) return -1;
      if (!aP && bP) return 1;
    }
    if (INDIC_LANGUAGES.includes(langPrefix)) {
      const aI = a.lang.endsWith('-IN');
      const bI = b.lang.endsWith('-IN');
      if (aI && !bI) return -1;
      if (!aI && bI) return 1;
    }
    const aQ = QUALITY_INDICATORS.test(a.name);
    const bQ = QUALITY_INDICATORS.test(b.name);
    if (aQ && !bQ) return -1;
    if (!aQ && bQ) return 1;
    if (!a.localService && b.localService) return -1;
    if (a.localService && !b.localService) return 1;
    return 0;
  });
}

export function useWebSpeechTTS(): UseWebSpeechTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef(true);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () => {
      if (isMountedRef.current) setVoices(speechSynthesis.getVoices());
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, [isSupported]);

  const selectVoice = useCallback(
    (speaker: "host1" | "host2", language: string = "en"): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;
      const isMaleSpeaker = speaker === "host1";
      const langTag = LANGUAGE_TAGS[language] || language;
      const langPrefix = langTag.split("-")[0].toLowerCase();

      // Check cache
      const cachedVoiceName = getCachedVoice(speaker, language);
      if (cachedVoiceName) {
        const cachedVoice = voices.find(v => v.name === cachedVoiceName);
        if (cachedVoice) {
          const cM = isVoiceMale(cachedVoice);
          const cF = isVoiceFemale(cachedVoice);
          if ((isMaleSpeaker && cM) || (!isMaleSpeaker && cF)) return cachedVoice;
        }
      }

      // Stored settings for English
      if (language === "en") {
        const storedSettings = getStoredSettings();
        if (storedSettings) {
          const name = speaker === "host1" ? storedSettings.host1VoiceName : storedSettings.host2VoiceName;
          if (name) {
            const v = voices.find(v => v.name === name);
            if (v) { cacheVoiceSelection(v.name, speaker, language); return v; }
          }
        }
      }

      let languageVoices = voices.filter(v => {
        const vl = v.lang.toLowerCase();
        return vl.startsWith(langPrefix) || vl === langTag.toLowerCase() || vl.split("-")[0] === langPrefix;
      });

      if (languageVoices.length === 0) {
        if (language !== "en") return selectVoice(speaker, "en");
        languageVoices = voices;
      }

      if (INDIC_LANGUAGES.includes(langPrefix)) {
        const indian = languageVoices.filter(v => v.lang.endsWith('-IN'));
        if (indian.length > 0) languageVoices = indian;
      }

      const sorted = sortByQuality(languageVoices, language, isMaleSpeaker);

      let selected: SpeechSynthesisVoice | null = null;
      if (isMaleSpeaker) {
        selected = sorted.find(v => isVoiceMale(v) && !isVoiceFemale(v)) || null;
        if (!selected) selected = sorted.find(v => !isVoiceFemale(v)) || null;
      } else {
        selected = sorted.find(v => isVoiceFemale(v)) || null;
        if (!selected) selected = sorted.find(v => !isVoiceMale(v)) || null;
      }

      if (!selected) {
        const idx = isMaleSpeaker ? 0 : Math.min(1, sorted.length - 1);
        selected = sorted[idx] || null;
      }

      if (selected) {
        cacheVoiceSelection(selected.name, speaker, language);
      }
      return selected;
    },
    [voices]
  );

  /**
   * Lock voices for both hosts at session start.
   * Returns the two voices that will be used for the entire session.
   */
  const lockVoices = useCallback((language: string): LockedVoices => {
    const host1Voice = selectVoice("host1", language);
    const host2Voice = selectVoice("host2", language);

    // Make sure host1 and host2 are different voices when possible
    if (host1Voice && host2Voice && host1Voice.name === host2Voice.name && voices.length > 1) {
      const langPrefix = (LANGUAGE_TAGS[language] || language).split("-")[0].toLowerCase();
      let languageVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
      if (languageVoices.length === 0) languageVoices = voices;
      const alt = languageVoices.find(v => v.name !== host1Voice.name);
      if (alt) {
        return { host1Voice, host2Voice: alt };
      }
    }

    console.log(`Locked voices — host1: ${host1Voice?.name}, host2: ${host2Voice?.name}`);
    return { host1Voice, host2Voice };
  }, [selectVoice, voices]);

  const speak = useCallback(
    (text: string, options: WebSpeechOptions = {}): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          reject(new Error("Web Speech API is not supported"));
          return;
        }

        speechSynthesis.cancel();

        const langPrefix = (options.language || "en").split("-")[0].toLowerCase();
        const preparedText = prepareTextForSpeech(text, langPrefix);
        const utterance = new SpeechSynthesisUtterance(preparedText);
        utteranceRef.current = utterance;

        const speaker = options.speaker || "host1";
        const isMaleSpeaker = speaker === "host1";

        // Voice selection: lockedVoice > voiceName > auto-select
        let selectedVoice: SpeechSynthesisVoice | null = null;

        if (options.lockedVoice) {
          selectedVoice = options.lockedVoice;
        } else if (options.voiceName) {
          selectedVoice = voices.find(v => v.name === options.voiceName) || null;
        }

        if (!selectedVoice) {
          const preferredName = getCachedVoice("preferred", langPrefix);
          if (preferredName) selectedVoice = voices.find(v => v.name === preferredName) || null;
        }

        if (!selectedVoice) {
          selectedVoice = selectVoice(speaker, options.language);
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else if (options.language) {
          utterance.lang = LANGUAGE_TAGS[options.language] || options.language;
        }

        const storedSettings = getStoredSettings();
        const langCode = options.language || "en";
        const langParams = LANGUAGE_SPEECH_PARAMS[langCode] || LANGUAGE_SPEECH_PARAMS.en;

        // NO random variation — deterministic rate for consistent pitch
        if (options.rate !== undefined) {
          utterance.rate = options.rate;
        } else if (storedSettings && options.language === "en") {
          utterance.rate = speaker === "host1" ? storedSettings.host1Rate : storedSettings.host2Rate;
        } else {
          utterance.rate = langParams.rate;
        }

        if (options.pitch !== undefined) {
          utterance.pitch = options.pitch;
        } else if (storedSettings && options.language === "en") {
          utterance.pitch = speaker === "host1" ? storedSettings.host1Pitch : storedSettings.host2Pitch;
        } else {
          utterance.pitch = isMaleSpeaker ? langParams.malePitch : langParams.femalePitch;
        }

        utterance.volume = 1;

        utterance.onstart = () => {
          if (isMountedRef.current) setIsSpeaking(true);
          options.onStart?.();
        };

        utterance.onend = () => {
          if (isMountedRef.current) setIsSpeaking(false);
          options.onEnd?.();
          resolve();
        };

        utterance.onerror = (event) => {
          if (isMountedRef.current) setIsSpeaking(false);
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
    [isSupported, voices, selectVoice]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      if (isMountedRef.current) setIsSpeaking(false);
    }
  }, [isSupported]);

  const getVoicesForLanguage = useCallback(
    (language: string): SpeechSynthesisVoice[] => {
      const langPrefix = language.split("-")[0].toLowerCase();
      let filtered = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
      if (filtered.length === 0) filtered = voices;
      return filtered.sort((a, b) => {
        const qA = QUALITY_INDICATORS.test(a.name) ? 0 : 1;
        const qB = QUALITY_INDICATORS.test(b.name) ? 0 : 1;
        if (qA !== qB) return qA - qB;
        return a.name.localeCompare(b.name);
      });
    },
    [voices]
  );

  const setPreferredVoice = useCallback((voiceName: string, language: string): void => {
    cacheVoiceSelection(voiceName, "preferred", language.split("-")[0].toLowerCase());
  }, []);

  const getPreferredVoice = useCallback((language: string): string | null => {
    return getCachedVoice("preferred", language.split("-")[0].toLowerCase());
  }, []);

  return {
    speak, cancel, isSpeaking, isSupported, voices,
    getVoicesForLanguage, setPreferredVoice, getPreferredVoice, lockVoices,
  };
}
