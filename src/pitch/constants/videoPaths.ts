// All demo videos for the NewtonAI pitch deck.
// Hosted permanently in the public `pitch-videos` storage bucket so anyone
// opening the shared pitch link can watch them without a local upload.
const BASE =
  "https://tdvsxaxmwmhpvsdpvbvc.supabase.co/storage/v1/object/public/pitch-videos";

export const VIDEO_PATHS = {
  NEWTON_CHAT:     `${BASE}/newtonchat.mp4`,
  SMART_CLASSROOM: `${BASE}/smart_classroom.mp4`,
  PULSE_METER:     "",
  VIDEO_SEARCH:    "",
  AD_FREE_VIDEOS:  `${BASE}/videowithout_ads.mp4`,
  QUIZ_GENERATOR:  `${BASE}/quiz.mp4`,
  AUTO_NOTES:      "",
  FLASHCARDS:      `${BASE}/flashcards.mp4`,
  SUMMARISER:      `${BASE}/summary.mp4`,
  HOMEWORK_HELP:   `${BASE}/homework_help.mp4`,
  PDF_CHAT:        `${BASE}/chat_pdf.mp4`,
  MIND_MAPS:       `${BASE}/mindmap.mp4`,
  PODCAST:         `${BASE}/podcast.mp4`,
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