
-- =============================================
-- Phase 3: Live Notes Co-Pilot — Database Setup
-- =============================================

-- 1. Add new columns to live_sessions (skip if exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='live_sessions' AND column_name='notes_enabled') THEN
    ALTER TABLE public.live_sessions ADD COLUMN notes_enabled boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='live_sessions' AND column_name='current_slide_index') THEN
    ALTER TABLE public.live_sessions ADD COLUMN current_slide_index integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='live_sessions' AND column_name='total_slides') THEN
    ALTER TABLE public.live_sessions ADD COLUMN total_slides integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Create session_slide_notes table
CREATE TABLE public.session_slide_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  slide_index integer NOT NULL,
  slide_title text,
  slide_context text NOT NULL,
  ai_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'generating',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, slide_index)
);

-- Validation trigger for status instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_slide_note_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('generating', 'ready', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be generating, ready, or failed.', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_slide_note_status
  BEFORE INSERT OR UPDATE ON public.session_slide_notes
  FOR EACH ROW EXECUTE FUNCTION public.validate_slide_note_status();

-- Auto-update updated_at
CREATE TRIGGER update_session_slide_notes_updated_at
  BEFORE UPDATE ON public.session_slide_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create student_note_annotations table
CREATE TABLE public.student_note_annotations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slide_note_id uuid NOT NULL REFERENCES public.session_slide_notes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  annotations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slide_note_id, student_id)
);

CREATE TRIGGER update_student_note_annotations_updated_at
  BEFORE UPDATE ON public.student_note_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create session_notes_export table
CREATE TABLE public.session_notes_export (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exported_at timestamptz NOT NULL DEFAULT now(),
  format text NOT NULL,
  file_path text NOT NULL,
  UNIQUE (session_id, student_id, format)
);

-- Validation trigger for format
CREATE OR REPLACE FUNCTION public.validate_export_format()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.format NOT IN ('pdf', 'docx', 'md') THEN
    RAISE EXCEPTION 'Invalid format: %. Must be pdf, docx, or md.', NEW.format;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_export_format
  BEFORE INSERT OR UPDATE ON public.session_notes_export
  FOR EACH ROW EXECUTE FUNCTION public.validate_export_format();

-- =============================================
-- 5. RLS Policies
-- =============================================

-- session_slide_notes
ALTER TABLE public.session_slide_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can insert slide notes"
  ON public.session_slide_notes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = session_slide_notes.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Teachers can update slide notes"
  ON public.session_slide_notes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = session_slide_notes.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Teachers can view slide notes"
  ON public.session_slide_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = session_slide_notes.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "Enrolled students can view slide notes"
  ON public.session_slide_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = session_slide_notes.session_id
      AND is_enrolled_in_class(ls.class_id, auth.uid())
  ));

CREATE POLICY "No slide note deletes"
  ON public.session_slide_notes FOR DELETE
  USING (false);

-- student_note_annotations
ALTER TABLE public.student_note_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own annotations"
  ON public.student_note_annotations FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own annotations"
  ON public.student_note_annotations FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can view own annotations"
  ON public.student_note_annotations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view annotations for their sessions"
  ON public.student_note_annotations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.session_slide_notes ssn
    JOIN public.live_sessions ls ON ls.id = ssn.session_id
    WHERE ssn.id = student_note_annotations.slide_note_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "No annotation deletes"
  ON public.student_note_annotations FOR DELETE
  USING (false);

-- session_notes_export
ALTER TABLE public.session_notes_export ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own exports"
  ON public.session_notes_export FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own exports"
  ON public.session_notes_export FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view exports for their sessions"
  ON public.session_notes_export FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = session_notes_export.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "No export updates"
  ON public.session_notes_export FOR UPDATE
  USING (false);

CREATE POLICY "No export deletes"
  ON public.session_notes_export FOR DELETE
  USING (false);

-- =============================================
-- 6. RPC Functions (SECURITY DEFINER)
-- =============================================

