
-- 1. Create class_announcements table
CREATE TABLE public.class_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.class_announcements ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their class announcements
CREATE POLICY "Teachers can manage announcements"
ON public.class_announcements
FOR ALL
USING (auth.uid() = teacher_id AND is_class_teacher(class_id, auth.uid()))
WITH CHECK (auth.uid() = teacher_id AND is_class_teacher(class_id, auth.uid()));

-- Enrolled students can view announcements
CREATE POLICY "Students can view class announcements"
ON public.class_announcements
FOR SELECT
USING (is_enrolled_in_class(class_id, auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_announcements;

-- 2. Create get_student_class_performance RPC
CREATE OR REPLACE FUNCTION public.get_student_class_performance(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_total_assignments integer;
  v_completed integer;
  v_avg_score numeric;
  v_rank integer;
  v_total_students integer;
  v_scores jsonb;
  v_weak_questions jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify student is enrolled
  IF NOT is_enrolled_in_class(p_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enrolled in this class');
  END IF;

  -- Total published assignments
  SELECT count(*) INTO v_total_assignments
  FROM assignments WHERE class_id = p_class_id AND is_published = true;

  -- Student's completed assignments
  SELECT count(*) INTO v_completed
  FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id
  WHERE a.class_id = p_class_id AND s.student_id = v_user_id;

  -- Average score
  SELECT round(avg(s.score)::numeric, 1) INTO v_avg_score
  FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id
  WHERE a.class_id = p_class_id AND s.student_id = v_user_id AND s.score IS NOT NULL;

  -- Rank among classmates (by average score, descending)
  SELECT count(*) INTO v_total_students
  FROM class_enrollments WHERE class_id = p_class_id AND status = 'active';

  WITH student_avgs AS (
    SELECT ce.student_id, COALESCE(avg(sub.score), 0) AS avg_s
    FROM class_enrollments ce
    LEFT JOIN assignment_submissions sub ON sub.student_id = ce.student_id
      AND sub.assignment_id IN (SELECT id FROM assignments WHERE class_id = p_class_id)
    WHERE ce.class_id = p_class_id AND ce.status = 'active'
    GROUP BY ce.student_id
  )
  SELECT count(*) + 1 INTO v_rank
  FROM student_avgs WHERE avg_s > COALESCE((SELECT avg_s FROM student_avgs WHERE student_id = v_user_id), 0);

  -- Per-assignment scores
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'assignment_id', a.id,
    'title', a.title,
    'score', s.score,
    'total', jsonb_array_length(a.content->'questions'),
    'percentage', CASE WHEN jsonb_array_length(a.content->'questions') > 0
      THEN round((COALESCE(s.score, 0)::numeric / jsonb_array_length(a.content->'questions')::numeric) * 100, 1)
      ELSE 0 END,
    'status', s.status
  ) ORDER BY a.created_at DESC), '[]'::jsonb) INTO v_scores
  FROM assignments a
  LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = v_user_id
  WHERE a.class_id = p_class_id AND a.is_published = true;

  -- Weak questions: questions the student got wrong in graded quizzes
  WITH wrong_answers AS (
    SELECT
      a.title AS assignment_title,
      q_idx,
      (a.content->'questions'->q_idx)->>'question' AS question_text
    FROM assignment_submissions s
    JOIN assignments a ON a.id = s.assignment_id
    CROSS JOIN generate_series(0, jsonb_array_length(a.content->'questions') - 1) AS q_idx
    WHERE a.class_id = p_class_id
      AND s.student_id = v_user_id
      AND s.status = 'graded'
      AND a.assignment_type = 'quiz'
      AND lower(trim(s.answers->>q_idx::text)) != lower(trim((a.content->'questions'->q_idx)->>'correct_answer'))
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'question', question_text,
    'assignment_title', assignment_title
  )), '[]'::jsonb) INTO v_weak_questions
  FROM wrong_answers;

  RETURN jsonb_build_object(
    'success', true,
    'attendance_pct', CASE WHEN v_total_assignments > 0
      THEN round((v_completed::numeric / v_total_assignments::numeric) * 100, 1)
      ELSE 0 END,
    'average_score', COALESCE(v_avg_score, 0),
    'rank', COALESCE(v_rank, 1),
    'total_students', v_total_students,
    'assignments_completed', v_completed,
    'total_assignments', v_total_assignments,
    'scores', v_scores,
    'weak_questions', v_weak_questions
  );
END;
$function$;
