import { useCallback, useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWebSpeechTTS } from "./useWebSpeechTTS";

/**
 * Read-aloud hook with the same surface as useWebSpeechTTS, but audio is
 * generated server-side (Kokoro first, ElevenLabs fallback, cached in storage).
 * If the server engine is unavailable it degrades to browser speech synthesis.
 */
export interface ReadAloudOptions {
  language?: string;
  voiceName?: string;
  /** Selectable Newton voice id (see src/lib/newtonVoices.ts). */
  voiceId?: string;
  speaker?: "host1" | "host2";
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}


const MAX_SERVER_CHARS = 5000;

/**
 * Only one read-aloud playback may run at a time across the whole app.
 * Each hook instance registers its stopper here; starting a new playback
 * stops whichever one is currently active (even from another component).
 */
let activeStop: (() => void) | null = null;

function stopActivePlayback(except?: () => void) {
  if (activeStop && activeStop !== except) {
    const stop = activeStop;
    activeStop = null;
    stop();
  }
}

export function useReadAloudTTS() {
  const web = useWebSpeechTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cancelledRef = useRef(false);
  const [isServerSpeaking, setIsServerSpeaking] = useState(false);
  const [engine, setEngine] = useState<"kokoro" | "elevenlabs" | "cache" | "browser" | null>(null);

  const pendingResolveRef = useRef<(() => void) | null>(null);

  const stopServerAudio = useCallback(() => {
    // Settle any pending speak() promise so awaiting callers (e.g. message
    // bubbles) reset their "speaking" state instead of getting stuck.
    if (pendingResolveRef.current) {
      const resolve = pendingResolveRef.current;
      pendingResolveRef.current = null;
      resolve();
    }
    if (audioRef.current) {
      const audio = audioRef.current;
      audioRef.current = null;
      // Detach handlers so pausing/clearing never surfaces as a playback error
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = "";
    }
    setIsServerSpeaking(false);
  }, []);

  const cancelSelf = useCallback(() => {
    cancelledRef.current = true;
    stopServerAudio();
    web.cancel();
  }, [stopServerAudio, web]);

  const cancelSelfRef = useRef(cancelSelf);
  cancelSelfRef.current = cancelSelf;

  useEffect(
    () => () => {
      if (activeStop === cancelSelfRef.current) activeStop = null;
      stopServerAudio();
    },
    [stopServerAudio],
  );

  const cancel = useCallback(() => {
    if (activeStop === cancelSelfRef.current) activeStop = null;
    cancelSelf();
  }, [cancelSelf]);

  const speak = useCallback(
    async (text: string, options: ReadAloudOptions = {}) => {
      // Stop any playback owned by another bubble/component, then our own.
      stopActivePlayback(cancelSelfRef.current);
      cancelSelf();

      const clean = (text ?? "").trim();
      if (!clean) return;

      cancelledRef.current = false;
      activeStop = cancelSelfRef.current;

      if (clean.length <= MAX_SERVER_CHARS) {
        try {
          const { data, error } = await supabase.functions.invoke("read-aloud-tts", {
            body: {
              text: clean,
              language: options.language ?? "en",
              role: options.speaker === "host2" ? "host2" : "tutor",
              voice: options.voiceId,
              speed: options.rate ?? 1.0,
            },

          });

          if (cancelledRef.current) return;

          if (!error && data?.audioUrl) {
            const audio = new Audio(data.audioUrl);
            audioRef.current = audio;
            setEngine(data.engine ?? null);

            await new Promise<void>((resolve, reject) => {
              audio.onplay = () => {
                setIsServerSpeaking(true);
                options.onStart?.();
              };
              audio.onended = () => {
                setIsServerSpeaking(false);
                if (activeStop === cancelSelfRef.current) activeStop = null;
                options.onEnd?.();
                resolve();
              };
              audio.onerror = () => {
                setIsServerSpeaking(false);
                // A deliberate stop detaches handlers first; anything here is real.
                if (cancelledRef.current) resolve();
                else reject(new Error("Audio playback failed"));
              };
              audio.play().catch((err) => {
                if (cancelledRef.current) resolve();
                else reject(err);
              });
            });
            return;
          }
          console.warn("read-aloud-tts unavailable, using browser voice:", error?.message);
        } catch (err) {
          if (cancelledRef.current) return;
          console.warn("read-aloud-tts failed, using browser voice:", err);
        }
      }

      if (cancelledRef.current) return;

      // Fallback: browser speech synthesis
      setEngine("browser");
      await web.speak(clean, options as never);
      if (activeStop === cancelSelfRef.current) activeStop = null;
    },
    [cancelSelf, web],
  );

  return {
    ...web,
    speak,
    cancel,
    engine,
    isSpeaking: isServerSpeaking || web.isSpeaking,
    isSupported: true,
  };
}
