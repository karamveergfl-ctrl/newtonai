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
  onToolChange?: (tool: string) => void;
  onColorChange?: (color: string) => void;
  onClearBoard?: () => void;
  onNewPage?: () => void;
  onUndo?: () => void;
}

type CommandType =
  | "generate_quiz"
  | "summarize"
  | "explain"
  | "next_slide"
  | "prev_slide"
  | "start_recording"
  | "stop_recording"
  | "tool_pen"
  | "tool_eraser"
  | "tool_highlighter"
  | "tool_text"
  | "color_change"
  | "clear_board"
  | "new_page"
  | "undo"
  | "unknown";

interface VoiceCommandResult {
  command: CommandType;
  label: string;
  result?: string;
}

const COLOR_MAP: Record<string, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#F59E0B",
  black: "#000000",
  white: "#FFFFFF",
  purple: "#A855F7",
  pink: "#EC4899",
};

export function useVoiceCommands({
  enabled,
  slideContent,
  sessionId,
  onNextSlide,
  onPrevSlide,
  onToggleCapture,
  onToolChange,
  onColorChange,
  onClearBoard,
  onNewPage,
  onUndo,
}: UseVoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const detectedColorRef = useRef<string>("");

  const parseCommand = (transcript: string): { type: CommandType; label: string } => {
    const lower = transcript.toLowerCase().trim();

    // Strip optional "newton" prefix
    const text = lower.replace(/^newton\s*/i, "").trim();

    if (/generat(e|ing)\s*(a\s+)?quiz/.test(text))
      return { type: "generate_quiz", label: "Generate Quiz" };
    if (/summar(ize|y)/.test(text))
      return { type: "summarize", label: "Summarize Slide" };
    if (/explain/.test(text))
      return { type: "explain", label: "Explain Simply" };
    if (/next\s*slide/.test(text))
      return { type: "next_slide", label: "Next Slide" };
    if (/prev(ious)?\s*slide|go\s*back/.test(text))
      return { type: "prev_slide", label: "Previous Slide" };
    if (/start\s*record/.test(text))
      return { type: "start_recording", label: "Start Recording" };
    if (/stop\s*record/.test(text))
      return { type: "stop_recording", label: "Stop Recording" };

    // Tool commands
    if (/\b(pen|draw)\b/.test(text) && !/highlighter/.test(text))
      return { type: "tool_pen", label: "Pen Tool" };
    if (/\bhighlighter\b/.test(text))
      return { type: "tool_highlighter", label: "Highlighter" };
    if (/\beraser?\b/.test(text))
      return { type: "tool_eraser", label: "Eraser" };
    if (/\btext\b/.test(text))
      return { type: "tool_text", label: "Text Tool" };

    // Color commands
    for (const [name] of Object.entries(COLOR_MAP)) {
      if (new RegExp(`\\b${name}\\b`).test(text)) {
        detectedColorRef.current = name;
        return { type: "color_change", label: `Color: ${name}` };
      }
    }

    if (/clear\s*(board|canvas|all)/.test(text))
      return { type: "clear_board", label: "Clear Board" };
    if (/new\s*page/.test(text))
      return { type: "new_page", label: "New Page" };
    if (/\bundo\b/.test(text))
      return { type: "undo", label: "Undo" };

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
            toast({ title: "Quiz generated!" });
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
              body: { message: `Explain this simply: ${slideContent}`, conversationHistory: [] },
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
          case "tool_pen":
            onToolChange?.("pen");
            toast({ title: "🖊 Pen selected" });
            break;
          case "tool_highlighter":
            onToolChange?.("highlighter");
            toast({ title: "🖍 Highlighter selected" });
            break;
          case "tool_eraser":
            onToolChange?.("eraser");
            toast({ title: "🧹 Eraser selected" });
            break;
          case "tool_text":
            onToolChange?.("text");
            toast({ title: "📝 Text tool selected" });
            break;
          case "color_change": {
            const hex = COLOR_MAP[detectedColorRef.current];
            if (hex) {
              onColorChange?.(hex);
              toast({ title: `🎨 Color: ${detectedColorRef.current}` });
            }
            break;
          }
          case "clear_board":
            onClearBoard?.();
            toast({ title: "🗑 Board cleared" });
            break;
          case "new_page":
            onNewPage?.();
            toast({ title: "📄 New page" });
            break;
          case "undo":
            onUndo?.();
            toast({ title: "↩ Undo" });
            break;
          case "unknown":
            toast({
              title: "Unrecognized command",
              description: "Try: 'next slide', 'pen', 'red', 'clear board', 'undo'",
            });
            break;
        }
      } catch (err) {
        console.error("Voice command error:", err);
        toast({ title: "Command failed", variant: "destructive" });
      } finally {
        if (mountedRef.current) setIsProcessing(false);
      }
    },
    [sessionId, slideContent, onNextSlide, onPrevSlide, onToggleCapture, onToolChange, onColorChange, onClearBoard, onNewPage, onUndo]
  );

  const handleTranscript = useCallback(
    (transcript: string) => {
      const { type, label } = parseCommand(transcript);
      if (type === "unknown") {
        // Still show toast for unrecognized
        executeCommand(type);
        return;
      }
      setLastCommand({ command: type, label });
      executeCommand(type);
    },
    [executeCommand]
  );

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
      if (mountedRef.current && enabled) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      console.error("Voice recognition error:", event.error);
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
