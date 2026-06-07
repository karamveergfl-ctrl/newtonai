DROP POLICY IF EXISTS "Students can insert own upvote" ON public.live_question_upvotes;
CREATE POLICY "Students can insert own upvote" ON public.live_question_upvotes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM public.live_questions lq
    JOIN public.live_sessions ls ON ls.id = lq.session_id
    WHERE lq.id = live_question_upvotes.question_id
      AND public.is_enrolled_in_class(ls.class_id, auth.uid())
  )
);