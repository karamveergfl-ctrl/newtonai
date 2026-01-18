-- Add CHECK constraint to prevent negative credits
ALTER TABLE public.user_credits 
ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);

-- Create atomic spend_credits function
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_feature_name TEXT,
  p_amount INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Get the current user ID from auth context
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Atomic update with balance check
  UPDATE user_credits
  SET 
    credits = credits - p_amount,
    lifetime_spent = lifetime_spent + p_amount,
    updated_at = now()
  WHERE user_id = v_user_id
    AND credits >= p_amount
  RETURNING credits INTO v_new_balance;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;
  
  -- Log transaction atomically
  INSERT INTO credit_transactions (user_id, amount, type, feature_name)
  VALUES (v_user_id, -p_amount, 'spend', p_feature_name);
  
  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$;

-- Create atomic earn_credits function for watching ads
CREATE OR REPLACE FUNCTION public.earn_credits(
  p_ad_duration INTEGER,
  p_credits_earned INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_new_balance INTEGER;
  v_ads_today INTEGER;
  v_last_ad_date DATE;
  v_max_ads_per_day INTEGER := 10;
BEGIN
  -- Get the current user ID from auth context
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF p_credits_earned <= 0 OR p_ad_duration <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid parameters');
  END IF;

  -- Get current ad count and check daily limit
  SELECT ads_watched_today, last_ad_date INTO v_ads_today, v_last_ad_date
  FROM user_credits
  WHERE user_id = v_user_id;
  
  -- Reset counter if it's a new day
  IF v_last_ad_date IS NULL OR v_last_ad_date < CURRENT_DATE THEN
    v_ads_today := 0;
  END IF;
  
  -- Check daily limit
  IF v_ads_today >= v_max_ads_per_day THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily ad limit reached');
  END IF;

  -- Atomic update
  UPDATE user_credits
  SET 
    credits = credits + p_credits_earned,
    lifetime_earned = lifetime_earned + p_credits_earned,
    ads_watched_today = CASE 
      WHEN last_ad_date IS NULL OR last_ad_date < CURRENT_DATE THEN 1 
      ELSE ads_watched_today + 1 
    END,
    last_ad_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING credits INTO v_new_balance;
  
  IF NOT FOUND THEN
    -- Create record if doesn't exist
    INSERT INTO user_credits (user_id, credits, lifetime_earned, ads_watched_today, last_ad_date)
    VALUES (v_user_id, 10 + p_credits_earned, 10 + p_credits_earned, 1, CURRENT_DATE)
    RETURNING credits INTO v_new_balance;
  END IF;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, ad_duration)
  VALUES (v_user_id, p_credits_earned, 'earn', p_ad_duration);
  
  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$;

-- Drop the UPDATE policy to force all modifications through RPC
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

-- Create a restrictive UPDATE policy that blocks all direct updates
CREATE POLICY "No direct credit updates"
ON public.user_credits
FOR UPDATE
USING (false);