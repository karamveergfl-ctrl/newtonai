
-- Enhanced faculty stats RPC with course allocation and workload data
CREATE OR REPLACE FUNCTION public.get_faculty_workload(p_institution_id uuid)
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
      -- Classes and courses
      (SELECT COUNT(*) FROM classes c2 WHERE c2.teacher_id = im.user_id AND c2.is_active = true) as active_class_count,
      (SELECT COUNT(*) FROM courses co WHERE co.teacher_id = im.user_id) as course_count,
      -- Course names
      (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'course_name', co2.course_name,
        'course_code', co2.course_code,
        'class_count', (SELECT COUNT(*) FROM classes cx WHERE cx.course_id = co2.id AND cx.is_active = true)
      )), '[]'::jsonb) FROM courses co2 WHERE co2.teacher_id = im.user_id) as courses,
      -- Session workload
      (SELECT COUNT(*) FROM live_sessions ls2 
       JOIN classes c3 ON c3.id = ls2.class_id 
       WHERE c3.teacher_id = im.user_id) as total_sessions,
      -- Sessions this week
      (SELECT COUNT(*) FROM live_sessions ls3 
       JOIN classes c4 ON c4.id = ls3.class_id 
       WHERE c4.teacher_id = im.user_id 
         AND ls3.started_at >= date_trunc('week', now())) as sessions_this_week,
      -- Sessions this month
      (SELECT COUNT(*) FROM live_sessions ls4 
       JOIN classes c5 ON c5.id = ls4.class_id 
       WHERE c5.teacher_id = im.user_id 
         AND ls4.started_at >= date_trunc('month', now())) as sessions_this_month,
      -- Student count
      (SELECT COUNT(DISTINCT ce.student_id) 
       FROM class_enrollments ce 
       JOIN classes c6 ON c6.id = ce.class_id 
       WHERE c6.teacher_id = im.user_id AND ce.status = 'active') as total_students,
      -- Assignment count
      (SELECT COUNT(*) FROM assignments a2 WHERE a2.teacher_id = im.user_id) as assignment_count,
      -- Avg student score
      (SELECT ROUND(COALESCE(AVG(sm2.total_marks), 0)::numeric, 1)
       FROM student_marks sm2
       JOIN classes c7 ON c7.id = sm2.class_id
       WHERE c7.teacher_id = im.user_id AND sm2.total_marks IS NOT NULL) as avg_student_score,
      -- Last active
      (SELECT MAX(ls5.started_at)
       FROM live_sessions ls5
       JOIN classes c8 ON c8.id = ls5.class_id
       WHERE c8.teacher_id = im.user_id) as last_active
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

-- NAAC/NBA compliance report data RPC
CREATE OR REPLACE FUNCTION public.get_compliance_report_data(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_faculty_count int;
  v_student_count int;
  v_department_count int;
  v_course_count int;
  v_session_count int;
  v_assignment_count int;
  v_avg_attendance numeric;
  v_avg_score numeric;
BEGIN
  IF NOT is_institution_admin(p_institution_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Faculty count
  SELECT COUNT(*) INTO v_faculty_count
  FROM institution_members im
  JOIN user_roles ur ON ur.user_id = im.user_id
  WHERE im.institution_id = p_institution_id AND ur.role = 'teacher';

  -- Student count across all classes
  SELECT COUNT(DISTINCT ce.student_id) INTO v_student_count
  FROM class_enrollments ce
  JOIN classes c ON c.id = ce.class_id
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id AND ce.status = 'active';

  SELECT COUNT(*) INTO v_department_count FROM departments WHERE institution_id = p_institution_id;

  SELECT COUNT(*) INTO v_course_count 
  FROM courses co JOIN departments d ON d.id = co.department_id 
  WHERE d.institution_id = p_institution_id;

  SELECT COUNT(*) INTO v_session_count
  FROM live_sessions ls
  JOIN classes c ON c.id = ls.class_id
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id;

  SELECT COUNT(*) INTO v_assignment_count
  FROM assignments a
  JOIN classes c ON c.id = a.class_id
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id;

  -- Avg attendance rate
  SELECT ROUND(COALESCE(
    (COUNT(*) FILTER (WHERE ar.status = 'present')::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100
  , 0), 1) INTO v_avg_attendance
  FROM attendance_records ar
  JOIN classes c ON c.id = ar.class_id
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id;

  -- Avg student score
  SELECT ROUND(COALESCE(AVG(sm.total_marks), 0)::numeric, 1) INTO v_avg_score
  FROM student_marks sm
  JOIN classes c ON c.id = sm.class_id
  JOIN courses co ON co.id = c.course_id
  JOIN departments d ON d.id = co.department_id
  WHERE d.institution_id = p_institution_id AND sm.total_marks IS NOT NULL;

  -- Department-wise breakdown
  result := jsonb_build_object(
    'institution_name', (SELECT name FROM institutions WHERE id = p_institution_id),
    'institution_type', (SELECT type FROM institutions WHERE id = p_institution_id),
    'generated_at', now(),
    'summary', jsonb_build_object(
      'faculty_count', v_faculty_count,
      'student_count', v_student_count,
      'department_count', v_department_count,
      'course_count', v_course_count,
      'total_sessions', v_session_count,
      'total_assignments', v_assignment_count,
      'avg_attendance_pct', v_avg_attendance,
      'avg_student_score', v_avg_score
    ),
    'departments', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', d.name,
        'head', (SELECT full_name FROM profiles WHERE id = d.head_user_id),
        'course_count', (SELECT COUNT(*) FROM courses WHERE department_id = d.id),
        'faculty_count', (SELECT COUNT(DISTINCT co.teacher_id) FROM courses co WHERE co.department_id = d.id),
        'session_count', (SELECT COUNT(*) FROM live_sessions ls JOIN classes c ON c.id = ls.class_id JOIN courses co ON co.id = c.course_id WHERE co.department_id = d.id)
      )), '[]'::jsonb)
      FROM departments d WHERE d.institution_id = p_institution_id
    ),
    'audit_log_count', (SELECT COUNT(*) FROM institution_audit_logs WHERE institution_id = p_institution_id)
  );

  RETURN result;
END;
$$;
