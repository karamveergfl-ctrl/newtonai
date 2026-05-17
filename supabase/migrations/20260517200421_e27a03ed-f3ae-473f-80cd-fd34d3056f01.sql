
INSERT INTO storage.buckets (id, name, public)
VALUES ('pitch-videos', 'pitch-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read pitch videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'pitch-videos');
