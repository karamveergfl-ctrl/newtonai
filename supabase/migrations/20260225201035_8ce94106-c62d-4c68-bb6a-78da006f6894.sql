
-- =====================================================
-- Institution Admin Dashboard Migration
-- =====================================================

-- 1. institution_audit_logs table
CREATE TABLE public.institution_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_institution ON public.institution_audit_logs(institution_id);
CREATE INDEX idx_audit_logs_created_at ON public.institution_audit_logs(created_at DESC);

ALTER TABLE public.institution_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only institution admins can SELECT
CREATE POLICY "Institution admins can view audit logs"
ON public.institution_audit_logs FOR SELECT
USING (is_institution_admin(institution_id, auth.uid()));

-- Block all direct writes
CREATE POLICY "No direct audit log inserts"
ON public.institution_audit_logs FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct audit log updates"
ON public.institution_audit_logs FOR UPDATE
USING (false);

CREATE POLICY "No direct audit log deletes"
ON public.institution_audit_logs FOR DELETE
USING (false);

-- 2. log_institution_audit RPC
CREATE OR REPLACE FUNCTION public.log_institution_audit(
  p_institution_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_institution_admin(p_institution_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO institution_audit_logs (institution_id, user_id, action, entity_type, entity_id, details)
  VALUES (p_institution_id, auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- 3. get_institution_analytics RPC
CREATE OR REPLACE FUNCTION public.get_institution_analytics(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_total_students int;
  v_avg_score numeric;
  v_attendance_rate numeric;
  v_active_courses int;
  v_total_sessions int;
  v_course_stats jsonb;
  v_attendance_stats jsonb;
BEGIN
  IF NOT is_institution_admin(p_institution_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Total students across institution classes
  SELECT COUNT(DISTINCT ce.student_id) INTO v_total_students
  FROM class_enrollments ce
  JOIN classes c ON c.id = ce.class_id
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id AND ce.status = 'active';

  -- Avg score from student_marks
  SELECT COALESCE(AVG(sm.total_marks), 0) INTO v_avg_score
  FROM student_marks sm
  JOIN courses co ON co.id = sm.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id AND sm.total_marks IS NOT NULL;

  -- Attendance rate
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE ar.status = 'present')::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
    0
  ) INTO v_attendance_rate
  FROM attendance_records ar
  JOIN classes c ON c.id = ar.class_id
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id;

  -- Active courses
  SELECT COUNT(*) INTO v_active_courses
  FROM courses co
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id;

  -- Total sessions
  SELECT COUNT(*) INTO v_total_sessions
  FROM live_sessions ls
  JOIN classes c ON c.id = ls.class_id
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id;

  -- Per-course avg scores
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_course_stats
  FROM (
    SELECT co.course_name, co.course_code, co.semester,
           ROUND(AVG(sm.total_marks)::numeric, 2) as avg_score,
           COUNT(DISTINCT sm.student_id) as student_count,
           COUNT(*) FILTER (WHERE sm.total_marks >= 40) as pass_count,
           COUNT(*) FILTER (WHERE sm.total_marks < 40) as fail_count
    FROM student_marks sm
    JOIN courses co ON co.id = sm.course_id
    JOIN departments d ON d.id = co.department_id
    WHERE d.institution_id = p_institution_id AND sm.total_marks IS NOT NULL
    GROUP BY co.id, co.course_name, co.course_code, co.semester
    ORDER BY co.course_name
  ) t;

  -- Per-class attendance
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_attendance_stats
  FROM (
    SELECT c.name as class_name, co.course_name,
           COUNT(*) FILTER (WHERE ar.status = 'present') as present_count,
           COUNT(*) as total_count,
           ROUND(
             (COUNT(*) FILTER (WHERE ar.status = 'present')::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
             1
           ) as attendance_rate
    FROM attendance_records ar
    JOIN classes c ON c.id = ar.class_id
    JOIN courses co ON co.id = c.course_id
    JOIN departments d ON d.id = co.department_id
    WHERE d.institution_id = p_institution_id
    GROUP BY c.id, c.name, co.course_name
    ORDER BY attendance_rate ASC
  ) t;

  result := jsonb_build_object(
    'total_students', v_total_students,
    'avg_score', ROUND(v_avg_score, 2),
    'attendance_rate', ROUND(v_attendance_rate, 1),
    'active_courses', v_active_courses,
    'total_sessions', v_total_sessions,
    'course_stats', v_course_stats,
    'attendance_stats', v_attendance_stats
  );

  RETURN result;
END;
$$;

-- 4. get_faculty_stats RPC
CREATE OR REPLACE FUNCTION public.get_faculty_stats(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT is_institution_admin(p_institution_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT 
      im.user_id as teacher_id,
      p.full_name as teacher_name,
      p.avatar_url,
      (SELECT COUNT(*) FROM classes c2 WHERE c2.teacher_id = im.user_id) as class_count,
      (SELECT COUNT(*) FROM live_sessions ls2 
       JOIN classes c3 ON c3.id = ls2.class_id 
       WHERE c3.teacher_id = im.user_id) as session_count,
      (SELECT COUNT(*) FROM assignments a2 WHERE a2.teacher_id = im.user_id) as assignment_count,
      (SELECT ROUND(COALESCE(AVG(sm2.total_marks), 0)::numeric, 2)
       FROM student_marks sm2
       JOIN classes c4 ON c4.id = sm2.class_id
       WHERE c4.teacher_id = im.user_id AND sm2.total_marks IS NOT NULL) as avg_student_score,
      (SELECT MAX(ls3.started_at)
       FROM live_sessions ls3
       JOIN classes c5 ON c5.id = ls3.class_id
       WHERE c5.teacher_id = im.user_id) as last_active
    FROM institution_members im
    JOIN profiles p ON p.id = im.user_id
    JOIN user_roles ur ON ur.user_id = im.user_id
    WHERE im.institution_id = p_institution_id
      AND ur.role = 'teacher'
    ORDER BY p.full_name
  ) t;

  RETURN result;
END;
$$;

-- 5. calculate_grades_batch RPC
CREATE OR REPLACE FUNCTION public.calculate_grades_batch(
  p_class_id uuid,
  p_grading_scale jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_institution_id uuid;
  v_updated int := 0;
  v_record RECORD;
  v_grade text;
  v_scale RECORD;
BEGIN
  -- Get institution_id from class -> course -> department
  SELECT d.institution_id INTO v_institution_id
  FROM classes c
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE c.id = p_class_id;

  IF v_institution_id IS NULL THEN
    RAISE EXCEPTION 'Class not found or not linked to institution';
  END IF;

  IF NOT is_institution_admin(v_institution_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- For each student_marks row in this class
  FOR v_record IN
    SELECT id, total_marks FROM student_marks WHERE class_id = p_class_id AND total_marks IS NOT NULL
  LOOP
    v_grade := 'F';
    -- Find matching grade from scale (sorted by min desc)
    FOR v_scale IN
      SELECT * FROM jsonb_to_recordset(p_grading_scale) AS x(min numeric, grade text) ORDER BY min DESC
    LOOP
      IF v_record.total_marks >= v_scale.min THEN
        v_grade := v_scale.grade;
        EXIT;
      END IF;
    END LOOP;

    UPDATE student_marks SET grade = v_grade, updated_at = now() WHERE id = v_record.id;
    v_updated := v_updated + 1;
  END LOOP;

  -- Log audit
  INSERT INTO institution_audit_logs (institution_id, user_id, action, entity_type, entity_id, details)
  VALUES (v_institution_id, auth.uid(), 'grades_calculated', 'student_marks', p_class_id,
          jsonb_build_object('students_updated', v_updated, 'grading_scale', p_grading_scale));

  RETURN jsonb_build_object('updated', v_updated);
END;
$$;

-- 6. generate_rank_list RPC
CREATE OR REPLACE FUNCTION public.generate_rank_list(
  p_class_id uuid,
  p_course_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_institution_id uuid;
  result jsonb;
BEGIN
  SELECT d.institution_id INTO v_institution_id
  FROM courses co
  JOIN departments d ON d.id = co.department_id
  WHERE co.id = p_course_id;

  IF NOT is_institution_admin(v_institution_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY sm.total_marks DESC NULLS LAST) as rank,
      sm.student_id,
      p.full_name as student_name,
      sm.total_marks,
      sm.grade,
      sm.midsem1, sm.midsem2, sm.endsem,
      sm.assignment_marks, sm.attendance_marks,
      sm.practical_marks, sm.project_marks
    FROM student_marks sm
    JOIN profiles p ON p.id = sm.student_id
    WHERE sm.class_id = p_class_id AND sm.course_id = p_course_id
    ORDER BY sm.total_marks DESC NULLS LAST
  ) t;

  RETURN result;
END;
$$;
