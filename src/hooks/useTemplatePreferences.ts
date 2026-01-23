import { useState, useEffect } from "react";

export type LectureTemplate = "lecture" | "study-guide" | "research" | "project";
export type MindMapStyle = "radial" | "tree" | "cluster" | "timeline";
export type SummaryFormat = "concise" | "detailed" | "bullet-points" | "academic";
export type NotesStyle = "academic" | "quick-notes" | "slides";
export type LanguageCode = 
  | "en" | "es" | "fr" | "de" | "it" | "pt" | "zh" | "ja" | "ko" 
  | "ar" | "hi" | "ru" | "nl" | "pl" | "tr" | "vi" | "th" | "id"
  | "bn" | "ta" | "te" | "mr" | "gu" | "kn" | "ml" | "pa"
  | "or" | "as" | "ks";

interface TemplatePreferences {
  lectureTemplate: LectureTemplate;
  mindMapStyle: MindMapStyle;
  summaryFormat: SummaryFormat;
  language: LanguageCode;
  notesStyle: NotesStyle;
}

const STORAGE_KEY = "study-tool-preferences";

const defaultPreferences: TemplatePreferences = {
  lectureTemplate: "lecture",
  mindMapStyle: "radial",
  summaryFormat: "concise",
  language: "en",
  notesStyle: "academic",
};

export const useTemplatePreferences = () => {
  const [preferences, setPreferences] = useState<TemplatePreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (e) {
      console.error("Failed to load template preferences:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage whenever they change
  const updatePreference = <K extends keyof TemplatePreferences>(
    key: K,
    value: TemplatePreferences[K]
  ) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save template preferences:", e);
      }
      return updated;
    });
  };

  return {
    preferences,
    isLoaded,
    setLectureTemplate: (value: LectureTemplate) => updatePreference("lectureTemplate", value),
    setMindMapStyle: (value: MindMapStyle) => updatePreference("mindMapStyle", value),
    setSummaryFormat: (value: SummaryFormat) => updatePreference("summaryFormat", value),
    setLanguage: (value: LanguageCode) => updatePreference("language", value),
    setNotesStyle: (value: NotesStyle) => updatePreference("notesStyle", value),
  };
};
