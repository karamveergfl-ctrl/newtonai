-- Create feature_costs table to store costs server-side
CREATE TABLE IF NOT EXISTS public.feature_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name TEXT NOT NULL UNIQUE,
  cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but no policies (only SECURITY DEFINER functions can read)
ALTER TABLE public.feature_costs ENABLE ROW LEVEL SECURITY;

-- Update spend_credits function to look up cost from server-side table
CREATE OR REPLACE FUNCTION public.spend_credits(p_feature_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_new_balance INTEGER;
  v_cost INTEGER;
BEGIN
  -- Get the current user ID from auth context
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Look up the feature cost from server-side config
  SELECT cost INTO v_cost FROM feature_costs WHERE feature_name = p_feature_name;
  
  IF v_cost IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unknown feature');
  END IF;
  
  IF v_cost <= 0 THEN
    -- Free feature, no credits needed
    RETURN jsonb_build_object('success', true, 'balance', (SELECT credits FROM user_credits WHERE user_id = v_user_id));
  END IF;

  -- Atomic update with balance check
  UPDATE user_credits
  SET 
    credits = credits - v_cost,
    lifetime_spent = lifetime_spent + v_cost,
    updated_at = now()
  WHERE user_id = v_user_id
    AND credits >= v_cost
  RETURNING credits INTO v_new_balance;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;
  
  -- Log transaction atomically
  INSERT INTO credit_transactions (user_id, amount, type, feature_name)
  VALUES (v_user_id, -v_cost, 'spend', p_feature_name);
  
  RETURN jsonb_build_object('success', true, 'balance', v_new_balance, 'cost', v_cost);
END;
$function$;