-- Prevent duplicate redemption of the same code by the same user
DELETE FROM public.redeemed_codes a
USING public.redeemed_codes b
WHERE a.ctid > b.ctid AND a.user_id = b.user_id AND a.code_id = b.code_id;

CREATE UNIQUE INDEX IF NOT EXISTS redeemed_codes_user_code_uniq
  ON public.redeemed_codes (user_id, code_id);

-- Atomic claim of a 100% discount code (row-locked, single transaction)
CREATE OR REPLACE FUNCTION public.claim_free_redeem_code(p_code_id UUID, p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code redeem_codes%ROWTYPE;
  v_redemption_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_code_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid request');
  END IF;

  SELECT * INTO v_code FROM redeem_codes WHERE id = p_code_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid redeem code');
  END IF;

  IF NOT v_code.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Redeem code is no longer active');
  END IF;

  IF v_code.valid_until IS NOT NULL AND v_code.valid_until < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Redeem code has expired');
  END IF;

  IF v_code.valid_from IS NOT NULL AND v_code.valid_from > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Redeem code is not yet valid');
  END IF;

  IF v_code.max_uses IS NOT NULL AND v_code.current_uses >= v_code.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Redeem code usage limit reached');
  END IF;

  IF v_code.discount_percent <> 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'This endpoint only accepts 100% discount codes');
  END IF;

  BEGIN
    INSERT INTO redeemed_codes (user_id, code_id, discount_percent)
    VALUES (p_user_id, p_code_id, v_code.discount_percent)
    RETURNING id INTO v_redemption_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already redeemed this code');
  END;

  UPDATE redeem_codes
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = p_code_id
  RETURNING * INTO v_code;

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'code', v_code.code,
    'discount_percent', v_code.discount_percent,
    'current_uses', v_code.current_uses,
    'max_uses', v_code.max_uses
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_free_redeem_code(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_free_redeem_code(UUID, UUID) TO service_role;