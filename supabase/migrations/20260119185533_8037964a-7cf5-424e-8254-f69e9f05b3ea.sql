-- Add restrictive DELETE policy to prevent users from deleting subscription records
-- Only server-side processes (service role) should manage subscription lifecycle
CREATE POLICY "Prevent subscription deletion"
ON public.subscriptions
FOR DELETE
USING (false);