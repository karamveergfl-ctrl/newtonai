ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS time_limit_minutes integer;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS publish_at timestamptz;
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_time_limit_positive;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_time_limit_positive CHECK (time_limit_minutes IS NULL OR (time_limit_minutes > 0 AND time_limit_minutes <= 600));

-- Students: only published (and past schedule time) assignments in classes they're enrolled in
DROP POLICY IF EXISTS "Students can view published assignments" ON public.assignments;
CREATE POLICY "Students can view published assignments" ON public.assignments
FOR SELECT TO authenticated
USING (
  is_published = true
  AND (publish_at IS NULL OR publish_at <= now())
  AND EXISTS (SELECT 1 FROM public.class_enrollments ce
              WHERE ce.class_id = assignments.class_id AND ce.student_id = auth.uid() AND ce.status = 'active')
);

-- Only the class teacher can create/edit
DROP POLICY IF EXISTS "Teachers can manage assignments" ON public.assignments;
CREATE POLICY "Teachers can manage assignments" ON public.assignments
FOR ALL TO authenticated
USING (auth.uid() = teacher_id AND public.is_class_teacher(class_id, auth.uid()))
WITH CHECK (auth.uid() = teacher_id AND public.is_class_teacher(class_id, auth.uid()));

-- Students insert only their own submissions to visible assignments
DROP POLICY IF EXISTS "Students can submit own work" ON public.assignment_submissions;
CREATE POLICY "Students can submit own work" ON public.assignment_submissions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = student_id AND EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.class_enrollments ce ON ce.class_id = a.class_id
    WHERE a.id = assignment_submissions.assignment_id
      AND ce.student_id = auth.uid() AND ce.status = 'active'
      AND a.is_published = true AND (a.publish_at IS NULL OR a.publish_at <= now())
  )
);

-- Students can never set their own score; grading happens server-side
CREATE OR REPLACE FUNCTION public.reset_submission_grade()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.score := NULL;
  NEW.graded_at := NULL;
  NEW.status := 'submitted';
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_reset_submission_grade ON public.assignment_submissions;
CREATE TRIGGER trg_reset_submission_grade BEFORE INSERT ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.reset_submission_grade();

CREATE OR REPLACE FUNCTION public.auto_grade_quiz_submission(p_submission_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid; v_submission assignment_submissions%ROWTYPE; v_assignment assignments%ROWTYPE;
  v_questions jsonb; v_answers jsonb; v_score integer := 0; v_total integer := 0; v_q jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  SELECT * INTO v_submission FROM assignment_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Submission not found'); END IF;
  SELECT * INTO v_assignment FROM assignments WHERE id = v_submission.assignment_id;
  IF v_user_id != v_submission.student_id AND NOT EXISTS (SELECT 1 FROM classes WHERE id = v_assignment.class_id AND teacher_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;
  IF v_assignment.assignment_type NOT IN ('quiz', 'test') THEN RETURN jsonb_build_object('success', false, 'error', 'Not a quiz'); END IF;
  v_questions := v_assignment.content->'questions';
  v_answers := v_submission.answers;
  IF v_questions IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'No questions'); END IF;
  FOR v_q IN SELECT * FROM jsonb_array_elements(v_questions) LOOP
    v_total := v_total + 1;
    IF lower(trim(v_answers->>((v_total - 1)::text))) = lower(trim(v_q->>'correct_answer')) THEN v_score := v_score + 1; END IF;
  END LOOP;
  UPDATE assignment_submissions SET score = v_score, graded_at = now(), status = 'graded' WHERE id = p_submission_id;
  RETURN jsonb_build_object('success', true, 'score', v_score, 'total', v_total,
    'percentage', CASE WHEN v_total > 0 THEN round((v_score::numeric / v_total::numeric) * 100, 1) ELSE 0 END);
END;
$function$;