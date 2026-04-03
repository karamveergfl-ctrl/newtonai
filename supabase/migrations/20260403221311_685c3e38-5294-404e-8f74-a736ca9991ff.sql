-- Fix: class-materials INSERT policy - restrict to class teachers
DROP POLICY IF EXISTS "Teachers can upload class materials" ON storage.objects;
CREATE POLICY "Teachers can upload class materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'class-materials'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = (storage.foldername(name))[1]::uuid
    AND c.teacher_id = auth.uid()
  )
);

-- Fix: class-materials DELETE policy - restrict to class teachers
DROP POLICY IF EXISTS "Teachers can delete class materials" ON storage.objects;
CREATE POLICY "Teachers can delete class materials"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'class-materials'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = (storage.foldername(name))[1]::uuid
    AND c.teacher_id = auth.uid()
  )
);