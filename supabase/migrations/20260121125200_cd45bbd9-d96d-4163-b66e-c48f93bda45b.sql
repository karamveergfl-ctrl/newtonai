-- Create redeem_codes table for storing discount codes
CREATE TABLE public.redeem_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL means no expiry
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track which users have redeemed which codes
CREATE TABLE public.redeemed_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code_id UUID NOT NULL REFERENCES public.redeem_codes(id),
  discount_percent INTEGER NOT NULL,
  applied_to_payment_id UUID REFERENCES public.payments(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on redeem_codes (read-only for authenticated users)
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;

-- Users can only view active codes (for validation)
CREATE POLICY "Users can view active codes"
ON public.redeem_codes
FOR SELECT
USING (is_active = true);

-- Enable RLS on redeemed_codes
ALTER TABLE public.redeemed_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own redeemed codes
CREATE POLICY "Users can view their own redeemed codes"
ON public.redeemed_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own redeemed codes
CREATE POLICY "Users can insert their own redeemed codes"
ON public.redeemed_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to validate and apply a redeem code
CREATE OR REPLACE FUNCTION public.validate_redeem_code(p_code TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_code_record redeem_codes%ROWTYPE;
  v_already_used BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find the code (case-insensitive)
  SELECT * INTO v_code_record
  FROM redeem_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
  END IF;
  
  -- Check if code is within valid date range
  IF v_code_record.valid_from > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code not yet active');
  END IF;
  
  IF v_code_record.valid_until IS NOT NULL AND v_code_record.valid_until < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code has expired');
  END IF;
  
  -- Check if max uses reached
  IF v_code_record.max_uses IS NOT NULL AND v_code_record.current_uses >= v_code_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code usage limit reached');
  END IF;
  
  -- Check if user already used this code
  SELECT EXISTS(
    SELECT 1 FROM redeemed_codes
    WHERE user_id = v_user_id AND code_id = v_code_record.id
  ) INTO v_already_used;
  
  IF v_already_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this code');
  END IF;
  
  -- Code is valid
  RETURN jsonb_build_object(
    'success', true,
    'code_id', v_code_record.id,
    'discount_percent', v_code_record.discount_percent,
    'description', v_code_record.description
  );
END;
$$;

-- Create function to apply redeem code (called after successful payment)
CREATE OR REPLACE FUNCTION public.apply_redeem_code(p_code_id UUID, p_payment_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_code_record redeem_codes%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get the code
  SELECT * INTO v_code_record FROM redeem_codes WHERE id = p_code_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code not found');
  END IF;
  
  -- Insert redemption record
  INSERT INTO redeemed_codes (user_id, code_id, discount_percent, applied_to_payment_id)
  VALUES (v_user_id, p_code_id, v_code_record.discount_percent, p_payment_id);
  
  -- Increment usage counter
  UPDATE redeem_codes
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = p_code_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Add some sample codes for testing
INSERT INTO public.redeem_codes (code, discount_percent, description, max_uses)
VALUES 
  ('WELCOME20', 20, '20% off your first subscription', 100),
  ('STUDENT50', 50, '50% student discount', 50),
  ('LAUNCH100', 100, 'Free subscription - Launch special', 10);