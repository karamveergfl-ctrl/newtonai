import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SlideTermDefinitions } from "@/types/liveSession";

interface UseTermDefinitionsProps {
  sessionId: string;
  slideIndex: number;
}

interface UseTermDefinitionsReturn {
  definitions: SlideTermDefinitions | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  expandedTermIndex: number | null;
  expandTerm: (index: number) => void;
  collapseAll: () => void;
}

function parseTermDefinitions(row: Record<string, unknown>): SlideTermDefinitions {
  let terms = row.terms;
  if (typeof terms === "string") {
    try {
      terms = JSON.parse(terms);
    } catch {
      terms = [];
    }
  }
  return {
    id: row.id as string,
    session_id: row.session_id as string,
    slide_index: row.slide_index as number,
    terms: Array.isArray(terms) ? terms : [],
    status: row.status as SlideTermDefinitions["status"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function useTermDefinitions({ sessionId, slideIndex }: UseTermDefinitionsProps): UseTermDefinitionsReturn {
  const [definitions, setDefinitions] = useState<SlideTermDefinitions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTermIndex, setExpandedTermIndex] = useState<number | null>(null);
  const cacheRef = useRef<Record<number, SlideTermDefinitions>>({});
  const mountedRef = useRef(true);

  const fetchDefinitions = useCallback(
    async (idx: number) => {
      // Check cache first
      const cached = cacheRef.current[idx];
      if (cached && cached.status === "ready") {
        setDefinitions(cached);
        setIsGenerating(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc("get_slide_term_definitions", {
          p_session_id: sessionId,
          p_slide_index: idx,
        });

        if (rpcError) {
          if (mountedRef.current) setError(rpcError.message);
          return;
        }

        if (!data) {
          if (mountedRef.current) {
            setDefinitions(null);
            setIsGenerating(false);
          }
          return;
        }

        const parsed = parseTermDefinitions(data as Record<string, unknown>);
        cacheRef.current[idx] = parsed;

        if (mountedRef.current) {
          setDefinitions(parsed);
          setIsGenerating(parsed.status === "generating");
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to fetch definitions");
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [sessionId]
  );

  // Fetch when slideIndex changes
  useEffect(() => {
    setExpandedTermIndex(null);
    fetchDefinitions(slideIndex);
  }, [slideIndex, fetchDefinitions]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`term-definitions-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "slide_term_definitions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const parsed = parseTermDefinitions(payload.new as Record<string, unknown>);
          cacheRef.current[parsed.slide_index] = parsed;
          if (parsed.slide_index === slideIndex) {
            setDefinitions(parsed);
            setIsGenerating(parsed.status === "generating");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "slide_term_definitions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const parsed = parseTermDefinitions(payload.new as Record<string, unknown>);
          cacheRef.current[parsed.slide_index] = parsed;
          if (parsed.slide_index === slideIndex) {
            setDefinitions(parsed);
            setIsGenerating(parsed.status === "generating");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, slideIndex]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const expandTerm = useCallback((index: number) => {
    setExpandedTermIndex((prev) => (prev === index ? null : index));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedTermIndex(null);
  }, []);

  return {
    definitions,
    isLoading,
    isGenerating,
    error,
    expandedTermIndex,
    expandTerm,
    collapseAll,
  };
}
