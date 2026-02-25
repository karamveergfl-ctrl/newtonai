
-- Phase 4: Post-Class Intelligence Report

-- 1. session_intelligence_reports
CREATE TABLE public.session_intelligence_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'generating',
  teacher_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_intelligence_report_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('generating', 'ready', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be generating, ready, or failed.', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_intelligence_report_status
  BEFORE INSERT OR UPDATE ON public.session_intelligence_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_intelligence_report_status();

-- 2. student_intelligence_reports
CREATE TABLE public.student_intelligence_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'generating',
  understanding_score integer NOT NULL DEFAULT 0,
  topic_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  knowledge_gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  revision_flashcards jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- Validation trigger for student report status
CREATE TRIGGER trg_validate_student_report_status
  BEFORE INSERT OR UPDATE ON public.student_intelligence_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_intelligence_report_status();

-- 3. report_video_results
CREATE TABLE public.report_video_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_report_id uuid NOT NULL REFERENCES public.student_intelligence_reports(id) ON DELETE CASCADE,
  topic text NOT NULL,
  video_id text NOT NULL,
  video_title text NOT NULL,
  channel_name text NOT NULL,
  thumbnail_url text NOT NULL,
  duration text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.session_intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_video_results ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — session_intelligence_reports
CREATE POLICY "Teachers can view own reports"
  ON public.session_intelligence_reports FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "No direct teacher report inserts"
  ON public.session_intelligence_reports FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct teacher report updates"
  ON public.session_intelligence_reports FOR UPDATE
  USING (false);

CREATE POLICY "No teacher report deletes"
  ON public.session_intelligence_reports FOR DELETE
  USING (false);

-- 6. RLS Policies — student_intelligence_reports
CREATE POLICY "Students can view own report"
  ON public.student_intelligence_reports FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view student reports for their sessions"
  ON public.student_intelligence_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions ls
    WHERE ls.id = student_intelligence_reports.session_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "No direct student report inserts"
  ON public.student_intelligence_reports FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct student report updates"
  ON public.student_intelligence_reports FOR UPDATE
  USING (false);

CREATE POLICY "No student report deletes"
  ON public.student_intelligence_reports FOR DELETE
  USING (false);

-- 7. RLS Policies — report_video_results
CREATE POLICY "Students can view own video results"
  ON public.report_video_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM student_intelligence_reports sir
    WHERE sir.id = report_video_results.student_report_id
      AND sir.student_id = auth.uid()
  ));

CREATE POLICY "Teachers can view video results for their sessions"
  ON public.report_video_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM student_intelligence_reports sir
    JOIN live_sessions ls ON ls.id = sir.session_id
    WHERE sir.id = report_video_results.student_report_id
      AND is_class_teacher(ls.class_id, auth.uid())
  ));

CREATE POLICY "No direct video result inserts"
  ON public.report_video_results FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No video result deletes"
  ON public.report_video_results FOR DELETE
  USING (false);

