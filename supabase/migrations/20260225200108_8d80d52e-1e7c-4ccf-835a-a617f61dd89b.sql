
-- =============================================
-- Academic Records System: Tables, RLS, RPCs
-- =============================================

-- 1. attendance_records table
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present',
  auto_marked boolean NOT NULL DEFAULT false,
  participation_score integer DEFAULT 0,
  marked_at timestamptz DEFAULT now(),
  UNIQUE(session_id, student_id)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- SELECT: students see own, teachers see their class
CREATE POLICY "Students can view own attendance"
  ON public.attendance_records FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view class attendance"
  ON public.attendance_records FOR SELECT
  USING (is_class_teacher(class_id, auth.uid()));

-- INSERT: teacher of class
CREATE POLICY "Teachers can insert attendance"
  ON public.attendance_records FOR INSERT
  WITH CHECK (is_class_teacher(class_id, auth.uid()));

-- UPDATE: teacher of class
CREATE POLICY "Teachers can update attendance"
  ON public.attendance_records FOR UPDATE
  USING (is_class_teacher(class_id, auth.uid()));

-- DELETE: teacher of class
CREATE POLICY "Teachers can delete attendance"
  ON public.attendance_records FOR DELETE
  USING (is_class_teacher(class_id, auth.uid()));

-- 2. student_marks table
CREATE TABLE public.student_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assignment_marks numeric DEFAULT 0,
  attendance_marks numeric DEFAULT 0,
  midsem1 numeric,
  midsem2 numeric,
  endsem numeric,
  practical_marks numeric,
  project_marks numeric,
  total_marks numeric GENERATED ALWAYS AS (
    COALESCE(assignment_marks,0) + COALESCE(attendance_marks,0) +
    COALESCE(midsem1,0) + COALESCE(midsem2,0) + COALESCE(endsem,0) +
    COALESCE(practical_marks,0) + COALESCE(project_marks,0)
  ) STORED,
  grade text,
  academic_year text,
  semester text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id, class_id)
);

ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;

-- SELECT: student own, teacher of class, institution admin
CREATE POLICY "Students can view own marks"
  ON public.student_marks FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view class marks"
  ON public.student_marks FOR SELECT
  USING (is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Institution admins can view marks"
  ON public.student_marks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN courses co ON co.id = student_marks.course_id
      JOIN departments d ON d.id = co.department_id
      WHERE c.id = student_marks.class_id
        AND is_institution_admin(d.institution_id, auth.uid())
    )
  );

-- INSERT/UPDATE: teacher of class
CREATE POLICY "Teachers can insert marks"
  ON public.student_marks FOR INSERT
  WITH CHECK (is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers can update marks"
  ON public.student_marks FOR UPDATE
  USING (is_class_teacher(class_id, auth.uid()));

-- DELETE: institution admin only
CREATE POLICY "Institution admins can delete marks"
  ON public.student_marks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN courses co ON co.id = student_marks.course_id
      JOIN departments d ON d.id = co.department_id
      WHERE c.id = student_marks.class_id
        AND is_institution_admin(d.institution_id, auth.uid())
    )
  );

