-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Store uploaded PDF documents
CREATE TABLE public.pdf_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  total_pages INTEGER DEFAULT 0,
  is_scanned BOOLEAN DEFAULT false,
  ocr_enabled BOOLEAN DEFAULT false,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store semantic chunks with embeddings
CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  heading TEXT,
  embedding vector(768),
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Store chat conversations per document
CREATE TABLE public.pdf_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  context_mode TEXT DEFAULT 'entire_document' CHECK (context_mode IN ('entire_document', 'current_page', 'selected_text')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store chat messages with citations
CREATE TABLE public.pdf_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.pdf_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_document_chunks_embedding ON public.document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Create indexes for common queries
CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_document_chunks_page_number ON public.document_chunks(document_id, page_number);
CREATE INDEX idx_pdf_documents_user_id ON public.pdf_documents(user_id);
CREATE INDEX idx_pdf_chat_sessions_document_id ON public.pdf_chat_sessions(document_id);
CREATE INDEX idx_pdf_chat_messages_session_id ON public.pdf_chat_messages(session_id);

-- Enable RLS
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_documents
CREATE POLICY "Users can view their own documents"
ON public.pdf_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON public.pdf_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.pdf_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.pdf_documents FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for document_chunks (access via document ownership)
CREATE POLICY "Users can view chunks of their documents"
ON public.document_chunks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.pdf_documents 
  WHERE pdf_documents.id = document_chunks.document_id 
  AND pdf_documents.user_id = auth.uid()
));

CREATE POLICY "Users can insert chunks for their documents"
ON public.document_chunks FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pdf_documents 
  WHERE pdf_documents.id = document_chunks.document_id 
  AND pdf_documents.user_id = auth.uid()
));

CREATE POLICY "Users can delete chunks of their documents"
ON public.document_chunks FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.pdf_documents 
  WHERE pdf_documents.id = document_chunks.document_id 
  AND pdf_documents.user_id = auth.uid()
));

-- RLS Policies for pdf_chat_sessions
CREATE POLICY "Users can view their own chat sessions"
ON public.pdf_chat_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
ON public.pdf_chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
ON public.pdf_chat_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
ON public.pdf_chat_sessions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for pdf_chat_messages (access via session ownership)
CREATE POLICY "Users can view messages in their sessions"
ON public.pdf_chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.pdf_chat_sessions 
  WHERE pdf_chat_sessions.id = pdf_chat_messages.session_id 
  AND pdf_chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can insert messages in their sessions"
ON public.pdf_chat_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pdf_chat_sessions 
  WHERE pdf_chat_sessions.id = pdf_chat_messages.session_id 
  AND pdf_chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages in their sessions"
ON public.pdf_chat_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.pdf_chat_sessions 
  WHERE pdf_chat_sessions.id = pdf_chat_messages.session_id 
  AND pdf_chat_sessions.user_id = auth.uid()
));

-- Function for semantic search using vector similarity
CREATE OR REPLACE FUNCTION public.search_document_chunks(
  p_document_id UUID,
  p_query_embedding vector(768),
  p_limit INTEGER DEFAULT 5,
  p_page_filter INTEGER DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  page_number INTEGER,
  content TEXT,
  heading TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Trigger to update updated_at
CREATE TRIGGER update_pdf_documents_updated_at
BEFORE UPDATE ON public.pdf_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdf_chat_sessions_updated_at
BEFORE UPDATE ON public.pdf_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();