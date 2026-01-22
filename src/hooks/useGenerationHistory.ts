import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GenerationRecord {
  id: string;
  user_id: string;
  tool_name: string;
  title: string | null;
  source_type: string | null;
  source_preview: string | null;
  result_preview: Record<string, any> | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type ToolFilter = 'all' | 'quiz' | 'flashcards' | 'mind_map' | 'podcast' | 'summary' | 'lecture_notes' | 'homework_help';

export function useGenerationHistory() {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ToolFilter>('all');

  const fetchGenerations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('generation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('tool_name', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setGenerations((data || []) as GenerationRecord[]);
    } catch (error) {
      console.error('Error fetching generation history:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const deleteGeneration = useCallback(async (generationId: string) => {
    try {
      const { error } = await supabase
        .from('generation_history')
        .delete()
        .eq('id', generationId);

      if (error) throw error;

      setGenerations(prev => prev.filter(g => g.id !== generationId));
    } catch (error) {
      console.error('Error deleting generation:', error);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('generation_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setGenerations([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  return {
    generations,
    loading,
    filter,
    setFilter,
    deleteGeneration,
    clearHistory,
    refresh: fetchGenerations,
  };
}

// Helper function to log a generation (to be used in tool pages)
export async function logGeneration(params: {
  tool_name: string;
  title?: string;
  source_type?: string;
  source_preview?: string;
  result_preview?: Record<string, any>;
  metadata?: Record<string, any>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('generation_history').insert({
      user_id: user.id,
      tool_name: params.tool_name,
      title: params.title || null,
      source_type: params.source_type || null,
      source_preview: params.source_preview?.slice(0, 200) || null,
      result_preview: params.result_preview || null,
      metadata: params.metadata || {},
    });
  } catch (error) {
    console.error('Error logging generation:', error);
  }
}
