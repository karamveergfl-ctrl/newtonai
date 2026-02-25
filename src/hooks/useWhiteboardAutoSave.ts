import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseWhiteboardAutoSaveProps {
  sessionId: string;
  slideIndex: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
}

export function useWhiteboardAutoSave({
  sessionId,
  slideIndex,
  canvasRef,
  enabled,
}: UseWhiteboardAutoSaveProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  const saveCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) return null;

    const timestamp = Date.now();
    const path = `${sessionId}/${slideIndex}_${timestamp}.png`;

    const { error } = await supabase.storage
      .from("whiteboard-notes")
      .upload(path, blob, { contentType: "image/png", upsert: false });

    if (error) {
      console.error("Whiteboard auto-save error:", error.message);
      return null;
    }

    lastSaveRef.current = timestamp;

    // Update whiteboard_data on live_sessions
    try {
      const { data: session } = await supabase
        .from("live_sessions")
        .select("whiteboard_data")
        .eq("id", sessionId)
        .single();

      const existing = (session?.whiteboard_data as any[]) || [];
      const updated = [
        ...existing,
        { slide_index: slideIndex, storage_path: path, created_at: new Date().toISOString() },
      ];

      await supabase
        .from("live_sessions")
        .update({ whiteboard_data: updated } as any)
        .eq("id", sessionId);
    } catch (err) {
      console.error("Whiteboard metadata update error:", err);
    }

    return path;
  }, [sessionId, slideIndex, canvasRef]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(() => {
      saveCanvas();
    }, 30_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, saveCanvas]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (enabled) saveCanvas();
    };
  }, [enabled, saveCanvas]);

  return { saveCanvas };
}
