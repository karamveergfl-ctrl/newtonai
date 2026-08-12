DROP POLICY IF EXISTS "No direct client access to podcast audio" ON storage.objects;
DROP POLICY IF EXISTS "No direct client access to tts cache" ON storage.objects;

CREATE POLICY "Block direct client access to private audio buckets"
ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated, anon
USING (bucket_id NOT IN ('podcast-audio', 'tts-cache'))
WITH CHECK (bucket_id NOT IN ('podcast-audio', 'tts-cache'));