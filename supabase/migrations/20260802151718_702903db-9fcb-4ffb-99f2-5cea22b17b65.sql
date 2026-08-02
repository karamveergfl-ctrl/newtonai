CREATE OR REPLACE FUNCTION public.sb_link_institution_admin(p_institution_id uuid, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised');
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No NewtonAI account exists for this email. Ask them to sign up first.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.sb_institution_admins
    WHERE institution_id = p_institution_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This person is already an administrator of this school.');
  END IF;

  INSERT INTO public.sb_institution_admins (institution_id, user_id)
  VALUES (p_institution_id, v_user_id);

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.sb_list_institution_admins(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_sb_admin(p_institution_id, auth.uid())) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('user_id', a.user_id, 'email', u.email, 'created_at', a.created_at) ORDER BY a.created_at), '[]'::jsonb)
  INTO v_result
  FROM public.sb_institution_admins a
  JOIN auth.users u ON u.id = a.user_id
  WHERE a.institution_id = p_institution_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.sb_link_institution_admin(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.sb_list_institution_admins(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.sb_link_institution_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sb_list_institution_admins(uuid) TO authenticated;