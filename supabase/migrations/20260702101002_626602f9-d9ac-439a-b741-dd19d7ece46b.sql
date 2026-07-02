-- Explicit teacher-only SELECT on concept_check_answers; also allow students to read answers only after their concept check has ended.
CREATE POLICY "Teachers can view answers for their sessions"
ON public.concept_check_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.concept_checks cc
    JOIN public.live_sessions ls ON ls.id = cc.session_id
    WHERE cc.id = concept_check_answers.check_id
      AND ls.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view answers after check closes"
ON public.concept_check_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.concept_checks cc
    JOIN public.class_enrollments ce ON ce.class_id = (
      SELECT ls.class_id FROM public.live_sessions ls WHERE ls.id = cc.session_id
    )
    WHERE cc.id = concept_check_answers.check_id
      AND ce.student_id = auth.uid()
      AND cc.status IN ('closed', 'ended')
  )
);