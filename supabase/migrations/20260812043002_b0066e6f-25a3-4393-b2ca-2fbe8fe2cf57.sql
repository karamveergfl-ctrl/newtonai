-- Explicit deny for direct writes to concept check answer keys (server-side SECURITY DEFINER / service role only)
CREATE POLICY "No direct answer key inserts"
ON public.concept_check_answers FOR INSERT TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "No direct answer key updates"
ON public.concept_check_answers FOR UPDATE TO authenticated, anon
USING (false) WITH CHECK (false);

CREATE POLICY "No direct answer key deletes"
ON public.concept_check_answers FOR DELETE TO authenticated, anon
USING (false);

-- Explicit deny for direct client access to private audio buckets.
-- Files are written by edge functions with the service role and read via signed URLs.
CREATE POLICY "No direct client access to podcast audio"
ON storage.objects FOR ALL TO authenticated, anon
USING (bucket_id <> 'podcast-audio')
WITH CHECK (bucket_id <> 'podcast-audio');

CREATE POLICY "No direct client access to tts cache"
ON storage.objects FOR ALL TO authenticated, anon
USING (bucket_id <> 'tts-cache')
WITH CHECK (bucket_id <> 'tts-cache');