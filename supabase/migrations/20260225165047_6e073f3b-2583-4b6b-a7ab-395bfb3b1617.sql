
-- ============================================================
-- Phase 5: Smart Board Spotlight — Database Objects
-- ============================================================

-- 1. slide_term_definitions
CREATE TABLE public.slide_term_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  slide_index integer NOT NULL,
  terms jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'generating',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, slide_index)
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_slide_term_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('generating', 'ready', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_slide_term_status
  BEFORE INSERT OR UPDATE ON public.slide_term_definitions
  FOR EACH ROW EXECUTE FUNCTION public.validate_slide_term_status();

ALTER TABLE public.slide_term_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can insert term definitions"
  ON public.slide_term_definitions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = slide_term_definitions.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Teachers can update term definitions"
  ON public.slide_term_definitions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = slide_term_definitions.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Teachers can view term definitions"
  ON public.slide_term_definitions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = slide_term_definitions.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Enrolled students can view term definitions"
  ON public.slide_term_definitions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = slide_term_definitions.session_id
      AND is_enrolled_in_class(ls.class_id, auth.uid())
  ));

CREATE POLICY "No term definition deletes"
  ON public.slide_term_definitions FOR DELETE
  USING (false);

-- 2. spotlight_session_state
CREATE TABLE public.spotlight_session_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  spotlight_enabled boolean NOT NULL DEFAULT true,
  current_slide_content text,
  current_slide_title text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

ALTER TABLE public.spotlight_session_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage spotlight state"
  ON public.spotlight_session_state FOR ALL
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = spotlight_session_state.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = spotlight_session_state.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Enrolled students can view spotlight state"
  ON public.spotlight_session_state FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = spotlight_session_state.session_id
      AND is_enrolled_in_class(ls.class_id, auth.uid())
  ));

-- 3. student_spotlight_state
CREATE TABLE public.student_spotlight_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_synced boolean NOT NULL DEFAULT true,
  last_viewed_slide_index integer NOT NULL DEFAULT 0,
  spotlight_view_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

ALTER TABLE public.student_spotlight_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own spotlight state"
  ON public.student_spotlight_state FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own spotlight state"
  ON public.student_spotlight_state FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can view own spotlight state"
  ON public.student_spotlight_state FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view spotlight states for their sessions"
  ON public.student_spotlight_state FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = student_spotlight_state.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "No student spotlight deletes"
  ON public.student_spotlight_state FOR DELETE
  USING (false);

-- ============================================================
-- RPC Functions
-- ============================================================

-- 1. get_slide_term_definitions
CREATE OR REPLACE FUNCTION public.get_slide_term_definitions(
  p_session_id uuid,
  p_slide_index integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_result jsonb;
BEGIN
  SELECT class_id INTO v_class_id
  FROM live_sessions WHERE id = p_session_id;

  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF NOT (is_class_teacher(v_class_id, auth.uid()) OR is_enrolled_in_class(v_class_id, auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'id', id, 'session_id', session_id, 'slide_index', slide_index,
    'terms', terms, 'status', status,
    'created_at', created_at, 'updated_at', updated_at
  ) INTO v_result
  FROM slide_term_definitions
  WHERE session_id = p_session_id AND slide_index = p_slide_index;

  RETURN v_result;
END;
$$;

-- 2. upsert_student_spotlight_state
CREATE OR REPLACE FUNCTION public.upsert_student_spotlight_state(
  p_session_id uuid,
  p_is_synced boolean,
  p_last_viewed_slide_index integer,
  p_spotlight_view_active boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO student_spotlight_state (session_id, student_id, is_synced, last_viewed_slide_index, spotlight_view_active, updated_at)
  VALUES (p_session_id, auth.uid(), p_is_synced, p_last_viewed_slide_index, p_spotlight_view_active, now())
  ON CONFLICT (session_id, student_id) DO UPDATE SET
    is_synced = EXCLUDED.is_synced,
    last_viewed_slide_index = EXCLUDED.last_viewed_slide_index,
    spotlight_view_active = EXCLUDED.spotlight_view_active,
    updated_at = now();

  SELECT jsonb_build_object(
    'id', id, 'session_id', session_id, 'student_id', student_id,
    'is_synced', is_synced, 'last_viewed_slide_index', last_viewed_slide_index,
    'spotlight_view_active', spotlight_view_active, 'updated_at', updated_at
  ) INTO v_result
  FROM student_spotlight_state
  WHERE session_id = p_session_id AND student_id = auth.uid();

  RETURN v_result;
END;
$$;

-- 3. get_spotlight_sync_stats
CREATE OR REPLACE FUNCTION public.get_spotlight_sync_stats(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_total integer;
  v_synced integer;
  v_unsynced integer;
  v_spotlight integer;
BEGIN
  SELECT class_id INTO v_class_id
  FROM live_sessions WHERE id = p_session_id;

  IF NOT is_class_teacher(v_class_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT count(*) INTO v_total
  FROM class_enrollments
  WHERE class_id = v_class_id AND status = 'active';

  SELECT
    coalesce(sum(CASE WHEN is_synced THEN 1 ELSE 0 END), 0),
    coalesce(sum(CASE WHEN NOT is_synced THEN 1 ELSE 0 END), 0),
    coalesce(sum(CASE WHEN spotlight_view_active THEN 1 ELSE 0 END), 0)
  INTO v_synced, v_unsynced, v_spotlight
  FROM student_spotlight_state
  WHERE session_id = p_session_id;

  RETURN jsonb_build_object(
    'total_enrolled', v_total,
    'synced_count', v_synced,
    'unsynced_count', v_unsynced,
    'spotlight_view_count', v_spotlight,
    'sync_percentage', CASE WHEN v_total > 0 THEN round((v_synced::numeric / v_total) * 100) ELSE 0 END
  );
END;
$$;

-- 4. update_spotlight_session_state
CREATE OR REPLACE FUNCTION public.update_spotlight_session_state(
  p_session_id uuid,
  p_spotlight_enabled boolean,
  p_current_slide_content text,
  p_current_slide_title text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_result jsonb;
BEGIN
  SELECT class_id INTO v_class_id
  FROM live_sessions WHERE id = p_session_id;

  IF NOT is_class_teacher(v_class_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO spotlight_session_state (session_id, spotlight_enabled, current_slide_content, current_slide_title, updated_at)
  VALUES (p_session_id, p_spotlight_enabled, p_current_slide_content, p_current_slide_title, now())
  ON CONFLICT (session_id) DO UPDATE SET
    spotlight_enabled = EXCLUDED.spotlight_enabled,
    current_slide_content = EXCLUDED.current_slide_content,
    current_slide_title = EXCLUDED.current_slide_title,
    updated_at = now();

  SELECT jsonb_build_object(
    'id', id, 'session_id', session_id,
    'spotlight_enabled', spotlight_enabled,
    'current_slide_content', current_slide_content,
    'current_slide_title', current_slide_title,
    'updated_at', updated_at
  ) INTO v_result
  FROM spotlight_session_state
  WHERE session_id = p_session_id;

  RETURN v_result;
END;
$$;

-- ============================================================
-- Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.slide_term_definitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spotlight_session_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_spotlight_state;
