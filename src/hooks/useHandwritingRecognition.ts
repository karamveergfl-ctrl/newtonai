import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseHandwritingRecognitionProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onRecognized?: (text: string) => void;
  debounceMs?: number;
}

export function useHandwritingRecognition({
  canvasRef,
  onRecognized,
  debounceMs = 3000,
}: UseHandwritingRecognitionProps) {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerRecognition = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecognizing(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];

      const { data, error } = await supabase.functions.invoke("ocr-handwriting", {
        body: { image: base64 },
      });

      if (error) {
        console.error("OCR error:", error);
        return;
      }

      const text = data?.text || "";
      if (text.trim()) {
        setRecognizedText(text);
        onRecognized?.(text);
      }
    } catch (err) {
      console.error("Handwriting recognition error:", err);
    } finally {
      setIsRecognizing(false);
    }
  }, [canvasRef, onRecognized]);

  // Call this after each stroke ends
  const onStrokeEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(triggerRecognition, debounceMs);
  }, [triggerRecognition, debounceMs]);

  const cancelPending = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { isRecognizing, recognizedText, onStrokeEnd, cancelPending };
}
