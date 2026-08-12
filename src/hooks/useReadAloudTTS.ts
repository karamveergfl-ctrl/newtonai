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
  speaker?: "host1" | "host2";
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

const MAX_SERVER_CHARS = 5000;

export function useReadAloudTTS() {
  const web = useWebSpeechTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isServerSpeaking, setIsServerSpeaking] = useState(false);
  const [engine, setEngine] = useState<"kokoro" | "elevenlabs" | "cache" | "browser" | null>(null);

  const stopServerAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsServerSpeaking(false);
  }, []);

  useEffect(() => () => stopServerAudio(), [stopServerAudio]);

  const cancel = useCallback(() => {
    stopServerAudio();
    web.cancel();
  }, [stopServerAudio, web]);

  const speak = useCallback(
    async (text: string, options: ReadAloudOptions = {}) => {
      cancel();
      const clean = (text ?? "").trim();
      if (!clean) return;

      if (clean.length <= MAX_SERVER_CHARS) {
        try {
          const { data, error } = await supabase.functions.invoke("read-aloud-tts", {
            body: {
              text: clean,
              language: options.language ?? "en",
              role: options.speaker === "host2" ? "host2" : "tutor",
              speed: options.rate ?? 1.0,
            },
          });

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
                options.onEnd?.();
                resolve();
              };
              audio.onerror = () => {
                setIsServerSpeaking(false);
                reject(new Error("Audio playback failed"));
              };
              audio.play().catch(reject);
            });
            return;
          }
          console.warn("read-aloud-tts unavailable, using browser voice:", error?.message);
        } catch (err) {
          console.warn("read-aloud-tts failed, using browser voice:", err);
        }
      }

      // Fallback: browser speech synthesis
      setEngine("browser");
      await web.speak(clean, options as never);
    },
    [cancel, web],
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
