-- Recreate the embedding column with vector type from extensions schema
ALTER TABLE public.document_chunks 
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);