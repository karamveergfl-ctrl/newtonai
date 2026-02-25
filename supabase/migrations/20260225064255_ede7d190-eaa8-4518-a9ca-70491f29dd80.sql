
-- Fix: recreate view with SECURITY INVOKER (default, explicit for clarity)
DROP VIEW IF EXISTS public.live_pulse_summary;
CREATE VIEW public.live_pulse_summary
WITH (security_invoker = true)
AS
SELECT
  session_id,
  COUNT(*) FILTER (WHERE status = 'got_it') AS got_it,
  COUNT(*) FILTER (WHERE status = 'slightly_lost') AS slightly_lost,
  COUNT(*) FILTER (WHERE status = 'lost') AS lost,
  COUNT(*) AS total
FROM public.live_pulse_responses
GROUP BY session_id;
