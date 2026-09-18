export interface NewtonVoice {
  id: string;
  label: string;
  description: string;
}

/** Voices offered for Newton chat read-aloud. Ids are validated server-side. */
export const NEWTON_VOICES: NewtonVoice[] = [
  { id: "charon", label: "Newton (default)", description: "Calm male narrator" },
  { id: "kore", label: "Aria", description: "Warm, confident female" },
  { id: "leda", label: "Mia", description: "Youthful, friendly female" },
  { id: "aoede", label: "Sana", description: "Breezy, expressive female" },
  { id: "puck", label: "Rio", description: "Upbeat male co-host" },
  { id: "fenrir", label: "Kabir", description: "Energetic male" },
];

export const DEFAULT_NEWTON_VOICE = "charon";

const STORAGE_KEY = "newton-chat-voice";

export function getStoredNewtonVoice(): string {
  if (typeof window === "undefined") return DEFAULT_NEWTON_VOICE;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return NEWTON_VOICES.some((v) => v.id === saved) ? (saved as string) : DEFAULT_NEWTON_VOICE;
}

export function storeNewtonVoice(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent("newton-voice-change", { detail: id }));
  } catch {
    /* ignore */
  }
}
