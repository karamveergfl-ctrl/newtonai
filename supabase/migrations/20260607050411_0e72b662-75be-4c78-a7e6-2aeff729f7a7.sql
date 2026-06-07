
-- 1. Create private answers table
CREATE TABLE IF NOT EXISTS public.concept_check_answers (
  check_id uuid PRIMARY KEY REFERENCES public.concept_checks(id) ON DELETE CASCADE,
  correct_answer text NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Grants - service_role only (functions are SECURITY DEFINER, so they don't need direct grants for authenticated)
GRANT ALL ON public.concept_check_answers TO service_role;

-- 3. RLS - enabled with NO policies for anon/authenticated => no direct access
ALTER TABLE public.concept_check_answers ENABLE ROW LEVEL SECURITY;

-- 4. Backfill existing rows
INSERT INTO public.concept_check_answers (check_id, correct_answer, explanation)
SELECT id, correct_answer, explanation
FROM public.concept_checks
WHERE correct_answer IS NOT NULL
ON CONFLICT (check_id) DO NOTHING;

-- 5. Drop sensitive columns from public table
ALTER TABLE public.concept_checks DROP COLUMN IF EXISTS correct_answer;
ALTER TABLE public.concept_checks DROP COLUMN IF EXISTS explanation;

-- 6. Update submit_concept_check_response to read from new table
CREATE OR REPLACE FUNCTION public.submit_concept_check_response(p_check_id uuid, p_selected_answer text, p_response_time_ms integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_check concept_checks%ROWTYPE;
  v_class_id uuid;
  v_is_correct boolean;
  v_correct_answer text;
  v_explanation text;
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

  SELECT correct_answer, explanation INTO v_correct_answer, v_explanation
  FROM concept_check_answers WHERE check_id = p_check_id;

  v_is_correct := (p_selected_answer = v_correct_answer);

  INSERT INTO concept_check_responses (check_id, student_id, selected_answer, is_correct, response_time_ms)
  VALUES (p_check_id, v_user_id, p_selected_answer, v_is_correct, p_response_time_ms);

  INSERT INTO assignment_submissions (student_id, assignment_id, session_id, answers, content, score, status, submitted_at)
  VALUES (
    v_user_id, NULL, v_check.session_id, '{}'::jsonb,
    jsonb_build_object(
      'type', 'concept_check',
      'check_id', p_check_id,
      'question', v_check.question,
      'selected', p_selected_answer,
      'correct', v_correct_answer,
      'is_correct', v_is_correct
    ),
    CASE WHEN v_is_correct THEN 100 ELSE 0 END,
    'graded',
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'correct_answer', v_correct_answer,
    'explanation', v_explanation
  );
END;
$function$;

-- 7. New helper: fetch answer (only teachers any time; students only after close)
CREATE OR REPLACE FUNCTION public.get_concept_check_answer(p_check_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_check concept_checks%ROWTYPE;
  v_class_id uuid;
  v_correct_answer text;
  v_explanation text;
  v_is_teacher boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_check FROM concept_checks WHERE id = p_check_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Check not found'); END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = v_check.session_id;
  v_is_teacher := is_class_teacher(v_class_id, v_user_id);

  IF NOT v_is_teacher THEN
    IF NOT is_enrolled_in_class(v_class_id, v_user_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
    END IF;
    IF v_check.status != 'closed' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Check not closed');
    END IF;
  END IF;

  SELECT correct_answer, explanation INTO v_correct_answer, v_explanation
  FROM concept_check_answers WHERE check_id = p_check_id;

  RETURN jsonb_build_object(
    'success', true,
    'correct_answer', v_correct_answer,
    'explanation', v_explanation
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_concept_check_answer(uuid) TO authenticated;
