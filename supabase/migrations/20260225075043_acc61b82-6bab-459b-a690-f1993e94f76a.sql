
-- =============================================
-- Phase 2: Instant Concept Checks
-- =============================================

-- 1. Modify assignment_submissions: add columns + make assignment_id nullable
ALTER TABLE public.assignment_submissions
  ALTER COLUMN assignment_id DROP NOT NULL;

ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.live_sessions(id),
  ADD COLUMN IF NOT EXISTS content jsonb;

-- 2. Create concept_checks table
CREATE TABLE public.concept_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  slide_context text,
  status text NOT NULL DEFAULT 'active',
  duration_seconds integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

-- Validation trigger for concept_checks
CREATE OR REPLACE FUNCTION public.validate_concept_check()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.correct_answer NOT IN ('a','b','c','d') THEN
    RAISE EXCEPTION 'Invalid correct_answer: %. Must be a, b, c, or d', NEW.correct_answer;
  END IF;
  IF NEW.status NOT IN ('active','closed','reviewing') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be active, closed, or reviewing', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_concept_check
  BEFORE INSERT OR UPDATE ON public.concept_checks
  FOR EACH ROW EXECUTE FUNCTION public.validate_concept_check();

-- 3. Create concept_check_responses table
CREATE TABLE public.concept_check_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid NOT NULL REFERENCES public.concept_checks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  response_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (check_id, student_id)
);

-- Validation trigger for responses
CREATE OR REPLACE FUNCTION public.validate_concept_check_response()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.selected_answer NOT IN ('a','b','c','d') THEN
    RAISE EXCEPTION 'Invalid selected_answer: %. Must be a, b, c, or d', NEW.selected_answer;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_concept_check_response
  BEFORE INSERT ON public.concept_check_responses
  FOR EACH ROW EXECUTE FUNCTION public.validate_concept_check_response();

-- 4. Enable RLS
ALTER TABLE public.concept_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_check_responses ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: concept_checks
CREATE POLICY "Teachers can insert concept checks"
  ON public.concept_checks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = concept_checks.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Teachers can update concept checks"
  ON public.concept_checks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = concept_checks.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Enrolled or teacher can view concept checks"
  ON public.concept_checks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = concept_checks.session_id
      AND (is_enrolled_in_class(ls.class_id, auth.uid()) OR is_class_teacher(ls.class_id, auth.uid()))
  ));

CREATE POLICY "No concept check deletes"
  ON public.concept_checks FOR DELETE
  USING (false);

-- 6. RLS Policies: concept_check_responses
CREATE POLICY "Students can insert own response"
  ON public.concept_check_responses FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own responses"
  ON public.concept_check_responses FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all responses"
  ON public.concept_check_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM concept_checks cc
    JOIN live_sessions ls ON ls.id = cc.session_id
    WHERE cc.id = concept_check_responses.check_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "No response updates"
  ON public.concept_check_responses FOR UPDATE
  USING (false);

CREATE POLICY "No response deletes"
  ON public.concept_check_responses FOR DELETE
  USING (false);

