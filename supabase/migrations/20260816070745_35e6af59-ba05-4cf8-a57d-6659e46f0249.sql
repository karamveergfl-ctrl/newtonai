CREATE OR REPLACE FUNCTION public.release_free_redeem_code(p_code_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE redeem_codes
  SET current_uses = GREATEST(current_uses - 1, 0), updated_at = now()
  WHERE id = p_code_id;
END;
$$;

REVOKE ALL ON FUNCTION public.release_free_redeem_code(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_free_redeem_code(UUID) TO service_role;