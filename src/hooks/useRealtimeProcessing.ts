import { useState, useCallback, useRef } from "react";

export interface UseRealtimeProcessingReturn {
  // State
  isProcessing: boolean;
  progress: number;          // 0-100 from backend
  isIndeterminate: boolean;  // True when no exact progress available
  stage: string;             // "extracting" | "analyzing" | "generating" | etc.
  message: string;           // Backend status message
  
  // Actions
  startProcessing: () => void;
  stopProcessing: () => void;
  cancelProcessing: () => void;
  reset: () => void;
  
  // SSE streaming helper
  streamWithProgress: (
    url: string,
    body: any,
    token: string,
    onComplete: (result: any) => void,
    onError: (error: Error) => void
  ) => Promise<void>;
  
  // Direct state setters for integration with existing flows
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  setIsIndeterminate: (indeterminate: boolean) => void;
  
  // AbortController for external cancellation
  abortController: AbortController | null;
}

/**
 * Combined hook for real-time backend-driven processing overlay.
 * Handles SSE progress streams and provides state for ProcessingOverlay.
 * 
 * Key behaviors:
 * - Progress is ONLY driven by backend (no fake timers)
 * - Supports both SSE streaming and regular fetch with manual updates
 * - Provides instant start/stop with no artificial delays
 */
export function useRealtimeProcessing(): UseRealtimeProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isIndeterminate, setIsIndeterminate] = useState(true);
  const [stage, setStage] = useState<string>("idle");
  const [message, setMessage] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
    setProgress(0);
    setIsIndeterminate(true);
    setStage("starting");
    setMessage("Initializing...");
    abortControllerRef.current = new AbortController();
  }, []);

  const stopProcessing = useCallback(() => {
    setProgress(100);
    setIsIndeterminate(false);
    setStage("complete");
    setMessage("Complete!");
    // Small delay before hiding to show 100% state
    setTimeout(() => {
      setIsProcessing(false);
    }, 100);
  }, []);

  const cancelProcessing = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    setProgress(0);
    setIsIndeterminate(true);
    setStage("cancelled");
    setMessage("Cancelled");
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    setProgress(0);
    setIsIndeterminate(true);
    setStage("idle");
    setMessage("");
  }, []);

  const streamWithProgress = useCallback(async (
    url: string,
    body: any,
    token: string,
    onComplete: (result: any) => void,
    onError: (error: Error) => void
  ): Promise<void> => {
    // Cancel any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsProcessing(true);
    setProgress(0);
    setIsIndeterminate(true);
    setStage("starting");
    setMessage("Initializing...");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ...body, stream: true }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      
      // Check if it's an SSE stream
      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";
        let finalResult: any = null;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  
                  // Handle progress events from our edge functions
                  if (parsed.type === "progress") {
                    setProgress(parsed.progress);
                    setIsIndeterminate(false);
                    setStage(parsed.stage);
                    if (parsed.message) setMessage(parsed.message);
                    continue;
                  }

                  // Handle final result events from our edge functions
                  if (parsed.type === "result") {
                    finalResult = parsed.data ?? parsed.result ?? parsed.payload ?? parsed;
                    continue;
                  }
                  
                  // Handle OpenAI-style streaming content (fallback)
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullContent += content;
                  }
                } catch {
                  // Not JSON, might be raw content
                }
              }
            }
          }
        }

        setProgress(100);
        setStage("complete");
        setMessage("Complete!");
        setIsIndeterminate(false);
        
        // Use final result if available, otherwise try to parse accumulated content
        const result = finalResult ?? (fullContent ? JSON.parse(fullContent) : null);
        
        setTimeout(() => {
          setIsProcessing(false);
          onComplete(result);
        }, 100);
      } else {
        // Non-streaming JSON response fallback
        const data = await response.json();
        setProgress(100);
        setStage("complete");
        setMessage("Complete!");
        setIsIndeterminate(false);
        
        setTimeout(() => {
          setIsProcessing(false);
          onComplete(data);
        }, 100);
      }
    } catch (error) {
      setIsProcessing(false);
      
      if ((error as Error).name === "AbortError") {
        setStage("cancelled");
        setMessage("Cancelled");
        // Don't call onError for user cancellation
        return;
      }
      
      setStage("error");
      setMessage((error as Error).message || "An error occurred");
      onError(error as Error);
    }
  }, []);

  return {
    isProcessing,
    progress,
    isIndeterminate,
    stage,
    message,
    startProcessing,
    stopProcessing,
    cancelProcessing,
    reset,
    streamWithProgress,
    setProgress,
    setMessage,
    setIsIndeterminate,
    abortController: abortControllerRef.current,
  };
}
