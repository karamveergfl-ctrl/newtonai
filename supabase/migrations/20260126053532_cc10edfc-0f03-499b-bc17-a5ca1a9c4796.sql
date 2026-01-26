-- Restore the embedding column that was dropped by CASCADE
-- The vector extension is in public schema (Supabase default)
ALTER TABLE public.document_chunks 
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Recreate the search_document_chunks function
CREATE OR REPLACE FUNCTION public.search_document_chunks(
  p_document_id uuid, 
  p_query_embedding vector, 
  p_limit integer DEFAULT 5, 
  p_page_filter integer DEFAULT NULL
)
RETURNS TABLE(
  chunk_id uuid, 
  page_number integer, 
  content text, 
  heading text, 
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id AS chunk_id,
    dc.page_number,
    dc.content,
    dc.heading,
    1 - (dc.embedding <=> p_query_embedding) AS similarity
  FROM document_chunks dc
  JOIN pdf_documents pd ON pd.id = dc.document_id
  WHERE dc.document_id = p_document_id
    AND pd.user_id = auth.uid()
    AND (p_page_filter IS NULL OR dc.page_number = p_page_filter)
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;