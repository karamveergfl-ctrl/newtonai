import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Annotation {
  type: "draw" | "highlight";
  points: { x: number; y: number }[];
  color: string;
  pageIndex: number;
  width?: number;
}

interface UseDocumentAnnotationsProps {
  sessionId: string;
}

export function useDocumentAnnotations({ sessionId }: UseDocumentAnnotationsProps) {
  const [annotations, setAnnotations] = useState<Map<number, Annotation[]>>(new Map());

  const addAnnotation = useCallback(
    (pageIndex: number, annotation: Annotation) => {
      setAnnotations((prev) => {
        const next = new Map(prev);
        const pageAnns = next.get(pageIndex) || [];
        next.set(pageIndex, [...pageAnns, annotation]);
        return next;
      });
    },
    []
  );

  const getPageAnnotations = useCallback(
    (pageIndex: number): Annotation[] => {
      return annotations.get(pageIndex) || [];
    },
    [annotations]
  );

  const clearPageAnnotations = useCallback((pageIndex: number) => {
    setAnnotations((prev) => {
      const next = new Map(prev);
      next.delete(pageIndex);
      return next;
    });
  }, []);

  const syncAnnotationsToSpotlight = useCallback(
    async (pageIndex: number, content: string) => {
      try {
        const pageAnns = annotations.get(pageIndex) || [];
        const annotatedContent = JSON.stringify({
          type: "annotated_document",
          pageIndex,
          textContent: content,
          annotations: pageAnns,
        });

        await supabase.rpc("update_spotlight_session_state", {
          p_session_id: sessionId,
          p_spotlight_enabled: true,
          p_current_slide_content: annotatedContent,
          p_current_slide_title: `Document Page ${pageIndex + 1}`,
        });
      } catch (err) {
        console.error("Annotation sync error:", err);
      }
    },
    [sessionId, annotations]
  );

  return {
    annotations,
    addAnnotation,
    getPageAnnotations,
    clearPageAnnotations,
    syncAnnotationsToSpotlight,
  };
}
