-- Block all updates to document_chunks - chunks should be immutable
CREATE POLICY "No updates to document chunks"
ON public.document_chunks
FOR UPDATE
USING (false);