-- 3. Auto-attendance RPC
CREATE OR REPLACE FUNCTION public.mark_auto_attendance(
  p_session_id uuid,
  p_student_id uuid,
  p_class_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.attendance_records (session_id, student_id, class_id, status, auto_marked, participation_score)
  VALUES (p_session_id, p_student_id, p_class_id, 'present', true, 1)
  ON CONFLICT (session_id, student_id)
  DO UPDATE SET participation_score = attendance_records.participation_score + 1;
END;
$$;

-- 4. Aggregate marks summary RPC
CREATE OR REPLACE FUNCTION public.get_institution_marks_summary(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Verify caller is institution admin
  IF NOT is_institution_admin(p_institution_id, auth.uid()) THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT jsonb_build_object(
    'total_students', COUNT(DISTINCT sm.student_id),
    'total_records', COUNT(*),
    'avg_total', ROUND(AVG(sm.total_marks)::numeric, 2),
    'pass_count', COUNT(*) FILTER (WHERE sm.total_marks >= 40),
    'fail_count', COUNT(*) FILTER (WHERE sm.total_marks < 40),
    'grade_distribution', (
      SELECT jsonb_object_agg(g, cnt)
      FROM (
        SELECT COALESCE(sm2.grade, 'Ungraded') as g, COUNT(*) as cnt
        FROM student_marks sm2
        JOIN classes c2 ON c2.id = sm2.class_id
        JOIN courses co2 ON co2.id = sm2.course_id
        JOIN departments d2 ON d2.id = co2.department_id
        WHERE d2.institution_id = p_institution_id
        GROUP BY sm2.grade
      ) sub
    ),
    'records', (
      SELECT jsonb_agg(jsonb_build_object(
        'student_id', sm3.student_id,
        'student_name', COALESCE(p.full_name, 'Unknown'),
        'course_name', co3.course_name,
        'course_code', co3.course_code,
        'class_name', c3.name,
        'department', d3.name,
        'assignment_marks', sm3.assignment_marks,
        'attendance_marks', sm3.attendance_marks,
        'midsem1', sm3.midsem1,
        'midsem2', sm3.midsem2,
        'endsem', sm3.endsem,
        'practical_marks', sm3.practical_marks,
        'project_marks', sm3.project_marks,
        'total_marks', sm3.total_marks,
        'grade', sm3.grade,
        'academic_year', sm3.academic_year,
        'semester', sm3.semester
      ) ORDER BY co3.course_name, p.full_name)
      FROM student_marks sm3
      JOIN classes c3 ON c3.id = sm3.class_id
      JOIN courses co3 ON co3.id = sm3.course_id
      JOIN departments d3 ON d3.id = co3.department_id
      LEFT JOIN profiles p ON p.id = sm3.student_id
      WHERE d3.institution_id = p_institution_id
    )
  ) INTO result
  FROM student_marks sm
  JOIN classes c ON c.id = sm.class_id
  JOIN courses co ON co.id = sm.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 5. Bulk upsert marks RPC
CREATE OR REPLACE FUNCTION public.bulk_upsert_student_marks(p_marks jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec jsonb;
  inserted_count int := 0;
  v_class_id uuid;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(p_marks)
  LOOP
    v_class_id := (rec->>'class_id')::uuid;
    
    -- Verify teacher owns this class
    IF NOT is_class_teacher(v_class_id, auth.uid()) THEN
      RETURN jsonb_build_object('error', 'unauthorized for class ' || v_class_id::text);
    END IF;

    INSERT INTO public.student_marks (
      student_id, course_id, class_id,
      assignment_marks, attendance_marks,
      midsem1, midsem2, endsem,
      practical_marks, project_marks,
      grade, academic_year, semester
    ) VALUES (
      (rec->>'student_id')::uuid,
      (rec->>'course_id')::uuid,
      v_class_id,
      (rec->>'assignment_marks')::numeric,
      (rec->>'attendance_marks')::numeric,
      (rec->>'midsem1')::numeric,
      (rec->>'midsem2')::numeric,
      (rec->>'endsem')::numeric,
      (rec->>'practical_marks')::numeric,
      (rec->>'project_marks')::numeric,
      rec->>'grade',
      rec->>'academic_year',
      rec->>'semester'
    )
    ON CONFLICT (student_id, course_id, class_id)
    DO UPDATE SET
      assignment_marks = COALESCE((rec->>'assignment_marks')::numeric, student_marks.assignment_marks),
      attendance_marks = COALESCE((rec->>'attendance_marks')::numeric, student_marks.attendance_marks),
      midsem1 = COALESCE((rec->>'midsem1')::numeric, student_marks.midsem1),
      midsem2 = COALESCE((rec->>'midsem2')::numeric, student_marks.midsem2),
      endsem = COALESCE((rec->>'endsem')::numeric, student_marks.endsem),
      practical_marks = COALESCE((rec->>'practical_marks')::numeric, student_marks.practical_marks),
      project_marks = COALESCE((rec->>'project_marks')::numeric, student_marks.project_marks),
      grade = COALESCE(rec->>'grade', student_marks.grade),
      academic_year = COALESCE(rec->>'academic_year', student_marks.academic_year),
      semester = COALESCE(rec->>'semester', student_marks.semester),
      updated_at = now();

    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', inserted_count);
END;
$$;
