
CREATE OR REPLACE FUNCTION public.assign_teacher_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Defence in depth: do not allow this path to touch admins.
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('admin'::app_role, 'institutional_admin'::app_role)
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'teacher'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_teacher_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_teacher_role() TO authenticated;

-- Backfill: users who completed teacher onboarding (have teacher_preferences)
-- but never got the teacher role due to the prior RLS-blocked upsert.
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'teacher'::app_role
FROM public.profiles p
WHERE p.teacher_preferences IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'teacher'::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;
