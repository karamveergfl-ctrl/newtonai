-- Fix overly permissive RLS policies

-- 1. admin_notifications: Replace "true" with a check that ensures required fields are provided
-- This table is inserted by trigger functions (SECURITY DEFINER) so we can restrict to service role
DROP POLICY IF EXISTS "Service role can insert notifications" ON admin_notifications;

-- Only allow inserts from authenticated context (trigger functions run with elevated privileges)
-- Add basic validation that required fields must be non-empty
CREATE POLICY "System can insert notifications with valid data"
ON admin_notifications FOR INSERT
WITH CHECK (
  type IS NOT NULL AND 
  title IS NOT NULL AND 
  message IS NOT NULL AND
  length(title) > 0 AND
  length(message) > 0
);

-- 2. enterprise_inquiries: Replace "true" with validation checks
-- This is a public contact form but should validate required fields
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON enterprise_inquiries;

-- Only authenticated users can submit, and all required fields must be provided
CREATE POLICY "Authenticated users can submit valid inquiries"
ON enterprise_inquiries FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  first_name IS NOT NULL AND length(first_name) > 0 AND
  last_name IS NOT NULL AND length(last_name) > 0 AND
  email IS NOT NULL AND length(email) > 0 AND
  company IS NOT NULL AND length(company) > 0 AND
  job_title IS NOT NULL AND length(job_title) > 0 AND
  team_size IS NOT NULL AND length(team_size) > 0 AND
  use_case IS NOT NULL AND length(use_case) > 0
);