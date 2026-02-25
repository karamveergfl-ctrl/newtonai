
-- 1. Add new columns to live_sessions
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS pulse_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS questions_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confusion_threshold integer NOT NULL DEFAULT 40;

-- 2. Create live_pulse_responses
CREATE TABLE public.live_pulse_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'got_it',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

-- Validation trigger for status values
CREATE OR REPLACE FUNCTION public.validate_pulse_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('got_it', 'slightly_lost', 'lost') THEN
    RAISE EXCEPTION 'Invalid pulse status: %. Must be got_it, slightly_lost, or lost', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pulse_status
  BEFORE INSERT OR UPDATE ON public.live_pulse_responses
  FOR EACH ROW EXECUTE FUNCTION public.validate_pulse_status();

-- updated_at trigger
CREATE TRIGGER update_live_pulse_responses_updated_at
  BEFORE UPDATE ON public.live_pulse_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create live_questions
CREATE TABLE public.live_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer NOT NULL DEFAULT 0,
  is_answered boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  newton_answer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create live_question_upvotes
CREATE TABLE public.live_question_upvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid NOT NULL REFERENCES public.live_questions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE (question_id, student_id)
);

-- 5. Create aggregate view
CREATE VIEW public.live_pulse_summary AS
SELECT
  session_id,
  COUNT(*) FILTER (WHERE status = 'got_it') AS got_it,
  COUNT(*) FILTER (WHERE status = 'slightly_lost') AS slightly_lost,
  COUNT(*) FILTER (WHERE status = 'lost') AS lost,
  COUNT(*) AS total
FROM public.live_pulse_responses
GROUP BY session_id;

-- 6. Enable RLS
ALTER TABLE public.live_pulse_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_question_upvotes ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- live_pulse_responses
CREATE POLICY "Students can insert own pulse"
  ON public.live_pulse_responses FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.live_sessions ls
      WHERE ls.id = session_id
        AND is_enrolled_in_class(ls.class_id, auth.uid())
    )
  );

CREATE POLICY "Students can update own pulse"
  ON public.live_pulse_responses FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view pulse responses"
  ON public.live_pulse_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions ls
      WHERE ls.id = session_id
        AND is_class_teacher(ls.class_id, auth.uid())
    )
  );

CREATE POLICY "No pulse deletes"
  ON public.live_pulse_responses FOR DELETE
  USING (false);

-- live_questions
CREATE POLICY "No direct question inserts"
  ON public.live_questions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Enrolled or teacher can view questions"
  ON public.live_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions ls
      WHERE ls.id = session_id
        AND (is_enrolled_in_class(ls.class_id, auth.uid()) OR is_class_teacher(ls.class_id, auth.uid()))
    )
  );

CREATE POLICY "Teachers can update questions"
  ON public.live_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions ls
      WHERE ls.id = session_id
        AND is_class_teacher(ls.class_id, auth.uid())
    )
  );

CREATE POLICY "Teachers can delete questions"
  ON public.live_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions ls
      WHERE ls.id = session_id
        AND is_class_teacher(ls.class_id, auth.uid())
    )
  );

-- live_question_upvotes
CREATE POLICY "Students can insert own upvote"
  ON public.live_question_upvotes FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete own upvote"
  ON public.live_question_upvotes FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Enrolled or teacher can view upvotes"
  ON public.live_question_upvotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_questions lq
      JOIN public.live_sessions ls ON ls.id = lq.session_id
      WHERE lq.id = question_id
        AND (is_enrolled_in_class(ls.class_id, auth.uid()) OR is_class_teacher(ls.class_id, auth.uid()))
    )
  );

CREATE POLICY "No upvote updates"
  ON public.live_question_upvotes FOR UPDATE
  USING (false);

-- 8. RPC Functions

