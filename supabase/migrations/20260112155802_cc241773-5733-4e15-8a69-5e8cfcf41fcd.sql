-- Create rate_limits table to track API usage
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, function_name)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own rate limit records
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rate limits"
ON public.rate_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rate limits"
ON public.rate_limits FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_rate_limits_user_function ON public.rate_limits(user_id, function_name);

-- Function to check and update rate limit (returns true if allowed, false if rate limited)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_function_name TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record rate_limits%ROWTYPE;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Try to get existing record
  SELECT * INTO v_record 
  FROM rate_limits 
  WHERE user_id = p_user_id AND function_name = p_function_name;
  
  IF NOT FOUND THEN
    -- No record exists, create one
    INSERT INTO rate_limits (user_id, function_name, request_count, window_start)
    VALUES (p_user_id, p_function_name, 1, now());
    RETURN TRUE;
  END IF;
  
  -- Check if window has expired
  IF v_record.window_start < v_window_start THEN
    -- Reset the window
    UPDATE rate_limits 
    SET request_count = 1, window_start = now()
    WHERE id = v_record.id;
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  IF v_record.request_count < p_max_requests THEN
    UPDATE rate_limits 
    SET request_count = request_count + 1
    WHERE id = v_record.id;
    RETURN TRUE;
  END IF;
  
  -- Rate limited
  RETURN FALSE;
END;
$$;