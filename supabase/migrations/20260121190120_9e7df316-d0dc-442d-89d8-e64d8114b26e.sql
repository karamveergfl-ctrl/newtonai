-- Fix admin_notifications permissive INSERT policy
-- Drop the overly permissive policy that allows any authenticated user to insert
DROP POLICY IF EXISTS "System can insert notifications with valid data" ON admin_notifications;

-- Block all direct inserts - SECURITY DEFINER triggers bypass RLS anyway
CREATE POLICY "No direct inserts to notifications"
ON admin_notifications FOR INSERT
WITH CHECK (false);