CREATE OR REPLACE FUNCTION public.get_pulse_summary(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_class_id uuid;
  v_got_it integer;
  v_slightly_lost integer;
  v_lost integer;
  v_total integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = p_session_id;
  IF v_class_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Session not found'); END IF;

  IF NOT is_class_teacher(v_class_id, v_user_id) AND NOT is_enrolled_in_class(v_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN status = 'got_it' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'slightly_lost' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END), 0),
    COUNT(*)
  INTO v_got_it, v_slightly_lost, v_lost, v_total
  FROM live_pulse_responses WHERE session_id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'got_it', v_got_it,
    'slightly_lost', v_slightly_lost,
    'lost', v_lost,
    'total', v_total,
    'confusion_percentage', CASE WHEN v_total > 0 THEN round(((v_slightly_lost + v_lost)::numeric / v_total::numeric) * 100, 1) ELSE 0 END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_pulse_response(p_session_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_class_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  IF p_status NOT IN ('got_it', 'slightly_lost', 'lost') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status');
  END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = p_session_id;
  IF v_class_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Session not found'); END IF;

  IF NOT is_enrolled_in_class(v_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enrolled');
  END IF;

  INSERT INTO live_pulse_responses (session_id, student_id, status)
  VALUES (p_session_id, v_user_id, p_status)
  ON CONFLICT (session_id, student_id)
  DO UPDATE SET status = EXCLUDED.status, updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_question_upvote(p_question_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
  v_new_count integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT EXISTS(SELECT 1 FROM live_question_upvotes WHERE question_id = p_question_id AND student_id = v_user_id) INTO v_exists;

  IF v_exists THEN
    DELETE FROM live_question_upvotes WHERE question_id = p_question_id AND student_id = v_user_id;
    UPDATE live_questions SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = p_question_id RETURNING upvotes INTO v_new_count;
  ELSE
    INSERT INTO live_question_upvotes (question_id, student_id) VALUES (p_question_id, v_user_id);
    UPDATE live_questions SET upvotes = upvotes + 1 WHERE id = p_question_id RETURNING upvotes INTO v_new_count;
  END IF;

  RETURN jsonb_build_object('success', true, 'upvotes', COALESCE(v_new_count, 0), 'has_upvoted', NOT v_exists);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_anonymous_question(p_session_id uuid, p_content text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_class_id uuid;
  v_question live_questions%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Content cannot be empty');
  END IF;
  IF length(p_content) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Content too long (max 500 chars)');
  END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = p_session_id;
  IF v_class_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Session not found'); END IF;

  IF NOT is_enrolled_in_class(v_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enrolled');
  END IF;

  INSERT INTO live_questions (session_id, content)
  VALUES (p_session_id, trim(p_content))
  RETURNING * INTO v_question;

  RETURN jsonb_build_object(
    'success', true,
    'question', jsonb_build_object(
      'id', v_question.id,
      'session_id', v_question.session_id,
      'content', v_question.content,
      'upvotes', v_question.upvotes,
      'is_answered', v_question.is_answered,
      'is_pinned', v_question.is_pinned,
      'created_at', v_question.created_at
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_session_questions(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_class_id uuid;
  v_questions jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT ls.class_id INTO v_class_id FROM live_sessions ls WHERE ls.id = p_session_id;
  IF v_class_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Session not found'); END IF;

  IF NOT is_class_teacher(v_class_id, v_user_id) AND NOT is_enrolled_in_class(v_class_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', lq.id,
    'session_id', lq.session_id,
    'content', lq.content,
    'upvotes', lq.upvotes,
    'is_answered', lq.is_answered,
    'is_pinned', lq.is_pinned,
    'newton_answer', lq.newton_answer,
    'created_at', lq.created_at,
    'has_upvoted', EXISTS(SELECT 1 FROM live_question_upvotes u WHERE u.question_id = lq.id AND u.student_id = v_user_id)
  ) ORDER BY lq.is_pinned DESC, lq.upvotes DESC, lq.created_at ASC), '[]'::jsonb)
  INTO v_questions
  FROM live_questions lq
  WHERE lq.session_id = p_session_id;

  RETURN jsonb_build_object('success', true, 'questions', v_questions);
END;
$$;

-- 9. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_pulse_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_question_upvotes;
