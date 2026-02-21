
-- Create live_sessions table
CREATE TABLE public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  content_source text NOT NULL DEFAULT 'text',
  content_text text,
  content_title text,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  time_limit_minutes integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'teaching',
  started_at timestamptz NOT NULL DEFAULT now(),
  quiz_started_at timestamptz,
  quiz_ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own sessions
CREATE POLICY "Teachers can manage own sessions"
ON public.live_sessions FOR ALL
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Students enrolled in the class can view sessions
CREATE POLICY "Students can view class sessions"
ON public.live_sessions FOR SELECT
USING (is_enrolled_in_class(class_id, auth.uid()));

-- Enable realtime for live polling
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;

-- Create analyze_session_results RPC
CREATE OR REPLACE FUNCTION public.analyze_session_results(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_session live_sessions%ROWTYPE;
  v_assignment assignments%ROWTYPE;
  v_total_enrolled integer;
  v_attendance jsonb;
  v_topic_analysis jsonb;
  v_student_analysis jsonb;
  v_class_avg numeric;
  v_class_median numeric;
  v_weak_topics jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_session FROM live_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Session not found'); END IF;
  IF v_session.teacher_id != v_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'Not authorized'); END IF;
  IF v_session.assignment_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'No quiz for this session'); END IF;

  SELECT * INTO v_assignment FROM assignments WHERE id = v_session.assignment_id;

  -- Total enrolled
  SELECT count(*) INTO v_total_enrolled FROM class_enrollments WHERE class_id = v_session.class_id AND status = 'active';

  -- Attendance: present = submitted, absent = not submitted
  SELECT jsonb_build_object(
    'total_enrolled', v_total_enrolled,
    'present', (SELECT count(*) FROM assignment_submissions WHERE assignment_id = v_session.assignment_id),
    'absent', v_total_enrolled - (SELECT count(*) FROM assignment_submissions WHERE assignment_id = v_session.assignment_id),
    'present_students', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('student_id', s.student_id, 'full_name', COALESCE(p.full_name, 'Unknown'), 'submitted_at', s.submitted_at))
      FROM assignment_submissions s LEFT JOIN profiles p ON p.id = s.student_id
      WHERE s.assignment_id = v_session.assignment_id
    ), '[]'::jsonb),
    'absent_students', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('student_id', ce.student_id, 'full_name', COALESCE(p.full_name, 'Unknown')))
      FROM class_enrollments ce LEFT JOIN profiles p ON p.id = ce.student_id
      WHERE ce.class_id = v_session.class_id AND ce.status = 'active'
        AND NOT EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_id = v_session.assignment_id AND student_id = ce.student_id)
    ), '[]'::jsonb)
  ) INTO v_attendance;

  -- Topic analysis: per-question accuracy
  SELECT COALESCE(jsonb_agg(q_result ORDER BY q_idx), '[]'::jsonb) INTO v_topic_analysis
  FROM (
    SELECT
      q_idx,
      jsonb_build_object(
        'question_index', q_idx,
        'question_text', (v_assignment.content->'questions'->q_idx)->>'question',
        'correct_count', (
          SELECT count(*) FROM assignment_submissions sub
          WHERE sub.assignment_id = v_session.assignment_id
            AND lower(trim(sub.answers->>q_idx::text)) = lower(trim(((v_assignment.content->'questions'->q_idx)->>'correct_answer')))
        ),
        'incorrect_count', (
          SELECT count(*) FROM assignment_submissions sub
          WHERE sub.assignment_id = v_session.assignment_id
            AND (sub.answers->>q_idx::text IS NULL OR lower(trim(sub.answers->>q_idx::text)) != lower(trim(((v_assignment.content->'questions'->q_idx)->>'correct_answer'))))
        ),
        'accuracy_pct', CASE WHEN (SELECT count(*) FROM assignment_submissions WHERE assignment_id = v_session.assignment_id) > 0 THEN
          round((
            (SELECT count(*) FROM assignment_submissions sub WHERE sub.assignment_id = v_session.assignment_id AND lower(trim(sub.answers->>q_idx::text)) = lower(trim(((v_assignment.content->'questions'->q_idx)->>'correct_answer'))))::numeric
            / (SELECT count(*) FROM assignment_submissions WHERE assignment_id = v_session.assignment_id)::numeric
          ) * 100, 1)
        ELSE 0 END,
        'status', CASE
          WHEN (SELECT count(*) FROM assignment_submissions WHERE assignment_id = v_session.assignment_id) = 0 THEN 'no_data'
          WHEN round((
            (SELECT count(*) FROM assignment_submissions sub WHERE sub.assignment_id = v_session.assignment_id AND lower(trim(sub.answers->>q_idx::text)) = lower(trim(((v_assignment.content->'questions'->q_idx)->>'correct_answer'))))::numeric
            / GREATEST((SELECT count(*) FROM assignment_submissions WHERE assignment_id = v_session.assignment_id)::numeric, 1)
          ) * 100, 1) < 50 THEN 'weak'
          WHEN round((
            (SELECT count(*) FROM assignment_submissions sub WHERE sub.assignment_id = v_session.assignment_id AND lower(trim(sub.answers->>q_idx::text)) = lower(trim(((v_assignment.content->'questions'->q_idx)->>'correct_answer'))))::numeric
            / GREATEST((SELECT count(*) FROM assignment_submissions WHERE assignment_id = v_session.assignment_id)::numeric, 1)
          ) * 100, 1) < 70 THEN 'moderate'
          ELSE 'strong'
        END
      ) AS q_result
    FROM generate_series(0, jsonb_array_length(v_assignment.content->'questions') - 1) AS q_idx
  ) t;

  -- Weak topics summary
  SELECT COALESCE(jsonb_agg((v_assignment.content->'questions'->elem.val::int)->>'question'), '[]'::jsonb) INTO v_weak_topics
  FROM jsonb_array_elements_text(v_topic_analysis) AS raw_elem,
       LATERAL (SELECT (raw_elem::jsonb)->>'question_index' AS val) elem
  WHERE (raw_elem::jsonb)->>'status' = 'weak';

  -- Student analysis
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'student_id', sub.student_id,
    'full_name', COALESCE(p.full_name, 'Unknown'),
    'score', sub.score,
    'total', jsonb_array_length(v_assignment.content->'questions'),
    'percentage', CASE WHEN jsonb_array_length(v_assignment.content->'questions') > 0 THEN round((COALESCE(sub.score,0)::numeric / jsonb_array_length(v_assignment.content->'questions')::numeric) * 100, 1) ELSE 0 END,
    'status', CASE
      WHEN COALESCE(sub.score,0)::numeric / GREATEST(jsonb_array_length(v_assignment.content->'questions')::numeric, 1) < 0.5 THEN 'needs_attention'
      WHEN COALESCE(sub.score,0)::numeric / GREATEST(jsonb_array_length(v_assignment.content->'questions')::numeric, 1) < 0.8 THEN 'moderate'
      ELSE 'strong'
    END
  ) ORDER BY sub.score ASC NULLS FIRST), '[]'::jsonb) INTO v_student_analysis
  FROM assignment_submissions sub
  LEFT JOIN profiles p ON p.id = sub.student_id
  WHERE sub.assignment_id = v_session.assignment_id;

  -- Class average & median
  SELECT avg(score), percentile_cont(0.5) WITHIN GROUP (ORDER BY score)
  INTO v_class_avg, v_class_median
  FROM assignment_submissions WHERE assignment_id = v_session.assignment_id AND score IS NOT NULL;

  RETURN jsonb_build_object(
    'success', true,
    'attendance', v_attendance,
    'topic_analysis', v_topic_analysis,
    'weak_topics_summary', v_weak_topics,
    'student_analysis', v_student_analysis,
    'class_average', COALESCE(round(v_class_avg, 1), 0),
    'class_median', COALESCE(round(v_class_median, 1), 0)
  );
END;
$$;
