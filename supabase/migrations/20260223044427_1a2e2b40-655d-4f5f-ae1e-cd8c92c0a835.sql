-- Create storage bucket for class materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-materials', 'class-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Allow teachers to upload files to their class folders
CREATE POLICY "Teachers can upload class materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'class-materials'
  AND auth.uid() IS NOT NULL
);

-- Allow anyone to view class materials (public bucket)
CREATE POLICY "Class materials are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'class-materials');

-- Allow teachers to delete their uploaded materials
CREATE POLICY "Teachers can delete class materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'class-materials'
  AND auth.uid() IS NOT NULL
);