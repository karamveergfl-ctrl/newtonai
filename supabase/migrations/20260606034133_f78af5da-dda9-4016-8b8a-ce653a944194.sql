
-- 1) user_roles: restrict self-assign to student only
DROP POLICY IF EXISTS "Users can self-assign student or teacher role" ON public.user_roles;
CREATE POLICY "Users can self-assign student role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'student'::app_role);

-- 2) enterprise_inquiries: add user_id ownership
ALTER TABLE public.enterprise_inquiries
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Authenticated users can submit inquiries" ON public.enterprise_inquiries;
DROP POLICY IF EXISTS "Users can submit enterprise inquiries" ON public.enterprise_inquiries;
DROP POLICY IF EXISTS "Anyone authenticated can insert" ON public.enterprise_inquiries;

CREATE POLICY "Authenticated users submit their own inquiries"
ON public.enterprise_inquiries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3) Storage UPDATE policies
CREATE POLICY "Teachers can update class materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'class-materials'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND c.teacher_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'class-materials'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update own whiteboard notes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'whiteboard-notes'
  AND EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = ((storage.foldername(objects.name))[1])::uuid
      AND ls.teacher_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'whiteboard-notes'
  AND EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = ((storage.foldername(objects.name))[1])::uuid
      AND ls.teacher_id = auth.uid()
  )
);

-- 4) Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_notifications;
ALTER PUBLICATION supabase_realtime DROP TABLE public.lecture_captures;
ALTER PUBLICATION supabase_realtime DROP TABLE public.student_intelligence_reports;
ALTER PUBLICATION supabase_realtime DROP TABLE public.session_intelligence_reports;
