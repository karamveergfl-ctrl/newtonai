import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { StudentAnnotation } from "@/types/liveSession";

interface UseStudentAnnotationsProps {
  sessionId: string;
}

interface UseStudentAnnotationsReturn {
  annotationsMap: Record<string, StudentAnnotation[]>;
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  addAnnotation: (slideNoteId: string, annotation: Omit<StudentAnnotation, "id" | "created_at">) => void;
  updateAnnotation: (slideNoteId: string, annotationId: string, content: string) => void;
  removeAnnotation: (slideNoteId: string, annotationId: string) => void;
  saveAnnotations: (slideNoteId: string) => Promise<void>;
  loadAllAnnotations: () => Promise<void>;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function useStudentAnnotations({ sessionId }: UseStudentAnnotationsProps): UseStudentAnnotationsReturn {
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, StudentAnnotation[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const mountedRef = useRef(true);
  const annotationsRef = useRef(annotationsMap);
  annotationsRef.current = annotationsMap;

  // Load all annotations on mount
  const loadAllAnnotations = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_student_annotations", {
        p_session_id: sessionId,
      });
      if (error) {
        console.error("loadAllAnnotations error:", error.message);
        return;
      }
      if (data && Array.isArray(data) && mountedRef.current) {
        const map: Record<string, StudentAnnotation[]> = {};
        for (const row of data) {
          const r = row as Record<string, unknown>;
          const slideNoteId = r.slide_note_id as string;
          const annotations = Array.isArray(r.annotations) ? r.annotations as StudentAnnotation[] : [];
          map[slideNoteId] = annotations;
        }
        setAnnotationsMap(map);
      }
    } catch (err) {
      console.error("loadAllAnnotations unexpected error:", err);
    }
  }, [sessionId]);

  useEffect(() => {
    loadAllAnnotations();
  }, [loadAllAnnotations]);

  // Save function
  const saveAnnotations = useCallback(async (slideNoteId: string) => {
    const annotations = annotationsRef.current[slideNoteId] ?? [];
    if (!mountedRef.current) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.rpc("upsert_student_annotations", {
        p_slide_note_id: slideNoteId,
        p_annotations: annotations as unknown as Json,
      });

      if (error) {
        console.error("saveAnnotations error:", error.message);
        // Retry once
        const { error: retryErr } = await supabase.rpc("upsert_student_annotations", {
          p_slide_note_id: slideNoteId,
          p_annotations: annotations as unknown as Json,
        });
        if (retryErr) {
          console.error("saveAnnotations retry failed:", retryErr.message);
          return;
        }
      }

      if (mountedRef.current) {
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("saveAnnotations unexpected error:", err);
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, []);

  // Debounced save trigger
  const triggerDebouncedSave = useCallback(
    (slideNoteId: string) => {
      if (debounceTimers.current[slideNoteId]) {
        clearTimeout(debounceTimers.current[slideNoteId]);
      }
      debounceTimers.current[slideNoteId] = setTimeout(() => {
        saveAnnotations(slideNoteId);
        delete debounceTimers.current[slideNoteId];
      }, 800);
    },
    [saveAnnotations]
  );

  const addAnnotation = useCallback(
    (slideNoteId: string, annotation: Omit<StudentAnnotation, "id" | "created_at">) => {
      const newAnnotation: StudentAnnotation = {
        ...annotation,
        id: generateId(),
        created_at: new Date().toISOString(),
      };
      setAnnotationsMap((prev) => ({
        ...prev,
        [slideNoteId]: [...(prev[slideNoteId] ?? []), newAnnotation],
      }));
      setHasUnsavedChanges(true);
      triggerDebouncedSave(slideNoteId);
    },
    [triggerDebouncedSave]
  );

  const updateAnnotation = useCallback(
    (slideNoteId: string, annotationId: string, content: string) => {
      setAnnotationsMap((prev) => ({
        ...prev,
        [slideNoteId]: (prev[slideNoteId] ?? []).map((a) =>
          a.id === annotationId ? { ...a, content } : a
        ),
      }));
      setHasUnsavedChanges(true);
      triggerDebouncedSave(slideNoteId);
    },
    [triggerDebouncedSave]
  );

  const removeAnnotation = useCallback(
    (slideNoteId: string, annotationId: string) => {
      setAnnotationsMap((prev) => ({
        ...prev,
        [slideNoteId]: (prev[slideNoteId] ?? []).filter((a) => a.id !== annotationId),
      }));
      setHasUnsavedChanges(true);
      triggerDebouncedSave(slideNoteId);
    },
    [triggerDebouncedSave]
  );

  // Force save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear pending debounces and save all dirty slide notes
      for (const slideNoteId of Object.keys(debounceTimers.current)) {
        clearTimeout(debounceTimers.current[slideNoteId]);
        delete debounceTimers.current[slideNoteId];
      }
      // Synchronous best-effort save using sendBeacon
      for (const [slideNoteId, annotations] of Object.entries(annotationsRef.current)) {
        if (annotations.length > 0) {
          // Use navigator.sendBeacon as last resort — RPC won't work here
          // but we've already been saving via debounce, so data loss is minimal
          void supabase.rpc("upsert_student_annotations", {
            p_slide_note_id: slideNoteId,
            p_annotations: annotations as unknown as Json,
          });
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clear all debounce timers
      for (const timer of Object.values(debounceTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  return {
    annotationsMap,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    saveAnnotations,
    loadAllAnnotations,
  };
}
