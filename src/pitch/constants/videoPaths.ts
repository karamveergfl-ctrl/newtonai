// All demo videos for the NewtonAI pitch deck.
// Replace each empty string with the actual video URL when recordings are ready.
export const VIDEO_PATHS = {
  NEWTON_CHAT:     "", // Replace with: /videos/newton-chat-demo.mp4
  SMART_CLASSROOM: "", // Replace with: /videos/smart-classroom-demo.mp4
  PULSE_METER:     "", // Replace with: /videos/pulse-meter-demo.mp4
  VIDEO_SEARCH:    "", // Replace with: /videos/video-search-demo.mp4
  AD_FREE_VIDEOS:  "", // Replace with: /videos/ad-free-videos-demo.mp4
  QUIZ_GENERATOR:  "", // Replace with: /videos/quiz-generator-demo.mp4
  AUTO_NOTES:      "", // Replace with: /videos/auto-notes-demo.mp4
  FLASHCARDS:      "", // Replace with: /videos/flashcards-demo.mp4
  SUMMARISER:      "", // Replace with: /videos/summariser-demo.mp4
  HOMEWORK_HELP:   "", // Replace with: /videos/homework-help-demo.mp4
  PDF_CHAT:        "", // Replace with: /videos/pdf-chat-demo.mp4
  MIND_MAPS:       "", // Replace with: /videos/mind-maps-demo.mp4
  PODCAST:         "", // Replace with: /videos/podcast-demo.mp4
};

export const PITCH_COLORS = {
  darkBg: "#0A1628",
  lightBg: "#FFFFFF",
  primary: "#6366F1",
  primaryLight: "#818CF8",
  primaryDark: "#4338CA",
  accent: "#F59E0B",
  textOnDark: "#F1F5F9",
  textOnDarkMuted: "#94A3B8",
  textOnLight: "#0F172A",
  textOnLightMuted: "#475569",
} as const;

export const PITCH_FONT = `"Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;

export type PitchTheme = "dark" | "light";

export interface PitchThemeTokens {
  background: string;
  text: string;
  textMuted: string;
}

export const PITCH_THEMES: Record<PitchTheme, PitchThemeTokens> = {
  dark: {
    background: PITCH_COLORS.darkBg,
    text: PITCH_COLORS.textOnDark,
    textMuted: PITCH_COLORS.textOnDarkMuted,
  },
  light: {
    background: PITCH_COLORS.lightBg,
    text: PITCH_COLORS.textOnLight,
    textMuted: PITCH_COLORS.textOnLightMuted,
  },
};

export const getPitchTheme = (theme: PitchTheme): PitchThemeTokens => PITCH_THEMES[theme];