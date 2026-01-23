import { useState, useCallback, useRef } from "react";

export interface ProgressEvent {
  stage: string;      // "extracting" | "analyzing" | "generating" | "complete"
  progress: number;   // 0-100
  message?: string;   // Optional status message
}

export interface UseSSEProgressReturn {
  progress: number;
  stage: string;
  message: string;
  isActive: boolean;
  startSSE: (
    url: string,
    body: any,
    token: string,
    onContent?: (content: string) => void
  ) => Promise<string>;
  cancel: () => void;
  reset: () => void;
}

export function useSSEProgress(): UseSSEProgressReturn {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>("idle");
  const [message, setMessage] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startSSE = useCallback(async (
    url: string,
    body: any,
    token: string,
    onContent?: (content: string) => void
  ): Promise<string> => {
    // Cancel any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsActive(true);
    setProgress(0);
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
                    setStage(parsed.stage);
                    if (parsed.message) setMessage(parsed.message);
                    continue;
                  }

                  // Handle final result events from our edge functions
                  if (parsed.type === "result") {
                    // Normalize into a string so callers can JSON.parse() it.
                    // (We intentionally overwrite any streaming text content.)
                    fullContent = JSON.stringify(
                      parsed.data ?? parsed.result ?? parsed.payload ?? parsed
                    );
                    continue;
                  }
                  
                  // Handle OpenAI-style streaming content
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullContent += content;
                    onContent?.(content);
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
        setIsActive(false);
        return fullContent;
      } else {
        // Non-streaming JSON response fallback
        const data = await response.json();
        setProgress(100);
        setStage("complete");
        setMessage("Complete!");
        setIsActive(false);
        return JSON.stringify(data);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setStage("cancelled");
        setMessage("Cancelled");
      } else {
        setStage("error");
        setMessage((error as Error).message || "An error occurred");
      }
      setIsActive(false);
      throw error;
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setProgress(0);
    setStage("cancelled");
    setMessage("Cancelled");
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setProgress(0);
    setStage("idle");
    setMessage("");
    setIsActive(false);
  }, []);

  return { progress, stage, message, isActive, startSSE, cancel, reset };
}
