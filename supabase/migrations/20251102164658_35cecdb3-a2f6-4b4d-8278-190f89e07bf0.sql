-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false);

-- RLS policies for PDF storage (public upload, owner access)
CREATE POLICY "Anyone can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Users can view their own PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');