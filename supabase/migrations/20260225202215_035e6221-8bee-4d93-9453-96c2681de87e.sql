
-- ============================================================
-- Institution Subscriptions & Payments
-- ============================================================

-- 1. institution_subscriptions
CREATE TABLE public.institution_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL UNIQUE REFERENCES public.institutions(id) ON DELETE CASCADE,
  plan_tier text NOT NULL DEFAULT 'starter',
  student_seats integer NOT NULL DEFAULT 50,
  teacher_seats integer NOT NULL DEFAULT 5,
  price_per_student numeric NOT NULL DEFAULT 0,
  price_per_teacher numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.institution_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution admins can view subscription"
  ON public.institution_subscriptions FOR SELECT
  USING (is_institution_admin(institution_id, auth.uid()));

CREATE POLICY "Institution admins can update subscription"
  ON public.institution_subscriptions FOR UPDATE
  USING (is_institution_admin(institution_id, auth.uid()));

CREATE POLICY "No direct subscription inserts"
  ON public.institution_subscriptions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct subscription deletes"
  ON public.institution_subscriptions FOR DELETE
  USING (false);

-- 2. institution_payments
CREATE TABLE public.institution_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.institution_subscriptions(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  currency text DEFAULT 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  status text NOT NULL DEFAULT 'created',
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.institution_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution admins can view payments"
  ON public.institution_payments FOR SELECT
  USING (is_institution_admin(institution_id, auth.uid()));

CREATE POLICY "No direct payment inserts"
  ON public.institution_payments FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct payment updates"
  ON public.institution_payments FOR UPDATE
  USING (false);

CREATE POLICY "No direct payment deletes"
  ON public.institution_payments FOR DELETE
  USING (false);

-- 3. Trigger for updated_at on institution_subscriptions
CREATE TRIGGER update_institution_subscriptions_updated_at
  BEFORE UPDATE ON public.institution_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RPC: get_institution_billing_stats
CREATE OR REPLACE FUNCTION public.get_institution_billing_stats(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  sub_record record;
  active_students integer;
  active_teachers integer;
  total_paid bigint;
  last_payment_date timestamptz;
BEGIN
  -- Verify caller is institution admin
  IF NOT is_institution_admin(p_institution_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get subscription
  SELECT * INTO sub_record
  FROM institution_subscriptions
  WHERE institution_id = p_institution_id
  LIMIT 1;

  -- Count active students (enrolled in classes belonging to institution teachers)
  SELECT COUNT(DISTINCT ce.student_id) INTO active_students
  FROM class_enrollments ce
  JOIN classes c ON c.id = ce.class_id
  JOIN institution_members im ON im.user_id = c.teacher_id AND im.institution_id = p_institution_id
  WHERE ce.status = 'active';

  -- Count active teachers
  SELECT COUNT(*) INTO active_teachers
  FROM institution_members
  WHERE institution_id = p_institution_id AND role IN ('admin', 'teacher', 'member');

  -- Payment summary
  SELECT COALESCE(SUM(amount), 0), MAX(created_at)
  INTO total_paid, last_payment_date
  FROM institution_payments
  WHERE institution_id = p_institution_id AND status = 'captured';

  result := jsonb_build_object(
    'plan_tier', COALESCE(sub_record.plan_tier, 'starter'),
    'student_seats', COALESCE(sub_record.student_seats, 50),
    'teacher_seats', COALESCE(sub_record.teacher_seats, 5),
    'price_per_student', COALESCE(sub_record.price_per_student, 0),
    'price_per_teacher', COALESCE(sub_record.price_per_teacher, 0),
    'billing_cycle', COALESCE(sub_record.billing_cycle, 'monthly'),
    'status', COALESCE(sub_record.status, 'active'),
    'current_period_start', sub_record.current_period_start,
    'current_period_end', sub_record.current_period_end,
    'active_students', active_students,
    'active_teachers', active_teachers,
    'student_utilization', CASE WHEN COALESCE(sub_record.student_seats, 50) > 0 
      THEN ROUND((active_students::numeric / sub_record.student_seats) * 100, 1) ELSE 0 END,
    'teacher_utilization', CASE WHEN COALESCE(sub_record.teacher_seats, 5) > 0 
      THEN ROUND((active_teachers::numeric / sub_record.teacher_seats) * 100, 1) ELSE 0 END,
    'total_paid', total_paid,
    'last_payment_date', last_payment_date
  );

  RETURN result;
END;
$$;

-- 5. RPC: get_institution_feature_access
CREATE OR REPLACE FUNCTION public.get_institution_feature_access(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tier text;
  result jsonb;
BEGIN
  IF NOT is_institution_admin(p_institution_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT plan_tier INTO tier
  FROM institution_subscriptions
  WHERE institution_id = p_institution_id
  LIMIT 1;

  tier := COALESCE(tier, 'starter');

  IF tier = 'enterprise' THEN
    result := jsonb_build_object(
      'live_sessions_limit', -1,
      'ai_insights', true,
      'result_processing', 'full',
      'faculty_monitoring', true,
      'compliance_audit', 'full',
      'report_card_pdfs', -1,
      'tier', 'enterprise'
    );
  ELSIF tier = 'growth' THEN
    result := jsonb_build_object(
      'live_sessions_limit', 100,
      'ai_insights', true,
      'result_processing', 'full',
      'faculty_monitoring', true,
      'compliance_audit', 'basic',
      'report_card_pdfs', 500,
      'tier', 'growth'
    );
  ELSE
    result := jsonb_build_object(
      'live_sessions_limit', 20,
      'ai_insights', false,
      'result_processing', 'basic',
      'faculty_monitoring', false,
      'compliance_audit', 'none',
      'report_card_pdfs', 50,
      'tier', 'starter'
    );
  END IF;

  RETURN result;
END;
$$;
