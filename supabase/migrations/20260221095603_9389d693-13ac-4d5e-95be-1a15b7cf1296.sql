
-- 1. generate_invite_code helper
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM classes WHERE invite_code = v_code) INTO v_exists;
    IF NOT v_exists THEN RETURN v_code; END IF;
  END LOOP;
END;
$$;

-- 2. Create ALL tables
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  name text NOT NULL,
  subject text,
  description text,
  invite_code text UNIQUE NOT NULL DEFAULT public.generate_invite_code(),
  academic_year text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.class_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  UNIQUE(class_id, student_id)
);

CREATE TABLE public.class_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  material_type text NOT NULL DEFAULT 'pdf',
  content_ref text,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  assignment_type text NOT NULL DEFAULT 'quiz',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  due_date timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  max_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  graded_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'submitted',
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE public.class_join_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_join_codes ENABLE ROW LEVEL SECURITY;

-- 4. Triggers
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS Policies

-- classes
CREATE POLICY "Teachers can view own classes" ON public.classes FOR SELECT TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view enrolled classes" ON public.classes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.class_enrollments WHERE class_enrollments.class_id = classes.id AND class_enrollments.student_id = auth.uid() AND class_enrollments.status = 'active'));
CREATE POLICY "Teachers can create classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Teachers can update own classes" ON public.classes FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete own classes" ON public.classes FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

-- class_enrollments
CREATE POLICY "Teachers can view enrollments" ON public.class_enrollments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_enrollments.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Students can view own enrollments" ON public.class_enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "No direct enrollment inserts" ON public.class_enrollments FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Teachers can update enrollments" ON public.class_enrollments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_enrollments.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete enrollments" ON public.class_enrollments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_enrollments.class_id AND classes.teacher_id = auth.uid()));

-- class_materials
CREATE POLICY "Teachers can manage materials" ON public.class_materials FOR ALL TO authenticated USING (auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_materials.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Students can view visible materials" ON public.class_materials FOR SELECT TO authenticated USING (is_visible = true AND EXISTS (SELECT 1 FROM public.class_enrollments WHERE class_enrollments.class_id = class_materials.class_id AND class_enrollments.student_id = auth.uid() AND class_enrollments.status = 'active'));

-- assignments
CREATE POLICY "Teachers can manage assignments" ON public.assignments FOR ALL TO authenticated USING (auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM public.classes WHERE classes.id = assignments.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Students can view published assignments" ON public.assignments FOR SELECT TO authenticated USING (is_published = true AND EXISTS (SELECT 1 FROM public.class_enrollments WHERE class_enrollments.class_id = assignments.class_id AND class_enrollments.student_id = auth.uid() AND class_enrollments.status = 'active'));

-- assignment_submissions
CREATE POLICY "Students can view own submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view class submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.assignments a JOIN public.classes c ON c.id = a.class_id WHERE a.id = assignment_submissions.assignment_id AND c.teacher_id = auth.uid()));
CREATE POLICY "Students can submit own work" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id AND EXISTS (SELECT 1 FROM public.assignments a JOIN public.class_enrollments ce ON ce.class_id = a.class_id WHERE a.id = assignment_submissions.assignment_id AND ce.student_id = auth.uid() AND ce.status = 'active' AND a.is_published = true));
CREATE POLICY "Teachers can grade submissions" ON public.assignment_submissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.assignments a JOIN public.classes c ON c.id = a.class_id WHERE a.id = assignment_submissions.assignment_id AND c.teacher_id = auth.uid()));
CREATE POLICY "No submission deletes" ON public.assignment_submissions FOR DELETE TO authenticated USING (false);

-- class_join_codes
CREATE POLICY "No direct join code access" ON public.class_join_codes FOR ALL TO authenticated USING (false);

-- 6. RPC Functions

