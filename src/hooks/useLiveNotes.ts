import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SessionSlideNotes } from "@/types/liveSession";

interface UseLiveNotesProps {
  sessionId: string;
  role: "teacher" | "student";
  onSlideAdvance?: (index: number, content: string, title: string) => void;
}

interface UseLiveNotesReturn {
  slideNotesMap: Record<number, SessionSlideNotes>;
  currentSlideIndex: number;
  totalSlides: number;
  isGenerating: boolean;
  generationError: string | null;
  notesEnabled: boolean;
  latestNoteSlideIndex: number | null;
  advanceToSlide: (slideIndex: number, slideContext: string, slideTitle?: string) => Promise<void>;
  retrySlideGeneration: (slideIndex: number) => Promise<void>;
  getAllNotes: () => Promise<void>;
}

function parseSlideNote(row: Record<string, unknown>): SessionSlideNotes {
  return {
    id: row.id as string,
    session_id: row.session_id as string,
    slide_index: row.slide_index as number,
    slide_title: (row.slide_title as string) ?? null,
    slide_context: row.slide_context as string,
    ai_notes: Array.isArray(row.ai_notes) ? row.ai_notes : [],
    status: row.status as SessionSlideNotes["status"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function useLiveNotes({ sessionId, role, onSlideAdvance }: UseLiveNotesProps): UseLiveNotesReturn {
  const [slideNotesMap, setSlideNotesMap] = useState<Record<number, SessionSlideNotes>>({});
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [notesEnabled, setNotesEnabled] = useState(true);
  const [latestNoteSlideIndex, setLatestNoteSlideIndex] = useState<number | null>(null);
  const mountedRef = useRef(true);

  // Load all existing notes on mount
  const getAllNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_session_notes", {
        p_session_id: sessionId,
      });
      if (error) {
        console.error("getAllNotes error:", error.message);
        return;
      }
      if (data && Array.isArray(data)) {
        const map: Record<number, SessionSlideNotes> = {};
        for (const row of data) {
          const note = parseSlideNote(row as Record<string, unknown>);
          map[note.slide_index] = note;
        }
        if (mountedRef.current) setSlideNotesMap(map);
      }
    } catch (err) {
      console.error("getAllNotes unexpected error:", err);
    }
  }, [sessionId]);

  // Load initial state
  useEffect(() => {
    getAllNotes();

    // Fetch current session metadata
    const fetchSession = async () => {
      try {
        const { data } = await supabase
          .from("live_sessions")
          .select("current_slide_index, total_slides, notes_enabled")
          .eq("id", sessionId)
          .single();
        if (data && mountedRef.current) {
          setCurrentSlideIndex(data.current_slide_index ?? 0);
          setTotalSlides(data.total_slides ?? 0);
          setNotesEnabled(data.notes_enabled ?? true);
        }
      } catch (err) {
        console.error("fetchSession error:", err);
      }
    };
    fetchSession();
  }, [sessionId, getAllNotes]);

  // Realtime: session_slide_notes
  useEffect(() => {
    const channel = supabase
      .channel(`live-notes-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_slide_notes",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const note = parseSlideNote(payload.new as Record<string, unknown>);
          setSlideNotesMap((prev) => ({ ...prev, [note.slide_index]: note }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "session_slide_notes",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const note = parseSlideNote(payload.new as Record<string, unknown>);
          setSlideNotesMap((prev) => ({ ...prev, [note.slide_index]: note }));
          if (note.status === "ready" && role === "student") {
            setLatestNoteSlideIndex(note.slide_index);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, role]);

  // Realtime: live_sessions (slide index, total, notes_enabled)
  useEffect(() => {
    const channel = supabase
      .channel(`live-session-index-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const updated = payload.new as Record<string, unknown>;
          if (typeof updated.current_slide_index === "number") {
            setCurrentSlideIndex(updated.current_slide_index);
          }
          if (typeof updated.total_slides === "number") {
            setTotalSlides(updated.total_slides);
          }
          if (typeof updated.notes_enabled === "boolean") {
            setNotesEnabled(updated.notes_enabled);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const generateForSlide = useCallback(
    async (slideIndex: number, slideContext: string, slideTitle?: string) => {
      if (role !== "teacher") return;
      setIsGenerating(true);
      setGenerationError(null);

      // Optimistic placeholder
      setSlideNotesMap((prev) => ({
        ...prev,
        [slideIndex]: {
          id: `temp-${slideIndex}`,
          session_id: sessionId,
          slide_index: slideIndex,
          slide_title: slideTitle ?? null,
          slide_context: slideContext,
          ai_notes: [],
          status: "generating",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));

      try {
        const { data, error } = await supabase.functions.invoke("generate-slide-notes", {
          body: {
            session_id: sessionId,
            slide_index: slideIndex,
            slide_context: slideContext,
            slide_title: slideTitle,
          },
        });

        if (error) throw new Error(error.message);

        if (data?.success && data.slide_notes && mountedRef.current) {
          const note = parseSlideNote(data.slide_notes as Record<string, unknown>);
          setSlideNotesMap((prev) => ({ ...prev, [note.slide_index]: note }));
          setLatestNoteSlideIndex(note.slide_index);
        } else if (data?.status === "generating") {
          // Already generating — no-op
        } else if (data?.error && mountedRef.current) {
          setGenerationError(data.error);
          setSlideNotesMap((prev) => ({
            ...prev,
            [slideIndex]: { ...prev[slideIndex], status: "failed" },
          }));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate notes";
        if (mountedRef.current) {
          setGenerationError(message);
          setSlideNotesMap((prev) => ({
            ...prev,
            [slideIndex]: { ...prev[slideIndex], status: "failed" },
          }));
        }
      } finally {
        if (mountedRef.current) setIsGenerating(false);
      }
    },
    [role, sessionId]
  );

  const advanceToSlide = useCallback(
    async (slideIndex: number, slideContext: string, slideTitle?: string) => {
      if (role !== "teacher") return;

      try {
        // Update current_slide_index in live_sessions
        const { error } = await supabase
          .from("live_sessions")
          .update({ current_slide_index: slideIndex })
          .eq("id", sessionId);
        if (error) console.error("advanceToSlide update error:", error.message);

        setCurrentSlideIndex(slideIndex);
      } catch (err) {
        console.error("advanceToSlide error:", err);
      }

      // Notify spotlight of new slide content
      onSlideAdvance?.(slideIndex, slideContext, slideTitle ?? "");

      // Generate notes AND term definitions in parallel
      const [notesResult, termsResult] = await Promise.allSettled([
        generateForSlide(slideIndex, slideContext, slideTitle),
        supabase.functions.invoke("generate-term-definitions", {
          body: {
            session_id: sessionId,
            slide_index: slideIndex,
            slide_content: slideContext,
            slide_title: slideTitle,
          },
        }),
      ]);

      if (notesResult.status === "rejected") {
        console.error("Notes generation failed:", notesResult.reason);
      }
      if (termsResult.status === "rejected") {
        console.error("Term definitions generation failed:", termsResult.reason);
      } else if (termsResult.status === "fulfilled") {
        const { error: termsError } = termsResult.value;
        if (termsError) {
          console.error("Term definitions error:", termsError.message);
        }
      }
    },
    [role, sessionId, generateForSlide, onSlideAdvance]
  );

  const retrySlideGeneration = useCallback(
    async (slideIndex: number) => {
      const existing = slideNotesMap[slideIndex];
      if (!existing) return;
      await generateForSlide(slideIndex, existing.slide_context, existing.slide_title ?? undefined);
    },
    [slideNotesMap, generateForSlide]
  );

  return {
    slideNotesMap,
    currentSlideIndex,
    totalSlides,
    isGenerating,
    generationError,
    notesEnabled,
    latestNoteSlideIndex,
    advanceToSlide,
    retrySlideGeneration,
    getAllNotes,
  };
}
