import { useCallback, useEffect, useState } from "react";
import { DEFAULT_NEWTON_VOICE, getStoredNewtonVoice, storeNewtonVoice } from "@/lib/newtonVoices";

/** Shared, persisted voice selection for Newton chat read-aloud. */
export function useNewtonVoice() {
  const [voice, setVoiceState] = useState<string>(DEFAULT_NEWTON_VOICE);

  useEffect(() => {
    setVoiceState(getStoredNewtonVoice());
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      if (next) setVoiceState(next);
    };
    window.addEventListener("newton-voice-change", onChange);
    return () => window.removeEventListener("newton-voice-change", onChange);
  }, []);

  const setVoice = useCallback((id: string) => {
    setVoiceState(id);
    storeNewtonVoice(id);
  }, []);

  return { voice, setVoice };
}
