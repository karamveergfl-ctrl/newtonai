-- Add policy to allow users to view their own role assignments
-- This complements the existing admin-only policy
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);