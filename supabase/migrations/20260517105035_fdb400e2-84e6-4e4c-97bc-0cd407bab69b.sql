
-- 1. Whiteboard notes storage: scope by teacher ownership of the session.
-- File path layout: <session_id>/<slide>_<ts>.png
DROP POLICY IF EXISTS "Teachers can view own whiteboard notes" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload whiteboard notes" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own whiteboard notes" ON storage.objects;

CREATE POLICY "Teachers can view own whiteboard notes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'whiteboard-notes'
  AND EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = ((storage.foldername(objects.name))[1])::uuid
      AND ls.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can upload whiteboard notes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'whiteboard-notes'
  AND EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = ((storage.foldername(objects.name))[1])::uuid
      AND ls.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete own whiteboard notes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'whiteboard-notes'
  AND EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = ((storage.foldername(objects.name))[1])::uuid
      AND ls.teacher_id = auth.uid()
  )
);

-- 2. Class materials storage: use storage.foldername(objects.name) consistently
DROP POLICY IF EXISTS "Teachers and enrolled students can view class materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload class materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete class materials" ON storage.objects;

CREATE POLICY "Teachers and enrolled students can view class materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'class-materials'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
        AND c.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      WHERE ce.class_id = ((storage.foldername(objects.name))[1])::uuid
        AND ce.student_id = auth.uid()
        AND ce.status = 'active'
    )
  )
);

CREATE POLICY "Teachers can upload class materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'class-materials'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete class materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'class-materials'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND c.teacher_id = auth.uid()
  )
);

-- 3. Concept check responses: require enrollment in the class
DROP POLICY IF EXISTS "Students can insert own response" ON public.concept_check_responses;

CREATE POLICY "Students can insert own response"
ON public.concept_check_responses FOR INSERT
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1
    FROM public.concept_checks cc
    JOIN public.live_sessions ls ON ls.id = cc.session_id
    WHERE cc.id = concept_check_responses.check_id
      AND public.is_enrolled_in_class(ls.class_id, auth.uid())
  )
);
