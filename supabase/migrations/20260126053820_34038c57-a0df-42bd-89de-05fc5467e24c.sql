-- Add rate limit configuration for enterprise inquiry endpoint
INSERT INTO rate_limit_config (function_name, max_requests, window_minutes)
VALUES ('send-enterprise-inquiry', 3, 60)
ON CONFLICT (function_name) DO UPDATE SET max_requests = 3, window_minutes = 60;