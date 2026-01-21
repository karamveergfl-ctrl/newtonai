-- =====================================================
-- FIX CRITICAL SECURITY ISSUES
-- =====================================================

-- 1. REDEEM_CODES TABLE - Lock down completely (admin access only via edge functions)
-- Drop any existing policies first
DROP POLICY IF EXISTS "Anyone can view codes" ON public.redeem_codes;
DROP POLICY IF EXISTS "Public can read codes" ON public.redeem_codes;

-- Deny all direct access - codes are accessed via validate_redeem_code RPC
CREATE POLICY "No direct access to redeem codes"
ON public.redeem_codes
FOR ALL
USING (false);

-- 2. WEBHOOK_EVENTS TABLE - Lock down completely (service role only)
DROP POLICY IF EXISTS "Anyone can view webhooks" ON public.webhook_events;
DROP POLICY IF EXISTS "Public can read webhooks" ON public.webhook_events;

-- Deny all access - webhooks handled by edge functions with service role
CREATE POLICY "No direct access to webhook events"
ON public.webhook_events
FOR ALL
USING (false);

-- 3. RATE_LIMIT_CONFIG TABLE - Lock down (accessed via SECURITY DEFINER function)
DROP POLICY IF EXISTS "Anyone can view rate limits" ON public.rate_limit_config;
DROP POLICY IF EXISTS "Public can read rate limits" ON public.rate_limit_config;

-- Deny all access - rate limits checked via check_rate_limit function
CREATE POLICY "No direct access to rate limit config"
ON public.rate_limit_config
FOR ALL
USING (false);

-- 4. ADMIN_NOTIFICATIONS - Add INSERT policy for service role triggers
CREATE POLICY "Service role can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (true); -- Triggers run as service role

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. ENTERPRISE_INQUIRIES - Add DELETE policy for admins
CREATE POLICY "Admins can delete inquiries"
ON public.enterprise_inquiries
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));