-- 8. RPC: trigger_report_generation
CREATE OR REPLACE FUNCTION public.trigger_report_generation(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_existing RECORD;
  v_report_id uuid;
BEGIN
  SELECT id, class_id, teacher_id, status INTO v_session
  FROM live_sessions WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.teacher_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the session teacher can trigger report generation';
  END IF;

  SELECT id, status INTO v_existing
  FROM session_intelligence_reports WHERE session_id = p_session_id;

  IF FOUND THEN
    RETURN jsonb_build_object('report_id', v_existing.id, 'status', v_existing.status);
  END IF;

  INSERT INTO session_intelligence_reports (session_id, class_id, teacher_id, status)
  VALUES (p_session_id, v_session.class_id, v_session.teacher_id, 'generating')
  RETURNING id INTO v_report_id;

  RETURN jsonb_build_object('report_id', v_report_id, 'status', 'generating');
END;
$$;

-- 9. RPC: get_teacher_report
CREATE OR REPLACE FUNCTION public.get_teacher_report(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report RECORD;
BEGIN
  SELECT sir.* INTO v_report
  FROM session_intelligence_reports sir
  JOIN live_sessions ls ON ls.id = sir.session_id
  WHERE sir.session_id = p_session_id
    AND is_class_teacher(ls.class_id, auth.uid());

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_report.id,
    'session_id', v_report.session_id,
    'class_id', v_report.class_id,
    'status', v_report.status,
    'teacher_report', v_report.teacher_report,
    'generated_at', v_report.generated_at,
    'updated_at', v_report.updated_at
  );
END;
$$;

-- 10. RPC: get_student_report
CREATE OR REPLACE FUNCTION public.get_student_report(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report RECORD;
BEGIN
  SELECT * INTO v_report
  FROM student_intelligence_reports
  WHERE session_id = p_session_id AND student_id = auth.uid();

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_report.id,
    'session_id', v_report.session_id,
    'student_id', v_report.student_id,
    'status', v_report.status,
    'understanding_score', v_report.understanding_score,
    'topic_scores', v_report.topic_scores,
    'knowledge_gaps', v_report.knowledge_gaps,
    'revision_flashcards', v_report.revision_flashcards,
    'video_suggestions', v_report.video_suggestions,
    'generated_at', v_report.generated_at,
    'updated_at', v_report.updated_at
  );
END;
$$;

-- 11. RPC: get_class_report_overview
CREATE OR REPLACE FUNCTION public.get_class_report_overview(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_total_students integer;
  v_reports_generated integer;
  v_class_avg numeric;
  v_excellent integer;
  v_good integer;
  v_needs_work integer;
  v_struggling integer;
  v_weakest RECORD;
  v_strongest RECORD;
BEGIN
  SELECT ls.class_id, ls.teacher_id INTO v_session
  FROM live_sessions ls WHERE ls.id = p_session_id;

  IF NOT FOUND OR NOT is_class_teacher(v_session.class_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COUNT(*) INTO v_total_students
  FROM class_enrollments WHERE class_id = v_session.class_id AND status = 'active';

  SELECT COUNT(*), COALESCE(AVG(understanding_score), 0)
  INTO v_reports_generated, v_class_avg
  FROM student_intelligence_reports WHERE session_id = p_session_id AND status = 'ready';

  SELECT COUNT(*) INTO v_excellent FROM student_intelligence_reports
  WHERE session_id = p_session_id AND status = 'ready' AND understanding_score >= 80;

  SELECT COUNT(*) INTO v_good FROM student_intelligence_reports
  WHERE session_id = p_session_id AND status = 'ready' AND understanding_score >= 60 AND understanding_score < 80;

  SELECT COUNT(*) INTO v_needs_work FROM student_intelligence_reports
  WHERE session_id = p_session_id AND status = 'ready' AND understanding_score >= 40 AND understanding_score < 60;

  SELECT COUNT(*) INTO v_struggling FROM student_intelligence_reports
  WHERE session_id = p_session_id AND status = 'ready' AND understanding_score < 40;

  -- Weakest/strongest topic from topic_scores across all student reports
  -- Using lateral join to unnest jsonb arrays
  SELECT t.elem->>'slide_title' as slide_title, AVG((t.elem->>'score')::numeric) as avg_score
  INTO v_weakest
  FROM student_intelligence_reports sir,
       LATERAL jsonb_array_elements(sir.topic_scores) AS t(elem)
  WHERE sir.session_id = p_session_id AND sir.status = 'ready'
  GROUP BY t.elem->>'slide_title'
  ORDER BY avg_score ASC LIMIT 1;

  SELECT t.elem->>'slide_title' as slide_title, AVG((t.elem->>'score')::numeric) as avg_score
  INTO v_strongest
  FROM student_intelligence_reports sir,
       LATERAL jsonb_array_elements(sir.topic_scores) AS t(elem)
  WHERE sir.session_id = p_session_id AND sir.status = 'ready'
  GROUP BY t.elem->>'slide_title'
  ORDER BY avg_score DESC LIMIT 1;

  RETURN jsonb_build_object(
    'total_students', v_total_students,
    'reports_generated', v_reports_generated,
    'class_average_score', ROUND(v_class_avg),
    'score_distribution', jsonb_build_object(
      'excellent', v_excellent,
      'good', v_good,
      'needs_work', v_needs_work,
      'struggling', v_struggling
    ),
    'weakest_topic', CASE WHEN v_weakest.slide_title IS NOT NULL
      THEN jsonb_build_object('slide_title', v_weakest.slide_title, 'avg_score', ROUND(v_weakest.avg_score))
      ELSE NULL END,
    'strongest_topic', CASE WHEN v_strongest.slide_title IS NOT NULL
      THEN jsonb_build_object('slide_title', v_strongest.slide_title, 'avg_score', ROUND(v_strongest.avg_score))
      ELSE NULL END
  );
END;
$$;

-- 12. RPC: save_report_video_results
CREATE OR REPLACE FUNCTION public.save_report_video_results(
  p_student_report_id uuid,
  p_videos jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_video jsonb;
BEGIN
  FOR v_video IN SELECT * FROM jsonb_array_elements(p_videos)
  LOOP
    INSERT INTO report_video_results (
      student_report_id, topic, video_id, video_title, channel_name, thumbnail_url, duration
    ) VALUES (
      p_student_report_id,
      v_video->>'topic',
      v_video->>'video_id',
      v_video->>'video_title',
      v_video->>'channel_name',
      v_video->>'thumbnail_url',
      v_video->>'duration'
    );
  END LOOP;
END;
$$;

-- 13. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_intelligence_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_intelligence_reports;
