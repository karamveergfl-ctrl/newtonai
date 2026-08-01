CREATE TABLE public.sb_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'school',
  city TEXT,
  state TEXT,
  contact_name TEXT,
  contact_email TEXT NOT NULL UNIQUE,
  contact_phone TEXT,
  plan TEXT NOT NULL DEFAULT 'smartboard',
  max_smartboards INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sb_institution_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.sb_institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id)
);

CREATE TABLE public.sb_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.sb_institutions(id) ON DELETE CASCADE,
  board_name TEXT NOT NULL,
  grade_level TEXT,
  subject_focus TEXT,
  activation_code TEXT NOT NULL UNIQUE,
  activated_at TIMESTAMPTZ,
  device_token_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sb_board_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.sb_boards(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.sb_institutions(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  video_id TEXT,
  video_title TEXT,
  video_channel TEXT,
  action TEXT NOT NULL DEFAULT 'search',
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sb_boards_institution ON public.sb_boards(institution_id);
CREATE INDEX idx_sb_usage_institution_date ON public.sb_board_usage(institution_id, session_date DESC);
CREATE INDEX idx_sb_usage_board ON public.sb_board_usage(board_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sb_institutions TO authenticated;
GRANT ALL ON public.sb_institutions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sb_institution_admins TO authenticated;
GRANT ALL ON public.sb_institution_admins TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sb_boards TO authenticated;
GRANT ALL ON public.sb_boards TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sb_board_usage TO authenticated;
GRANT ALL ON public.sb_board_usage TO service_role;

ALTER TABLE public.sb_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_institution_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_board_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_sb_admin(_institution_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sb_institution_admins
    WHERE institution_id = _institution_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.sb_admin_institution(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.sb_institution_admins
  WHERE user_id = _user_id
  ORDER BY created_at ASC
  LIMIT 1;
$$;

CREATE POLICY "sb_inst_admin_read" ON public.sb_institutions
  FOR SELECT TO authenticated
  USING (public.is_sb_admin(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sb_inst_admin_update" ON public.sb_institutions
  FOR UPDATE TO authenticated
  USING (public.is_sb_admin(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_sb_admin(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sb_inst_staff_insert" ON public.sb_institutions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sb_inst_staff_delete" ON public.sb_institutions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "sb_admins_read" ON public.sb_institution_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sb_admins_staff_write" ON public.sb_institution_admins
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "sb_boards_read" ON public.sb_boards
  FOR SELECT TO authenticated
  USING (public.is_sb_admin(institution_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sb_boards_insert" ON public.sb_boards
  FOR INSERT TO authenticated
  WITH CHECK (public.is_sb_admin(institution_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sb_boards_update" ON public.sb_boards
  FOR UPDATE TO authenticated
  USING (public.is_sb_admin(institution_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_sb_admin(institution_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sb_boards_delete" ON public.sb_boards
  FOR DELETE TO authenticated
  USING (public.is_sb_admin(institution_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "sb_usage_read" ON public.sb_board_usage
  FOR SELECT TO authenticated
  USING (public.is_sb_admin(institution_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.sb_generate_activation_code(_institution_name TEXT, _board_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  suffix TEXT;
  code TEXT;
  tries INT := 0;
BEGIN
  prefix := UPPER(LEFT(REGEXP_REPLACE(COALESCE(_institution_name,'SB'), '[^a-zA-Z]', '', 'g') || 'SB', 3));
  suffix := UPPER(LEFT(REGEXP_REPLACE(COALESCE(_board_name,'BD'), '[^a-zA-Z0-9]', '', 'g') || 'BD', 2));
  LOOP
    code := prefix || '-' || suffix || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.sb_boards WHERE activation_code = code) OR tries > 20;
    tries := tries + 1;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.sb_create_board(
  p_institution_id UUID,
  p_board_name TEXT,
  p_grade_level TEXT DEFAULT NULL,
  p_subject_focus TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst public.sb_institutions%ROWTYPE;
  v_count INT;
  v_code TEXT;
  v_board public.sb_boards%ROWTYPE;
BEGIN
  IF NOT (public.is_sb_admin(p_institution_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;

  SELECT * INTO v_inst FROM public.sb_institutions WHERE id = p_institution_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'institution_not_found');
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.sb_boards WHERE institution_id = p_institution_id;
  IF v_count >= v_inst.max_smartboards THEN
    RETURN jsonb_build_object('success', false, 'error', 'limit_reached', 'limit', v_inst.max_smartboards);
  END IF;

  v_code := public.sb_generate_activation_code(v_inst.name, p_board_name);

  INSERT INTO public.sb_boards (institution_id, board_name, grade_level, subject_focus, activation_code)
  VALUES (p_institution_id, p_board_name, p_grade_level, p_subject_focus, v_code)
  RETURNING * INTO v_board;

  RETURN jsonb_build_object('success', true, 'board', to_jsonb(v_board));
END;
$$;

CREATE OR REPLACE FUNCTION public.sb_reissue_board_code(p_board_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board public.sb_boards%ROWTYPE;
  v_inst_name TEXT;
  v_code TEXT;
BEGIN
  SELECT * INTO v_board FROM public.sb_boards WHERE id = p_board_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'board_not_found');
  END IF;
  IF NOT (public.is_sb_admin(v_board.institution_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;

  SELECT name INTO v_inst_name FROM public.sb_institutions WHERE id = v_board.institution_id;
  v_code := public.sb_generate_activation_code(v_inst_name, v_board.board_name);

  UPDATE public.sb_boards
  SET activation_code = v_code,
      activated_at = NULL,
      device_token_hash = NULL,
      updated_at = now()
  WHERE id = p_board_id;

  RETURN jsonb_build_object('success', true, 'activation_code', v_code);
END;
$$;

CREATE TRIGGER sb_institutions_updated_at
  BEFORE UPDATE ON public.sb_institutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER sb_boards_updated_at
  BEFORE UPDATE ON public.sb_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();