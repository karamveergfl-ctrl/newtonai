
-- Step 1: Drop dependent function
DROP FUNCTION IF EXISTS public.search_document_chunks(uuid, vector, integer, integer);

-- Step 2: Drop the HNSW index on the embedding column
DROP INDEX IF EXISTS public.idx_document_chunks_embedding;

-- Step 3: Drop the embedding column (no data to lose - 0 rows with embeddings)
ALTER TABLE public.document_chunks DROP COLUMN IF EXISTS embedding;

-- Step 4: Drop the vector extension from public
DROP EXTENSION IF EXISTS vector;

-- Step 5: Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 6: Reinstall vector extension in extensions schema
CREATE EXTENSION vector SCHEMA extensions;

-- Step 7: Re-add the embedding column using the extensions-scoped type
ALTER TABLE public.document_chunks ADD COLUMN embedding extensions.vector(1536);

-- Step 8: Recreate the HNSW index
CREATE INDEX idx_document_chunks_embedding ON public.document_chunks 
USING hnsw (embedding extensions.vector_cosine_ops);

-- Step 9: Recreate the search_document_chunks function with extensions-scoped vector type
CREATE OR REPLACE FUNCTION public.search_document_chunks(
  p_document_id uuid, 
  p_query_embedding extensions.vector, 
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
    1 - (dc.embedding OPERATOR(extensions.<=>) p_query_embedding) AS similarity
  FROM document_chunks dc
  JOIN pdf_documents pd ON pd.id = dc.document_id
  WHERE dc.document_id = p_document_id
    AND pd.user_id = auth.uid()
    AND (p_page_filter IS NULL OR dc.page_number = p_page_filter)
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding OPERATOR(extensions.<=>) p_query_embedding
  LIMIT p_limit;
END;
$$;
