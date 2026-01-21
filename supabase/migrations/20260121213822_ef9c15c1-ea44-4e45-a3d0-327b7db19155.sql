-- Add missing rate limit configurations for newly protected functions
INSERT INTO rate_limit_config (function_name, max_requests, window_minutes) VALUES
  ('generate-podcast-script', 10, 60),
  ('podcast-raise-hand', 20, 60),
  ('elevenlabs-podcast-tts', 10, 60),
  ('elevenlabs-sfx', 20, 60),
  ('elevenlabs-ambient', 10, 60),
  ('generate-newton-pose', 30, 60)
ON CONFLICT (function_name) DO UPDATE SET
  max_requests = EXCLUDED.max_requests,
  window_minutes = EXCLUDED.window_minutes,
  updated_at = now();