-- get_session_notes
CREATE OR REPLACE FUNCTION public.get_session_notes(p_session_id uuid)
RETURNS SETOF public.session_slide_notes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Validate caller is enrolled or teacher
  IF NOT EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = p_session_id
      AND (is_enrolled_in_class(ls.class_id, auth.uid()) OR is_class_teacher(ls.class_id, auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Not authorized to view notes for this session';
  END IF;

  RETURN QUERY
    SELECT * FROM public.session_slide_notes
    WHERE session_id = p_session_id
    ORDER BY slide_index ASC;
END;
$$;

-- get_slide_notes
CREATE OR REPLACE FUNCTION public.get_slide_notes(p_session_id uuid, p_slide_index integer)
RETURNS public.session_slide_notes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result public.session_slide_notes;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = p_session_id
      AND (is_enrolled_in_class(ls.class_id, auth.uid()) OR is_class_teacher(ls.class_id, auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Not authorized to view notes for this session';
  END IF;

  SELECT * INTO result
  FROM public.session_slide_notes
  WHERE session_id = p_session_id AND slide_index = p_slide_index;

  RETURN result;
END;
$$;

-- upsert_student_annotations
CREATE OR REPLACE FUNCTION public.upsert_student_annotations(
  p_slide_note_id uuid,
  p_annotations jsonb
)
RETURNS public.student_note_annotations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result public.student_note_annotations;
  v_session_id uuid;
BEGIN
  -- Get session_id from the slide note
  SELECT ssn.session_id INTO v_session_id
  FROM public.session_slide_notes ssn
  WHERE ssn.id = p_slide_note_id;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Slide note not found';
  END IF;

  -- Validate enrollment
  IF NOT EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = v_session_id
      AND is_enrolled_in_class(ls.class_id, auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not enrolled in this class';
  END IF;

  INSERT INTO public.student_note_annotations (slide_note_id, student_id, annotations)
  VALUES (p_slide_note_id, auth.uid(), p_annotations)
  ON CONFLICT (slide_note_id, student_id)
  DO UPDATE SET annotations = p_annotations, updated_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- get_student_annotations
CREATE OR REPLACE FUNCTION public.get_student_annotations(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  slide_note_id uuid,
  student_id uuid,
  annotations jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  slide_index integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = p_session_id
      AND (is_enrolled_in_class(ls.class_id, auth.uid()) OR is_class_teacher(ls.class_id, auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT
      sna.id,
      sna.slide_note_id,
      sna.student_id,
      sna.annotations,
      sna.created_at,
      sna.updated_at,
      ssn.slide_index
    FROM public.student_note_annotations sna
    JOIN public.session_slide_notes ssn ON ssn.id = sna.slide_note_id
    WHERE ssn.session_id = p_session_id
      AND sna.student_id = auth.uid()
    ORDER BY ssn.slide_index ASC;
END;
$$;

-- get_notes_analytics (teacher only)
CREATE OR REPLACE FUNCTION public.get_notes_analytics(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_annotations integer;
  v_most_starred jsonb;
  v_most_annotated jsonb;
  v_engagement_rate numeric;
  v_total_enrolled integer;
  v_students_with_annotations integer;
BEGIN
  -- Teacher only
  IF NOT EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = p_session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ) THEN
    RAISE EXCEPTION 'Only the teacher can view analytics';
  END IF;

  -- Total annotations across all students
  SELECT COALESCE(SUM(jsonb_array_length(sna.annotations)), 0)
  INTO v_total_annotations
  FROM public.student_note_annotations sna
  JOIN public.session_slide_notes ssn ON ssn.id = sna.slide_note_id
  WHERE ssn.session_id = p_session_id;

  -- Most starred slide
  SELECT jsonb_build_object(
    'slide_index', ssn.slide_index,
    'slide_title', ssn.slide_title,
    'star_count', COUNT(*)
  ) INTO v_most_starred
  FROM public.student_note_annotations sna
  JOIN public.session_slide_notes ssn ON ssn.id = sna.slide_note_id,
  LATERAL jsonb_array_elements(sna.annotations) AS ann
  WHERE ssn.session_id = p_session_id
    AND (ann->>'annotation_type') = 'star'
  GROUP BY ssn.slide_index, ssn.slide_title
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Most annotated slide
  SELECT jsonb_build_object(
    'slide_index', ssn.slide_index,
    'slide_title', ssn.slide_title,
    'annotation_count', SUM(jsonb_array_length(sna.annotations))
  ) INTO v_most_annotated
  FROM public.student_note_annotations sna
  JOIN public.session_slide_notes ssn ON ssn.id = sna.slide_note_id
  WHERE ssn.session_id = p_session_id
  GROUP BY ssn.slide_index, ssn.slide_title
  ORDER BY SUM(jsonb_array_length(sna.annotations)) DESC
  LIMIT 1;

  -- Engagement rate
  SELECT COUNT(DISTINCT ce.student_id)
  INTO v_total_enrolled
  FROM public.class_enrollments ce
  JOIN public.live_sessions ls ON ls.class_id = ce.class_id
  WHERE ls.id = p_session_id AND ce.status = 'active';

  SELECT COUNT(DISTINCT sna.student_id)
  INTO v_students_with_annotations
  FROM public.student_note_annotations sna
  JOIN public.session_slide_notes ssn ON ssn.id = sna.slide_note_id
  WHERE ssn.session_id = p_session_id;

  v_engagement_rate := CASE WHEN v_total_enrolled > 0
    THEN ROUND((v_students_with_annotations::numeric / v_total_enrolled) * 100, 1)
    ELSE 0 END;

  RETURN jsonb_build_object(
    'total_annotations', v_total_annotations,
    'most_starred_slide', COALESCE(v_most_starred, 'null'::jsonb),
    'most_annotated_slide', COALESCE(v_most_annotated, 'null'::jsonb),
    'student_engagement_rate', v_engagement_rate
  );
END;
$$;

-- =============================================
-- 7. Enable Realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_slide_notes;