CREATE OR REPLACE FUNCTION public.join_class_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_class_record classes%ROWTYPE;
  v_recent_attempts integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT count(*) INTO v_recent_attempts FROM class_join_codes WHERE user_id = v_user_id AND attempted_at > now() - interval '1 hour';
  IF v_recent_attempts >= 10 THEN RETURN jsonb_build_object('success', false, 'error', 'Too many attempts. Try again later.'); END IF;

  SELECT * INTO v_class_record FROM classes WHERE upper(invite_code) = upper(p_code) AND is_active = true;
  IF NOT FOUND THEN
    INSERT INTO class_join_codes (user_id, code, success) VALUES (v_user_id, p_code, false);
    RETURN jsonb_build_object('success', false, 'error', 'Invalid class code');
  END IF;

  IF v_class_record.teacher_id = v_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'You are the teacher of this class'); END IF;
  IF EXISTS (SELECT 1 FROM class_enrollments WHERE class_id = v_class_record.id AND student_id = v_user_id) THEN RETURN jsonb_build_object('success', false, 'error', 'Already enrolled'); END IF;

  INSERT INTO class_enrollments (class_id, student_id, status) VALUES (v_class_record.id, v_user_id, 'active');
  INSERT INTO class_join_codes (user_id, code, success) VALUES (v_user_id, p_code, true);

  RETURN jsonb_build_object('success', true, 'class_id', v_class_record.id, 'class_name', v_class_record.name, 'subject', v_class_record.subject);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_class_analytics(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_enrollment_count integer;
  v_assignment_count integer;
  v_submission_count integer;
  v_avg_score numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF NOT EXISTS (SELECT 1 FROM classes WHERE id = p_class_id AND teacher_id = v_user_id) THEN RETURN jsonb_build_object('success', false, 'error', 'Not authorized'); END IF;

  SELECT count(*) INTO v_enrollment_count FROM class_enrollments WHERE class_id = p_class_id AND status = 'active';
  SELECT count(*) INTO v_assignment_count FROM assignments WHERE class_id = p_class_id;
  SELECT count(*) INTO v_submission_count FROM assignment_submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.class_id = p_class_id;
  SELECT avg(s.score) INTO v_avg_score FROM assignment_submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.class_id = p_class_id AND s.score IS NOT NULL;

  RETURN jsonb_build_object('success', true, 'enrollment_count', v_enrollment_count, 'assignment_count', v_assignment_count, 'submission_count', v_submission_count, 'average_score', coalesce(round(v_avg_score, 1), 0));
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_grade_quiz_submission(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_submission assignment_submissions%ROWTYPE;
  v_assignment assignments%ROWTYPE;
  v_questions jsonb;
  v_answers jsonb;
  v_score integer := 0;
  v_total integer := 0;
  v_q jsonb;
  v_student_answer text;
  v_correct_answer text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_submission FROM assignment_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Submission not found'); END IF;

  SELECT * INTO v_assignment FROM assignments WHERE id = v_submission.assignment_id;

  IF v_user_id != v_submission.student_id AND NOT EXISTS (SELECT 1 FROM classes WHERE id = v_assignment.class_id AND teacher_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_assignment.assignment_type != 'quiz' THEN RETURN jsonb_build_object('success', false, 'error', 'Not a quiz'); END IF;

  v_questions := v_assignment.content->'questions';
  v_answers := v_submission.answers;
  IF v_questions IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'No questions'); END IF;

  FOR v_q IN SELECT * FROM jsonb_array_elements(v_questions)
  LOOP
    v_total := v_total + 1;
    v_correct_answer := lower(trim(v_q->>'correct_answer'));
    v_student_answer := lower(trim(v_answers->>((v_total - 1)::text)));
    IF v_student_answer = v_correct_answer THEN v_score := v_score + 1; END IF;
  END LOOP;

  UPDATE assignment_submissions SET score = v_score, graded_at = now(), status = 'graded' WHERE id = p_submission_id;

  RETURN jsonb_build_object('success', true, 'score', v_score, 'total', v_total, 'percentage', CASE WHEN v_total > 0 THEN round((v_score::numeric / v_total::numeric) * 100, 1) ELSE 0 END);
END;
$$;
