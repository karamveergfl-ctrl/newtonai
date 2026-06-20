
-- Restrict uploads/updates/deletes on the public pitch-videos bucket to the owning user's folder
DO $$
BEGIN
  -- INSERT: only allow uploads scoped to user's own folder
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pitch-videos owner can upload to own folder'
  ) THEN
    CREATE POLICY "pitch-videos owner can upload to own folder"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'pitch-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pitch-videos owner can update own files'
  ) THEN
    CREATE POLICY "pitch-videos owner can update own files"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'pitch-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'pitch-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pitch-videos owner can delete own files'
  ) THEN
    CREATE POLICY "pitch-videos owner can delete own files"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'pitch-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
