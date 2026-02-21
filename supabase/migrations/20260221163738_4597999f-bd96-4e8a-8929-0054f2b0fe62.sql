
-- RPC 1: get_student_progress
CREATE OR REPLACE FUNCTION public.get_student_progress(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF NOT EXISTS (SELECT 1 FROM classes WHERE id = p_class_id AND teacher_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT jsonb_agg(row_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'student_id', ce.student_id,
      'full_name', COALESCE(p.full_name, 'Unknown'),
      'total_assignments', (SELECT count(*) FROM assignments WHERE class_id = p_class_id),
      'submitted_count', COALESCE(sub.cnt, 0),
      'average_score', COALESCE(sub.avg_score, 0),
      'last_submission_at', sub.last_sub
    ) AS row_data
    FROM class_enrollments ce
    LEFT JOIN profiles p ON p.id = ce.student_id
    LEFT JOIN LATERAL (
      SELECT count(*) AS cnt,
             round(avg(asub.score)::numeric, 1) AS avg_score,
             max(asub.submitted_at) AS last_sub
      FROM assignment_submissions asub
      JOIN assignments a ON a.id = asub.assignment_id AND a.class_id = p_class_id
      WHERE asub.student_id = ce.student_id
    ) sub ON true
    WHERE ce.class_id = p_class_id AND ce.status = 'active'
    ORDER BY p.full_name
  ) t;

  RETURN jsonb_build_object('success', true, 'students', COALESCE(v_result, '[]'::jsonb));
END;
$$;

-- RPC 2: get_assignment_results
CREATE OR REPLACE FUNCTION public.get_assignment_results(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF NOT EXISTS (SELECT 1 FROM classes WHERE id = p_class_id AND teacher_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT jsonb_agg(row_data ORDER BY a_created DESC) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'assignment_id', a.id,
      'title', a.title,
      'assignment_type', a.assignment_type,
      'is_published', a.is_published,
      'due_date', a.due_date,
      'created_at', a.created_at,
      'total_enrolled', (SELECT count(*) FROM class_enrollments WHERE class_id = p_class_id AND status = 'active'),
      'submission_count', COALESCE(stats.cnt, 0),
      'average_score', COALESCE(stats.avg_s, 0),
      'submissions', COALESCE(stats.subs, '[]'::jsonb)
    ) AS row_data,
    a.created_at AS a_created
    FROM assignments a
    LEFT JOIN LATERAL (
      SELECT count(*) AS cnt,
             round(avg(asub.score)::numeric, 1) AS avg_s,
             jsonb_agg(jsonb_build_object(
               'student_id', asub.student_id,
               'full_name', COALESCE(pr.full_name, 'Unknown'),
               'score', asub.score,
               'status', asub.status,
               'submitted_at', asub.submitted_at
             )) AS subs
      FROM assignment_submissions asub
      LEFT JOIN profiles pr ON pr.id = asub.student_id
      WHERE asub.assignment_id = a.id
    ) stats ON true
    WHERE a.class_id = p_class_id
  ) t;

  RETURN jsonb_build_object('success', true, 'assignments', COALESCE(v_result, '[]'::jsonb));
END;
$$;

-- RPC 3: get_attendance_grid
CREATE OR REPLACE FUNCTION public.get_attendance_grid(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_students jsonb;
  v_assignments jsonb;
  v_attendance jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF NOT EXISTS (SELECT 1 FROM classes WHERE id = p_class_id AND teacher_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('student_id', ce.student_id, 'full_name', COALESCE(p.full_name, 'Unknown')) ORDER BY p.full_name), '[]'::jsonb)
  INTO v_students
  FROM class_enrollments ce
  LEFT JOIN profiles p ON p.id = ce.student_id
  WHERE ce.class_id = p_class_id AND ce.status = 'active';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('assignment_id', a.id, 'title', a.title, 'due_date', a.due_date) ORDER BY a.created_at), '[]'::jsonb)
  INTO v_assignments
  FROM assignments a WHERE a.class_id = p_class_id AND a.is_published = true;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'student_id', ce.student_id,
    'assignment_id', a.id,
    'status', CASE
      WHEN asub.id IS NOT NULL THEN
        CASE WHEN a.due_date IS NOT NULL AND asub.submitted_at > a.due_date THEN 'late' ELSE 'submitted' END
      WHEN a.due_date IS NOT NULL AND a.due_date > now() THEN 'not_due'
      ELSE 'missing'
    END
  )), '[]'::jsonb)
  INTO v_attendance
  FROM class_enrollments ce
  CROSS JOIN assignments a
  LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = ce.student_id
  WHERE ce.class_id = p_class_id AND ce.status = 'active' AND a.class_id = p_class_id AND a.is_published = true;

  RETURN jsonb_build_object('success', true, 'students', v_students, 'assignments', v_assignments, 'attendance', v_attendance);
END;
$$;
