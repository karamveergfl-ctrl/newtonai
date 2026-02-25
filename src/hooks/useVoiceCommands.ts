import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UseVoiceCommandsProps {
  enabled: boolean;
  slideContent: string;
  sessionId: string;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  onToggleCapture?: (recording: boolean) => void;
}

type CommandType =
  | "generate_quiz"
  | "summarize"
  | "explain"
  | "next_slide"
  | "prev_slide"
  | "start_recording"
  | "stop_recording"
  | "unknown";

interface VoiceCommandResult {
  command: CommandType;
  label: string;
  result?: string;
}

export function useVoiceCommands({
  enabled,
  slideContent,
  sessionId,
  onNextSlide,
  onPrevSlide,
  onToggleCapture,
}: UseVoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const parseCommand = (transcript: string): { type: CommandType; label: string } => {
    const lower = transcript.toLowerCase();
    // Only process if "newton" is mentioned
    if (!lower.includes("newton")) return { type: "unknown", label: "" };

    const afterNewton = lower.split("newton").slice(1).join(" ").trim();

    if (/generat(e|ing)\s*(a\s+)?quiz/.test(afterNewton))
      return { type: "generate_quiz", label: "Generate Quiz" };
    if (/summar(ize|y)/.test(afterNewton))
      return { type: "summarize", label: "Summarize Slide" };
    if (/explain/.test(afterNewton))
      return { type: "explain", label: "Explain Simply" };
    if (/next\s*slide/.test(afterNewton))
      return { type: "next_slide", label: "Next Slide" };
    if (/prev(ious)?\s*slide|go\s*back/.test(afterNewton))
      return { type: "prev_slide", label: "Previous Slide" };
    if (/start\s*record/.test(afterNewton))
      return { type: "start_recording", label: "Start Recording" };
    if (/stop\s*record/.test(afterNewton))
      return { type: "stop_recording", label: "Stop Recording" };

    return { type: "unknown", label: "" };
  };

  const executeCommand = useCallback(
    async (type: CommandType) => {
      setIsProcessing(true);
      try {
        switch (type) {
          case "generate_quiz":
            await supabase.functions.invoke("generate-concept-check", {
              body: { sessionId, slideContext: slideContent },
            });
            toast({ title: "Quiz generated!", description: "A concept check has been created." });
            break;

          case "summarize": {
            const { data } = await supabase.functions.invoke("generate-summary", {
              body: { content: slideContent },
            });
            const summary = data?.summary || "Summary generated.";
            setLastCommand((prev) => prev ? { ...prev, result: summary } : null);
            toast({ title: "Summary", description: summary.slice(0, 200) });
            break;
          }

          case "explain": {
            const { data } = await supabase.functions.invoke("newton-chat", {
              body: {
                message: `Explain this simply: ${slideContent}`,
                conversationHistory: [],
              },
            });
            const explanation = data?.response || "Explanation generated.";
            setLastCommand((prev) => prev ? { ...prev, result: explanation } : null);
            toast({ title: "Explanation", description: explanation.slice(0, 200) });
            break;
          }

          case "next_slide":
            onNextSlide?.();
            break;

          case "prev_slide":
            onPrevSlide?.();
            break;

          case "start_recording":
            onToggleCapture?.(true);
            toast({ title: "Recording started" });
            break;

          case "stop_recording":
            onToggleCapture?.(false);
            toast({ title: "Recording stopped" });
            break;
        }
      } catch (err) {
        console.error("Voice command execution error:", err);
        toast({ title: "Command failed", description: "Could not execute voice command.", variant: "destructive" });
      } finally {
        if (mountedRef.current) setIsProcessing(false);
      }
    },
    [sessionId, slideContent, onNextSlide, onPrevSlide, onToggleCapture]
  );

  const handleTranscript = useCallback(
    (transcript: string) => {
      const { type, label } = parseCommand(transcript);
      if (type === "unknown") return;

      setLastCommand({ command: type, label });
      executeCommand(type);
    },
    [executeCommand]
  );

  // Initialize Web Speech API in continuous mode
  useEffect(() => {
    if (!enabled) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          handleTranscript(event.results[i][0].transcript);
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (mountedRef.current && enabled) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      console.error("Voice command recognition error:", event.error);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start voice commands:", err);
    }

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [enabled, handleTranscript]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return { isListening, isProcessing, lastCommand };
}
