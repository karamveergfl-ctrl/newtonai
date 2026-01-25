-- Create ad_sessions table for tracking ad watch sessions
CREATE TABLE public.ad_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  duration INTEGER NOT NULL,
  reward INTEGER NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'smartlink',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_duration CHECK (duration IN (30, 60)),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  CONSTRAINT valid_ad_type CHECK (ad_type IN ('rewarded_video', 'smartlink'))
);

-- Enable RLS
ALTER TABLE public.ad_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users can view own ad sessions" ON public.ad_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Block direct inserts (only via edge functions with service role)
CREATE POLICY "No direct ad session inserts" ON public.ad_sessions
  FOR INSERT WITH CHECK (false);

-- Block direct updates
CREATE POLICY "No direct ad session updates" ON public.ad_sessions
  FOR UPDATE USING (false);

-- Block direct deletes  
CREATE POLICY "No direct ad session deletes" ON public.ad_sessions
  FOR DELETE USING (false);

-- Add credits_earned_today column to user_credits
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS credits_earned_today INTEGER DEFAULT 0;

-- Create updated earn_credits function with 200 credit daily cap
CREATE OR REPLACE FUNCTION public.earn_credits_v2(
  p_session_id UUID,
  p_credits_earned INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_new_balance INTEGER;
  v_ads_today INTEGER;
  v_credits_today INTEGER;
  v_last_ad_date DATE;
  v_max_ads_per_day INTEGER := 10;
  v_max_credits_per_day INTEGER := 200;
  v_session ad_sessions%ROWTYPE;
BEGIN
  -- Get the current user ID from auth context
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF p_credits_earned <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credit amount');
  END IF;

  -- Verify session exists and belongs to user
  SELECT * INTO v_session FROM ad_sessions 
  WHERE id = p_session_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  IF v_session.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session already processed');
  END IF;
  
  -- Check session not expired (5 min window)
  IF v_session.created_at < now() - INTERVAL '5 minutes' THEN
    UPDATE ad_sessions SET status = 'expired' WHERE id = p_session_id;
    RETURN jsonb_build_object('success', false, 'error', 'Session expired');
  END IF;

  -- Get current stats and check daily limits
  SELECT ads_watched_today, credits_earned_today, last_ad_date 
  INTO v_ads_today, v_credits_today, v_last_ad_date
  FROM user_credits
  WHERE user_id = v_user_id;
  
  -- Reset counters if it's a new day
  IF v_last_ad_date IS NULL OR v_last_ad_date < CURRENT_DATE THEN
    v_ads_today := 0;
    v_credits_today := 0;
  END IF;
  
  -- Check daily ad limit
  IF v_ads_today >= v_max_ads_per_day THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily ad limit reached');
  END IF;
  
  -- Check daily credit limit
  IF v_credits_today + p_credits_earned > v_max_credits_per_day THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily credit limit reached');
  END IF;

  -- Mark session as completed
  UPDATE ad_sessions 
  SET status = 'completed', completed_at = now() 
  WHERE id = p_session_id;

  -- Atomic update to user credits
  UPDATE user_credits
  SET 
    credits = credits + p_credits_earned,
    lifetime_earned = lifetime_earned + p_credits_earned,
    ads_watched_today = CASE 
      WHEN last_ad_date IS NULL OR last_ad_date < CURRENT_DATE THEN 1 
      ELSE ads_watched_today + 1 
    END,
    credits_earned_today = CASE
      WHEN last_ad_date IS NULL OR last_ad_date < CURRENT_DATE THEN p_credits_earned
      ELSE credits_earned_today + p_credits_earned
    END,
    last_ad_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING credits, ads_watched_today, credits_earned_today INTO v_new_balance, v_ads_today, v_credits_today;
  
  IF NOT FOUND THEN
    -- Create record if doesn't exist
    INSERT INTO user_credits (user_id, credits, lifetime_earned, ads_watched_today, credits_earned_today, last_ad_date)
    VALUES (v_user_id, 10 + p_credits_earned, 10 + p_credits_earned, 1, p_credits_earned, CURRENT_DATE)
    RETURNING credits, ads_watched_today, credits_earned_today INTO v_new_balance, v_ads_today, v_credits_today;
  END IF;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, ad_duration)
  VALUES (v_user_id, p_credits_earned, 'earn', v_session.duration);
  
  RETURN jsonb_build_object(
    'success', true, 
    'balance', v_new_balance,
    'credits_added', p_credits_earned,
    'ads_today', v_ads_today,
    'credits_today', v_credits_today,
    'ads_remaining', v_max_ads_per_day - v_ads_today,
    'credits_remaining', v_max_credits_per_day - v_credits_today
  );
END;
$$;

-- Function to get daily ad stats
CREATE OR REPLACE FUNCTION public.get_ad_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_ads_today INTEGER;
  v_credits_today INTEGER;
  v_last_ad_date DATE;
  v_max_ads INTEGER := 10;
  v_max_credits INTEGER := 200;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT ads_watched_today, COALESCE(credits_earned_today, 0), last_ad_date 
  INTO v_ads_today, v_credits_today, v_last_ad_date
  FROM user_credits
  WHERE user_id = v_user_id;
  
  IF NOT FOUND THEN
    v_ads_today := 0;
    v_credits_today := 0;
  ELSIF v_last_ad_date IS NULL OR v_last_ad_date < CURRENT_DATE THEN
    v_ads_today := 0;
    v_credits_today := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'ads_watched', v_ads_today,
    'credits_earned', v_credits_today,
    'ads_remaining', v_max_ads - v_ads_today,
    'credits_remaining', v_max_credits - v_credits_today,
    'max_ads', v_max_ads,
    'max_credits', v_max_credits
  );
END;
$$;