-- 7. RPC: generate_concept_check
-- NOTE: Edge function calls from PL/pgSQL aren't practical synchronously.
-- Frontend calls the edge function first, then passes results here.
CREATE OR REPLACE FUNCTION public.generate_concept_check(
  p_session_id uuid,
  p_question text,
  p_option_a text,
  p_option_b text,
  p_option_c text,
  p_option_d text,
  p_correct_answer text,
  p_explanation text DEFAULT NULL,
  p_slide_context text DEFAULT NULL,
  p_duration_seconds integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id uuid;
  v_class_id uuid;
  v_check concept_checks%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = p_session_id;
  IF v_class_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Session not found'); END IF;
  IF NOT is_class_teacher(v_class_id, v_user_id) THEN RETURN jsonb_build_object('success', false, 'error', 'Not authorized'); END IF;

  -- Close any existing active check for this session
  UPDATE concept_checks SET status = 'closed', closed_at = now()
  WHERE session_id = p_session_id AND status = 'active';

  INSERT INTO concept_checks (session_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, slide_context, duration_seconds)
  VALUES (p_session_id, p_question, p_option_a, p_option_b, p_option_c, p_option_d, p_correct_answer, p_explanation, p_slide_context, p_duration_seconds)
  RETURNING * INTO v_check;

  RETURN jsonb_build_object(
    'success', true,
    'check', jsonb_build_object(
      'id', v_check.id, 'session_id', v_check.session_id, 'question', v_check.question,
      'option_a', v_check.option_a, 'option_b', v_check.option_b,
      'option_c', v_check.option_c, 'option_d', v_check.option_d,
      'correct_answer', v_check.correct_answer, 'explanation', v_check.explanation,
      'status', v_check.status, 'duration_seconds', v_check.duration_seconds,
      'created_at', v_check.created_at
    )
  );
END;
$$;

-- 8. RPC: submit_concept_check_response
CREATE OR REPLACE FUNCTION public.submit_concept_check_response(
  p_check_id uuid,
  p_selected_answer text,
  p_response_time_ms integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id uuid;
  v_check concept_checks%ROWTYPE;
  v_class_id uuid;
  v_is_correct boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  IF p_selected_answer NOT IN ('a','b','c','d') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid answer');
  END IF;

  SELECT * INTO v_check FROM concept_checks WHERE id = p_check_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Check not found'); END IF;
  IF v_check.status != 'active' THEN RETURN jsonb_build_object('success', false, 'error', 'Check is no longer active'); END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = v_check.session_id;
  IF NOT is_enrolled_in_class(v_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enrolled');
  END IF;

  v_is_correct := (p_selected_answer = v_check.correct_answer);

  INSERT INTO concept_check_responses (check_id, student_id, selected_answer, is_correct, response_time_ms)
  VALUES (p_check_id, v_user_id, p_selected_answer, v_is_correct, p_response_time_ms);

  -- Record in assignment_submissions for grade history
  INSERT INTO assignment_submissions (student_id, assignment_id, session_id, answers, content, score, status, submitted_at)
  VALUES (
    v_user_id,
    NULL,
    v_check.session_id,
    '{}'::jsonb,
    jsonb_build_object(
      'type', 'concept_check',
      'check_id', p_check_id,
      'question', v_check.question,
      'selected', p_selected_answer,
      'correct', v_check.correct_answer,
      'is_correct', v_is_correct
    ),
    CASE WHEN v_is_correct THEN 100 ELSE 0 END,
    'graded',
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'correct_answer', v_check.correct_answer,
    'explanation', v_check.explanation
  );
END;
$$;

-- 9. RPC: close_concept_check
CREATE OR REPLACE FUNCTION public.close_concept_check(p_check_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id uuid;
  v_check concept_checks%ROWTYPE;
  v_class_id uuid;
  v_summary jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_check FROM concept_checks WHERE id = p_check_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Check not found'); END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = v_check.session_id;
  IF NOT is_class_teacher(v_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  UPDATE concept_checks SET status = 'closed', closed_at = now() WHERE id = p_check_id;

  SELECT jsonb_build_object(
    'total_responses', count(*),
    'correct_count', count(*) FILTER (WHERE is_correct),
    'correct_percentage', CASE WHEN count(*) > 0 THEN round((count(*) FILTER (WHERE is_correct))::numeric / count(*)::numeric * 100, 1) ELSE 0 END
  ) INTO v_summary FROM concept_check_responses WHERE check_id = p_check_id;

  RETURN jsonb_build_object('success', true, 'summary', v_summary);
END;
$$;

-- 10. RPC: get_concept_check_results
CREATE OR REPLACE FUNCTION public.get_concept_check_results(p_check_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id uuid;
  v_check concept_checks%ROWTYPE;
  v_class_id uuid;
  v_total_responses integer;
  v_total_enrolled integer;
  v_correct_count integer;
  v_avg_time numeric;
  v_dist jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_check FROM concept_checks WHERE id = p_check_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Check not found'); END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = v_check.session_id;
  IF NOT is_class_teacher(v_class_id, v_user_id) AND NOT is_enrolled_in_class(v_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT count(*), count(*) FILTER (WHERE is_correct), round(avg(response_time_ms))
  INTO v_total_responses, v_correct_count, v_avg_time
  FROM concept_check_responses WHERE check_id = p_check_id;

  SELECT count(*) INTO v_total_enrolled FROM class_enrollments WHERE class_id = v_class_id AND status = 'active';

  SELECT jsonb_build_object(
    'a', jsonb_build_object('count', count(*) FILTER (WHERE selected_answer = 'a'), 'percentage', CASE WHEN v_total_responses > 0 THEN round((count(*) FILTER (WHERE selected_answer = 'a'))::numeric / v_total_responses * 100, 1) ELSE 0 END),
    'b', jsonb_build_object('count', count(*) FILTER (WHERE selected_answer = 'b'), 'percentage', CASE WHEN v_total_responses > 0 THEN round((count(*) FILTER (WHERE selected_answer = 'b'))::numeric / v_total_responses * 100, 1) ELSE 0 END),
    'c', jsonb_build_object('count', count(*) FILTER (WHERE selected_answer = 'c'), 'percentage', CASE WHEN v_total_responses > 0 THEN round((count(*) FILTER (WHERE selected_answer = 'c'))::numeric / v_total_responses * 100, 1) ELSE 0 END),
    'd', jsonb_build_object('count', count(*) FILTER (WHERE selected_answer = 'd'), 'percentage', CASE WHEN v_total_responses > 0 THEN round((count(*) FILTER (WHERE selected_answer = 'd'))::numeric / v_total_responses * 100, 1) ELSE 0 END)
  ) INTO v_dist FROM concept_check_responses WHERE check_id = p_check_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_responses', v_total_responses,
    'total_enrolled', v_total_enrolled,
    'response_rate', CASE WHEN v_total_enrolled > 0 THEN round(v_total_responses::numeric / v_total_enrolled * 100, 1) ELSE 0 END,
    'answer_distribution', v_dist,
    'correct_count', v_correct_count,
    'correct_percentage', CASE WHEN v_total_responses > 0 THEN round(v_correct_count::numeric / v_total_responses * 100, 1) ELSE 0 END,
    'avg_response_time_ms', COALESCE(v_avg_time, 0)
  );
END;
$$;

-- 11. RPC: get_active_concept_check
CREATE OR REPLACE FUNCTION public.get_active_concept_check(p_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id uuid;
  v_class_id uuid;
  v_check concept_checks%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = p_session_id;
  IF v_class_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Session not found'); END IF;
  IF NOT is_class_teacher(v_class_id, v_user_id) AND NOT is_enrolled_in_class(v_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT * INTO v_check FROM concept_checks
  WHERE session_id = p_session_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', true, 'check', null); END IF;

  RETURN jsonb_build_object(
    'success', true,
    'check', jsonb_build_object(
      'id', v_check.id, 'session_id', v_check.session_id, 'question', v_check.question,
      'option_a', v_check.option_a, 'option_b', v_check.option_b,
      'option_c', v_check.option_c, 'option_d', v_check.option_d,
      'status', v_check.status, 'duration_seconds', v_check.duration_seconds,
      'created_at', v_check.created_at
    )
  );
END;
$$;

-- 12. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.concept_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.concept_check_responses;
