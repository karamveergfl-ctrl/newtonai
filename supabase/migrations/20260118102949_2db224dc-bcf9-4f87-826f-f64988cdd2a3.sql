-- Phase 1: Rate Limit Hardening
-- Create rate_limit_config table with server-side limits
CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT UNIQUE NOT NULL,
  max_requests INTEGER NOT NULL DEFAULT 100,
  window_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rate_limit_config (only readable, not modifiable by users)
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read config (needed for RPC)
CREATE POLICY "Anyone can read rate limit config"
ON public.rate_limit_config
FOR SELECT
USING (true);

-- Insert default rate limits for all edge functions
INSERT INTO public.rate_limit_config (function_name, max_requests, window_minutes) VALUES
('analyze-text', 60, 60),
('generate-quiz', 50, 60),
('generate-flashcards', 50, 60),
('generate-mindmap', 50, 60),
('generate-lecture-notes', 30, 60),
('generate-summary', 50, 60),
('solve-problem', 100, 60),
('detailed-solution', 80, 60),
('solution-chat', 100, 60),
('find-similar', 50, 60),
('fetch-transcript', 100, 60),
('search-videos', 100, 60),
('search-youtube', 100, 60),
('chat-with-pdf', 100, 60),
('extract-text', 100, 60),
('extract-pdf-text', 30, 60),
('process-pdf', 30, 60),
('ocr-handwriting', 50, 60),
('transcribe-audio', 30, 60),
('text-to-speech', 50, 60),
('structure-problem', 100, 60)
ON CONFLICT (function_name) DO NOTHING;

-- Phase 2: Webhook Replay Prevention
-- Create webhook_events table to track processed webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL
);

-- Enable RLS (no user access needed, only service role)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies needed - only service role accesses this table

-- Phase 3: Update check_rate_limit function to use config table
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_function_name TEXT,
  p_max_requests INTEGER DEFAULT NULL,
  p_window_minutes INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record rate_limits%ROWTYPE;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_max_requests INTEGER;
  v_window_minutes INTEGER;
  v_config rate_limit_config%ROWTYPE;
BEGIN
  -- Get limits from config table, ignoring any user-provided values
  SELECT * INTO v_config 
  FROM rate_limit_config 
  WHERE function_name = p_function_name;
  
  -- Use config values if found, otherwise use safe defaults
  IF FOUND THEN
    v_max_requests := v_config.max_requests;
    v_window_minutes := v_config.window_minutes;
  ELSE
    -- Safe defaults if function not in config
    v_max_requests := 50;
    v_window_minutes := 60;
  END IF;
  
  v_window_start := now() - (v_window_minutes || ' minutes')::INTERVAL;
  
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
  IF v_record.request_count < v_max_requests THEN
    UPDATE rate_limits 
    SET request_count = request_count + 1
    WHERE id = v_record.id;
    RETURN TRUE;
  END IF;
  
  -- Rate limited
  RETURN FALSE;
END;
$$;