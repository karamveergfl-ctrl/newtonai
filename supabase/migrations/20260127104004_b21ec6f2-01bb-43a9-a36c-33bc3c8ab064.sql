-- Create internal table for document file paths (not accessible to users)
CREATE TABLE public.document_file_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL UNIQUE REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS and block ALL direct access
ALTER TABLE public.document_file_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to file paths"
  ON public.document_file_paths
  FOR ALL
  USING (false);

-- Migrate existing file paths to the internal table
INSERT INTO public.document_file_paths (document_id, file_path)
SELECT id, file_path FROM public.pdf_documents WHERE file_path IS NOT NULL;

-- Create SECURITY DEFINER function to get file path (server-side only)
CREATE OR REPLACE FUNCTION public.get_document_file_path(p_document_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_file_path text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verify user owns the document before returning file path
  SELECT dfp.file_path INTO v_file_path
  FROM document_file_paths dfp
  JOIN pdf_documents pd ON pd.id = dfp.document_id
  WHERE dfp.document_id = p_document_id
    AND pd.user_id = v_user_id;
  
  RETURN v_file_path;
END;
$$;

-- Create function to store file path (for edge functions)
CREATE OR REPLACE FUNCTION public.set_document_file_path(p_document_id uuid, p_file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify user owns the document
  IF NOT EXISTS (SELECT 1 FROM pdf_documents WHERE id = p_document_id AND user_id = v_user_id) THEN
    RETURN false;
  END IF;
  
  -- Upsert file path
  INSERT INTO document_file_paths (document_id, file_path)
  VALUES (p_document_id, p_file_path)
  ON CONFLICT (document_id) DO UPDATE SET file_path = p_file_path;
  
  RETURN true;
END;
$$;

-- Remove file_path column from pdf_documents (no longer needed)
ALTER TABLE public.pdf_documents DROP COLUMN file_path;