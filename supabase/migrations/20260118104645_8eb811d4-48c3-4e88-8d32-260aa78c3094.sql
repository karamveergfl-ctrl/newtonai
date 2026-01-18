-- Remove the public read policy that exposes rate limit configuration
DROP POLICY IF EXISTS "Anyone can read rate limit config" ON public.rate_limit_config;